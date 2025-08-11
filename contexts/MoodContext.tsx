import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfWeek, endOfWeek, isAfter, isSameDay } from 'date-fns';

export type MoodType = 'happy' | 'calm' | 'stressed' | 'angry' | 'sad';

export interface MoodEntry {
  id?: string;
  moodType: MoodType;
  intensity: number; // 1-10
  notes?: string;
  createdAt: Date;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
}

interface MoodSummary {
  id?: string;
  weekStartDate: Date;
  weekEndDate: Date;
  dominantMood: MoodType;
  moodFluctuation: number;
  insights: string[];
  recommendations: string[];
}

interface MoodContextType {
  currentMood: MoodEntry | null;
  todaysMoodRecorded: boolean;
  weeklyMoods: MoodEntry[];
  weeklySummary: MoodSummary | null;
  recordMood: (moodType: MoodType, intensity?: number, notes?: string) => Promise<void>;
  fetchWeeklyMoods: () => Promise<void>;
  shouldPromptForMood: boolean;
  loading: boolean;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [currentMood, setCurrentMood] = useState<MoodEntry | null>(null);
  const [weeklyMoods, setWeeklyMoods] = useState<MoodEntry[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<MoodSummary | null>(null);
  const [shouldPromptForMood, setShouldPromptForMood] = useState(true);
  const [loading, setLoading] = useState(true);
  const [todaysMoodRecorded, setTodaysMoodRecorded] = useState(false);

  // Check if we should prompt for mood on app load
  useEffect(() => {
    checkMoodPromptStatus();
    fetchTodaysMood();
    fetchWeeklyMoods();
  }, []);

  const checkMoodPromptStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const morningTime = new Date(today);
      morningTime.setHours(8, 0, 0, 0);

      // Get the latest mood entry
      const { data: latestMood, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      // If no mood recorded today or it's after 8 AM and the last mood was before 8 AM
      if (!latestMood || latestMood.length === 0) {
        setShouldPromptForMood(true);
      } else {
        const lastMoodDate = new Date(latestMood[0].created_at);
        const isSameToday = isSameDay(lastMoodDate, today);
        
        // If it's the same day and after 8 AM, don't prompt again
        if (isSameToday && isAfter(lastMoodDate, morningTime)) {
          setShouldPromptForMood(false);
          setTodaysMoodRecorded(true);
        } else {
          // If it's a new day or before 8 AM, prompt for mood
          setShouldPromptForMood(true);
        }
      }
    } catch (error) {
      console.error('Error checking mood prompt status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysMood = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${todayStr}T00:00:00`)
        .lte('created_at', `${todayStr}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setCurrentMood({
          id: data[0].id,
          moodType: data[0].mood_type,
          intensity: data[0].intensity,
          notes: data[0].notes,
          createdAt: new Date(data[0].created_at),
          dayOfWeek: data[0].day_of_week
        });
        setTodaysMoodRecorded(true);
      }
    } catch (error) {
      console.error('Error fetching today\'s mood:', error);
    }
  };

  const fetchWeeklyMoods = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', format(weekStart, 'yyyy-MM-dd'))
        .lte('created_at', format(weekEnd, 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedMoods = data.map((entry: { id: string; mood_type: MoodType; intensity: number; notes: string; created_at: string; day_of_week: number }) => ({
          id: entry.id,
          moodType: entry.mood_type,
          intensity: entry.intensity,
          notes: entry.notes,
          createdAt: new Date(entry.created_at),
          dayOfWeek: entry.day_of_week
        }));
        setWeeklyMoods(formattedMoods);
      }

      // Fetch weekly summary if it's weekend
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend (Sunday or Saturday)
        await fetchWeeklySummary(weekStart, weekEnd);
      }
    } catch (error) {
      console.error('Error fetching weekly moods:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySummary = async (weekStart: Date, weekEnd: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mood_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', format(weekStart, 'yyyy-MM-dd'))
        .eq('week_end_date', format(weekEnd, 'yyyy-MM-dd'))
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setWeeklySummary({
          id: data[0].id,
          weekStartDate: new Date(data[0].week_start_date),
          weekEndDate: new Date(data[0].week_end_date),
          dominantMood: data[0].dominant_mood,
          moodFluctuation: data[0].mood_fluctuation,
          insights: data[0].insights,
          recommendations: data[0].recommendations
        });
      } else {
        // Generate summary if it doesn't exist
        if (weeklyMoods.length > 0) {
          await generateWeeklySummary(weekStart, weekEnd);
        }
      }
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    }
  };

  const generateWeeklySummary = async (weekStart: Date, weekEnd: Date) => {
    if (weeklyMoods.length === 0) return;

    // Count occurrences of each mood
    const moodCounts: Record<MoodType, number> = {
      happy: 0,
      calm: 0,
      stressed: 0,
      angry: 0,
      sad: 0
    };

    weeklyMoods.forEach(mood => {
      moodCounts[mood.moodType]++;
    });

    // Find dominant mood
    let dominantMood: MoodType = 'calm';
    let maxCount = 0;
    
    (Object.keys(moodCounts) as MoodType[]).forEach(mood => {
      if (moodCounts[mood] > maxCount) {
        maxCount = moodCounts[mood];
        dominantMood = mood;
      }
    });

    // Calculate mood fluctuation (standard deviation of intensities)
    const intensities = weeklyMoods.map(mood => mood.intensity);
    const avgIntensity = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
    const variance = intensities.reduce((sum, val) => sum + Math.pow(val - avgIntensity, 2), 0) / intensities.length;
    const moodFluctuation = Math.sqrt(variance);

    // Generate insights based on mood patterns
    const insights = generateInsights(dominantMood, moodFluctuation, weeklyMoods);
    
    // Generate recommendations
    const recommendations = generateRecommendations(dominantMood, moodFluctuation, weeklyMoods);

    // Save summary to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mood_summaries')
        .insert({
          user_id: user.id,
          week_start_date: format(weekStart, 'yyyy-MM-dd'),
          week_end_date: format(weekEnd, 'yyyy-MM-dd'),
          dominant_mood: dominantMood,
          mood_fluctuation: moodFluctuation,
          insights,
          recommendations
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setWeeklySummary({
          id: data[0].id,
          weekStartDate: new Date(data[0].week_start_date),
          weekEndDate: new Date(data[0].week_end_date),
          dominantMood: data[0].dominant_mood,
          moodFluctuation: data[0].mood_fluctuation,
          insights: data[0].insights,
          recommendations: data[0].recommendations
        });
      }
    } catch (error) {
      console.error('Error generating weekly summary:', error);
    }
  };

  const generateInsights = (dominantMood: MoodType, fluctuation: number, moods: MoodEntry[]): string[] => {
    const insights: string[] = [];
    
    // Dominant mood insights
    switch (dominantMood) {
      case 'happy':
        insights.push("You've been radiating positive energy this week!");
        insights.push("Your happiness seems to be a consistent theme lately.");
        break;
      case 'calm':
        insights.push("You've maintained a balanced and peaceful state this week.");
        insights.push("Your calm demeanor has been your strength lately.");
        break;
      case 'stressed':
        insights.push("You've been experiencing higher stress levels this week.");
        insights.push("Your body might be telling you to take a break.");
        break;
      case 'angry':
        insights.push("You've been feeling more irritable than usual this week.");
        insights.push("There might be underlying issues causing frustration.");
        break;
      case 'sad':
        insights.push("You've been experiencing some low moments this week.");
        insights.push("It's okay to feel down sometimes, it's part of being human.");
        break;
    }
    
    // Fluctuation insights
    if (fluctuation > 3) {
      insights.push("Your emotions have been quite variable this week.");
      insights.push("These mood swings might be worth exploring in your journal.");
    } else {
      insights.push("Your emotional state has been relatively stable this week.");
    }
    
    // Pattern insights
    const moodSequence = moods.map(m => m.moodType);
    if (moodSequence.filter(m => m === 'stressed' || m === 'angry').length >= 3) {
      insights.push("You might benefit from some stress-reduction techniques.");
    }
    
    if (moodSequence.filter(m => m === 'sad').length >= 3) {
      insights.push("Consider reaching out to someone you trust about your feelings.");
    }
    
    return insights;
  };

  const generateRecommendations = (dominantMood: MoodType, fluctuation: number, moods: MoodEntry[]): string[] => {
    const recommendations: string[] = [];
    
    // General recommendations
    recommendations.push("Try to journal more regularly to track your emotional patterns.");
    
    // Mood-specific recommendations
    switch (dominantMood) {
      case 'happy':
        recommendations.push("Share your positive energy with others who might need it.");
        recommendations.push("Reflect on what's contributing to your happiness to maintain it.");
        break;
      case 'calm':
        recommendations.push("Continue your mindfulness practices that keep you centered.");
        recommendations.push("Consider teaching others your techniques for staying calm.");
        break;
      case 'stressed':
        recommendations.push("Try deep breathing exercises when you feel overwhelmed.");
        recommendations.push("Consider cutting back on commitments to give yourself space.");
        break;
      case 'angry':
        recommendations.push("Physical exercise can help release pent-up frustration.");
        recommendations.push("Practice identifying triggers before they escalate to anger.");
        break;
      case 'sad':
        recommendations.push("Gentle movement like walking can help lift your mood.");
        recommendations.push("Don't hesitate to seek support if sadness persists.");
        break;
    }
    
    // Fluctuation recommendations
    if (fluctuation > 3) {
      recommendations.push("Establishing a consistent routine might help stabilize your mood.");
      recommendations.push("Consider tracking what triggers your mood changes.");
    }
    
    return recommendations;
  };

  const recordMood = async (moodType: MoodType, intensity: number = 5, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const dayOfWeek = today.getDay();

      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood_type: moodType,
          intensity,
          notes,
          day_of_week: dayOfWeek
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newMood: MoodEntry = {
          id: data[0].id,
          moodType: data[0].mood_type,
          intensity: data[0].intensity,
          notes: data[0].notes,
          createdAt: new Date(data[0].created_at),
          dayOfWeek: data[0].day_of_week
        };
        
        setCurrentMood(newMood);
        setTodaysMoodRecorded(true);
        setShouldPromptForMood(false);
        
        // Update weekly moods
        setWeeklyMoods(prev => [...prev, newMood]);
      }
    } catch (error) {
      console.error('Error recording mood:', error);
      throw error;
    }
  };

  return (
    <MoodContext.Provider value={{
      currentMood,
      todaysMoodRecorded,
      weeklyMoods,
      weeklySummary,
      recordMood,
      fetchWeeklyMoods,
      shouldPromptForMood,
      loading
    }}>
      {children}
    </MoodContext.Provider>
  );
}

export const useMood = () => {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
}; 