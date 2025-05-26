-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's check the existing categories table
DO $$ 
BEGIN
  -- Drop categories table if it exists to ensure fresh start
  DROP TABLE IF EXISTS categories CASCADE;
  
  -- Create categories table with TEXT id
  CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#FF7F50',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END $$;

-- Drop and recreate tags table with TEXT category_id
DO $$ 
BEGIN
  -- Drop existing tags table if it exists
  DROP TABLE IF EXISTS tags CASCADE;
  
  -- Create tags table with TEXT category_id to match categories(id)
  CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END $$;

-- Create user interests table
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  category TEXT,
  confidence_score REAL DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, interest)
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  content_type TEXT CHECK (content_type IN ('article', 'podcast', 'video', 'book')),
  duration TEXT,
  source TEXT,
  url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  difficulty_level TEXT DEFAULT 'beginner',
  popularity_score REAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource content table
CREATE TABLE IF NOT EXISTS resource_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  content_text TEXT,
  media_url TEXT,
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource tags junction table
CREATE TABLE IF NOT EXISTS resource_tags (
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  relevance_score REAL DEFAULT 1.0,
  PRIMARY KEY (resource_id, tag_id)
);

-- Create resource categories junction table
CREATE TABLE IF NOT EXISTS resource_categories (
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, category_id)
);

-- Create user saved resources table
CREATE TABLE IF NOT EXISTS user_saved_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- Create user recommendations table
CREATE TABLE IF NOT EXISTS user_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  recommendation_score REAL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shown_at TIMESTAMP WITH TIME ZONE,
  clicked BOOLEAN DEFAULT FALSE
);

-- Create content queue for daily population
CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT CHECK (content_type IN ('article', 'podcast', 'video')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  source TEXT,
  tags TEXT[],
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if profiles table exists and add columns if needed
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Add interests column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'interests') THEN
      ALTER TABLE profiles ADD COLUMN interests TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add saved_resources column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'saved_resources') THEN
      ALTER TABLE profiles ADD COLUMN saved_resources UUID[] DEFAULT '{}';
    END IF;
    
    -- Add onboarding_completed column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
      ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add last_recommendation_update column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_recommendation_update') THEN
      ALTER TABLE profiles ADD COLUMN last_recommendation_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Now insert the categories with TEXT ids
INSERT INTO categories (id, name, color, description) VALUES
('academic', 'Academic', '#4CAF50', 'Study skills, research, and academic achievement'),
('career', 'Career', '#2196F3', 'Professional growth and career planning'),
('finance', 'Finance', '#FF9800', 'Personal finance and money management'),
('wellness', 'Wellness', '#E91E63', 'Mental and physical health for students'),
('personal', 'Personal', '#9C27B0', 'Leadership, communication, and personal growth'),
('tech', 'Tech', '#607D8B', 'Programming, digital tools, and tech skills'),
('social', 'Social', '#795548', 'Campus life, diversity, and community engagement')
ON CONFLICT (id) DO NOTHING;

-- Insert the tags with TEXT category_id references
INSERT INTO tags (id, identifier, name, category_id) VALUES
-- Academic
(uuid_generate_v4(), 'study_skills', 'Study Skills & Techniques', 'academic'),
(uuid_generate_v4(), 'time_management', 'Time Management', 'academic'),
(uuid_generate_v4(), 'exam_prep', 'Exam Preparation', 'academic'),
(uuid_generate_v4(), 'research_skills', 'Research Skills', 'academic'),
(uuid_generate_v4(), 'writing_skills', 'Academic Writing', 'academic'),
-- Career
(uuid_generate_v4(), 'internships', 'Internships & Work Experience', 'career'),
(uuid_generate_v4(), 'resume_building', 'Resume & Cover Letters', 'career'),
(uuid_generate_v4(), 'interview_prep', 'Interview Preparation', 'career'),
(uuid_generate_v4(), 'networking', 'Professional Networking', 'career'),
(uuid_generate_v4(), 'career_planning', 'Career Planning', 'career'),
-- Finance
(uuid_generate_v4(), 'budgeting', 'Student Budgeting', 'finance'),
(uuid_generate_v4(), 'student_loans', 'Student Loans & Debt', 'finance'),
(uuid_generate_v4(), 'investing', 'Personal Investing', 'finance'),
(uuid_generate_v4(), 'financial_planning', 'Financial Planning', 'finance'),
-- Wellness
(uuid_generate_v4(), 'mental_health', 'Mental Health', 'wellness'),
(uuid_generate_v4(), 'physical_health', 'Physical Health', 'wellness'),
(uuid_generate_v4(), 'stress_management', 'Stress Management', 'wellness'),
(uuid_generate_v4(), 'sleep_hygiene', 'Sleep Hygiene', 'wellness'),
(uuid_generate_v4(), 'nutrition', 'Student Nutrition', 'wellness'),
-- Personal
(uuid_generate_v4(), 'leadership', 'Leadership Skills', 'personal'),
(uuid_generate_v4(), 'communication', 'Communication Skills', 'personal'),
(uuid_generate_v4(), 'creativity', 'Creative Expression', 'personal'),
(uuid_generate_v4(), 'critical_thinking', 'Critical Thinking', 'personal'),
(uuid_generate_v4(), 'emotional_intelligence', 'Emotional Intelligence', 'personal'),
-- Tech
(uuid_generate_v4(), 'coding', 'Programming & Coding', 'tech'),
(uuid_generate_v4(), 'digital_tools', 'Digital Tools & Software', 'tech'),
(uuid_generate_v4(), 'data_analysis', 'Data Analysis', 'tech'),
(uuid_generate_v4(), 'ai_ml', 'AI & Machine Learning', 'tech'),
-- Social
(uuid_generate_v4(), 'campus_life', 'Campus Life', 'social'),
(uuid_generate_v4(), 'diversity', 'Diversity & Inclusion', 'social'),
(uuid_generate_v4(), 'sustainability', 'Sustainability', 'social'),
(uuid_generate_v4(), 'community_service', 'Community Service', 'social')
ON CONFLICT (identifier) DO NOTHING;



