import axios from 'axios';
import { getSpotifyToken } from './node-spotify-token';

// Load environment variables
require('dotenv').config();

// API Keys
const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
const NEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY;

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
  } catch (error: any) {
    console.error('Error fetching YouTube videos:', error.message);
    return [];
  }
}

// Convert YouTube ISO 8601 duration to minutes
function convertYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  
  if (!match) {
    return 0;
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
    const accessToken = await getSpotifyToken();
    
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
    
    // Process episodes - with better error handling
    const episodes = response.data.episodes?.items || [];
    return episodes.map((episode: any) => {
      try {
        if (!episode || !episode.name) {
          console.log('Invalid episode data:', episode);
          return null;
        }
        
        const durationMinutes = episode.duration_ms ? Math.round(episode.duration_ms / 60000) : 30;
        const showName = episode.show?.name || 'Unknown Show';
        
        return {
          id: episode.id || `spotify-${Date.now()}-${Math.random()}`,
          title: episode.name,
          description: episode.description || `A podcast episode about ${query}`,
          thumbnail_url: episode.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=Podcast',
          media_url: episode.external_urls?.spotify || 'https://open.spotify.com',
          duration: `${durationMinutes} min listen`,
          source: 'Spotify',
          author: showName,
          published_at: episode.release_date || new Date().toISOString()
        };
      } catch (err) {
        console.error('Error processing Spotify episode:', err);
        return null;
      }
    }).filter(Boolean); // Remove any null entries
  } catch (error: any) {
    console.error('Error fetching Spotify podcasts:', error.message);
    return [];
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
  } catch (error: any) {
    console.error('Error fetching news articles:', error.message);
    return [];
  }
} 