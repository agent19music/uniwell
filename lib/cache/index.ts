/**
 * Cache System Entry Point
 * 
 * Export all cache services and utilities
 */

export { profileCache } from './ProfileCache';
export { routineCache } from './RoutineCache';
export { semesterCache } from './SemesterCache';
export { journalCache } from './JournalCache';
export { sleepCache } from './SleepCache';
export { moodCache } from './MoodCache';
export { streakCache } from './StreakCache';
export { syncQueue } from './SyncQueue';
export { cacheManager } from './CacheManager';

export * from './types';

// Re-export types
export type { CachedProfile } from './ProfileCache';
export type { CachedRoutine, CachedRoutineCompletion, RoutineCacheData } from './RoutineCache';
export type { CachedSemester, CachedClassSchedule, SemesterCacheData } from './SemesterCache';
export type { CachedJournalEntry, JournalCacheData } from './JournalCache';
export type { CachedSleepEntry, CachedSleepGoal, SleepCacheData } from './SleepCache';
export type { CachedMoodEntry, CachedMoodSummary, MoodCacheData } from './MoodCache';
export type { CachedStreak, StreakCacheData } from './StreakCache';
