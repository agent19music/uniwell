import { 
  fetchYouTubeVideos, 
  fetchSpotifyPodcasts, 
  fetchNewsArticles, 
  addResourceToDatabase 
} from '../lib/resourceUtils';
import { supabase } from '../lib/supabase';

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

// Create categories and tags first
async function createCategoriesAndTags() {
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
    if (error) console.error(`Error creating category ${category.name}:`, error);
  }
  
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
    if (error) console.error(`Error creating tag ${tag.name}:`, error);
  }
}

// Populate resources by topic
async function populateResourcesByTopic() {
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
    },
    {
      query: 'alcoholism recovery strategies',
      categories: [CATEGORIES.ADDICTION_RECOVERY, CATEGORIES.MENTAL_HEALTH],
      tags: [TAGS.ALCOHOLISM, TAGS.ADDICTION]
    },
    {
      query: 'overcoming porn addiction',
      categories: [CATEGORIES.ADDICTION_RECOVERY],
      tags: [TAGS.PORN_ADDICTION, TAGS.ADDICTION]
    },
    {
      query: 'healthy eating habits',
      categories: [CATEGORIES.HEALTHY_HABITS],
      tags: [TAGS.HEALTHY_EATING]
    },
    {
      query: 'effective study techniques',
      categories: [CATEGORIES.PRODUCTIVITY],
      tags: [TAGS.STUDY_HABITS]
    },
    {
      query: 'improving sleep quality',
      categories: [CATEGORIES.SLEEP, CATEGORIES.HEALTHY_HABITS],
      tags: [TAGS.SLEEP_HYGIENE]
    }
  ];
  
  for (const topic of topics) {
    console.log(`Fetching resources for topic: ${topic.query}`);
    
    // Fetch videos
    const videos = await fetchYouTubeVideos(topic.query, 5);
    for (const video of videos) {
      await addResourceToDatabase(video, 'video', topic.categories, topic.tags);
    }
    
    // Fetch podcasts
    const podcasts = await fetchSpotifyPodcasts(topic.query, 5);
    for (const podcast of podcasts) {
      await addResourceToDatabase(podcast, 'podcast', topic.categories, topic.tags);
    }
    
    // Fetch articles
    const articles = await fetchNewsArticles(topic.query, 5);
    for (const article of articles) {
      await addResourceToDatabase(article, 'article', topic.categories, topic.tags);
    }
    
    console.log(`Added resources for topic: ${topic.query}`);
  }
}

// Main function to run the population script
async function populateLibrary() {
  try {
    console.log('Creating categories and tags...');
    await createCategoriesAndTags();
    
    console.log('Populating resources...');
    await populateResourcesByTopic();
    
    console.log('Library population complete!');
  } catch (error) {
    console.error('Error populating library:', error);
  }
}

// Run the script
populateLibrary(); 