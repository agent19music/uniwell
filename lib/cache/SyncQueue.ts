/**
 * Sync Queue Manager
 * 
 * Manages offline operations and syncs them when online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../supabase';
import { SyncQueueItem } from './types';

const SYNC_QUEUE_KEY = '@uniwell:sync_queue';
const MAX_RETRY_COUNT = 3;

class SyncQueueManager {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private async init() {
    // Monitor network status
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // If we just came online, sync
      if (wasOffline && this.isOnline) {
        this.sync();
      }
    });

    // Initial sync
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    
    if (this.isOnline) {
      this.sync();
    }
  }

  /**
   * Add an operation to the sync queue
   */
  async enqueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    try {
      const queueItem: SyncQueueItem = {
        ...item,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };

      const queue = await this.getQueue();
      queue.push(queueItem);
      await this.saveQueue(queue);

      // Notify listeners
      this.notifyListeners();

      // Try to sync immediately if online
      if (this.isOnline) {
        this.sync();
      }

      return queueItem.id;
    } catch (error) {
      console.error('Error enqueuing sync item:', error);
      throw error;
    }
  }

  /**
   * Get all pending items
   */
  async getQueue(): Promise<SyncQueueItem[]> {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(queue: SyncQueueItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Process the sync queue
   */
  async sync(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;

    try {
      this.isSyncing = true;
      const queue = await this.getQueue();
      
      if (queue.length === 0) {
        this.isSyncing = false;
        return;
      }

      const results = await Promise.allSettled(
        queue.map(item => this.processItem(item))
      );

      // Filter out successfully synced items
      const remainingQueue = queue.filter((item, index) => {
        const result = results[index];
        
        if (result.status === 'fulfilled' && result.value) {
          return false; // Remove from queue
        }
        
        // Increment retry count
        item.retryCount++;
        
        // Remove if max retries exceeded
        if (item.retryCount >= MAX_RETRY_COUNT) {
          console.error(`Max retries exceeded for sync item:`, item);
          return false;
        }
        
        return true; // Keep in queue
      });

      await this.saveQueue(remainingQueue);
      this.notifyListeners();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a single sync item
   */
  private async processItem(item: SyncQueueItem): Promise<boolean> {
    try {
      const { type, table, data, userId } = item;

      switch (type) {
        case 'create':
          const { error: createError } = await supabase
            .from(table)
            .insert({ ...data, user_id: userId });
          
          if (createError) throw createError;
          return true;

        case 'update':
          const { id, ...updateData } = data;
          const { error: updateError } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);
          
          if (updateError) throw updateError;
          return true;

        case 'delete':
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('id', data.id)
            .eq('user_id', userId);
          
          if (deleteError) throw deleteError;
          return true;

        default:
          console.error('Unknown sync type:', type);
          return false;
      }
    } catch (error) {
      console.error('Error processing sync item:', error);
      return false;
    }
  }

  /**
   * Get pending count
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Clear the entire queue (use with caution!)
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    this.notifyListeners();
  }

  /**
   * Add a listener for queue changes
   */
  addListener(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Check if online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const syncQueue = new SyncQueueManager();
