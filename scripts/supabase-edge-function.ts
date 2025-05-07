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
    console.error('Error in edge function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Helper function to add resources to database
async function addResourceToDatabase(supabase: any, resource: any, contentType: string, categoryIds: string[], tagIds: string[]) {
  try {
    // Check if resource already exists to avoid duplicates
    const { data: existingResource } = await supabase
      .from('resources')
      .select('id')
      .eq('title', resource.title)
      .eq('source', resource.source)
      .maybeSingle();
      
    if (existingResource) {
      console.log(`Resource already exists: ${resource.title}`);
      return true; // Consider this successful to avoid error counts
    }
    
    // Insert into resources table
    const { data: resourceData, error: resourceError } = await supabase
      .from('resources')
      .insert({
        title: resource.title,
        description: resource.description,
        content_type: contentType,
        thumbnail_url: resource.thumbnail_url,
        source: resource.source,
        author: resource.author || 'Unknown',
        duration: resource.duration,
        is_featured: false,
        is_premium: false,
        view_count: resource.view_count || 0
      })
      .select()
      .single();
      
    if (resourceError) throw resourceError;
    
    // Insert into resource_content table
    const contentData: any = {
      resource_id: resourceData.id,
      content_type: contentType
    };
    
    if (contentType === 'article') {
      contentData.article_content = resource.article_content;
      contentData.media_url = resource.url;
    } else if (contentType === 'video' || contentType === 'podcast') {
      contentData.media_url = resource.media_url;
      contentData.media_thumbnail = resource.thumbnail_url;
    }
    
    const { error: contentError } = await supabase
      .from('resource_content')
      .insert(contentData);
      
    if (contentError) throw contentError;
    
    // Add categories
    if (categoryIds.length > 0) {
      const categoryRelations = categoryIds.map(categoryId => ({
        resource_id: resourceData.id,
        category_id: categoryId
      }));
      
      const { error: categoryError } = await supabase
        .from('resource_categories')
        .insert(categoryRelations);
        
      if (categoryError) throw categoryError;
    }
    
    // Add tags
    if (tagIds.length > 0) {
      const tagRelations = tagIds.map(tagId => ({
        resource_id: resourceData.id,
        tag_id: tagId
      }));
      
      const { error: tagError } = await supabase
        .from('resource_tags')
        .insert(tagRelations);
        
      if (tagError) throw tagError;
    }
    
    console.log(`Added ${contentType}: ${resource.title}`);
    return true;
  } catch (error: any) {
    console.error(`Error adding resource to database: ${resource.title}`, error.message);
    return false;
  }
} 