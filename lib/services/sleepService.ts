import { supabase } from '../supabase';
import { format, subDays, subWeeks, subMonths, parseISO, isValid } from 'date-fns';

// Define types
export interface SleepData {
  id?: string;
  user_id?: string;
  sleep_date: string;
  sleep_time: string;
  wake_time: string;
  total_hours: number;
  quality_rating: number;
  deep_sleep_minutes?: number;
  rem_sleep_minutes?: number;
  light_sleep_minutes?: number;
  awake_minutes?: number;
  heart_rate_avg?: number;
  respiratory_rate_avg?: number;
  sleep_environment_rating?: number;
  caffeine_consumed?: boolean;
  alcohol_consumed?: boolean;
  exercise_before_sleep?: boolean;
  screen_time_before_sleep?: boolean;
  stress_level?: number;
  mood_next_day?: number;
  notes?: string;
}

export interface SleepInsight {
  id?: string;
  user_id?: string;
  insight_text: string;
  insight_type: 'daily' | 'weekly' | 'monthly' | 'trend';
  start_date: string;
  end_date: string;
}

export interface SleepGoal {
  id?: string;
  user_id?: string;
  target_hours: number;
  target_bedtime?: string;
  target_wake_time?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

// Sleep stats/metrics interfaces
export interface SleepStats {
  averageHours: number;
  averageQuality: number;
  trend: 'improving' | 'declining' | 'stable';
  consistencyScore: number;
  goalAchievement: number;
  sleepDebt: number;
}

export interface WeeklySleepData {
  day: string;
  hours: number;
  quality: number;
  goalAchieved: boolean;
}

// Add a sleep entry
export const addSleepEntry = async (sleepData: SleepData): Promise<{ data: any; error: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const { data, error } = await supabase
      .from('sleep_data')
      .insert({
        ...sleepData,
        user_id: userData.user?.id,
      })
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error adding sleep entry:', error);
    return { data: null, error };
  }
};

// Update a sleep entry
export const updateSleepEntry = async (id: string, sleepData: Partial<SleepData>): Promise<{ data: any; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('sleep_data')
      .update(sleepData)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error updating sleep entry:', error);
    return { data: null, error };
  }
};

// Delete a sleep entry
export const deleteSleepEntry = async (id: string): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('sleep_data')
      .delete()
      .eq('id', id);
    
    return { error };
  } catch (error) {
    console.error('Error deleting sleep entry:', error);
    return { error };
  }
};

// Get a single sleep entry by id
export const getSleepEntry = async (id: string): Promise<{ data: SleepData | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('sleep_data')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error getting sleep entry:', error);
    return { data: null, error };
  }
};

// Get sleep entries for a specific date
export const getSleepEntryByDate = async (date: string): Promise<{ data: SleepData | null; error: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const { data, error } = await supabase
      .from('sleep_data')
      .select('*')
      .eq('user_id', userData.user?.id)
      .eq('sleep_date', date)
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error getting sleep entry by date:', error);
    return { data: null, error };
  }
};

// Get sleep entries for the last week
export const getWeekSleepData = async (): Promise<{ data: SleepData[] | null; error: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const lastWeekDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('sleep_data')
      .select('*')
      .eq('user_id', userData.user?.id)
      .gte('sleep_date', lastWeekDate)
      .order('sleep_date', { ascending: true });
    
    return { data, error };
  } catch (error) {
    console.error('Error getting week sleep data:', error);
    return { data: null, error };
  }
};

// Get sleep entries for the last month
export const getMonthSleepData = async (): Promise<{ data: SleepData[] | null; error: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const lastMonthDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('sleep_data')
      .select('*')
      .eq('user_id', userData.user?.id)
      .gte('sleep_date', lastMonthDate)
      .order('sleep_date', { ascending: true });
    
    return { data, error };
  } catch (error) {
    console.error('Error getting month sleep data:', error);
    return { data: null, error };
  }
};

// Get active sleep goal
export const getActiveSleepGoal = async (): Promise<{ data: SleepGoal | null; error: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const { data, error } = await supabase
      .from('sleep_goals')
      .select('*')
      .eq('user_id', userData.user?.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error getting active sleep goal:', error);
    return { data: null, error };
  }
};

// Set a sleep goal
export const setSleepGoal = async (goal: SleepGoal): Promise<{ data: any; error: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    // Deactivate existing goals
    await supabase
      .from('sleep_goals')
      .update({ is_active: false })
      .eq('user_id', userData.user?.id)
      .eq('is_active', true);
    
    // Insert new goal
    const { data, error } = await supabase
      .from('sleep_goals')
      .insert({
        ...goal,
        user_id: userData.user?.id,
        is_active: true
      })
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error setting sleep goal:', error);
    return { data: null, error };
  }
};

