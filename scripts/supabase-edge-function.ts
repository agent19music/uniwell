import { createClient } from '@supabase/supabase-js';
import { fetchYouTubeVideos, fetchSpotifyPodcasts, fetchNewsArticles } from './node-resource-utils';

// This function will be deployed as a Supabase Edge Function
// Run with: supabase functions deploy refresh-library

// Content topics with categories and tags mapping from your database
const TOPICS = [
  {
    query: 'mental health young people',
    categories: ['550e8400-e29b-41d4-a716-446655440000'], // MENTAL_HEALTH
    tags: ['660e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001'] // ANXIETY, DEPRESSION
  },
  {
    query: 'healthy relationships communication',
    categories: ['550e8400-e29b-41d4-a716-446655440002'], // RELATIONSHIPS
    tags: []
  },
  {
    query: 'addiction recovery young adults',
    categories: ['550e8400-e29b-41d4-a716-446655440003'], // ADDICTION_RECOVERY
    tags: ['660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004'] // ADDICTION, ALCOHOLISM
  },
  // Add more topics as needed
];

// Supabase function handler
export const handler = async (req: any) => {
  try {
    // Authentication - using service key from environment variables
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    const results = {
      added: 0,
      errors: 0,
      details: []
    };

    // Process each topic
    for (const topic of TOPICS) {
      // Fetch content from different sources (limited to 2 each for testing)
      const videos = await fetchYouTubeVideos(topic.query, 2);
      const podcasts = await fetchSpotifyPodcasts(topic.query, 2);
      const articles = await fetchNewsArticles(topic.query, 2);
      
      // Add videos to database
      for (const video of videos) {
        const success = await addResourceToDatabase(supabaseAdmin, video, 'video', topic.categories, topic.tags);
        if (success) {
          results.added++;
          results.details.push({ type: 'video', title: video.title, success: true });
        } else {
          results.errors++;
          results.details.push({ type: 'video', title: video.title, success: false });
        }
      }
      
      // Add podcasts to database
      for (const podcast of podcasts) {
        const success = await addResourceToDatabase(supabaseAdmin, podcast, 'podcast', topic.categories, topic.tags);
        if (success) {
          results.added++;
          results.details.push({ type: 'podcast', title: podcast.title, success: true });
        } else {
          results.errors++;
          results.details.push({ type: 'podcast', title: podcast.title, success: false });
        }
      }
      
      // Add articles to database
      for (const article of articles) {
        const success = await addResourceToDatabase(supabaseAdmin, article, 'article', topic.categories, topic.tags);
        if (success) {
          results.added++;
          results.details.push({ type: 'article', title: article.title, success: true });
        } else {
          results.errors++;
          results.details.push({ type: 'article', title: article.title, success: false });
        }
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
} 