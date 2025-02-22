import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Frequency = 'daily' | 'weekly' | 'custom';
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type Status = 'active' | 'completed' | 'abandoned';

interface WellnessPlan {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
}

interface Goal {
  id: string;
  plan_id: string;
  description: string;
  target_date: string;
  status: Status;
}

interface Habit {
  id: string;
  goal_id: string;
  title: string;
  frequency: Frequency;
  custom_days: DayOfWeek[];
  streak: {
    current_streak: number;
    longest_streak: number;
    last_updated: string;
  };
}

interface HabitAttempt {
  id: string;
  habit_id: string;
  date: string;
  is_completed: boolean;
  notes: string | null;
}

interface Streak {
  habitId: string;
  type: 'break' | 'build';
  streak: number;
  color: string;
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
  completeHabit: (habitId: string, date: Date, notes?: string) => Promise<void>;
  getHabitHistory: (habitId: string) => Promise<HabitAttempt[]>;
  getStreakInfo: (habitId: string) => Promise<{ current: number; longest: number }>;
  updateHabitStatus: (habitId: string, completed: boolean) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  streaks: Streak[];
  fetchStreaks: () => Promise<void>;
  createStreak: (habitId: string, title: string, startDate: Date, endDate?: Date) => Promise<void>;
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

  // Fetch initial data
  useEffect(() => {
    fetchUserData();
    fetchStreaks();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Fetch all relevant data
      const [plansData, goalsData, habitsData, attemptsData] = await Promise.all([
        supabase.from('wellness_plans').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*'),
        supabase.from('habits').select('*, streaks(*)'),
        supabase.from('habit_attempts').select('*').eq('user_id', user.id)
      ]);

      setPlans(plansData.data || []);
      setGoals(goalsData.data || []);
      setHabits(habitsData.data || []);
      setAttempts(attemptsData.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreaks = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('id, title, streak, frequency, custom_days');

      if (error) throw error;

      const streaksData: Streak[] = data.map((habit: any) => ({
        habitId: habit.id,
        type: habit.frequency === 'daily' ? 'build' : 'break',
        streak: habit.streak.current_streak,
        color: habit.frequency === 'daily' ? '#8A8AFF' : '#FF69B4',
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

  const createStreak = async (habitId: string, title: string, startDate: Date, endDate?: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('streaks')
        .insert({
          habit_id: habitId,
          title,
          start_date: startDate.toISOString(),
          end_date: endDate?.toISOString()
        })
        .select();
          if (error) throw error;
          setStreaks([...streaks, data[0]]);
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
    createStreak
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