# Deploying Automated Resource Updates to Supabase

This guide will help you set up automated resource updates using Supabase Edge Functions and Database Triggers.

## 1. Set Up Environment Variables

First, add these environment variables to your Supabase project:

```bash
# In Supabase Dashboard -> Settings -> API -> Environment Variables
YOUTUBE_API_KEY=your_youtube_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEWS_API_KEY=your_news_api_key
```

## 2. Deploy the Edge Function

1. Install Supabase CLI if you haven't already:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Deploy the edge function:
```bash
supabase functions deploy update-resources
```

## 3. Set Up Scheduled Execution

1. Go to your Supabase Dashboard
2. Navigate to Database -> Functions
3. Create a new function:

```sql
CREATE OR REPLACE FUNCTION public.schedule_resource_updates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the edge function every 24 hours
  PERFORM
    net.http_post(
      url := CONCAT(current_setting('app.settings.pgrest_url'), '/functions/v1/update-resources'),
      headers := jsonb_build_object(
        'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key')),
        'Content-Type', 'application/json'
      )
    );
END;
$$;
```

4. Create a cron job to run this function:

```sql
SELECT cron.schedule(
  'update-resources-daily',  -- job name
  '0 0 * * *',             -- every day at midnight
  $$SELECT public.schedule_resource_updates()$$
);
```

## 4. Verify Setup

1. Check the function logs in Supabase Dashboard -> Edge Functions -> update-resources -> Logs
2. Monitor the database for new resources being added
3. Check the cron job status:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

## 5. Troubleshooting

If resources aren't being added:

1. Check Edge Function logs for errors
2. Verify all API keys are correctly set
3. Ensure the cron job is running:
```sql
SELECT * FROM cron.job WHERE jobname = 'update-resources-daily';
```

4. Test the function manually:
```sql
SELECT public.schedule_resource_updates();
```

## 6. Monitoring

Set up monitoring for the automated updates:

1. Create a monitoring table:
```sql
CREATE TABLE IF NOT EXISTS resource_update_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resources_added INTEGER,
  status TEXT,
  error_message TEXT
);
```

2. Modify the edge function to log results:
```sql
CREATE OR REPLACE FUNCTION public.schedule_resource_updates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Call the edge function
  SELECT content::jsonb INTO result
  FROM net.http_post(
    url := CONCAT(current_setting('app.settings.pgrest_url'), '/functions/v1/update-resources'),
    headers := jsonb_build_object(
      'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key')),
      'Content-Type', 'application/json'
    )
  );

  -- Log the result
  INSERT INTO resource_update_logs (resources_added, status, error_message)
  VALUES (
    (result->>'resources_added')::integer,
    CASE WHEN result->>'error' IS NULL THEN 'success' ELSE 'error' END,
    result->>'error'
  );
END;
$$;
```

## 7. Maintenance

Regular maintenance tasks:

1. Monitor resource quality:
```sql
SELECT 
  content_type,
  COUNT(*) as total,
  AVG(popularity_score) as avg_popularity
FROM resources
GROUP BY content_type;
```

2. Clean up old resources:
```sql
DELETE FROM resources 
WHERE created_at < NOW() - INTERVAL '6 months'
AND popularity_score < 0.5;
```

3. Update API keys when needed:
```sql
ALTER SYSTEM SET app.settings.youtube_api_key = 'new_key';
SELECT pg_reload_conf();
``` 