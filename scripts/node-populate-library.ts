import { createClient } from '@supabase/supabase-js';
import { fetchYouTubeVideos, fetchSpotifyPodcasts, fetchNewsArticles } from './node-resource-utils';

// Load environment variables
require('dotenv').config();

// Create Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define categories with their IDs
const CATEGORIES = {
  MENTAL_HEALTH: '550e8400-e29b-41d4-a716-446655440000',
  SELF_LOVE: '550e8400-e29b-41d4-a716-446655440001',
  RELATIONSHIPS: '550e8400-e29b-41d4-a716-446655440002',
  ADDICTION_RECOVERY: '550e8400-e29b-41d4-a716-446655440003',
  HEALTHY_HABITS: '550e8400-e29b-41d4-a716-446655440004',
  PRODUCTIVITY: '550e8400-e29b-41d4-a716-446655440005',
  MINDFULNESS: '550e8400-e29b-41d4-a716-446655440006',
  SLEEP: '550e8400-e29b-41d4-a716-446655440007'
};

// Define tags with their IDs
const TAGS = {
  ANXIETY: '660e8400-e29b-41d4-a716-446655440000',
  DEPRESSION: '660e8400-e29b-41d4-a716-446655440001',
  BREAKUP: '660e8400-e29b-41d4-a716-446655440002',
  ADDICTION: '660e8400-e29b-41d4-a716-446655440003',
  ALCOHOLISM: '660e8400-e29b-41d4-a716-446655440004',
  PORN_ADDICTION: '660e8400-e29b-41d4-a716-446655440005',
  HEALTHY_EATING: '660e8400-e29b-41d4-a716-446655440006',
  STUDY_HABITS: '660e8400-e29b-41d4-a716-446655440007',
  MEDITATION: '660e8400-e29b-41d4-a716-446655440008',
  SLEEP_HYGIENE: '660e8400-e29b-41d4-a716-446655440009'
};

// Define interfaces for better type safety
interface Resource {
  id?: string;
  title: string;
  description: string;
  thumbnail_url: string;
  source: string;
  author: string;
  duration: string;
  view_count?: number;
  published_at?: string;
  media_url?: string;
  article_content?: string;
}

// Create categories and tags first
async function createCategoriesAndTags() {
  console.log('Creating categories...');
  // Create categories
  const categories = [
    { id: CATEGORIES.MENTAL_HEALTH, name: 'Mental Health', color: '#4A90E2', icon: 'brain' },
    { id: CATEGORIES.SELF_LOVE, name: 'Self Love', color: '#FF6B6B', icon: 'heart' },
    { id: CATEGORIES.RELATIONSHIPS, name: 'Relationships', color: '#9C27B0', icon: 'people' },
    { id: CATEGORIES.ADDICTION_RECOVERY, name: 'Addiction Recovery', color: '#4CAF50', icon: 'fitness' },
    { id: CATEGORIES.HEALTHY_HABITS, name: 'Healthy Habits', color: '#FF9800', icon: 'nutrition' },
    { id: CATEGORIES.PRODUCTIVITY, name: 'Productivity', color: '#3F51B5', icon: 'time' },
    { id: CATEGORIES.MINDFULNESS, name: 'Mindfulness', color: '#00BCD4', icon: 'leaf' },
    { id: CATEGORIES.SLEEP, name: 'Sleep', color: '#673AB7', icon: 'moon' }
  ];
  
  for (const category of categories) {
    const { error } = await supabase
      .from('categories')
      .upsert(category, { onConflict: 'id' });
      
    if (error) {
      console.error(`Error creating category ${category.name}:`, error.message);
    } else {
      console.log(`✅ Created category: ${category.name}`);
    }
  }
  
  console.log('Creating tags...');
  // Create tags
  const tags = [
    { id: TAGS.ANXIETY, name: 'Anxiety' },
    { id: TAGS.DEPRESSION, name: 'Depression' },
    { id: TAGS.BREAKUP, name: 'Breakup Recovery' },
    { id: TAGS.ADDICTION, name: 'Addiction' },
    { id: TAGS.ALCOHOLISM, name: 'Alcoholism' },
    { id: TAGS.PORN_ADDICTION, name: 'Porn Addiction' },
    { id: TAGS.HEALTHY_EATING, name: 'Healthy Eating' },
    { id: TAGS.STUDY_HABITS, name: 'Study Habits' },
    { id: TAGS.MEDITATION, name: 'Meditation' },
    { id: TAGS.SLEEP_HYGIENE, name: 'Sleep Hygiene' }
  ];
  
  for (const tag of tags) {
    const { error } = await supabase
      .from('tags')
      .upsert(tag, { onConflict: 'id' });
      
    if (error) {
      console.error(`Error creating tag ${tag.name}:`, error.message);
    } else {
      console.log(`✅ Created tag: ${tag.name}`);
    }
  }
}

// Function to add resources to Supabase
async function addResourceToDatabase(resource: any, contentType: string, categoryIds: string[], tagIds: string[]) {
  try {
    // Insert into resources table
    const { data: resourceData, error: resourceError } = await supabase
      .from('resources')
      .insert({
        title: resource.title,
        description: resource.description,
        content_type: contentType,
        thumbnail_url: resource.thumbnail_url,
        source: resource.source,
        author: resource.author,
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
    
    console.log(`✅ Added ${contentType}: ${resource.title}`);
    return resourceData;
  } catch (error: any) {
    console.error('❌ Error adding resource to database:', error.message);
    return null;
  }
}

// Fix for the Spotify API issue
async function fixSpotifyPodcasts(query: string, limit = 2): Promise<Resource[]> {
  try {
    const podcasts = await fetchSpotifyPodcasts(query, limit);
    return podcasts.filter((podcast: Resource) => podcast && podcast.title && podcast.description);
  } catch (error) {
    console.error('Error in fixSpotifyPodcasts:', error);
    return [];
  }
}

// Main function to run the population script
async function populateLibrary() {
  try {
    console.log('Starting library population...');
    
    // Create categories and tags first
    await createCategoriesAndTags();
    
    // Define topics with their associated categories and tags
    const topics = [
      {
        query: 'overcoming anxiety techniques',
        categories: [CATEGORIES.MENTAL_HEALTH, CATEGORIES.MINDFULNESS],
        tags: [TAGS.ANXIETY, TAGS.MEDITATION]
      },
      {
        query: 'healing after breakup',
        categories: [CATEGORIES.RELATIONSHIPS, CATEGORIES.SELF_LOVE],
        tags: [TAGS.BREAKUP]
      }
      // Add more topics as needed
    ];
    
    for (const topic of topics) {
      console.log(`Fetching resources for topic: ${topic.query}`);
      
      // Fetch videos
      const videos = await fetchYouTubeVideos(topic.query, 2);
      for (const video of videos) {
        await addResourceToDatabase(video, 'video', topic.categories, topic.tags);
      }
      
      // Fetch podcasts with fix
      const podcasts = await fixSpotifyPodcasts(topic.query, 2);
      for (const podcast of podcasts) {
        await addResourceToDatabase(podcast, 'podcast', topic.categories, topic.tags);
      }
      
      // Fetch articles
      const articles = await fetchNewsArticles(topic.query, 2);
      for (const article of articles) {
        await addResourceToDatabase(article, 'article', topic.categories, topic.tags);
      }
      
      console.log(`Completed resources for topic: ${topic.query}`);
    }
    
    console.log('Library population complete!');
  } catch (error: any) {
    console.error('Error populating library:', error.message);
  }
}

// Run the script
populateLibrary(); 