-- Function to generate recommendations based on user interests
CREATE OR REPLACE FUNCTION generate_user_recommendations(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Clear existing recommendations
  DELETE FROM user_recommendations WHERE user_id = user_uuid;
  
  -- Generate new recommendations based on interests and tags
  INSERT INTO user_recommendations (user_id, resource_id, recommendation_score, reason)
  SELECT DISTINCT
    user_uuid,
    r.id,
    CASE 
      WHEN t.identifier IN (SELECT interest FROM user_interests WHERE user_id = user_uuid) THEN 3.0
      WHEN rc.category_id IN (SELECT DISTINCT category FROM user_interests WHERE user_id = user_uuid) THEN 2.0
      ELSE 1.0
    END as score,
    CASE 
      WHEN t.identifier IN (SELECT interest FROM user_interests WHERE user_id = user_uuid) THEN 'Based on your interest in ' || t.name
      WHEN rc.category_id IN (SELECT DISTINCT category FROM user_interests WHERE user_id = user_uuid) THEN 'Based on your interest in ' || c.name
      ELSE 'Trending content'
    END as reason
  FROM resources r
  LEFT JOIN resource_tags rt ON r.id = rt.resource_id
  LEFT JOIN tags t ON rt.tag_id = t.id
  LEFT JOIN resource_categories rc ON r.id = rc.resource_id
  LEFT JOIN categories c ON rc.category_id = c.id
  WHERE r.id NOT IN (SELECT resource_id FROM user_saved_resources WHERE user_id = user_uuid)
  ORDER BY score DESC
  LIMIT 50;
  
  -- Update last recommendation update in profiles table if it exists
  UPDATE profiles 
  SET last_recommendation_update = NOW() 
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate recommendations when interests are updated
CREATE OR REPLACE FUNCTION trigger_generate_recommendations()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM generate_user_recommendations(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_interests_change ON user_interests;

-- Create trigger
CREATE TRIGGER on_user_interests_change
  AFTER INSERT OR UPDATE OR DELETE ON user_interests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_recommendations();

-- Function to classify interests using AI
CREATE OR REPLACE FUNCTION classify_user_interest(
  interest_text TEXT,
  user_uuid UUID,
  ai_category TEXT DEFAULT NULL,
  confidence REAL DEFAULT 0.5
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_interests (user_id, interest, category, confidence_score)
  VALUES (user_uuid, interest_text, ai_category, confidence)
  ON CONFLICT (user_id, interest) 
  DO UPDATE SET 
    category = EXCLUDED.category,
    confidence_score = EXCLUDED.confidence_score,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security)
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can manage their own saved resources" ON user_saved_resources;
DROP POLICY IF EXISTS "Users can view their own recommendations" ON user_recommendations;

-- Create RLS policies
CREATE POLICY "Users can view their own interests" ON user_interests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own saved resources" ON user_saved_resources
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own recommendations" ON user_recommendations
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_category ON user_interests(category);
CREATE INDEX IF NOT EXISTS idx_user_saved_resources_user_id ON user_saved_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_type_featured ON resources(content_type, is_featured);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_tags_tag_id ON resource_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_resource_categories_category_id ON resource_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_tags_identifier ON tags(identifier);
CREATE INDEX IF NOT EXISTS idx_resources_url ON resources(url); 