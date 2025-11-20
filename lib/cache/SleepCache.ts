/**
 * Sleep Data Cache Service
 * 
 * Caches sleep entries and goals
 */

import { BaseCacheService } from './BaseCacheService';
import { CACHE_CONFIGS } from './types';
import { syncQueue } from './SyncQueue';

export interface CachedSleepEntry {
  id: string;
  user_id: string;
  sleep_date: string;
  sleep_time: string;
  wake_time: string;
  total_hours: number;
  quality_rating: number;
  deep_sleep_minutes: number | null;
  rem_sleep_minutes: number | null;
  light_sleep_minutes: number | null;
  awake_minutes: number | null;
  heart_rate_avg: number | null;
  respiratory_rate_avg: number | null;
  sleep_environment_rating: number | null;
  caffeine_consumed: boolean | null;
  alcohol_consumed: boolean | null;
  exercise_before_sleep: boolean | null;
  screen_time_before_sleep: boolean | null;
  stress_level: number | null;
  mood_next_day: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CachedSleepGoal {
  id: string;
  user_id: string;
  target_hours: number;
  target_bedtime: string | null;
  target_wake_time: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SleepCacheData {
  entries: CachedSleepEntry[];
  goals: CachedSleepGoal[];
}

class SleepCacheService extends BaseCacheService<SleepCacheData> {
  constructor() {
    super('@uniwell:sleep', CACHE_CONFIGS.sleep);
  }

  /**
   * Get all sleep data for a user
   */
  async getSleepData(userId: string): Promise<SleepCacheData | null> {
    return this.get(userId);
  }

  /**
   * Set sleep data
   */
  async setSleepData(userId: string, data: SleepCacheData): Promise<void> {
    return this.set(data, userId);
  }

  /**
   * Add a new sleep entry
   */
  async addEntry(
    userId: string, 
    entry: Omit<CachedSleepEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newEntry: CachedSleepEntry = {
      ...entry,
      id: tempId,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    await this.update(
      (existing) => {
        const data = existing || { entries: [], goals: [] };
        return {
          ...data,
          entries: [...data.entries, newEntry],
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'create',
      table: 'sleep_data',
      data: entry,
      userId,
    });

    return tempId;
  }

  /**
   * Update sleep entry
   */
  async updateEntry(
    userId: string, 
    entryId: string, 
    updates: Partial<CachedSleepEntry>
  ): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        const entries = existing.entries.map(e => 
          e.id === entryId 
            ? { ...e, ...updates, updated_at: new Date().toISOString() }
            : e
        );
        
        return { ...existing, entries };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'update',
      table: 'sleep_data',
      data: { id: entryId, ...updates },
      userId,
    });
  }

  /**
   * Delete sleep entry
   */
  async deleteEntry(userId: string, entryId: string): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        return {
          ...existing,
          entries: existing.entries.filter(e => e.id !== entryId),
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'delete',
      table: 'sleep_data',
      data: { id: entryId },
      userId,
    });
  }

  /**
   * Get entry for a specific date
   */
  async getEntryForDate(userId: string, date: string): Promise<CachedSleepEntry | null> {
    const data = await this.get(userId);
    if (!data) return null;
    
    return data.entries.find(e => e.sleep_date === date) || null;
  }

  /**
   * Get entries in date range
   */
  async getEntriesInRange(userId: string, startDate: string, endDate: string): Promise<CachedSleepEntry[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    return data.entries.filter(e => 
      e.sleep_date >= startDate && e.sleep_date <= endDate
    ).sort((a, b) => b.sleep_date.localeCompare(a.sleep_date));
  }

  /**
   * Get recent entries
   */
  async getRecentEntries(userId: string, limit: number = 30): Promise<CachedSleepEntry[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    return data.entries
      .sort((a, b) => b.sleep_date.localeCompare(a.sleep_date))
      .slice(0, limit);
  }

  /**
   * Add sleep goal
   */
  async addGoal(
    userId: string, 
    goal: Omit<CachedSleepGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newGoal: CachedSleepGoal = {
      ...goal,
      id: tempId,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    await this.update(
      (existing) => {
        const data = existing || { entries: [], goals: [] };
        return {
          ...data,
          goals: [...data.goals, newGoal],
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'create',
      table: 'sleep_goals',
      data: goal,
      userId,
    });

    return tempId;
  }

  /**
   * Get active goal
   */
  async getActiveGoal(userId: string): Promise<CachedSleepGoal | null> {
    const data = await this.get(userId);
    if (!data) return null;
    
    return data.goals.find(g => g.is_active) || null;
  }
}

export const sleepCache = new SleepCacheService();
