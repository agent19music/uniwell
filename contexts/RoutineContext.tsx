import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns/format';
import { ClassSchedule } from '../types/TimetableTypes'; // Adjust the import based on your types
import { useAuth } from './AuthContext';

type Frequency = 'daily' | 'weekly' | 'custom';
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type Status = 'active' | 'completed' | 'abandoned';

interface WellnessPlan {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
}

interface Goal {
  id: string;
  planId: string;
  description: string;
  targetDate: string;
  status: Status;
}

interface Habit {
  id: string;
  goalId: string;
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

interface Streak {
  id: string;
  type: 'break' | 'build';
  length: number;
  title: string;
  startDate: string;
  startTime: string;
  status: string;
}

interface RoutineContextType {
  plans: WellnessPlan[];
  goals: Goal[];
  habits: Habit[];
  attempts: HabitAttempt[];
  loading: boolean;
  error: string | null;
  createPlan: (title: string, startDate: Date, endDate?: Date) => Promise<void>;
  createGoal: (planId: string, description: string, targetDate: Date) => Promise<void>;
  createHabit: (goalId: string, title: string, frequency: Frequency, customDays?: DayOfWeek[]) => Promise<void>;
  createRoutine: (title: string, frequency: Frequency, customDays?: DayOfWeek[]) => Promise<void>;
  completeHabit: (habitId: string, date: Date, notes?: string) => Promise<void>;
  getHabitHistory: (habitId: string) => Promise<HabitAttempt[]>;
  getStreakInfo: (habitId: string) => Promise<{ current: number; longest: number }>;
  updateHabitStatus: (habitId: string, completed: boolean) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  streaks: Streak[];
  fetchStreaks: () => Promise<void>;
  createStreak: (title: string, type: 'build' | 'break', startDate: Date, startTime: Date) => Promise<void>;
  getStreak: (streakId: string) => Promise<Streak | null>;
  updateStreak: (streakId: string, updates: Partial<Streak>) => Promise<void>;
  deleteStreak: (streakId: string) => Promise<void>;
  createClassSchedule: (schedule: Omit<ClassSchedule, 'id'>) => Promise<void>;
  updateClassSchedule: (id: string, updates: Partial<ClassSchedule>) => Promise<void>;
  deleteClassSchedule: (id: string) => Promise<void>;
  fetchClassSchedules: () => Promise<ClassSchedule[]>;
  
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export function RoutineProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<WellnessPlan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [attempts, setAttempts] = useState<HabitAttempt[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);

  const { currentUser } = useAuth();

  // Fetch initial data
  useEffect(() => {
    fetchStreaks();
    fetchClassSchedules();
    fetchHabits();
    
  }, [currentUser,streaks,classSchedules]);

  const formatWellnessPlan = (plan: any): WellnessPlan => ({
    id: plan.id,
    title: plan.title,
    startDate: plan.start_date,
    endDate: plan.end_date,
  });

  const formatGoal = (goal: any): Goal => ({
    id: goal.id,
    planId: goal.plan_id,
    description: goal.description,
    targetDate: goal.target_date,
    status: goal.status,
  });

  const formatHabit = (habit: any): Habit => ({
    id: habit.id,
    goalId: habit.goal_id,
    completed: habit.completed,
    title: habit.title,
    frequency: habit.frequency,
    customDays: habit.custom_days,
    streak: {
      currentStreak: habit.streak.current_streak,
      longestStreak: habit.streak.longest_streak,
      lastUpdated: habit.streak.last_updated,
    },
  });

  const formatHabitAttempt = (attempt: any): HabitAttempt => ({
    id: attempt.id,
    habitId: attempt.habit_id,
    date: attempt.date,
    isCompleted: attempt.is_completed,
    notes: attempt.notes,
  });

  const formatStreak = (streak: any): Streak => ({
    id: streak.id,
    type: streak.type,
    length: streak.length,
    title: streak.title,
    startDate: streak.start_date,
    startTime: streak.start_time,
    status
  });



