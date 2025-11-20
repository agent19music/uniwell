/**
 * Mood Entry Cache Service
 * 
 * Caches mood entries and summaries
 */

import { BaseCacheService } from './BaseCacheService';
import { CACHE_CONFIGS } from './types';
import { syncQueue } from './SyncQueue';

export interface CachedMoodEntry {
  id: string;
  user_id: string;
  mood_type: string;
  intensity: number;
  notes: string | null;
  day_of_week: number;
  created_at: string;
}

export interface CachedMoodSummary {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  dominant_mood: string;
  mood_fluctuation: number;
  insights: string[] | null;
  recommendations: string[] | null;
  created_at: string;
}

export interface MoodCacheData {
  entries: CachedMoodEntry[];
  summaries: CachedMoodSummary[];
}

class MoodCacheService extends BaseCacheService<MoodCacheData> {
  constructor() {
    super('@uniwell:mood', CACHE_CONFIGS.mood);
  }

  /**
   * Get all mood data for a user
   */
  async getMoodData(userId: string): Promise<MoodCacheData | null> {
    return this.get(userId);
  }

  /**
   * Set mood data
   */
  async setMoodData(userId: string, data: MoodCacheData): Promise<void> {
    return this.set(data, userId);
  }

  /**
   * Add a new mood entry
   */
  async addEntry(
    userId: string, 
    entry: Omit<CachedMoodEntry, 'id' | 'user_id' | 'created_at'>
  ): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newEntry: CachedMoodEntry = {
      ...entry,
      id: tempId,
      user_id: userId,
      created_at: now,
    };

    await this.update(
      (existing) => {
        const data = existing || { entries: [], summaries: [] };
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
      table: 'mood_entries',
      data: entry,
      userId,
    });

    return tempId;
  }

  /**
   * Get today's mood entry
   */
  async getTodaysMood(userId: string): Promise<CachedMoodEntry | null> {
    const data = await this.get(userId);
    if (!data) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = data.entries.filter(e => 
      e.created_at.startsWith(today)
    );
    
    return todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : null;
  }

  /**
   * Get entries in date range
   */
  async getEntriesInRange(userId: string, startDate: string, endDate: string): Promise<CachedMoodEntry[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    return data.entries.filter(e => {
      const entryDate = e.created_at.split('T')[0];
      return entryDate >= startDate && entryDate <= endDate;
    }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  /**
   * Get recent entries
   */
  async getRecentEntries(userId: string, limit: number = 30): Promise<CachedMoodEntry[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    return data.entries
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  /**
   * Check if mood was recorded today
   */
  async isMoodRecordedToday(userId: string): Promise<boolean> {
    const todaysMood = await this.getTodaysMood(userId);
    return todaysMood !== null;
  }

  /**
   * Add mood summary
   */
  async addSummary(
    userId: string, 
    summary: Omit<CachedMoodSummary, 'id' | 'user_id' | 'created_at'>
  ): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newSummary: CachedMoodSummary = {
      ...summary,
      id: tempId,
      user_id: userId,
      created_at: now,
    };

    await this.update(
      (existing) => {
        const data = existing || { entries: [], summaries: [] };
        return {
          ...data,
          summaries: [...data.summaries, newSummary],
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'create',
      table: 'mood_summaries',
      data: summary,
      userId,
    });

    return tempId;
  }

  /**
   * Get latest summary
   */
  async getLatestSummary(userId: string): Promise<CachedMoodSummary | null> {
    const data = await this.get(userId);
    if (!data || data.summaries.length === 0) return null;
    
    return data.summaries.sort((a, b) => 
      b.created_at.localeCompare(a.created_at)
    )[0];
  }
}

export const moodCache = new MoodCacheService();
