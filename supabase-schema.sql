-- Create sleep_data table with comprehensive sleep metrics
CREATE TABLE sleep_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  sleep_date DATE NOT NULL,
  sleep_time TIME NOT NULL,
  wake_time TIME NOT NULL,
  total_hours DECIMAL(4, 2) NOT NULL,
  quality_rating INTEGER NOT NULL CHECK (quality_rating BETWEEN 1 AND 10),
  deep_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  light_sleep_minutes INTEGER,
  awake_minutes INTEGER,
  heart_rate_avg INTEGER,
  respiratory_rate_avg DECIMAL(4, 2),
  sleep_environment_rating INTEGER CHECK (sleep_environment_rating BETWEEN 1 AND 10),
  caffeine_consumed BOOLEAN,
  alcohol_consumed BOOLEAN,
  exercise_before_sleep BOOLEAN,
  screen_time_before_sleep BOOLEAN,
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  mood_next_day INTEGER CHECK (mood_next_day BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Add unique constraint to prevent duplicate entries for the same date and user
  UNIQUE (user_id, sleep_date)
);

-- Create sleep_tags table for categorizing sleep entries
CREATE TABLE sleep_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sleep_data_tags junction table
CREATE TABLE sleep_data_tags (
  sleep_data_id UUID REFERENCES sleep_data(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES sleep_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (sleep_data_id, tag_id)
);

-- Create sleep_insights table for storing AI-generated insights
CREATE TABLE sleep_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  insight_text TEXT NOT NULL,
  insight_type TEXT NOT NULL, -- e.g., 'weekly', 'monthly', 'trend'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Add unique constraint to prevent duplicate insights for the same period and type
  UNIQUE (user_id, insight_type, start_date, end_date)
);

-- Create sleep_goals table for user-defined sleep goals
CREATE TABLE sleep_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  target_hours DECIMAL(4, 2) NOT NULL,
  target_bedtime TIME,
  target_wake_time TIME,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE sleep_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for sleep_data
CREATE POLICY "Users can view their own sleep data"
  ON sleep_data
  FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own sleep data"
  ON sleep_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own sleep data"
  ON sleep_data
  FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own sleep data"
  ON sleep_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for sleep_insights
CREATE POLICY "Users can view their own sleep insights"
  ON sleep_insights
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for sleep_goals
CREATE POLICY "Users can view their own sleep goals"
  ON sleep_goals
  FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own sleep goals"
  ON sleep_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own sleep goals"
  ON sleep_goals
  FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own sleep goals"
  ON sleep_goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create functions to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the update_timestamp function
CREATE TRIGGER update_sleep_data_timestamp
BEFORE UPDATE ON sleep_data
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_sleep_goals_timestamp
BEFORE UPDATE ON sleep_goals
FOR EACH ROW
EXECUTE FUNCTION update_timestamp(); 