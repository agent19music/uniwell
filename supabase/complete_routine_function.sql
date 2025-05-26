-- Function to securely complete a routine with proper RLS handling
CREATE OR REPLACE FUNCTION complete_routine(
  p_routine_id UUID,
  p_user_id UUID,
  p_completion_date DATE,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Make sure user can only complete their own routines
  IF NOT EXISTS (
    SELECT 1 FROM routines
    WHERE id = p_routine_id AND user_id = p_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  -- Check if already completed
  IF EXISTS (
    SELECT 1 FROM routine_completions
    WHERE routine_id = p_routine_id 
    AND user_id = p_user_id
    AND completion_date = p_completion_date
  ) THEN
    RETURN TRUE; -- Already completed, return success
  END IF;

  -- Insert with security definer permissions (bypassing RLS)
  INSERT INTO routine_completions (
    routine_id, 
    user_id, 
    completion_date, 
    status,
    notes
  ) VALUES (
    p_routine_id,
    p_user_id,
    p_completion_date,
    'completed',
    p_notes
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to use this function
GRANT EXECUTE ON FUNCTION complete_routine TO authenticated;
GRANT EXECUTE ON FUNCTION complete_routine TO anon;

-- Add proper RLS policy for routine_completions table if missing
CREATE POLICY IF NOT EXISTS "Users can view their own routine completions" 
  ON routine_completions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own routine completions" 
  ON routine_completions FOR INSERT 
  WITH CHECK (auth.uid() = user_id); 