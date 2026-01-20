/**
 * Journal Entry Cache Service
 * 
 * Caches journal entries with offline-first support
 * Supports text, audio, and video journal types with optional encryption
 */

import { BaseCacheService } from './BaseCacheService';
import { CACHE_CONFIGS } from './types';
import { syncQueue } from './SyncQueue';

export type JournalType = 'text' | 'audio' | 'video';

export interface CachedJournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  journal_type: JournalType;
  text_content: string | null;
  file_url: string | null;
  entry_date: string;
  mood_type: string | null;
  mood_intensity: number | null;
  is_pinned: boolean;
  is_synced: boolean;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  content?: string | null;
  voice_note_url?: string | null;
}

export interface JournalCacheData {
  entries: CachedJournalEntry[];
}

class JournalCacheService extends BaseCacheService<JournalCacheData> {
  constructor() {
    super('@uniwell:journals', CACHE_CONFIGS.journals);
  }

  /**
   * Get all journal entries for a user
   */
  async getJournals(userId: string): Promise<JournalCacheData | null> {
    return this.get(userId);
  }

  /**
   * Set journal data
   */
  async setJournals(userId: string, data: JournalCacheData): Promise<void> {
    return this.set(data, userId);
  }

  /**
   * Add a new journal entry (local-first)
   */
  async addEntry(
    userId: string, 
    entry: Omit<CachedJournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_synced'>
  ): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newEntry: CachedJournalEntry = {
      ...entry,
      id: tempId,
      user_id: userId,
      is_synced: false,
      created_at: now,
      updated_at: now,
    };

    await this.update(
      (existing) => {
        const data = existing || { entries: [] };
        return {
          entries: [...data.entries, newEntry],
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'create',
      table: 'journal_entries',
      data: entry,
      userId,
    });

    return tempId;
  }

  /**
   * Update journal entry
   */
  async updateEntry(
    userId: string, 
    entryId: string, 
    updates: Partial<CachedJournalEntry>
  ): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        const entries = existing.entries.map(e => 
          e.id === entryId 
            ? { ...e, ...updates, updated_at: new Date().toISOString() }
            : e
        );
        
        return { entries };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'update',
      table: 'journal_entries',
      data: { id: entryId, ...updates },
      userId,
    });
  }

  /**
   * Delete journal entry
   */
  async deleteEntry(userId: string, entryId: string): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        return {
          entries: existing.entries.filter(e => e.id !== entryId),
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'delete',
      table: 'journal_entries',
      data: { id: entryId },
      userId,
    });
  }

  /**
   * Get entry for a specific date
   */
  async getEntryForDate(userId: string, date: string): Promise<CachedJournalEntry | null> {
    const data = await this.get(userId);
    if (!data) return null;
    
    return data.entries.find(e => e.entry_date === date) || null;
  }

  /**
   * Get entries in date range
   */
  async getEntriesInRange(userId: string, startDate: string, endDate: string): Promise<CachedJournalEntry[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    return data.entries.filter(e => 
      e.entry_date >= startDate && e.entry_date <= endDate
    ).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  }

  /**
   * Get recent entries
   */
  async getRecentEntries(userId: string, limit: number = 10): Promise<CachedJournalEntry[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    return data.entries
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
}

export const journalCache = new JournalCacheService();
