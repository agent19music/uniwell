import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO, differenceInDays, isYesterday, isToday, isFuture } from 'date-fns';
import { ClassSchedule } from '../types/TimetableTypes';
import { useAuth } from './AuthContext';
import * as Notifications from 'expo-notifications';
import { routineCache, streakCache } from '../lib/cache';
import type { RoutineCacheData } from '../lib/cache';

type Frequency = 'daily' | 'weekly' | 'custom';
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type CompletionStatus = 'completed' | 'missed' | 'pending' | 'warning' | 'urgent';
type RoutineEventType = 'tick' | 'miss';

interface WellnessPlan {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
}


interface Habit {
  id: string;
  userId: string;
  completed?: string[];
  title: string;
  frequency: Frequency;
  customDays: DayOfWeek[];
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastUpdated: string;
  };
}

interface HabitAttempt {
  id: string;
  habitId: string;
  date: string;
  isCompleted: boolean;
  notes: string | null;
}

export interface Streak {
  id: string;
  title: string;
  type: 'build' | 'break';
  status: 'active' | 'broken';
  startDate: string;
  startTime: string; 
  currentStreak: number;
  longestStreak: number;
  targetCount: number;
  color: string;
  icon: string;
}

interface CheckIn {
  id: string;
  streakId: string;
  checkDate: string;
  notes: string | null;
  createdAt: string;
}

export type UrgeLogOutcome = 'logged' | 'rode_out' | 'relapsed';

export interface UrgeLogEntry {
  id: string;
  streakId: string;
  intensity: number;
  triggerTags: string[];
  supportAction: string | null;
  note: string | null;
  outcome: UrgeLogOutcome;
  createdAt: string;
  resolvedAt: string | null;
}

interface Routine {
  id: string;
  userId: string;
  title: string;
  frequency: Frequency;
  customDays: string[];
  color: string;
  icon: string;
  isActive: boolean;
  notificationTime?: string;
  notificationEnabled: boolean;
  created_at: string;
  updatedAt: string;
}

interface RoutineEvent {
  id: string;
  routineId: string;
  userId: string;
  eventType: RoutineEventType;
  eventDate: string;
  notes?: string;
  createdAt: string;
}

// Legacy type alias for backward compatibility
type RoutineCompletion = RoutineEvent;

interface ProgressArchive {
  id: string;
  userId: string;
  date: string;
  hasRoutineCompletion: boolean;
  hasJournalEntry: boolean;
  hasSleepEntry: boolean;
  streakCount: number;
  sleepQualityRating?: number;
  moodRating?: number;
  createdAt: string;
}

