/**
 * Cache Manager
 * 
 * Central manager for all cache operations including initialization,
 * sync, and garbage collection
 */

import { profileCache } from './ProfileCache';
import { routineCache } from './RoutineCache';
import { semesterCache } from './SemesterCache';
import { journalCache } from './JournalCache';
import { sleepCache } from './SleepCache';
import { moodCache } from './MoodCache';
import { streakCache } from './StreakCache';
import { syncQueue } from './SyncQueue';
import { supabase } from '../supabase';

class CacheManager {
  private gcInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the cache system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[CacheManager] Initializing cache system...');

    // Start garbage collection interval (every hour)
    this.gcInterval = setInterval(() => {
      this.runGarbageCollection();
    }, 60 * 60 * 1000);

    // Start sync interval (every 5 minutes)
    this.syncInterval = setInterval(() => {
      syncQueue.sync();
    }, 5 * 60 * 1000);

    this.isInitialized = true;
    console.log('[CacheManager] Cache system initialized');
  }

  /**
   * Warm up cache with user data
   */
  async warmupCache(userId: string): Promise<void> {
    console.log('[CacheManager] Warming up cache for user:', userId);

    try {
      await Promise.allSettled([
        this.warmupProfile(userId),
        this.warmupRoutines(userId),
        this.warmupSemesters(userId),
        this.warmupJournals(userId),
        this.warmupSleep(userId),
        this.warmupMood(userId),
        this.warmupStreaks(userId),
      ]);

      console.log('[CacheManager] Cache warmup completed');
    } catch (error) {
      console.error('[CacheManager] Error during cache warmup:', error);
    }
  }

  /**
   * Warmup profile data
   */
  private async warmupProfile(userId: string): Promise<void> {
    const status = await profileCache.getStatus(userId);
    
    if (status === 'expired') {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        await profileCache.setProfile(userId, data);
      }
    }
  }

  /**
   * Warmup routines data
   */
  private async warmupRoutines(userId: string): Promise<void> {
    const status = await routineCache.getStatus(userId);
    
    if (status === 'expired') {
      const [routinesRes, completionsRes] = await Promise.all([
        supabase.from('routines').select('*').eq('user_id', userId),
        supabase.from('routine_completions').select('*').eq('user_id', userId),
      ]);

      if (!routinesRes.error && !completionsRes.error) {
        await routineCache.setRoutines(userId, {
          routines: routinesRes.data || [],
          completions: completionsRes.data || [],
        });
      }
    }
  }

  /**
   * Warmup semesters data
   */
  private async warmupSemesters(userId: string): Promise<void> {
    const status = await semesterCache.getStatus(userId);
    
    if (status === 'expired') {
      const [semestersRes, classesRes] = await Promise.all([
        supabase.from('semesters').select('*').eq('user_id', userId),
        supabase.from('class_schedules').select('*').eq('user_id', userId),
      ]);

      if (!semestersRes.error && !classesRes.error) {
        await semesterCache.setSemesterData(userId, {
          semesters: semestersRes.data || [],
          classSchedules: classesRes.data || [],
          attendance: [],
        });
      }
    }
  }

  /**
   * Warmup journals data
   */
  private async warmupJournals(userId: string): Promise<void> {
    const status = await journalCache.getStatus(userId);
    
    if (status === 'expired') {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .limit(90); // Last 90 days

      if (!error && data) {
        await journalCache.setJournals(userId, { entries: data });
      }
    }
  }

  /**
   * Warmup sleep data
   */
  private async warmupSleep(userId: string): Promise<void> {
    const status = await sleepCache.getStatus(userId);
    
    if (status === 'expired') {
      const [entriesRes, goalsRes] = await Promise.all([
        supabase
          .from('sleep_data')
          .select('*')
          .eq('user_id', userId)
          .order('sleep_date', { ascending: false })
          .limit(90),
        supabase.from('sleep_goals').select('*').eq('user_id', userId),
      ]);

      if (!entriesRes.error && !goalsRes.error) {
        await sleepCache.setSleepData(userId, {
          entries: entriesRes.data || [],
          goals: goalsRes.data || [],
        });
      }
    }
  }

  /**
   * Warmup mood data
   */
  private async warmupMood(userId: string): Promise<void> {
    const status = await moodCache.getStatus(userId);
    
    if (status === 'expired') {
      const [entriesRes, summariesRes] = await Promise.all([
        supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(60),
        supabase
          .from('mood_summaries')
          .select('*')
          .eq('user_id', userId)
          .order('week_start_date', { ascending: false })
          .limit(12),
      ]);

      if (!entriesRes.error && !summariesRes.error) {
        await moodCache.setMoodData(userId, {
          entries: entriesRes.data || [],
          summaries: summariesRes.data || [],
        });
      }
    }
  }

  /**
   * Warmup streaks data
   */
  private async warmupStreaks(userId: string): Promise<void> {
    const status = await streakCache.getStatus(userId);
    
    if (status === 'expired') {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) {
        await streakCache.setStreaks(userId, { streaks: data });
      }
    }
  }

  /**
   * Run garbage collection on all caches
   */
  async runGarbageCollection(): Promise<void> {
    console.log('[CacheManager] Running garbage collection...');

    try {
      await Promise.all([
        profileCache.gc(),
        routineCache.gc(),
        semesterCache.gc(),
        journalCache.gc(),
        sleepCache.gc(),
        moodCache.gc(),
        streakCache.gc(),
      ]);

      console.log('[CacheManager] Garbage collection completed');
    } catch (error) {
      console.error('[CacheManager] Error during garbage collection:', error);
    }
  }

  /**
   * Clear all caches for a user (logout scenario)
   */
  async clearAllCaches(): Promise<void> {
    console.log('[CacheManager] Clearing all caches...');

    try {
      await Promise.all([
        profileCache.clear(),
        routineCache.clear(),
        semesterCache.clear(),
        journalCache.clear(),
        sleepCache.clear(),
        moodCache.clear(),
        streakCache.clear(),
      ]);

      console.log('[CacheManager] All caches cleared');
    } catch (error) {
      console.error('[CacheManager] Error clearing caches:', error);
    }
  }

  /**
   * Force sync all pending operations
   */
  async forceSync(): Promise<void> {
    console.log('[CacheManager] Force syncing all pending operations...');
    await syncQueue.sync();
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    pendingCount: number;
    isOnline: boolean;
  }> {
    const pendingCount = await syncQueue.getPendingCount();
    const isOnline = syncQueue.getOnlineStatus();

    return { pendingCount, isOnline };
  }

  /**
   * Shutdown cache manager
   */
  shutdown(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.isInitialized = false;
    console.log('[CacheManager] Cache system shut down');
  }
}

export const cacheManager = new CacheManager();