// Calculate sleep statistics
export const calculateSleepStats = async (): Promise<{ data: SleepStats | null; error: any }> => {
  try {
    // Get last 30 days of sleep data
    const { data, error } = await getMonthSleepData();
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return { 
        data: {
          averageHours: 0,
          averageQuality: 0,
          trend: 'stable',
          consistencyScore: 0,
          goalAchievement: 0,
          sleepDebt: 0
        }, 
        error: null 
      };
    }
    
    // Get active goal
    const { data: goalData } = await getActiveSleepGoal();
    const targetHours = goalData?.target_hours || 8;
    
    // Calculate metrics
    const totalHours = data.reduce((sum, entry) => sum + entry.total_hours, 0);
    const totalQuality = data.reduce((sum, entry) => sum + entry.quality_rating, 0);
    
    const averageHours = totalHours / data.length;
    const averageQuality = totalQuality / data.length;
    
    // Calculate sleep debt
    const sleepDebt = data.reduce((debt, entry) => {
      return debt + (targetHours - entry.total_hours);
    }, 0);
    
    // Calculate trend (compare first half to second half of the period)
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.total_hours, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.total_hours, 0) / secondHalf.length;
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg + 0.3) {
      trend = 'improving';
    } else if (firstHalfAvg > secondHalfAvg + 0.3) {
      trend = 'declining';
    }
    
    // Calculate consistency score (standard deviation from target)
    const varianceSum = data.reduce((sum, entry) => {
      const diff = entry.total_hours - averageHours;
      return sum + (diff * diff);
    }, 0);
    const stdDev = Math.sqrt(varianceSum / data.length);
    const consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev * 20)));
    
    // Calculate goal achievement percentage
    const achievedDays = data.filter(entry => entry.total_hours >= targetHours).length;
    const goalAchievement = (achievedDays / data.length) * 100;
    
    return { 
      data: {
        averageHours,
        averageQuality,
        trend,
        consistencyScore,
        goalAchievement,
        sleepDebt
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error calculating sleep stats:', error);
    return { data: null, error };
  }
};

// Generate weekly sleep chart data
export const getWeeklySleepChartData = async (): Promise<{ data: WeeklySleepData[] | null; error: any }> => {
  try {
    const { data, error } = await getWeekSleepData();
    if (error) throw error;
    
    const { data: goalData } = await getActiveSleepGoal();
    const targetHours = goalData?.target_hours || 8;
    
    if (!data) return { data: null, error: null };
    
    // Create an array of the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'yyyy-MM-dd');
    });
    
    const chartData = last7Days.map(day => {
      const entry = data.find(d => d.sleep_date === day);
      return {
        day: format(parseISO(day), 'EEE'),
        hours: entry?.total_hours || 0,
        quality: entry?.quality_rating || 0,
        goalAchieved: entry ? entry.total_hours >= targetHours : false
      };
    });
    
    return { data: chartData, error: null };
  } catch (error) {
    console.error('Error generating weekly sleep chart data:', error);
    return { data: null, error };
  }
};

// Get sleep insights
export const getSleepInsights = async (type: 'daily' | 'weekly' | 'monthly'): Promise<{ data: SleepInsight[] | null; error: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const { data, error } = await supabase
      .from('sleep_insights')
      .select('*')
      .eq('user_id', userData.user?.id)
      .eq('insight_type', type)
      .order('created_at', { ascending: false })
      .limit(5);
    
    return { data, error };
  } catch (error) {
    console.error('Error getting sleep insights:', error);
    return { data: null, error };
  }
};

// Generate sleep insights (this would typically be run as a cron job)
export const generateSleepInsights = async (): Promise<{ data: any; error: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const { data: statsData, error: statsError } = await calculateSleepStats();
    if (statsError) throw statsError;
    
    if (!statsData) return { data: null, error: 'No stats data available' };
    
    // Weekly insight
    const startDate = format(subWeeks(new Date(), 1), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');
    
    let insightText = '';
    
    if (statsData.trend === 'improving') {
      insightText = `Your sleep pattern is improving! You've been averaging ${statsData.averageHours.toFixed(1)} hours with ${statsData.averageQuality.toFixed(1)}/10 quality. Keep up the good work!`;
    } else if (statsData.trend === 'declining') {
      insightText = `Your sleep quality has been declining slightly. Try to maintain a consistent sleep schedule to improve your rest quality.`;
    } else {
      insightText = `Your sleep has been stable, averaging ${statsData.averageHours.toFixed(1)} hours per night. Your consistency score is ${statsData.consistencyScore.toFixed(0)}%.`;
    }
    
    // Add additional insights based on the data
    if (statsData.sleepDebt > 7) {
      insightText += ` You have a sleep debt of ${statsData.sleepDebt.toFixed(1)} hours this month. Consider getting extra rest on weekends.`;
    }
    
    if (statsData.goalAchievement < 50) {
      insightText += ` You're achieving your sleep goals ${statsData.goalAchievement.toFixed(0)}% of the time. Try adjusting your schedule or setting more realistic goals.`;
    }
    
    const { data, error } = await supabase
      .from('sleep_insights')
      .insert({
        user_id: userData.user?.id,
        insight_text: insightText,
        insight_type: 'weekly',
        start_date: startDate,
        end_date: endDate
      })
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error generating sleep insights:', error);
    return { data: null, error };
  }
}; 