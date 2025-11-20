/**
 * Routine Cache Service
 * 
 * Caches user routines and their completions
 */

import { BaseCacheService } from './BaseCacheService';
import { CACHE_CONFIGS } from './types';
import { syncQueue } from './SyncQueue';

export interface CachedRoutine {
  id: string;
  user_id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'custom';
  custom_days: string[];
  color: string;
  icon: string;
  is_active: boolean;
  notification_time: string | null;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CachedRoutineCompletion {
  id: string;
  routine_id: string;
  user_id: string;
  completion_date: string;
  completed_at: string;
  status: 'completed' | 'missed' | 'pending';
  notes: string | null;
}

export interface RoutineCacheData {
  routines: CachedRoutine[];
  completions: CachedRoutineCompletion[];
}

class RoutineCacheService extends BaseCacheService<RoutineCacheData> {
  constructor() {
    super('@uniwell:routines', CACHE_CONFIGS.routines);
  }

  /**
   * Get all routines and completions for a user
   */
  async getRoutines(userId: string): Promise<RoutineCacheData | null> {
    return this.get(userId);
  }

  /**
   * Set routines data
   */
  async setRoutines(userId: string, data: RoutineCacheData): Promise<void> {
    return this.set(data, userId);
  }

  /**
   * Add a new routine (local-first)
   */
  async addRoutine(userId: string, routine: Omit<CachedRoutine, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newRoutine: CachedRoutine = {
      ...routine,
      id: tempId,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    await this.update(
      (existing) => {
        const data = existing || { routines: [], completions: [] };
        return {
          ...data,
          routines: [...data.routines, newRoutine],
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'create',
      table: 'routines',
      data: routine,
      userId,
    });

    return tempId;
  }

  /**
   * Update routine
   */
  async updateRoutine(userId: string, routineId: string, updates: Partial<CachedRoutine>): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        const routines = existing.routines.map(r => 
          r.id === routineId 
            ? { ...r, ...updates, updated_at: new Date().toISOString() }
            : r
        );
        
        return { ...existing, routines };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'update',
      table: 'routines',
      data: { id: routineId, ...updates },
      userId,
    });
  }

  /**
   * Delete routine
   */
  async deleteRoutine(userId: string, routineId: string): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        return {
          routines: existing.routines.filter(r => r.id !== routineId),
          completions: existing.completions.filter(c => c.routine_id !== routineId),
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'delete',
      table: 'routines',
      data: { id: routineId },
      userId,
    });
  }

  /**
   * Complete a routine (local-first)
   */
  async completeRoutine(userId: string, routineId: string, date: Date): Promise<void> {
    const completionDate = date.toISOString().split('T')[0];
    const now = new Date().toISOString();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const completion: CachedRoutineCompletion = {
      id: tempId,
      routine_id: routineId,
      user_id: userId,
      completion_date: completionDate,
      completed_at: now,
      status: 'completed',
      notes: null,
    };

    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        // Check if already completed
        const alreadyCompleted = existing.completions.some(
          c => c.routine_id === routineId && c.completion_date === completionDate
        );
        
        if (alreadyCompleted) return existing;
        
        return {
          ...existing,
          completions: [...existing.completions, completion],
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'create',
      table: 'routine_completions',
      data: {
        routine_id: routineId,
        completion_date: completionDate,
        completed_at: now,
        status: 'completed',
      },
      userId,
    });
  }

  /**
   * Check if routine is completed on a specific date
   */
  async isRoutineCompleted(userId: string, routineId: string, date: Date): Promise<boolean> {
    const data = await this.get(userId);
    if (!data) return false;

    const completionDate = date.toISOString().split('T')[0];
    return data.completions.some(
      c => c.routine_id === routineId && 
           c.completion_date === completionDate && 
           c.status === 'completed'
    );
  }

  /**
   * Get completions for a routine
   */
  async getRoutineCompletions(userId: string, routineId: string): Promise<CachedRoutineCompletion[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    return data.completions.filter(c => c.routine_id === routineId);
  }
}

export const routineCache = new RoutineCacheService();
