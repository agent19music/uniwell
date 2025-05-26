-- Function to securely create post replies with proper ltree path handling
CREATE OR REPLACE FUNCTION create_post_reply(
  p_post_id UUID,
  p_user_id UUID,
  p_content TEXT,
  p_parent_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_thread_path ltree;
  v_reply_id UUID;
BEGIN
  -- Generate the thread path based on whether this is a root reply or a nested reply
  IF p_parent_id IS NULL THEN
    -- This is a root level reply
    v_thread_path = text2ltree(p_post_id::text);
  ELSE
    -- This is a nested reply, find parent path and append this reply's path
    SELECT thread_path || text2ltree(p_parent_id::text) INTO v_thread_path 
    FROM post_replies 
    WHERE id = p_parent_id;
    
    IF v_thread_path IS NULL THEN
      -- If parent not found, fallback to root level
      v_thread_path = text2ltree(p_post_id::text);
    END IF;
  END IF;

  -- Insert the reply
  INSERT INTO post_replies (
    post_id,
    user_id,
    parent_id,
    content,
    thread_path
  ) VALUES (
    p_post_id,
    p_user_id,
    p_parent_id,
    p_content,
    v_thread_path
  ) RETURNING id INTO v_reply_id;

  RETURN v_reply_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to use this function
GRANT EXECUTE ON FUNCTION create_post_reply TO authenticated;
GRANT EXECUTE ON FUNCTION create_post_reply TO anon;

-- Add proper RLS policy for post_replies table if missing
CREATE POLICY IF NOT EXISTS "Users can view all post replies" 
  ON post_replies FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own post replies" 
  ON post_replies FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own post replies" 
  ON post_replies FOR UPDATE
  USING (auth.uid() = user_id); 