export interface SleepRecord {
  id: string;
  user_id: string;
  sleep_start: string;
  sleep_end: string;
  quality_rating: number;
  deep_sleep_hours: number;
  light_sleep_hours: number;
  rem_sleep_hours: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SleepStats {
  total_hours: number;
  quality_rating: number;
  deep_sleep_hours: number;
  light_sleep_hours: number;
  rem_sleep_hours: number;
} 