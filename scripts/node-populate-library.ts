// Import all dependencies at the top using ESM syntax
import { createClient } from '@supabase/supabase-js';
import { fetchYouTubeVideos, fetchSpotifyPodcasts, fetchNewsArticles } from './node-resource-utils.js';
import cron from 'node-cron';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define categories with their IDs
const CATEGORIES = {
  ACADEMIC_SUCCESS: '550e8400-e29b-41d4-a716-446655440000',
  CAREER_DEVELOPMENT: '550e8400-e29b-41d4-a716-446655440001',
  FINANCIAL_LITERACY: '550e8400-e29b-41d4-a716-446655440002',
  STUDENT_WELLNESS: '550e8400-e29b-41d4-a716-446655440003',
  PERSONAL_DEVELOPMENT: '550e8400-e29b-41d4-a716-446655440004',
  TECHNOLOGY: '550e8400-e29b-41d4-a716-446655440005',
  SOCIAL_COMMUNITY: '550e8400-e29b-41d4-a716-446655440006',
  PRODUCTIVITY: '550e8400-e29b-41d4-a716-446655440007'
};

// Define tags with their IDs
const TAGS = {
  STUDY_SKILLS: '660e8400-e29b-41d4-a716-446655440000',
  TIME_MANAGEMENT: '660e8400-e29b-41d4-a716-446655440001',
  EXAM_PREP: '660e8400-e29b-41d4-a716-446655440002',
  RESEARCH_SKILLS: '660e8400-e29b-41d4-a716-446655440003',
  ACADEMIC_WRITING: '660e8400-e29b-41d4-a716-446655440004',
  INTERNSHIPS: '660e8400-e29b-41d4-a716-446655440005',
  RESUME_BUILDING: '660e8400-e29b-41d4-a716-446655440006',
  INTERVIEW_PREP: '660e8400-e29b-41d4-a716-446655440007',
  NETWORKING: '660e8400-e29b-41d4-a716-446655440008',
  CAREER_PLANNING: '660e8400-e29b-41d4-a716-446655440009',
  BUDGETING: '660e8400-e29b-41d4-a716-446655440010',
  STUDENT_LOANS: '660e8400-e29b-41d4-a716-446655440011',
  INVESTING: '660e8400-e29b-41d4-a716-446655440012',
  FINANCIAL_PLANNING: '660e8400-e29b-41d4-a716-446655440013',
  MENTAL_HEALTH: '660e8400-e29b-41d4-a716-446655440014',
  PHYSICAL_HEALTH: '660e8400-e29b-41d4-a716-446655440015',
  STRESS_MANAGEMENT: '660e8400-e29b-41d4-a716-446655440016',
  SLEEP_HYGIENE: '660e8400-e29b-41d4-a716-446655440017',
  NUTRITION: '660e8400-e29b-41d4-a716-446655440018',
  LEADERSHIP: '660e8400-e29b-41d4-a716-446655440019',
  COMMUNICATION: '660e8400-e29b-41d4-a716-446655440020',
  CREATIVITY: '660e8400-e29b-41d4-a716-446655440021',
  CRITICAL_THINKING: '660e8400-e29b-41d4-a716-446655440022',
  EMOTIONAL_INTELLIGENCE: '660e8400-e29b-41d4-a716-446655440023',
  PROGRAMMING: '660e8400-e29b-41d4-a716-446655440024',
  DIGITAL_TOOLS: '660e8400-e29b-41d4-a716-446655440025',
  DATA_ANALYSIS: '660e8400-e29b-41d4-a716-446655440026',
  AI_ML: '660e8400-e29b-41d4-a716-446655440027',
  CAMPUS_LIFE: '660e8400-e29b-41d4-a716-446655440028',
  DIVERSITY: '660e8400-e29b-41d4-a716-446655440029',
  SUSTAINABILITY: '660e8400-e29b-41d4-a716-446655440030',
  COMMUNITY_SERVICE: '660e8400-e29b-41d4-a716-446655440031'
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
    { id: CATEGORIES.ACADEMIC_SUCCESS, name: 'Academic Success', color: '#4A90E2', icon: 'school' },
    { id: CATEGORIES.CAREER_DEVELOPMENT, name: 'Career Development', color: '#FF6B6B', icon: 'briefcase' },
    { id: CATEGORIES.FINANCIAL_LITERACY, name: 'Financial Literacy', color: '#9C27B0', icon: 'cash' },
    { id: CATEGORIES.STUDENT_WELLNESS, name: 'Student Wellness', color: '#4CAF50', icon: 'fitness' },
    { id: CATEGORIES.PERSONAL_DEVELOPMENT, name: 'Personal Development', color: '#FF9800', icon: 'person' },
    { id: CATEGORIES.TECHNOLOGY, name: 'Technology & Digital Skills', color: '#3F51B5', icon: 'code' },
    { id: CATEGORIES.SOCIAL_COMMUNITY, name: 'Social & Community', color: '#00BCD4', icon: 'people' },
    { id: CATEGORIES.PRODUCTIVITY, name: 'Productivity', color: '#673AB7', icon: 'time' }
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
    { id: TAGS.STUDY_SKILLS, name: 'Study Skills' },
    { id: TAGS.TIME_MANAGEMENT, name: 'Time Management' },
    { id: TAGS.EXAM_PREP, name: 'Exam Preparation' },
    { id: TAGS.RESEARCH_SKILLS, name: 'Research Skills' },
    { id: TAGS.ACADEMIC_WRITING, name: 'Academic Writing' },
    { id: TAGS.INTERNSHIPS, name: 'Internships' },
    { id: TAGS.RESUME_BUILDING, name: 'Resume Building' },
    { id: TAGS.INTERVIEW_PREP, name: 'Interview Preparation' },
    { id: TAGS.NETWORKING, name: 'Networking' },
    { id: TAGS.CAREER_PLANNING, name: 'Career Planning' },
    { id: TAGS.BUDGETING, name: 'Budgeting' },
    { id: TAGS.STUDENT_LOANS, name: 'Student Loans' },
    { id: TAGS.INVESTING, name: 'Investing' },
    { id: TAGS.FINANCIAL_PLANNING, name: 'Financial Planning' },
    { id: TAGS.MENTAL_HEALTH, name: 'Mental Health' },
    { id: TAGS.PHYSICAL_HEALTH, name: 'Physical Health' },
    { id: TAGS.STRESS_MANAGEMENT, name: 'Stress Management' },
    { id: TAGS.SLEEP_HYGIENE, name: 'Sleep Hygiene' },
    { id: TAGS.NUTRITION, name: 'Nutrition' },
    { id: TAGS.LEADERSHIP, name: 'Leadership' },
    { id: TAGS.COMMUNICATION, name: 'Communication' },
    { id: TAGS.CREATIVITY, name: 'Creativity' },
    { id: TAGS.CRITICAL_THINKING, name: 'Critical Thinking' },
    { id: TAGS.EMOTIONAL_INTELLIGENCE, name: 'Emotional Intelligence' },
    { id: TAGS.PROGRAMMING, name: 'Programming' },
    { id: TAGS.DIGITAL_TOOLS, name: 'Digital Tools' },
    { id: TAGS.DATA_ANALYSIS, name: 'Data Analysis' },
    { id: TAGS.AI_ML, name: 'AI & Machine Learning' },
    { id: TAGS.CAMPUS_LIFE, name: 'Campus Life' },
    { id: TAGS.DIVERSITY, name: 'Diversity & Inclusion' },
    { id: TAGS.SUSTAINABILITY, name: 'Sustainability' },
    { id: TAGS.COMMUNITY_SERVICE, name: 'Community Service' }
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
    // Check if resource already exists
    const { data: existingResource } = await supabase
      .from('resources')
      .select('id')
      .eq('title', resource.title)
      .single();

    if (existingResource) {
      console.log(`⏭️ Skipping existing resource: ${resource.title}`);
      return existingResource;
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
        author: resource.author,
        duration: resource.duration,
        is_featured: false,
        is_premium: false,
        view_count: resource.view_count || 0,
        created_at: new Date().toISOString()
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

// Main function to run the population script
async function populateLibrary() {
  try {
    console.log('Starting library population...');
    
    // Create categories and tags first
    await createCategoriesAndTags();
    
    // Define topics with their associated categories and tags
    const topics = [
      {
        query: 'effective study techniques for college students',
        categories: [CATEGORIES.ACADEMIC_SUCCESS],
        tags: [TAGS.STUDY_SKILLS, TAGS.TIME_MANAGEMENT, TAGS.EXAM_PREP]
      },
      {
        query: 'college student resume writing tips',
        categories: [CATEGORIES.CAREER_DEVELOPMENT],
        tags: [TAGS.RESUME_BUILDING, TAGS.CAREER_PLANNING]
      },
      {
        query: 'student loan management and financial planning',
        categories: [CATEGORIES.FINANCIAL_LITERACY],
        tags: [TAGS.STUDENT_LOANS, TAGS.FINANCIAL_PLANNING, TAGS.BUDGETING]
      },
      {
        query: 'college student mental health and stress management',
        categories: [CATEGORIES.STUDENT_WELLNESS],
        tags: [TAGS.MENTAL_HEALTH, TAGS.STRESS_MANAGEMENT, TAGS.SLEEP_HYGIENE]
      },
      {
        query: 'leadership skills for college students',
        categories: [CATEGORIES.PERSONAL_DEVELOPMENT],
        tags: [TAGS.LEADERSHIP, TAGS.COMMUNICATION, TAGS.EMOTIONAL_INTELLIGENCE]
      },
      {
        query: 'programming and coding for beginners',
        categories: [CATEGORIES.TECHNOLOGY],
        tags: [TAGS.PROGRAMMING, TAGS.DIGITAL_TOOLS]
      },
      {
        query: 'campus life and student community',
        categories: [CATEGORIES.SOCIAL_COMMUNITY],
        tags: [TAGS.CAMPUS_LIFE, TAGS.DIVERSITY, TAGS.COMMUNITY_SERVICE]
      },
      {
        query: 'college productivity and time management',
        categories: [CATEGORIES.PRODUCTIVITY],
        tags: [TAGS.TIME_MANAGEMENT, TAGS.STUDY_SKILLS]
      }
    ];
    
    for (const topic of topics) {
      console.log(`\nFetching resources for topic: ${topic.query}`);
      
      // Fetch videos
      const videos = await fetchYouTubeVideos(topic.query, 3);
      for (const video of videos) {
        await addResourceToDatabase(video, 'video', topic.categories, topic.tags);
      }
      
      // Fetch podcasts
      const podcasts = await fetchSpotifyPodcasts(topic.query, 3);
      for (const podcast of podcasts) {
        await addResourceToDatabase(podcast, 'podcast', topic.categories, topic.tags);
      }
      
      // Fetch articles
      const articles = await fetchNewsArticles(topic.query, 3);
      for (const article of articles) {
        await addResourceToDatabase(article, 'article', topic.categories, topic.tags);
      }
      
      console.log(`✅ Completed resources for topic: ${topic.query}`);
    }
    
    console.log('\nLibrary population complete!');
  } catch (error: any) {
    console.error('Error populating library:', error.message);
  }
}

// Schedule automated updates
function scheduleUpdates() {
  // Run full population daily at 2 AM
  cron.schedule('0 2 * * *', () => {
    console.log('Running scheduled library update...');
    populateLibrary();
  });

  // Run quick update every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Running quick library update...');
    // Implement quick update logic here
    // This could fetch only the most recent content
  });
}

// Start the scheduler
scheduleUpdates();

// Run initial population
populateLibrary(); 