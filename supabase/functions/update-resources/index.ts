import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Spotify token management
interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  timestamp: number;
}

let spotifyToken: SpotifyToken | null = null;

async function getSpotifyToken(): Promise<string> {
  // Check if we have a valid token
  if (spotifyToken && Date.now() < spotifyToken.timestamp + (spotifyToken.expires_in * 1000)) {
    return spotifyToken.access_token;
  }

  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  const creds = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error('Failed to get Spotify token');
  const data = await res.json();

  spotifyToken = {
    ...data,
    timestamp: Date.now(),
  };

  return spotifyToken.access_token;
}

// Helper function to clean content
function cleanContent(text: string): string {
  return text
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// Helper function to score content relevance
function scoreContentRelevance(resource: any, userInterests: string[]): number {
  let score = 0
  const resourceText = cleanContent(`${resource.title} ${resource.description}`)
  
  // Check for interest matches
  userInterests.forEach(interest => {
    if (resourceText.includes(cleanContent(interest))) {
      score += 1
    }
  })
  
  // Boost score for featured content
  if (resource.is_featured) {
    score += 2
  }
  
  // Boost score for new content
  const isNew = new Date(resource.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  if (isNew) {
    score += 1
  }
  
  return score
}

// Main function handler
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Fetch one of each type of resource
    const [video, podcast, article] = await Promise.all([
      fetchYouTubeVideo(),
      fetchSpotifyPodcast(),
      fetchArticle()
    ])

    // Randomly choose one more type
    const types = ['video', 'podcast', 'article']
    const randomType = types[Math.floor(Math.random() * types.length)]
    let extraResource = null

    switch (randomType) {
      case 'video':
        extraResource = await fetchYouTubeVideo()
        break
      case 'podcast':
        extraResource = await fetchSpotifyPodcast()
        break
      case 'article':
        extraResource = await fetchArticle()
        break
    }

    // Add all resources to database
    const resources = [video, podcast, article, extraResource].filter(Boolean)
    const results = {
      added: 0,
      errors: 0,
      details: [] as any[]
    }

    for (const resource of resources) {
      if (resource) {
        try {
          await addResourceToDatabase(supabaseClient, resource)
          results.added++
          results.details.push({ type: resource.content_type, title: resource.title, success: true })
        } catch (error: any) {
          results.errors++
          results.details.push({ type: resource.content_type, title: resource.title, success: false, error: error.message })
        }
      }
    }

    // Log the results
    await supabaseClient
      .from('resource_update_logs')
      .insert({
        resources_added: results.added,
        status: results.errors === 0 ? 'success' : 'partial_success',
        error_message: results.errors > 0 ? JSON.stringify(results.details) : null
      })

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in edge function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Helper functions
async function fetchYouTubeVideo() {
  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=student%20success%20tips%20OR%20study%20techniques%20OR%20university%20life&type=video&maxResults=1&videoDuration=medium&relevanceLanguage=en&order=relevance&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const video = searchData.items?.[0];
    if (!video?.id?.videoId) return null;

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${video.id.videoId}&key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();
    const details = detailsData.items?.[0];
    if (!details) return null;

    return {
      title: details.snippet?.title || '',
      description: details.snippet?.description || '',
      thumbnail_url: details.snippet?.thumbnails?.high?.url || '',
      content_type: 'video',
      duration: details.contentDetails?.duration || '',
      source: 'YouTube',
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      tags: ['study_skills', 'time_management', 'academic']
    }
  } catch (error) {
    console.error('Error fetching YouTube video:', error)
    return null
  }
}

async function fetchSpotifyPodcast() {
  try {
    // Get Spotify access token using the token management function
    const token = await getSpotifyToken()

    // Search for podcasts
    const res = await fetch('https://api.spotify.com/v1/search?q=student%20success%20OR%20study%20tips&type=show&limit=1&market=US', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const show = data.shows.items[0]
    if (!show) return null

    // Get latest episode
    const episodesResponse = await fetch(`https://api.spotify.com/v1/shows/${show.id}/episodes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit: 1,
        market: 'US'
      }
    })

    const episodeData = await episodesResponse.json();
    const episode = episodeData.items[0]
    if (!episode) return null

    return {
      title: episode.name,
      description: episode.description,
      thumbnail_url: show.images[0]?.url || '',
      content_type: 'podcast',
      duration: `${Math.round(episode.duration_ms / 60000)} min`,
      source: 'Spotify',
      url: episode.external_urls.spotify,
      tags: ['study_skills', 'time_management', 'academic']
    }
  } catch (error) {
    console.error('Error fetching Spotify podcast:', error)
    return null
  }
}

async function fetchArticle() {
  try {
    const apiKey = Deno.env.get('NEWS_API_KEY');
    const url = `https://newsapi.org/v2/everything?q=student%20success%20OR%20study%20techniques%20OR%20university%20life&language=en&sortBy=relevancy&pageSize=1&apiKey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    const article = data.articles[0]
    if (!article) return null

    return {
      title: article.title,
      description: article.description,
      thumbnail_url: article.urlToImage || '',
      content_type: 'article',
      duration: `${Math.ceil(article.content?.split(' ').length / 200)} min read`,
      source: article.source.name,
      url: article.url,
      tags: ['study_skills', 'time_management', 'academic']
    }
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

async function addResourceToDatabase(supabase: any, resource: any) {
  // Insert into resources table
  const { data: resourceData, error: resourceError } = await supabase
    .from('resources')
    .insert({
      title: resource.title,
      description: resource.description,
      thumbnail_url: resource.thumbnail_url,
      content_type: resource.content_type,
      duration: resource.duration,
      source: resource.source,
      url: resource.url,
      is_featured: false,
      popularity_score: 0
    })
    .select()
    .single()

  if (resourceError) throw resourceError

  // Add resource content
  await supabase
    .from('resource_content')
    .insert({
      resource_id: resourceData.id,
      media_url: resource.url
    })

  // Add resource tags
  const tagPromises = resource.tags.map(async (tagId: string) => {
    const { data: tagData } = await supabase
      .from('tags')
      .select('id')
      .eq('identifier', tagId)
      .single()

    if (tagData) {
      await supabase
        .from('resource_tags')
        .insert({
          resource_id: resourceData.id,
          tag_id: tagData.id,
          relevance_score: 1.0
        })
    }
  })

  await Promise.all(tagPromises)

  return resourceData
}

async function updateUserResourceScores(supabaseClient: any) {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, interests');
    
    if (usersError) throw usersError;
    
    // Get all resources
    const { data: resources, error: resourcesError } = await supabaseClient
      .from('resources')
      .select('*');
    
    if (resourcesError) throw resourcesError;
    
    // Update scores for each user
    for (const user of users) {
      const userInterests = user.interests || [];
      
      // Calculate personalized scores for each resource
      const resourceScores = resources.map((resource: any) => ({
        user_id: user.id,
        resource_id: resource.id,
        score: scoreContentRelevance(resource, userInterests)
      }));
      
      // Update scores in the database
      const { error: updateError } = await supabaseClient
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