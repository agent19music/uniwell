# Supabase Edge Function Deployment Guide

This guide explains how to deploy and schedule the content refresh edge function to automate mental health content collection for your app.

## Prerequisites

1. [Supabase CLI](https://supabase.com/docs/guides/cli) installed
2. Supabase project created
3. API keys for YouTube, Spotify, and News API

## Setup Steps

### 1. Setup Supabase Project

Ensure your Supabase project is properly configured with the necessary tables:

- `resources` - Main content table
- `resource_content` - Content details table
- `resource_categories` - Category connections
- `resource_tags` - Tag connections
- `categories` - Categories reference
- `tags` - Tags reference

### 2. Initialize Supabase Functions

```bash
# Login to Supabase
supabase login

# Initialize in your project
cd your-project-directory
supabase init
```

### 3. Create the Edge Function

```bash
# Create a new edge function
supabase functions new refresh-library
```

### 4. Copy Edge Function Code

Copy the code from `scripts/supabase-edge-function.ts` to the newly created function file at:

```
supabase/functions/refresh-library/index.ts
```

### 5. Configure Secrets

Add your API keys as secrets:

```bash
supabase secrets set EXPO_PUBLIC_YOUTUBE_API_KEY=your-youtube-api-key
supabase secrets set EXPO_PUBLIC_NEWS_API_KEY=your-news-api-key
supabase secrets set EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your-spotify-client-id
supabase secrets set EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
```

### 6. Deploy the Function

```bash
supabase functions deploy refresh-library --no-verify-jwt
```

### 7. Test the Function

Test the function using the Supabase dashboard or cURL:

```bash
curl -X POST https://<your-project-ref>.functions.supabase.co/refresh-library
```

### 8. Schedule Automated Runs

#### Option 1: Using Supabase Scheduler (Recommended)

1. Go to your Supabase project's SQL Editor
2. Create a scheduled job:

```sql
select cron.schedule(
  'refresh-content-daily',
  '0 0 * * *',  -- Run at midnight every day
  $$ select net.http_post(
      'https://<your-project-ref>.functions.supabase.co/refresh-library',
      '{}',
      jsonb_build_object(
        'Authorization', 'Bearer your-service-role-key',
        'Content-Type', 'application/json'
      )
    ) $$
);
```

#### Option 2: Using External Scheduler (AWS Lambda, GitHub Actions, etc.)

You can also set up an external scheduler using services like:

- GitHub Actions with a scheduled workflow
- AWS Lambda + EventBridge
- Google Cloud Scheduler

Example GitHub Actions workflow:

```yaml
name: Refresh Content Library

on:
  schedule:
    - cron: '0 0 * * *'  # Run at midnight every day
  workflow_dispatch:  # Allow manual runs

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger content refresh
        run: |
          curl -X POST \
            https://<your-project-ref>.functions.supabase.co/refresh-library \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"
```

## Monitoring and Maintenance

### Check Function Logs

To check logs for your function:

```bash
supabase functions logs refresh-library
```

### Update the Function

To update the function after making changes:

1. Edit the function code
2. Deploy the updated function:

```bash
supabase functions deploy refresh-library --no-verify-jwt
```

## Troubleshooting

- **API Rate Limiting**: If you're hitting API rate limits, consider increasing the delay between requests or running the function less frequently.
- **Function Timeouts**: Supabase Edge Functions have a default timeout of 60 seconds. If your function processes a large amount of content, consider:
  - Reducing the amount of content fetched per run
  - Breaking the function into smaller, more focused functions
  - Using a background task queue pattern
- **Missing Data**: If content isn't being saved correctly, check the function logs for errors and verify database schema/permissions.

## Advanced Configuration

### Customizing Content Topics

Edit the `TOPICS` array in the edge function to change what mental health topics are fetched:

```typescript
const TOPICS = [
  {
    query: 'your custom topic',
    categories: ['category-id'],
    tags: ['tag-id-1', 'tag-id-2']
  },
  // Add more topics
];
```

### Configuring Fetch Limits

Adjust the number of items fetched per content type:

```typescript
const videos = await fetchYouTubeVideos(topic.query, 5); // Fetch 5 videos instead of 2
const podcasts = await fetchSpotifyPodcasts(topic.query, 5); // Fetch 5 podcasts
const articles = await fetchNewsArticles(topic.query, 5); // Fetch 5 articles
``` 