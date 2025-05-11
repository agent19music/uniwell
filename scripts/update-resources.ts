import { createClient } from '@supabase/supabase-js';
import { 
  fetchYouTubeVideos, 
  fetchSpotifyPodcasts, 
  fetchNewsArticles,
  validateResource,
  cleanContent,
  scoreContentRelevance
} from './node-resource-utils';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Resource categories and their search queries
const RESOURCE_CATEGORIES = {
  'academic-success': [
    'study techniques university',
    'exam preparation tips',
    'research skills for students',
    'academic writing guide',
    'time management for students'
  ],
  'career-development': [
    'internship tips for students',
    'resume writing for graduates',
    'job interview preparation',
    'networking for students',
    'career planning guide'
  ],
  'financial-literacy': [
    'student budgeting tips',
    'managing student loans',
    'personal finance for students',
    'saving money in college',
    'student investment guide'
  ],
  'student-wellness': [
    'mental health for students',
    'stress management college',
    'healthy sleep habits students',
    'nutrition for college students',
    'work-life balance university'
  ]
};

async function updateResources() {
  console.log('Starting resource update...');
  
  try {
    // Get all user interests for relevance scoring
    const { data: userInterests, error: interestsError } = await supabase
      .from('user_interests')
      .select('interest');
    
    if (interestsError) throw interestsError;
    
    const allInterests = userInterests.map(ui => ui.interest);
    
    // Process each category
    for (const [category, queries] of Object.entries(RESOURCE_CATEGORIES)) {
      console.log(`Processing category: ${category}`);
      
      // Fetch resources from different sources
      const youtubeVideos = await Promise.all(
        queries.map(query => fetchYouTubeVideos(query))
      );
      
      const spotifyPodcasts = await Promise.all(
        queries.map(query => fetchSpotifyPodcasts(query))
      );
      
      const newsArticles = await Promise.all(
        queries.map(query => fetchNewsArticles(query))
      );
      
      // Combine and process all resources
      const allResources = [
        ...youtubeVideos.flat(),
        ...spotifyPodcasts.flat(),
        ...newsArticles.flat()
      ];
      
      // Filter and validate resources
      const validResources = allResources
        .filter(validateResource)
        .map(resource => ({
          ...resource,
          description: cleanContent(resource.description),
          article_content: resource.article_content ? cleanContent(resource.article_content) : null,
          relevance_score: scoreContentRelevance(resource, allInterests)
        }));
      
      // Check for existing resources to avoid duplicates
      const { data: existingResources } = await supabase
        .from('resources')
        .select('media_url, article_content')
        .eq('category', category);
      
      const existingUrls = new Set(
        existingResources?.map(r => r.media_url || r.article_content) || []
      );
      
      // Filter out duplicates
      const newResources = validResources.filter(
        resource => !existingUrls.has(resource.media_url || resource.article_content)
      );
      
      // Insert new resources
      if (newResources.length > 0) {
        const { error: insertError } = await supabase
          .from('resources')
          .insert(
            newResources.map(resource => ({
              ...resource,
              category,
              created_at: new Date().toISOString()
            }))
          );
        
        if (insertError) throw insertError;
        
        console.log(`Added ${newResources.length} new resources to ${category}`);
      }
    }
    
    // Update resource scores for all users
    await updateUserResourceScores();
    
    console.log('Resource update completed successfully');
  } catch (error) {
    console.error('Error updating resources:', error);
    throw error;
  }
}

async function updateUserResourceScores() {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, interests');
    
    if (usersError) throw usersError;
    
    // Get all resources
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('*');
    
    if (resourcesError) throw resourcesError;
    
    // Update scores for each user
    for (const user of users) {
      const userInterests = user.interests || [];
      
      // Calculate personalized scores for each resource
      const resourceScores = resources.map(resource => ({
        user_id: user.id,
        resource_id: resource.id,
        score: scoreContentRelevance(resource, userInterests)
      }));
      
      // Update scores in the database
      const { error: updateError } = await supabase
        .from('user_resource_scores')
        .upsert(resourceScores, {
          onConflict: 'user_id,resource_id'
        });
      
      if (updateError) throw updateError;
    }
    
    console.log('Updated resource scores for all users');
  } catch (error) {
    console.error('Error updating user resource scores:', error);
    throw error;
  }
}

// Export for use in other scripts
export { updateResources, updateUserResourceScores };

// Run if called directly
if (require.main === module) {
  updateResources()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} 