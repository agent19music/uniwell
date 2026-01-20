/**
 * Streak Cache Service
 * 
 * Caches streak data with events (milestones, relapses, check-ins)
 */

import { BaseCacheService } from './BaseCacheService';
import { CACHE_CONFIGS } from './types';
import { syncQueue } from './SyncQueue';

export type StreakEventType = 'relapse' | 'milestone' | 'check_in';

export interface CachedStreakEvent {
  id: string;
  streak_id: string;
  timestamp: string;
  event_type: StreakEventType;
  milestone_days: number | null;
  notes: string | null;
  created_at: string;
}

export interface CachedStreak {
  id: string;
  user_id: string;
  title: string;
  type: 'build' | 'break';
  status: 'active' | 'broken';
  start_date: string;
  start_time: string;
  current_streak: number;
  longest_streak: number;
  target_count: number;
  target_days: number | null;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  events?: CachedStreakEvent[];
}

export interface StreakCacheData {
  streaks: CachedStreak[];
}

class StreakCacheService extends BaseCacheService<StreakCacheData> {
  constructor() {
    super('@uniwell:streaks', CACHE_CONFIGS.streaks);
  }

  /**
   * Get all streaks for a user
   */
  async getStreaks(userId: string): Promise<StreakCacheData | null> {
    return this.get(userId);
  }

  /**
   * Set streak data
   */
  async setStreaks(userId: string, data: StreakCacheData): Promise<void> {
    return this.set(data, userId);
  }

  /**
   * Add a new streak
   */
  async addStreak(
    userId: string, 
    streak: Omit<CachedStreak, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newStreak: CachedStreak = {
      ...streak,
      id: tempId,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    await this.update(
      (existing) => {
        const data = existing || { streaks: [] };
        return {
          streaks: [...data.streaks, newStreak],
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'create',
      table: 'streaks',
      data: streak,
      userId,
    });

    return tempId;
  }

  /**
   * Update streak
   */
  async updateStreak(
    userId: string, 
    streakId: string, 
    updates: Partial<CachedStreak>
  ): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        const streaks = existing.streaks.map(s => 
          s.id === streakId 
            ? { ...s, ...updates, updated_at: new Date().toISOString() }
            : s
        );
        
        return { streaks };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'update',
      table: 'streaks',
      data: { id: streakId, ...updates },
      userId,
    });
  }

  /**
   * Delete streak
   */
  async deleteStreak(userId: string, streakId: string): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        return {
          streaks: existing.streaks.filter(s => s.id !== streakId),
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'delete',
      table: 'streaks',
      data: { id: streakId },
      userId,
    });
  }

  /**
   * Increment streak
   */
  async incrementStreak(userId: string, streakId: string): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        const streaks = existing.streaks.map(s => {
          if (s.id === streakId) {
            const newCurrent = s.current_streak + 1;
            return {
              ...s,
              current_streak: newCurrent,
              longest_streak: Math.max(s.longest_streak, newCurrent),
              updated_at: new Date().toISOString(),
            };
          }
          return s;
        });
        
        return { streaks };
      },
      userId
    );

    // Get the updated streak
    const data = await this.get(userId);
    const streak = data?.streaks.find(s => s.id === streakId);
    
    if (streak) {
      await syncQueue.enqueue({
        type: 'update',
        table: 'streaks',
        data: { 
          id: streakId, 
          current_streak: streak.current_streak,
          longest_streak: streak.longest_streak,
          updated_at: streak.updated_at,
        },
        userId,
      });
    }
  }

  /**
   * Reset streak
   */
  async resetStreak(userId: string, streakId: string): Promise<void> {
    await this.updateStreak(userId, streakId, {
      current_streak: 0,
      status: 'active',
    });
  }

  /**
   * Break streak
   */
  async breakStreak(userId: string, streakId: string): Promise<void> {
    await this.updateStreak(userId, streakId, {
      status: 'broken',
    });
  }

  /**
   * Get active streaks
   */
  async getActiveStreaks(userId: string): Promise<CachedStreak[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    return data.streaks.filter(s => s.status === 'active');
  }

  /**
   * Add a streak event (relapse, milestone, check_in)
   */
  async addEvent(
    userId: string,
    streakId: string,
    event: Omit<CachedStreakEvent, 'id' | 'streak_id' | 'timestamp' | 'created_at'>
  ): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newEvent: CachedStreakEvent = {
      ...event,
      id: tempId,
      streak_id: streakId,
      timestamp: now,
      created_at: now,
    };

    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        const streaks = existing.streaks.map(s => {
          if (s.id === streakId) {
            return {
              ...s,
              events: [...(s.events || []), newEvent],
            };
          }
          return s;
        });
        
        return { streaks };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'create',
      table: 'streak_events',
      data: {
        streak_id: streakId,
        event_type: event.event_type,
        milestone_days: event.milestone_days,
        notes: event.notes,
      },
      userId,
    });

    return tempId;
  }

  /**
   * Get events for a streak
   */
  async getStreakEvents(userId: string, streakId: string): Promise<CachedStreakEvent[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    const streak = data.streaks.find(s => s.id === streakId);
    return streak?.events || [];
  }
}

export const streakCache = new StreakCacheService();