interface RoutineContextType {
  plans: WellnessPlan[];
  habits: Habit[];
  attempts: HabitAttempt[];
  loading: boolean;
  error: string | null;
  createPlan: (title: string, startDate: Date, endDate?: Date) => Promise<void>;
  createRoutine: (title: string, frequency: Frequency, customDays?: string[], notificationTime?: string) => Promise<void>;
  getStreakInfo: (habitId: string) => Promise<{ current: number; longest: number }>;
  streaks: Streak[];
  fetchStreaks: () => Promise<void>;
  createStreak: (title: string, type: 'build' | 'break', startDate: Date, startTime: Date, targetCount?: number) => Promise<void>;
  getStreak: (streakId: string) => Promise<Streak | null>;
  updateStreak: (streakId: string, updates: Partial<Streak>) => Promise<void>;
  deleteStreak: (streakId: string) => Promise<void>;
  createClassSchedule: (schedule: Omit<ClassSchedule, 'id'>) => Promise<void>;
  updateClassSchedule: (id: string, updates: Partial<ClassSchedule>) => Promise<void>;
  deleteClassSchedule: (id: string) => Promise<void>;
  fetchClassSchedules: () => Promise<ClassSchedule[]>;
  checkIns: Record<string, CheckIn[]>;
  checkInStreak: (streakId: string, date?: Date, notes?: string) => Promise<void>;
  getStreakCheckIns: (streakId: string, days?: number) => Promise<CheckIn[]>;
  getStreakProgress: (streakId: string) => Promise<{current: number, target: number, percentage: number}>;
  isTodayCheckedIn: (streakId: string) => boolean;
  syncOfflineData: () => Promise<void>;
  resetStreak: (streakId: string) => Promise<void>;
  terminateStreak: (streakId: string) => Promise<void>;
  breakStreak: (streakId: string) => Promise<void>;
  logUrge: (
    streakId: string,
    payload: {
      intensity: number;
      triggerTags: string[];
      supportAction: string | null;
      note?: string | null;
    }
  ) => Promise<UrgeLogEntry | null>;
  updateUrgeOutcome: (urgeLogId: string, outcome: Exclude<UrgeLogOutcome, 'logged'>) => Promise<void>;
  getRecentUrges: (streakId: string, days?: number) => Promise<UrgeLogEntry[]>;
  updateRoutine: (routineId: string, updates: Partial<Routine>) => Promise<void>;
  deleteRoutine: (routineId: string) => Promise<void>;
  getRoutine: (routineId: string) => Promise<Routine | null>;
  routines: Routine[];
  routineCompletions: Record<string, RoutineCompletion[]>;
  progressArchive: ProgressArchive[];
  completeRoutine: (routineId: string, date: Date, notes?: string) => Promise<void>;
  getRoutineCompletions: (date: Date) => Promise<RoutineCompletion[]>;
  getRoutineCompletionsForRange: (startDate: Date, endDate: Date) => Promise<RoutineCompletion[]>;
  getProgressArchive: (startDate: Date, endDate: Date) => Promise<ProgressArchive[]>;
  isRoutineCompleted: (routineId: string, date: Date) => boolean;
  canCompleteRoutine: (routineId: string, date: Date) => boolean;
  getRoutineStatus: (routineId: string, date: Date) => CompletionStatus;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export function RoutineProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<WellnessPlan[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [attempts, setAttempts] = useState<HabitAttempt[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [checkIns, setCheckIns] = useState<Record<string, CheckIn[]>>({});
  const [offlineCheckIns, setOfflineCheckIns] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineCompletions, setRoutineCompletions] = useState<Record<string, RoutineCompletion[]>>({});
  const [progressArchive, setProgressArchive] = useState<ProgressArchive[]>([]);

  const { currentUser } = useAuth();

  // Fetch initial data
  useEffect(() => {
    if (currentUser?.id) {
      const loadAllData = async () => {
        try {
          setLoading(true);
          await fetchStreaks();
          await fetchClassSchedules();
          await fetchRoutines();
          await fetchProgressArchive();
          await fetchRoutineCompletionsForUser();
          setLoading(false);
        } catch (error) {
          console.error('Error loading data:', error);
          setError((error as Error).message);
          setLoading(false);
        }
      };
      
      loadAllData();
    }
  }, [currentUser?.id]);

  // Separate effect to log for debugging
  useEffect(() => {
    console.log('Current routine completions state:', routineCompletions);
  }, [routineCompletions]);

  useEffect(() => {
    // Request notification permissions
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    })();
  }, []);

  const scheduleRoutineNotifications = async (habit: Habit) => {
    try {
      // Cancel any existing notifications for this habit
      await Notifications.cancelScheduledNotificationAsync(habit.id);

      if (habit.frequency === 'daily') {
        // Schedule daily notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: habit.title,
            body: "Don't forget to complete your daily routine!",
            data: { habitId: habit.id },
          },
          trigger: {
            type: 'daily',
            hour: 9, // 9 AM
            minute: 0,
            repeats: true,
          } as any,
        });
      } else if (habit.frequency === 'weekly' && habit.customDays?.length === 1) {
        const day = habit.customDays[0];
        // Schedule weekly notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: habit.title,
            body: `Your weekly routine is due tomorrow!`,
            data: { habitId: habit.id },
          },
          trigger: {
            type: 'weekly',
            weekday: getDayNumber(day),
            hour: 9,
            minute: 0,
            repeats: true,
          } as any,
        });
      } else if (habit.frequency === 'custom' && habit.customDays?.length > 0) {
        // Schedule notifications for each custom day
        for (const day of habit.customDays) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: habit.title,
              body: `Your routine is due tomorrow!`,
              data: { habitId: habit.id },
            },
            trigger: {
              type: 'weekly',
              weekday: getDayNumber(day),
              hour: 9,
              minute: 0,
              repeats: true,
            } as any,
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const getDayNumber = (day: string): number => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.indexOf(day.toLowerCase());
  };

  const checkInStreak = async (streakId: string, date: Date = new Date(), notes?: string) => {
    const checkDate = format(date, 'yyyy-MM-dd');
    
    if (isTodayCheckedIn(streakId)) {
      return;
    }
  
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          streak_id: streakId,
          check_date: checkDate,
          notes,
        })
        .select();
  
      if (error) throw error;
  
      const newCheckIn = formatCheckIn(data[0]);
      setCheckIns(prev => ({
        ...prev,
        [streakId]: [...(prev[streakId] || []), newCheckIn]
      }));
  
      await fetchStreaks(); // Refresh streak data
    } catch (err) {
      setError((err as Error).message);
    }
  };
  
  const getStreakCheckIns = async (streakId: string, days: number = 30): Promise<CheckIn[]> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('streak_id', streakId)
        .gte('check_date', format(startDate, 'yyyy-MM-dd'))
        .order('check_date', { ascending: true });
        
      if (error) throw error;
      
      return data.map(formatCheckIn);
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  };
  

  const getStreakProgress = async (streakId: string) => {
    const streak = streaks.find(s => s.id === streakId);
    
    if (!streak) {
      return { current: 0, target: 30, percentage: 0 };
    }
    
    const percentage = streak.targetCount > 0 
      ? Math.min(100, (streak.currentStreak / streak.targetCount) * 100)
      : 0;
      
    return {
      current: streak.currentStreak,
      target: streak.targetCount,
      percentage
    };
  };
  
  const isTodayCheckedIn = (streakId: string): boolean => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const streakCheckIns = checkIns[streakId] || [];
    return streakCheckIns.some(checkIn => checkIn.checkDate === today);
  };

  useEffect(() => {
    const handleConnectivityChange = async (isConnected: boolean) => {
      setIsConnected(isConnected);
      if (isConnected) {
        await syncOfflineData();
      }
    };
  
    // Initialize connectivity state
    const checkConnectivity = async () => {
      try {
        const response = await fetch('https://www.google.com');
        handleConnectivityChange(response.ok);
      } catch {
        handleConnectivityChange(false);
      }
    };
  
    checkConnectivity();
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const formatWellnessPlan = (plan: any): WellnessPlan => ({
    id: plan.id,
    title: plan.title,
    startDate: plan.start_date,
    endDate: plan.end_date,
  });



  const formatStreak = (streak: any): Streak => {
    if (!streak) {
      throw new Error('Invalid streak data');
    }
    
    const startDate = streak.start_date ? parseISO(streak.start_date) : new Date();
    const now = new Date();
    const elapsedDays = differenceInDays(now, startDate);
    const currentStreak = streak.status === 'active' ? elapsedDays : streak.current_streak || 0;
    
    return {
      id: streak.id,
      title: streak.title,
      type: streak.type,
      status: streak.status,
      startDate: streak.start_date,
      startTime: streak.start_time,
      currentStreak: currentStreak,
      longestStreak: streak.longest_streak || currentStreak,
      targetCount: streak.target_count || 30,
      color: streak.color || '#FF7F50',
      icon: streak.icon || 'flame'
    };
  };

  const formatCheckIn = (checkIn: any): CheckIn => {
    if (!checkIn) {
      throw new Error('Invalid check-in data');
    }
    
    return {
      id: checkIn.id,
      streakId: checkIn.streak_id,
      checkDate: checkIn.check_date,
      notes: checkIn.notes,
      createdAt: checkIn.created_at
    };
  };


  const fetchStreaks = async () => {
    if (!currentUser?.id) return;

    try {
      // Try cache first
      let cachedData = await streakCache.getStreaks(currentUser.id);
      
      if (cachedData) {
        const streaksData = cachedData.streaks.map((s): Streak => ({
          id: s.id,
          title: s.title,
          type: s.type,
          status: s.status,
          startDate: s.start_date,
          startTime: s.start_time,
          currentStreak: s.current_streak,
          longestStreak: s.longest_streak,
          targetCount: s.target_count,
          color: s.color,
          icon: s.icon,
        }));
        setStreaks(streaksData);
        
        // Check if stale and refresh
        const status = await streakCache.getStatus(currentUser.id);
        if (status === 'stale') {
          fetchStreaksFromServer();
        }
      } else {
        await fetchStreaksFromServer();
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const fetchStreaksFromServer = async () => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Update cache
      await streakCache.setStreaks(currentUser.id, {
        streaks: data.map((s: any) => ({
          id: s.id,
          user_id: s.user_id,
          title: s.title,
          type: s.type,
          status: s.status,
          start_date: s.start_date,
          start_time: s.start_time,
          current_streak: s.current_streak,
          longest_streak: s.longest_streak,
          target_count: s.target_count,
          color: s.color,
          icon: s.icon,
          created_at: s.created_at,
          updated_at: s.updated_at,
        })),
      });

      const streaksData = data.map(formatStreak);
      setStreaks(streaksData);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const createPlan = async (title: string, startDate: Date, endDate?: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('wellness_plans')
        .insert({
          user_id: user?.id,
          title,
          start_date: startDate.toISOString(),
          end_date: endDate?.toISOString()
        })
        .select();

      if (error) throw error;
      setPlans([...plans, data[0]]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const createStreak = async (
    title: string, 
    type: 'build' | 'break', 
    startDate: Date, 
    startTime: Date,
    targetCount: number = 30
  ) => {
    try {
      // Combine date and time into a single ISO string
      const combinedDateTime = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startTime.getHours(),
        startTime.getMinutes()
      );

      const { data, error } = await supabase
        .from('streaks')
        .insert({
          title,
          type,
          start_date: combinedDateTime.toISOString(),
          start_time: combinedDateTime.toISOString(),
          user_id: currentUser?.id,
          status: 'active',
          current_streak: 0,
          longest_streak: 0,
          target_count: targetCount
        })
        .select();
      
      if (error) throw error;

      // Fetch updated streaks
      await fetchStreaks();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  






  const getStreakInfo = async (habitId: string) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('streak')
        .eq('id', habitId)
        .single();

      if (error) throw error;
      return data.streak;
    } catch (err) {
      setError((err as Error).message);
      return { current: 0, longest: 0 };
    }
  };




  const updateStreak = async (streakId: string, updates: Partial<Streak>) => {
    try {
      const { error } = await supabase
        .from('streaks')
        .update({
          ...updates,
          current_streak: updates.status === 'active' ? 
            differenceInDays(new Date(), new Date(updates.startDate || '')) : 
            updates.currentStreak
        })
        .eq('id', streakId);

      if (error) throw error;
      await fetchStreaks(); // Refresh streaks after update
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const createClassSchedule = async (schedule: Omit<ClassSchedule, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('class_schedules')
        .insert(schedule)
        .select();
      if (error) throw error;
      setClassSchedules((prev) => [...prev, data[0]]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const updateClassSchedule = async (id: string, updates: Partial<ClassSchedule>) => {
    try {
      const { data, error } = await supabase
        .from('class_schedules')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      setClassSchedules((prev) => prev.map((schedule) => (schedule.id === id ? data[0] : schedule)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteClassSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('class_schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setClassSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const fetchClassSchedules = async (): Promise<ClassSchedule[]> => {
    try {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('*');
      if (error) throw error;
      setClassSchedules(data);
      return data;
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  };



  const createRoutine = async (
    title: string,
    frequency: Frequency,
    customDays?: string[],
    notificationTime?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .insert({
          user_id: currentUser?.id,
          title,
          frequency,
          custom_days: customDays || [],
          notification_time: notificationTime,
          notification_enabled: !!notificationTime
        })
        .select();

      if (error) throw error;

      // Schedule notification if enabled
      if (notificationTime && data[0]) {
        await scheduleRoutineNotification(data[0]);
      }

      setRoutines([...routines, data[0]]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getStreak = useCallback(async (streakId: string): Promise<Streak | null> => {
    // First check the local state
    const localStreak = streaks.find(s => s.id === streakId);
    if (localStreak) return localStreak;
  
    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('id', streakId)
        .single();
  
      if (error) throw error;
      const formattedStreak = formatStreak(data);
      
      // Update local state
      setStreaks(prev => [...prev, formattedStreak]);
      return formattedStreak;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [streaks]);

  const deleteStreak = async (streakId: string) => {
    try {
      const { error } = await supabase
        .from('streaks')
        .delete()
        .eq('id', streakId);

      if (error) throw error;
      setStreaks(streaks.filter(streak => streak.id !== streakId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const syncOfflineData = async () => {
    if (!isConnected || offlineCheckIns.length === 0) return;
  
    try {
      // Process each offline check-in
      for (const checkIn of offlineCheckIns) {
        const { error } = await supabase
          .from('check_ins')
          .insert(checkIn);
          
        if (error && error.code !== '23505') { // Ignore unique constraint violations
          throw error;
        }
      }
      
      // Clear offline check-ins after successful sync
      setOfflineCheckIns([]);
      
      // Refresh streaks data
      await fetchStreaks();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const resetStreak = async (streakId: string) => {
    try {
      const { error } = await supabase
        .rpc('reset_streak', { streak_id: streakId });

      if (error) throw error;
      await fetchStreaks(); // Refresh streaks after reset
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const terminateStreak = async (streakId: string) => {
    try {
      const { error } = await supabase
        .rpc('terminate_streak', { streak_id: streakId });

      if (error) throw error;
      await fetchStreaks(); // Refresh streaks after termination
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const breakStreak = async (streakId: string) => {
    try {
      const { error } = await supabase
        .rpc('break_streak', { streak_id: streakId });

      if (error) throw error;
      await fetchStreaks(); // Refresh streaks after breaking
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formatUrgeLog = (row: {
    id: string;
    streak_id: string;
    intensity: number;
    trigger_tags: string[] | null;
    support_action: string | null;
    note: string | null;
    outcome: string;
    created_at: string;
    resolved_at: string | null;
  }): UrgeLogEntry => ({
    id: row.id,
    streakId: row.streak_id,
    intensity: row.intensity,
    triggerTags: row.trigger_tags ?? [],
    supportAction: row.support_action,
    note: row.note,
    outcome: row.outcome as UrgeLogOutcome,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  });

  const logUrge = async (
    streakId: string,
    payload: {
      intensity: number;
      triggerTags: string[];
      supportAction: string | null;
      note?: string | null;
    }
  ): Promise<UrgeLogEntry | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setError('You must be signed in to log an urge.');
        return null;
      }

      const { data, error } = await supabase
        .from('urge_logs')
        .insert({
          user_id: user.id,
          streak_id: streakId,
          intensity: payload.intensity,
          trigger_tags: payload.triggerTags,
          support_action: payload.supportAction,
          note: payload.note ?? null,
          outcome: 'logged',
        })
        .select()
        .single();

      if (error) throw error;
      return formatUrgeLog(data as Parameters<typeof formatUrgeLog>[0]);
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  };

  const updateUrgeOutcome = async (
    urgeLogId: string,
    outcome: Exclude<UrgeLogOutcome, 'logged'>
  ) => {
    try {
      const { error } = await supabase
        .from('urge_logs')
        .update({
          outcome,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', urgeLogId);

      if (error) throw error;
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getRecentUrges = async (streakId: string, days: number = 7): Promise<UrgeLogEntry[]> => {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceIso = since.toISOString();

      const { data, error } = await supabase
        .from('urge_logs')
        .select('*')
        .eq('streak_id', streakId)
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((row: Parameters<typeof formatUrgeLog>[0]) => formatUrgeLog(row));
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  };

  const updateRoutine = async (routineId: string, updates: Partial<Routine>) => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .update(updates)
        .eq('id', routineId)
        .select();

      if (error) throw error;

      // Update notification if time changed
      if (updates.notificationTime && data[0]) {
        await scheduleRoutineNotification(data[0]);
      }

      setRoutines(routines.map(r => r.id === routineId ? data[0] : r));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteRoutine = async (routineId: string) => {
    try {
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', routineId);

      if (error) throw error;

      // Cancel notification
      await Notifications.cancelScheduledNotificationAsync(routineId);

      setRoutines(routines.filter(r => r.id !== routineId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const fetchRoutines = async () => {
    if (!currentUser?.id) return;

    try {
      // Try cache first
      let cachedData = await routineCache.getRoutines(currentUser.id);
      
      if (cachedData) {
        setRoutines(cachedData.routines.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          title: r.title,
          frequency: r.frequency,
          customDays: r.custom_days || [],
          color: r.color,
          icon: r.icon,
          isActive: r.is_active,
          notificationTime: r.notification_time,
          notificationEnabled: r.notification_enabled,
          created_at: r.created_at,
          updatedAt: r.updated_at,
        })));
        
        // Group events by date
        const eventsByDate: Record<string, RoutineEvent[]> = {};
        (cachedData.events || []).forEach(event => {
          if (!eventsByDate[event.event_date]) {
            eventsByDate[event.event_date] = [];
          }
          eventsByDate[event.event_date].push({
            id: event.id,
            routineId: event.routine_id,
            userId: event.user_id,
            eventType: event.event_type as RoutineEventType,
            eventDate: event.event_date,
            notes: event.notes || undefined,
            createdAt: event.created_at,
          });
        });
        setRoutineCompletions(eventsByDate);
        
        // Check if cache is stale and refresh in background
        const status = await routineCache.getStatus(currentUser.id);
        if (status === 'stale') {
          fetchRoutinesFromServer();
        }
      } else {
        // Not in cache, fetch from server
        await fetchRoutinesFromServer();
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const fetchRoutinesFromServer = async () => {
    if (!currentUser?.id) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const [routinesRes, eventsRes] = await Promise.all([
        supabase.from('routines').select('*').eq('user_id', currentUser.id),
        supabase.from('routine_events').select('*')
          .eq('user_id', currentUser.id)
          .gte('event_date', format(startDate, 'yyyy-MM-dd'))
      ]);

      if (routinesRes.error) throw routinesRes.error;
      if (eventsRes.error) throw eventsRes.error;

      // Update cache
      await routineCache.setRoutines(currentUser.id, {
        routines: routinesRes.data.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          title: r.title,
          frequency: r.frequency,
          custom_days: r.custom_days || [],
          days: r.days || [],
          color: r.color,
          icon: r.icon,
          is_active: r.is_active,
          notification_time: r.notification_time,
          notification_enabled: r.notification_enabled,
          created_at: r.created_at,
          updated_at: r.updated_at,
        })),
        events: eventsRes.data.map((e: any) => ({
          id: e.id,
          routine_id: e.routine_id,
          user_id: e.user_id,
          event_type: e.event_type,
          event_date: e.event_date,
          notes: e.notes,
          created_at: e.created_at,
        })),
      });

      setRoutines(routinesRes.data || []);
      
      // Group events by date
      const eventsByDate: Record<string, RoutineEvent[]> = {};
      eventsRes.data.forEach((item: any) => {
        const dateStr = item.event_date;
        if (!eventsByDate[dateStr]) {
          eventsByDate[dateStr] = [];
        }
        eventsByDate[dateStr].push({
          id: item.id,
          routineId: item.routine_id,
          userId: item.user_id,
          eventType: item.event_type as RoutineEventType,
          eventDate: item.event_date,
          notes: item.notes,
          createdAt: item.created_at,
        });
      });
      setRoutineCompletions(eventsByDate);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const fetchRoutineCompletionsForUser = async () => {
    try {
      // Get events for the last 30 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const { data, error } = await supabase
        .from('routine_events')
        .select('*')
        .eq('user_id', currentUser?.id)
        .gte('event_date', format(startDate, 'yyyy-MM-dd'));

      if (error) throw error;
      
      // Group events by date for easier lookup
      const eventsByDate: Record<string, RoutineEvent[]> = {};
      
      data.forEach((item: { id: string; routine_id: string; user_id: string; event_type: string; event_date: string; notes: string | null; created_at: string }) => { 
        const dateStr = item.event_date;
        if (!eventsByDate[dateStr]) {
          eventsByDate[dateStr] = [];
        }
        
        // Format the event to match the expected structure
        const event: RoutineEvent = {
          id: item.id,
          routineId: item.routine_id,
          userId: item.user_id,
          eventType: item.event_type as RoutineEventType,
          eventDate: item.event_date,
          notes: item.notes || undefined,
          createdAt: item.created_at,
        };
        
        eventsByDate[dateStr].push(event);
      });
      
      setRoutineCompletions(eventsByDate);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const fetchProgressArchive = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const { data, error } = await supabase
        .from('progress_archive')
        .select('*')
        .eq('user_id', currentUser?.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;
      setProgressArchive(data || []);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getRoutine = async (routineId: string): Promise<Routine | null> => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('id', routineId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  };

  // Use useEffect to properly handle the async call
  useEffect(() => {
    const fetchRoutine = async () => {
      const routine = await getRoutine('7fab5093-ff93-43b7-a9d7-a4edc726e7a8');
      console.log('Routine data:', routine);
    };
    
    fetchRoutine();
  }, []);

  const scheduleRoutineNotification = async (routine: Routine) => {
    if (!routine.notificationEnabled || !routine.notificationTime) return;

    try {
      // Cancel existing notification
      await Notifications.cancelScheduledNotificationAsync(routine.id);

      // Parse notification time safely with default values
      const defaultTime = '09:00';
      const timeString = routine.notificationTime || defaultTime;
      const timeParts = timeString.split(':');
      const hours = parseInt(timeParts[0] || '9', 10);
      const minutes = parseInt(timeParts[1] || '0', 10);
      const hour = isNaN(hours) ? 9 : hours;
      const minute = isNaN(minutes) ? 0 : minutes;

      // Schedule new notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: routine.title,
          body: "Time to complete your routine!",
          data: { routineId: routine.id },
        },
        trigger: {
          type: 'daily',
          hour: hour,
          minute: minute,
          repeats: true,
        } as any,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const completeRoutine = async (routineId: string, date: Date, notes?: string) => {
    if (!canCompleteRoutine(routineId, date)) {
      throw new Error('Cannot complete routines older than 2 days');
    }
    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Complete routine in cache (optimistic update)
      await routineCache.completeRoutine(currentUser.id, routineId, date);
      
      // Update local state immediately with new event structure
      const tempEvent: RoutineEvent = {
        id: `temp-${Date.now()}`,
        routineId: routineId,
        userId: currentUser.id,
        eventType: 'tick',
        eventDate: formattedDate,
        notes: notes,
        createdAt: new Date().toISOString(),
      };
      
      setRoutineCompletions(prev => {
        const updated = { ...prev };
        if (!updated[formattedDate]) {
          updated[formattedDate] = [];
        }
        updated[formattedDate] = [...updated[formattedDate], tempEvent];
        return updated;
      });

      // Refresh progress archive
      await fetchProgressArchive();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const getRoutineCompletions = useCallback(async (date: Date) => {
    try {
      const { data, error } = await supabase
        .from('routine_events')
        .select('*')
        .eq('user_id', currentUser?.id)
        .eq('event_date', format(date, 'yyyy-MM-dd'))
        .eq('event_type', 'tick'); // Only get completed routines

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, [currentUser?.id]);

  const getRoutineCompletionsForRange = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const { data, error } = await supabase
        .from('routine_events')
        .select('*')
        .eq('user_id', currentUser?.id)
        .eq('event_type', 'tick') // Only get completed routines
        .gte('event_date', format(startDate, 'yyyy-MM-dd'))
        .lte('event_date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;
      
      // Map to RoutineEvent type
      return (data || []).map((item: any) => ({
        id: item.id,
        routineId: item.routine_id,
        userId: item.user_id,
        eventType: item.event_type as RoutineEventType,
        eventDate: item.event_date,
        notes: item.notes,
        createdAt: item.created_at,
      }));
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  }, [currentUser?.id]);

  const getProgressArchive = async (startDate: Date, endDate: Date) => {
    try {
      const { data, error } = await supabase
        .from('progress_archive')
        .select('*')
        .eq('user_id', currentUser?.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError((err as Error).message);
      return [];
    }
  };

  const isRoutineCompleted = useCallback((routineId: string, date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Check if we have events for this date
      const eventsForDate = routineCompletions[dateStr];
      
      if (!eventsForDate || eventsForDate.length === 0) {
        return false;
      }
      
      // Check if this specific routine has a 'tick' event (completed)
      const isCompleted = eventsForDate.some(
        event => event.routineId === routineId && event.eventType === 'tick'
      );
      
      console.log(`Checking completion for routine ${routineId} on ${dateStr}: ${isCompleted ? 'Completed' : 'Not completed'}`);
      
      return isCompleted;
    } catch (error) {
      console.error('Error checking routine completion:', error);
      return false;
    }
  }, [routineCompletions]);

  const canCompleteRoutine = useCallback((routineId: string, date: Date) => {
    if (isFuture(date)) return false;
    const daysDiff = differenceInDays(new Date(), date);
    return daysDiff <= 2;
  }, []);

  const getRoutineStatus = useCallback((routineId: string, date: Date): CompletionStatus => {
    if (isFuture(date)) return 'pending';
    if (!canCompleteRoutine(routineId, date)) return 'missed';
    
    const isCompleted = isRoutineCompleted(routineId, date);
    if (isCompleted) return 'completed';

    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    
    // If it's a different day, check if it's missed
    if (!isToday(date)) {
      return 'missed';
    }

    // Time-based progression for today
    if (currentHour >= 16 && currentHour < 22) { // 4 PM to 10 PM
      return 'warning';
    } else if (currentHour >= 22) { // After 10 PM
      return 'urgent';
    }

    return 'pending';
  }, [canCompleteRoutine, isRoutineCompleted]);

  const value = {
    plans,
 
    habits,
    attempts,
    loading,
    error,
    createPlan,
 
    getStreakInfo,
    streaks,
    fetchStreaks,
    createStreak,
    getStreak,
    updateStreak,
    deleteStreak,
    createClassSchedule,
    updateClassSchedule,
    deleteClassSchedule,
    fetchClassSchedules,
    createRoutine,
    checkIns,
    checkInStreak,
    getStreakCheckIns,
    getStreakProgress,
    isTodayCheckedIn,
    syncOfflineData,
    resetStreak,
    terminateStreak,
    breakStreak,
    logUrge,
    updateUrgeOutcome,
    getRecentUrges,
    updateRoutine,
    deleteRoutine,
    getRoutine,
    routines,
    routineCompletions,
    progressArchive,
    completeRoutine,
    getRoutineCompletions,
    getRoutineCompletionsForRange,
    getProgressArchive,
    isRoutineCompleted,
    canCompleteRoutine,
    getRoutineStatus
  };

  return (
    <RoutineContext.Provider value={value}>
      {children}
    </RoutineContext.Provider>
  );
}

export const useRoutine = () => {
  const context = useContext(RoutineContext);
  if (context === undefined) {
    throw new Error('useRoutine must be used within a RoutineProvider');
  }
  return context;
};