  const fetchStreaks = async () => {
    // Exit early if no current user
    if (!currentUser?.id) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('id, title, type, length, start_date, start_time')
        .eq('user_id', currentUser.id); // Fetch streaks for the current user

      if (error) throw error;

      const streaksData: Streak[] = data.map((streak: any) => ({
        id: streak.id,
        title: streak.title,
        type: streak.type,
        length: streak.length,
        startDate: streak.start_date,
        startTime: streak.start_time,
        status
      }));

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

  const createStreak = async (title: string, type: 'build' | 'break', startDate: Date, startTime: Date) => {
    // Extract timezone from the original Date object
    const timezone = startTime.toString().match(/GMT[+-]\d{4}/)![0];
    console.log(`Creating streak: title=${title}, type=${type}, startDate=${format(startDate, 'MMMM d, yyyy')}, startTime=${format(startTime, 'h:mm a')} ${timezone}`);
    try {
      const { data, error } = await supabase
        .from('streaks')
        .insert({
          title,
          type,
          start_date: format(startDate, 'MMMM d, yyyy'),
          start_time: format(startTime, 'h:mm a'),
          user_id: currentUser?.id, // Assuming user.id is available
        })
        .select();
      
      // Log the response from Supabase
      console.log('Supabase response:', { data, error });

      if (error) throw error;

      // Fetch updated streaks
      await fetchStreaks();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  

  const createGoal = async (planId: string, description: string, targetDate: Date) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          plan_id: planId,
          description,
          target_date: targetDate.toISOString(),
          status: 'active'
        })
        .select();

      if (error) throw error;
      setGoals([...goals, data[0]]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const createHabit = async (goalId: string, title: string, frequency: Frequency, customDays: DayOfWeek[] = []) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          goal_id: goalId,
          title,
          frequency,
          custom_days: customDays,
          streak: {
            current_streak: 0,
            longest_streak: 0,
            last_updated: new Date().toISOString()
          }
        })
        .select();

      if (error) throw error;
      setHabits([...habits, data[0]]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const completeHabit = async (habitId: string, date: Date, notes?: string) => {
    try {
      const { data, error } = await supabase
        .from('habit_attempts')
        .insert({
          habit_id: habitId,
          date: date.toISOString(),
          is_completed: true,
          notes
        })
        .select();

      if (error) throw error;
      setAttempts([...attempts, data[0]]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getHabitHistory = async (habitId: string) => {
    try {
      const { data, error } = await supabase
        .from('habit_attempts')
        .select('*')
        .eq('habit_id', habitId);

      if (error) throw error;
      return data;
    } catch (err) {
      setError((err as Error).message);
      return [];
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

  const updateHabitStatus = async (habitId: string, completed: boolean) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .update({ status: completed ? 'completed' : 'active' })
        .eq('id', habitId)
        .select();

      if (error) throw error;
      setHabits(habits.map(habit => habit.id === habitId ? data[0] : habit));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;
      setHabits(habits.filter(habit => habit.id !== habitId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const updateStreak = async (streakId: string, updates: Partial<Streak>) => {
    try {
      const { error } = await supabase
        .from('streaks')
        .update(updates)
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

  const fetchHabits = async () => {
    if (!currentUser?.id) {
      return; // Exit early if user ID is not available
    }
    
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (error) throw error;
      setHabits(data);
    } catch (err) {
      console.error('Error fetching routines:', err);
    }
  };

  const createRoutine = async (title: string, frequency: Frequency, customDays?: DayOfWeek[]) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          title,
          frequency,
          custom_days: customDays,
          user_id: currentUser?.id, // Assuming user.id is available
        })
        .select();
      if (error) throw error;

      // Fetch updated habits
      await fetchHabits();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getStreak = async (streakId: string): Promise<Streak | null> => {
    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('id', streakId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  };

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

  const value = {
    plans,
    goals,
    habits,
    attempts,
    loading,
    error,
    createPlan,
    createGoal,
    createHabit,
    completeHabit,
    getHabitHistory,
    getStreakInfo,
    updateHabitStatus,
    deleteHabit,
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