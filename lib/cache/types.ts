/**
 * Cache Types & Interfaces
 * 
 * Defines types for the local-first caching system
 */

export type CacheStatus = 'fresh' | 'stale' | 'expired';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface CacheMetadata {
  lastFetched: number;
  lastModified: number;
  version: number;
  syncStatus: SyncStatus;
}

export interface CachedData<T> {
  data: T;
  metadata: CacheMetadata;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  userId: string;
}

export interface CacheConfig {
  maxAge: number; // milliseconds
  staleTime: number; // milliseconds
  gcInterval: number; // garbage collection interval
}

// Default cache configurations for different data types
export const CACHE_CONFIGS = {
  profile: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcInterval: 60 * 60 * 1000, // 1 hour
  },
  routines: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    staleTime: 30 * 1000, // 30 seconds
    gcInterval: 60 * 60 * 1000,
  },
  schedules: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    staleTime: 60 * 1000, // 1 minute
    gcInterval: 60 * 60 * 1000,
  },
  journals: {
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcInterval: 60 * 60 * 1000,
  },
  sleep: {
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    staleTime: 2 * 60 * 1000,
    gcInterval: 60 * 60 * 1000,
  },
  mood: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    staleTime: 60 * 1000,
    gcInterval: 60 * 60 * 1000,
  },
  streaks: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    staleTime: 30 * 1000,
    gcInterval: 60 * 60 * 1000,
  },
  semesters: {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    staleTime: 5 * 60 * 1000,
    gcInterval: 60 * 60 * 1000,
  },
} as const;
