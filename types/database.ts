/**
 * Supabase Database Types - Auto-generated
 * Generated: 2026-01-20
 * 
 * This file contains TypeScript types for all Supabase tables.
 * Re-generate using: npx supabase gen types typescript --project-id jspliuclmihxjbwidjib
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string | null
          avatar_url: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          course: string | null
          username: string | null
          bio: string | null
          gender: string | null
          interests: string[] | null
          is_anonymous: boolean | null
          notification_preferences: Json | null
          occupation: string | null
          onboarding_completed: boolean | null
          primary_goal: string | null
          profile_completion_percentage: number | null
          push_token: string | null
          saved_resources: string[] | null
          student_id: string | null
          university: string | null
          last_recommendation_update: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id?: string | null
          avatar_url?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          course?: string | null
          username?: string | null
          bio?: string | null
          gender?: string | null
          interests?: string[] | null
          is_anonymous?: boolean | null
          notification_preferences?: Json | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          primary_goal?: string | null
          profile_completion_percentage?: number | null
          push_token?: string | null
          saved_resources?: string[] | null
          student_id?: string | null
          university?: string | null
          last_recommendation_update?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          avatar_url?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          course?: string | null
          username?: string | null
          bio?: string | null
          gender?: string | null
          interests?: string[] | null
          is_anonymous?: boolean | null
          notification_preferences?: Json | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          primary_goal?: string | null
          profile_completion_percentage?: number | null
          push_token?: string | null
          saved_resources?: string[] | null
          student_id?: string | null
          university?: string | null
          last_recommendation_update?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string | null
          title: string | null
          journal_type: 'text' | 'audio' | 'video'
          text_content: string | null
          file_url: string | null
          content: string | null
          voice_note_url: string | null
          entry_date: string
          mood_type: string | null
          mood_intensity: number | null
          is_pinned: boolean | null
          is_synced: boolean | null
          is_encrypted: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title?: string | null
          journal_type?: 'text' | 'audio' | 'video'
          text_content?: string | null
          file_url?: string | null
          content?: string | null
          voice_note_url?: string | null
          entry_date: string
          mood_type?: string | null
          mood_intensity?: number | null
          is_pinned?: boolean | null
          is_synced?: boolean | null
          is_encrypted?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string | null
          journal_type?: 'text' | 'audio' | 'video'
          text_content?: string | null
          file_url?: string | null
          content?: string | null
          voice_note_url?: string | null
          entry_date?: string
          mood_type?: string | null
          mood_intensity?: number | null
          is_pinned?: boolean | null
          is_synced?: boolean | null
          is_encrypted?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      mood_entries: {
        Row: {
          id: string
          user_id: string
          mood_type: string
          intensity: number
          notes: string | null
          day_of_week: number
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          mood_type: string
          intensity: number
          notes?: string | null
          day_of_week: number
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          mood_type?: string
          intensity?: number
          notes?: string | null
          day_of_week?: number
          created_at?: string | null
        }
      }
      community_posts: {
        Row: {
          id: string
          user_id: string | null
          title: string | null
          content: string
          text_content: string | null
          file_urls: string[] | null
          media_url: string[] | null
          is_anonymous: boolean | null
          view_count: number | null
          edited_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title?: string | null
          content: string
          text_content?: string | null
          file_urls?: string[] | null
          media_url?: string[] | null
          is_anonymous?: boolean | null
          view_count?: number | null
          edited_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string | null
          content?: string
          text_content?: string | null
          file_urls?: string[] | null
          media_url?: string[] | null
          is_anonymous?: boolean | null
          view_count?: number | null
          edited_at?: string | null
          created_at?: string | null
        }
      }
      post_replies: {
        Row: {
          id: string
          post_id: string | null
          parent_reply_id: string | null
          parent_id: string | null
          user_id: string | null
          content: string
          file_urls: string[] | null
          media_url: string[] | null
          thread_path: unknown
          edited_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          post_id?: string | null
          parent_reply_id?: string | null
          parent_id?: string | null
          user_id?: string | null
          content: string
          file_urls?: string[] | null
          media_url?: string[] | null
          thread_path?: unknown
          edited_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string | null
          parent_reply_id?: string | null
          parent_id?: string | null
          user_id?: string | null
          content?: string
          file_urls?: string[] | null
          media_url?: string[] | null
          thread_path?: unknown
          edited_at?: string | null
          created_at?: string | null
        }
      }
      therapists: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          qualifications: string[] | null
          schedule_slots: Json | null
          avatar_url: string | null
          rates: Json | null
          bio: string | null
          specializations: string[] | null
          is_available: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          qualifications?: string[] | null
          schedule_slots?: Json | null
          avatar_url?: string | null
          rates?: Json | null
          bio?: string | null
          specializations?: string[] | null
          is_available?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          qualifications?: string[] | null
          schedule_slots?: Json | null
          avatar_url?: string | null
          rates?: Json | null
          bio?: string | null
          specializations?: string[] | null
          is_available?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      therapist_bookings: {
        Row: {
          id: string
          student_id: string
          therapist_id: string
          date: string
          timeslot: Json
          billable_amount: number | null
          currency: string | null
          status: string | null
          notes: string | null
          meeting_link: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          therapist_id: string
          date: string
          timeslot: Json
          billable_amount?: number | null
          currency?: string | null
          status?: string | null
          notes?: string | null
          meeting_link?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          therapist_id?: string
          date?: string
          timeslot?: Json
          billable_amount?: number | null
          currency?: string | null
          status?: string | null
          notes?: string | null
          meeting_link?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      sleep_data: {
        Row: {
          id: string
          user_id: string
          sleep_date: string
          period: 'morning' | 'night' | null
          sleep_time: string
          wake_time: string
          total_hours: number
          quality_rating: number
          deep_sleep_minutes: number | null
          rem_sleep_minutes: number | null
          light_sleep_minutes: number | null
          awake_minutes: number | null
          heart_rate_avg: number | null
          respiratory_rate_avg: number | null
          sleep_environment_rating: number | null
          caffeine_consumed: boolean | null
          alcohol_consumed: boolean | null
          exercise_before_sleep: boolean | null
          screen_time_before_sleep: boolean | null
          stress_level: number | null
          mood_next_day: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          sleep_date: string
          period?: 'morning' | 'night' | null
          sleep_time: string
          wake_time: string
          total_hours: number
          quality_rating: number
          deep_sleep_minutes?: number | null
          rem_sleep_minutes?: number | null
          light_sleep_minutes?: number | null
          awake_minutes?: number | null
          heart_rate_avg?: number | null
          respiratory_rate_avg?: number | null
          sleep_environment_rating?: number | null
          caffeine_consumed?: boolean | null
          alcohol_consumed?: boolean | null
          exercise_before_sleep?: boolean | null
          screen_time_before_sleep?: boolean | null
          stress_level?: number | null
          mood_next_day?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          sleep_date?: string
          period?: 'morning' | 'night' | null
          sleep_time?: string
          wake_time?: string
          total_hours?: number
          quality_rating?: number
          deep_sleep_minutes?: number | null
          rem_sleep_minutes?: number | null
          light_sleep_minutes?: number | null
          awake_minutes?: number | null
          heart_rate_avg?: number | null
          respiratory_rate_avg?: number | null
          sleep_environment_rating?: number | null
          caffeine_consumed?: boolean | null
          alcohol_consumed?: boolean | null
          exercise_before_sleep?: boolean | null
          screen_time_before_sleep?: boolean | null
          stress_level?: number | null
          mood_next_day?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string
          content_type: string
          content: string | null
          thumbnail_url: string
          source: string
          author: string | null
          duration: string | null
          url: string | null
          tags: string[] | null
          category: string | null
          is_featured: boolean | null
          is_premium: boolean | null
          view_count: number | null
          average_rating: number | null
          upvotes: number | null
          downvotes: number | null
          popularity_score: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          content_type: string
          content?: string | null
          thumbnail_url: string
          source: string
          author?: string | null
          duration?: string | null
          url?: string | null
          tags?: string[] | null
          category?: string | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          view_count?: number | null
          average_rating?: number | null
          upvotes?: number | null
          downvotes?: number | null
          popularity_score?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          content_type?: string
          content?: string | null
          thumbnail_url?: string
          source?: string
          author?: string | null
          duration?: string | null
          url?: string | null
          tags?: string[] | null
          category?: string | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          view_count?: number | null
          average_rating?: number | null
          upvotes?: number | null
          downvotes?: number | null
          popularity_score?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_bookmarks: {
        Row: {
          id: string
          user_id: string
          resource_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          resource_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          resource_id?: string
          created_at?: string | null
        }
      }
      user_votes: {
        Row: {
          id: string
          user_id: string
          resource_id: string
          vote_type: 'up' | 'down'
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          resource_id: string
          vote_type: 'up' | 'down'
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          resource_id?: string
          vote_type?: 'up' | 'down'
          created_at?: string | null
        }
      }
      semesters: {
        Row: {
          id: string
          user_id: string
          name: string | null
          start_date: string | null
          end_date: string | null
          status: string
          type: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: string
          type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: string
          type?: string | null
          created_at?: string | null
        }
      }
      class_schedules: {
        Row: {
          id: string
          user_id: string
          semester_id: string
          title: string | null
          course_name: string | null
          unit_code: string | null
          course_code: string | null
          instructor: string | null
          room: string | null
          days: Json | null
          days_of_week: string | null
          time_slot: Json | null
          start_time: string | null
          end_time: string | null
          frequency: string | null
          type: string | null
          notification_preference: string | null
          semester_start: string | null
          semester_end: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          semester_id: string
          title?: string | null
          course_name?: string | null
          unit_code?: string | null
          course_code?: string | null
          instructor?: string | null
          room?: string | null
          days?: Json | null
          days_of_week?: string | null
          time_slot?: Json | null
          start_time?: string | null
          end_time?: string | null
          frequency?: string | null
          type?: string | null
          notification_preference?: string | null
          semester_start?: string | null
          semester_end?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          semester_id?: string
          title?: string | null
          course_name?: string | null
          unit_code?: string | null
          course_code?: string | null
          instructor?: string | null
          room?: string | null
          days?: Json | null
          days_of_week?: string | null
          time_slot?: Json | null
          start_time?: string | null
          end_time?: string | null
          frequency?: string | null
          type?: string | null
          notification_preference?: string | null
          semester_start?: string | null
          semester_end?: string | null
          created_at?: string | null
        }
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          title: string
          type: string
          status: string
          start_date: string
          start_time: string
          target_count: number
          target_days: number | null
          current_streak: number
          longest_streak: number
          color: string | null
          icon: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          type: string
          status?: string
          start_date: string
          start_time: string
          target_count?: number
          target_days?: number | null
          current_streak?: number
          longest_streak?: number
          color?: string | null
          icon?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          type?: string
          status?: string
          start_date?: string
          start_time?: string
          target_count?: number
          target_days?: number | null
          current_streak?: number
          longest_streak?: number
          color?: string | null
          icon?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      streak_events: {
        Row: {
          id: string
          streak_id: string
          timestamp: string | null
          event_type: 'relapse' | 'milestone' | 'check_in'
          milestone_days: number | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          streak_id: string
          timestamp?: string | null
          event_type: 'relapse' | 'milestone' | 'check_in'
          milestone_days?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          streak_id?: string
          timestamp?: string | null
          event_type?: 'relapse' | 'milestone' | 'check_in'
          milestone_days?: number | null
          notes?: string | null
          created_at?: string | null
        }
      }
      routines: {
        Row: {
          id: string
          user_id: string | null
          title: string
          frequency: string
          custom_days: string[] | null
          days: Json | null
          color: string | null
          icon: string | null
          is_active: boolean | null
          notification_time: string | null
          notification_enabled: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          frequency: string
          custom_days?: string[] | null
          days?: Json | null
          color?: string | null
          icon?: string | null
          is_active?: boolean | null
          notification_time?: string | null
          notification_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          frequency?: string
          custom_days?: string[] | null
          days?: Json | null
          color?: string | null
          icon?: string | null
          is_active?: boolean | null
          notification_time?: string | null
          notification_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      routine_events: {
        Row: {
          id: string
          routine_id: string
          timestamp: string | null
          event_date: string | null
          event_type: 'miss' | 'tick'
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          routine_id: string
          timestamp?: string | null
          event_date?: string | null
          event_type: 'miss' | 'tick'
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          routine_id?: string
          timestamp?: string | null
          event_date?: string | null
          event_type?: 'miss' | 'tick'
          notes?: string | null
          created_at?: string | null
        }
      }
    }
    Views: {
      sleep_summary: {
        Row: {
          id: string | null
          user_id: string | null
          date: string | null
          period: string | null
          sleep_time: string | null
          wake_time: string | null
          total_hours: number | null
          quality_rating: number | null
          created_at: string | null
        }
      }
    }
    Functions: {
      update_mood_if_within_window: {
        Args: {
          p_mood_id: string
          p_new_mood_type: string
          p_new_intensity?: number
          p_new_notes?: string
        }
        Returns: boolean
      }
      get_mood_swings: {
        Args: {
          p_user_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          date: string
          mood_count: number
          mood_types: string[]
          has_swing: boolean
        }[]
      }
      get_nested_replies: {
        Args: {
          p_post_id: string
        }
        Returns: {
          id: string
          post_id: string
          parent_reply_id: string
          user_id: string
          content: string
          file_urls: string[]
          created_at: string
          depth: number
        }[]
      }
      get_sleep_stats: {
        Args: {
          p_user_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          avg_hours: number
          avg_quality: number
          total_entries: number
          best_sleep_date: string
          worst_sleep_date: string
        }[]
      }
      get_routine_stats: {
        Args: {
          p_routine_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          total_ticks: number
          total_misses: number
          completion_rate: number
          current_streak: number
          longest_streak: number
        }[]
      }
    }
    Enums: {
      day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
      habit_frequency: 'daily' | 'weekly' | 'custom'
      journal_type: 'text' | 'audio' | 'video'
      sleep_period: 'morning' | 'night'
    }
  }
}

// Helper types for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Convenience type aliases
export type Profile = Tables<'profiles'>
export type JournalEntry = Tables<'journal_entries'>
export type MoodEntry = Tables<'mood_entries'>
export type CommunityPost = Tables<'community_posts'>
export type PostReply = Tables<'post_replies'>
export type Therapist = Tables<'therapists'>
export type TherapistBooking = Tables<'therapist_bookings'>
export type SleepData = Tables<'sleep_data'>
export type Resource = Tables<'resources'>
export type UserBookmark = Tables<'user_bookmarks'>
export type UserVote = Tables<'user_votes'>
export type Semester = Tables<'semesters'>
export type ClassSchedule = Tables<'class_schedules'>
export type Streak = Tables<'streaks'>
export type StreakEvent = Tables<'streak_events'>
export type Routine = Tables<'routines'>
export type RoutineEvent = Tables<'routine_events'>
