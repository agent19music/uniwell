/**
 * Base Cache Service
 * 
 * Provides core caching functionality with AsyncStorage
 * All specific cache services extend this base class
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CachedData, CacheMetadata, CacheConfig, CacheStatus } from './types';

export abstract class BaseCacheService<T> {
  protected cacheKey: string;
  protected config: CacheConfig;

  constructor(cacheKey: string, config: CacheConfig) {
    this.cacheKey = cacheKey;
    this.config = config;
  }

  /**
   * Get data from cache
   */
  async get(key?: string): Promise<T | null> {
    try {
      const storageKey = key ? `${this.cacheKey}:${key}` : this.cacheKey;
      const cached = await AsyncStorage.getItem(storageKey);
      
      if (!cached) return null;

      const cachedData: CachedData<T> = JSON.parse(cached);
      
      // Check if cache is expired
      if (this.isExpired(cachedData.metadata)) {
        await this.remove(key);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.error(`Cache get error for ${this.cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set(data: T, key?: string): Promise<void> {
    try {
      const storageKey = key ? `${this.cacheKey}:${key}` : this.cacheKey;
      const now = Date.now();
      
      const cachedData: CachedData<T> = {
        data,
        metadata: {
          lastFetched: now,
          lastModified: now,
          version: 1,
          syncStatus: 'synced',
        },
      };

      await AsyncStorage.setItem(storageKey, JSON.stringify(cachedData));
    } catch (error) {
      console.error(`Cache set error for ${this.cacheKey}:`, error);
    }
  }

  /**
   * Update existing cached data
   */
  async update(updater: (data: T | null) => T, key?: string): Promise<void> {
    try {
      const existing = await this.get(key);
      const updated = updater(existing);
      await this.set(updated, key);
    } catch (error) {
      console.error(`Cache update error for ${this.cacheKey}:`, error);
    }
  }

  /**
   * Remove data from cache
   */
  async remove(key?: string): Promise<void> {
    try {
      const storageKey = key ? `${this.cacheKey}:${key}` : this.cacheKey;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Cache remove error for ${this.cacheKey}:`, error);
    }
  }

  /**
   * Clear all cache for this service
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const relevantKeys = keys.filter(key => key.startsWith(this.cacheKey));
      await AsyncStorage.multiRemove(relevantKeys);
    } catch (error) {
      console.error(`Cache clear error for ${this.cacheKey}:`, error);
    }
  }

  /**
   * Get cache status
   */
  async getStatus(key?: string): Promise<CacheStatus> {
    try {
      const storageKey = key ? `${this.cacheKey}:${key}` : this.cacheKey;
      const cached = await AsyncStorage.getItem(storageKey);
      
      if (!cached) return 'expired';

      const cachedData: CachedData<T> = JSON.parse(cached);
      
      if (this.isExpired(cachedData.metadata)) return 'expired';
      if (this.isStale(cachedData.metadata)) return 'stale';
      
      return 'fresh';
    } catch (error) {
      return 'expired';
    }
  }

  /**
   * Get metadata for cached item
   */
  async getMetadata(key?: string): Promise<CacheMetadata | null> {
    try {
      const storageKey = key ? `${this.cacheKey}:${key}` : this.cacheKey;
      const cached = await AsyncStorage.getItem(storageKey);
      
      if (!cached) return null;

      const cachedData: CachedData<T> = JSON.parse(cached);
      return cachedData.metadata;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(status: CacheMetadata['syncStatus'], key?: string): Promise<void> {
    try {
      const storageKey = key ? `${this.cacheKey}:${key}` : this.cacheKey;
      const cached = await AsyncStorage.getItem(storageKey);
      
      if (!cached) return;

      const cachedData: CachedData<T> = JSON.parse(cached);
      cachedData.metadata.syncStatus = status;
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(cachedData));
    } catch (error) {
      console.error(`Sync status update error for ${this.cacheKey}:`, error);
    }
  }

  /**
   * Check if cache is expired
   */
  protected isExpired(metadata: CacheMetadata): boolean {
    const age = Date.now() - metadata.lastFetched;
    return age > this.config.maxAge;
  }

  /**
   * Check if cache is stale (needs refresh but can still be used)
   */
  protected isStale(metadata: CacheMetadata): boolean {
    const age = Date.now() - metadata.lastFetched;
    return age > this.config.staleTime;
  }

  /**
   * Garbage collection - remove expired items
   */
  async gc(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const relevantKeys = keys.filter(key => key.startsWith(this.cacheKey));
      
      for (const key of relevantKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (!cached) continue;

        const cachedData: CachedData<T> = JSON.parse(cached);
        if (this.isExpired(cachedData.metadata)) {
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error(`GC error for ${this.cacheKey}:`, error);
    }
  }
}
