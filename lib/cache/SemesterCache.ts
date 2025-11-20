/**
 * Semester & Class Schedule Cache Service
 * 
 * Caches semester information and class schedules
 */

import { BaseCacheService } from './BaseCacheService';
import { CACHE_CONFIGS } from './types';
import { syncQueue } from './SyncQueue';

export interface CachedSemester {
  id: string;
  user_id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface CachedClassSchedule {
  id: string;
  user_id: string;
  semester_id: string;
  course_name: string;
  course_code: string;
  room: string | null;
  instructor: string | null;
  frequency: string;
  start_time: string;
  end_time: string;
  days_of_week: string;
  type: string | null;
  notification_preference: string | null;
  created_at: string;
}

export interface CachedAttendance {
  id: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes: string | null;
}

export interface SemesterCacheData {
  semesters: CachedSemester[];
  classSchedules: CachedClassSchedule[];
  attendance: CachedAttendance[];
}

class SemesterCacheService extends BaseCacheService<SemesterCacheData> {
  constructor() {
    super('@uniwell:semesters', CACHE_CONFIGS.semesters);
  }

  /**
   * Get all semester data for a user
   */
  async getSemesterData(userId: string): Promise<SemesterCacheData | null> {
    return this.get(userId);
  }

  /**
   * Set semester data
   */
  async setSemesterData(userId: string, data: SemesterCacheData): Promise<void> {
    return this.set(data, userId);
  }

  /**
   * Add a new semester
   */
  async addSemester(userId: string, semester: Omit<CachedSemester, 'id' | 'created_at'>): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newSemester: CachedSemester = {
      ...semester,
      id: tempId,
      user_id: userId,
      created_at: now,
    };

    await this.update(
      (existing) => {
        const data = existing || { semesters: [], classSchedules: [], attendance: [] };
        return {
          ...data,
          semesters: [...data.semesters, newSemester],
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'create',
      table: 'semesters',
      data: semester,
      userId,
    });

    return tempId;
  }

  /**
   * Update semester
   */
  async updateSemester(userId: string, semesterId: string, updates: Partial<CachedSemester>): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        const semesters = existing.semesters.map(s => 
          s.id === semesterId ? { ...s, ...updates } : s
        );
        
        return { ...existing, semesters };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'update',
      table: 'semesters',
      data: { id: semesterId, ...updates },
      userId,
    });
  }

  /**
   * Delete semester and associated classes
   */
  async deleteSemester(userId: string, semesterId: string): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        return {
          semesters: existing.semesters.filter(s => s.id !== semesterId),
          classSchedules: existing.classSchedules.filter(c => c.semester_id !== semesterId),
          attendance: existing.attendance,
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'delete',
      table: 'semesters',
      data: { id: semesterId },
      userId,
    });
  }

  /**
   * Add a class schedule
   */
  async addClassSchedule(userId: string, classSchedule: Omit<CachedClassSchedule, 'id' | 'created_at'>): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newClass: CachedClassSchedule = {
      ...classSchedule,
      id: tempId,
      user_id: userId,
      created_at: now,
    };

    await this.update(
      (existing) => {
        const data = existing || { semesters: [], classSchedules: [], attendance: [] };
        return {
          ...data,
          classSchedules: [...data.classSchedules, newClass],
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'create',
      table: 'class_schedules',
      data: classSchedule,
      userId,
    });

    return tempId;
  }

  /**
   * Update class schedule
   */
  async updateClassSchedule(userId: string, classId: string, updates: Partial<CachedClassSchedule>): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        const classSchedules = existing.classSchedules.map(c => 
          c.id === classId ? { ...c, ...updates } : c
        );
        
        return { ...existing, classSchedules };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'update',
      table: 'class_schedules',
      data: { id: classId, ...updates },
      userId,
    });
  }

  /**
   * Delete class schedule
   */
  async deleteClassSchedule(userId: string, classId: string): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        
        return {
          ...existing,
          classSchedules: existing.classSchedules.filter(c => c.id !== classId),
        };
      },
      userId
    );

    // Queue for sync
    await syncQueue.enqueue({
      type: 'delete',
      table: 'class_schedules',
      data: { id: classId },
      userId,
    });
  }

  /**
   * Get active semester
   */
  async getActiveSemester(userId: string): Promise<CachedSemester | null> {
    const data = await this.get(userId);
    if (!data) return null;
    
    return data.semesters.find(s => s.status === 'active') || null;
  }

  /**
   * Get classes for semester
   */
  async getClassesForSemester(userId: string, semesterId: string): Promise<CachedClassSchedule[]> {
    const data = await this.get(userId);
    if (!data) return [];
    
    return data.classSchedules.filter(c => c.semester_id === semesterId);
  }
}

export const semesterCache = new SemesterCacheService();
