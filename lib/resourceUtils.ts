import { supabase } from './supabase';
import axios from 'axios';

// API Keys (store these in environment variables in production)
const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
const NEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY;
const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;

// YouTube API integration
export async function fetchYouTubeVideos(query: string, maxResults = 10) {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        maxResults,
        q: query,
        type: 'video',
        key: YOUTUBE_API_KEY,
        videoEmbeddable: true,
        relevanceLanguage: 'en'
      }
    });

    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
    
    // Get video details including duration
    const videoDetails = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'contentDetails,statistics,snippet',
        id: videoIds,
        key: YOUTUBE_API_KEY
      }
    });

    return videoDetails.data.items.map((item: any) => {
      // Convert ISO 8601 duration to minutes
      const duration = convertYouTubeDuration(item.contentDetails.duration);
      
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail_url: item.snippet.thumbnails.high.url,
        media_url: `https://www.youtube.com/embed/${item.id}`,
        duration: `${duration} min watch`,
        source: 'YouTube',
        author: item.snippet.channelTitle,
        view_count: parseInt(item.statistics.viewCount),
        published_at: item.snippet.publishedAt
      };
    });
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
}

// Convert YouTube ISO 8601 duration to minutes
export function convertYouTubeDuration(duration: string) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  
  if (!match) {
    return 0; // Return 0 if the format doesn't match
  }
  
  const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
  const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
  const seconds = match[3] ? parseInt(match[3].replace('S', '')) : 0;
  
  return Math.round(hours * 60 + minutes + seconds / 60);
}

// Spotify API integration
export async function fetchSpotifyPodcasts(query: string, limit = 10) {
  try {
    // Get access token
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'client_credentials'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // Search for podcasts
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: query,
        type: 'show,episode',
        limit
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // Process episodes
    const episodes = response.data.episodes?.items || [];
    return episodes.map((episode: any) => {
      const durationMinutes = Math.round(episode.duration_ms / 60000);
      
      return {
        id: episode.id,
        title: episode.name,
        description: episode.description,
        thumbnail_url: episode.images[0].url,
        media_url: episode.external_urls.spotify,
        duration: `${durationMinutes} min listen`,
        source: 'Spotify',
        author: episode.show.name,
        published_at: episode.release_date
      };
    });
  } catch (error) {
    console.error('Error fetching Spotify podcasts:', error);
    throw error;
  }
}

// News API integration
export async function fetchNewsArticles(query: string, pageSize = 10) {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        pageSize,
        language: 'en',
        sortBy: 'relevancy',
        apiKey: NEWS_API_KEY
      }
    });
    
    return response.data.articles.map((article: any) => {
      // Estimate reading time (average reading speed: 200 words per minute)
      const wordCount = article.content ? article.content.split(' ').length : 300;
      const readingTime = Math.max(1, Math.round(wordCount / 200));
      
      return {
        title: article.title,
        description: article.description || '',
        thumbnail_url: article.urlToImage || 'https://via.placeholder.com/300x200?text=No+Image',
        article_content: article.content,
        url: article.url,
        duration: `${readingTime} min read`,
        source: article.source.name,
        author: article.author || article.source.name,
        published_at: article.publishedAt
      };
    });
  } catch (error) {
    console.error('Error fetching news articles:', error);
    throw error;
  }
}

// Function to add resources to Supabase
export async function addResourceToDatabase(resource: any, contentType: 'article' | 'video' | 'podcast' | 'book', categoryIds: string[], tagIds: string[]) {
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
      contentData.media_duration = resource.media_duration;
    } else if (contentType === 'book') {
      contentData.book_preview_url = resource.book_preview_url;
      contentData.book_purchase_url = resource.book_purchase_url;
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
    
    return resourceData;
  } catch (error) {
    console.error('Error adding resource to database:', error);
    throw error;
  }
}