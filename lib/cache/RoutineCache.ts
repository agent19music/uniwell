/**
 * Routine Cache Service
 * 
 * Caches user routines and their events (completions/misses)
 */

import { BaseCacheService } from './BaseCacheService';
import { CACHE_CONFIGS } from './types';
import { syncQueue } from './SyncQueue';

export type RoutineEventType = 'miss' | 'tick';

export interface CachedRoutine {
  id: string;
  user_id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'custom';
  custom_days: string[];
  days: string[] | null; // JSONB days for flexible patterns
  color: string;
  icon: string;
  is_active: boolean;
  notification_time: string | null;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CachedRoutineEvent {
  id: string;
  routine_id: string;
  user_id: string;
  event_date: string;
  event_type: RoutineEventType;
  notes: string | null;
  created_at: string;
}

// Legacy interface for backward compatibility
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
  events: CachedRoutineEvent[];
  completions?: CachedRoutineCompletion[]; // Legacy support
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
        const data = existing || { routines: [], events: [] };
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
          events: existing.events.filter(e => e.routine_id !== routineId),
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
   * Add a routine event (tick or miss) - local-first
   */
  async addEvent(
    userId: string,
    routineId: string,
    eventType: RoutineEventType,
    eventDate?: Date,
    notes?: string
  ): Promise<CachedRoutineEvent> {
    const date = eventDate || new Date();
    const eventDateStr = date.toISOString().split('T')[0];
    const now = new Date().toISOString();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const event: CachedRoutineEvent = {
      id: tempId,
      routine_id: routineId,
      user_id: userId,
      event_type: eventType,
      event_date: eventDateStr,
      notes: notes || null,
      created_at: now,
    };

    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        // Prevent duplicate events for same routine on same date
        const alreadyExists = existing.events.some(
          e => e.routine_id === routineId && e.event_date === eventDateStr
        );
        
        if (alreadyExists) return existing;
        
        return {
          ...existing,
          events: [...existing.events, event],
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'create',
      table: 'routine_events',
      data: {
        routine_id: routineId,
        event_type: eventType,
        event_date: eventDateStr,
        notes: notes || null,
      },
      userId,
    });

    return event;
  }

  /**
   * Complete a routine (convenience method - adds a 'tick' event)
   */
  async completeRoutine(userId: string, routineId: string, date?: Date): Promise<void> {
    await this.addEvent(userId, routineId, 'tick', date);
  }

  /**
   * Mark a routine as missed
   */
  async missRoutine(userId: string, routineId: string, date?: Date, notes?: string): Promise<void> {
    await this.addEvent(userId, routineId, 'miss', date, notes);
  }

  /**
   * Check if routine is completed on a specific date
   */
  async isRoutineCompleted(userId: string, routineId: string, date: Date): Promise<boolean> {
    const data = await this.get(userId);
    if (!data) return false;

    const eventDate = date.toISOString().split('T')[0];
    return data.events.some(
      e => e.routine_id === routineId && 
           e.event_date === eventDate && 
           e.event_type === 'tick'
    );
  }

  /**
   * Get all events for a routine
   */
  async getRoutineEvents(userId: string, routineId: string): Promise<CachedRoutineEvent[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    return data.events.filter(e => e.routine_id === routineId);
  }

  /**
   * Get routine events by type
   */
  async getRoutineEventsByType(
    userId: string,
    routineId: string,
    eventType: RoutineEventType
  ): Promise<CachedRoutineEvent[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    return data.events.filter(
      e => e.routine_id === routineId && e.event_type === eventType
    );
  }

  /**
   * Get completions for a routine (backward compatibility - returns tick events)
   * @deprecated Use getRoutineEvents instead
   */
  async getRoutineCompletions(userId: string, routineId: string): Promise<CachedRoutineEvent[]> {
    return this.getRoutineEventsByType(userId, routineId, 'tick');
  }
}

export const routineCache = new RoutineCacheService();
