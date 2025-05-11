import axios from 'axios';
import { google } from 'googleapis';
import SpotifyWebApi from 'spotify-web-api-node';

// Initialize APIs with environment variables
const youtube = google.youtube('v3');
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// News API configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

interface Resource {
  title: string;
  description: string;
  thumbnail_url: string;
  source: string;
  author: string;
  duration: string;
  media_url?: string;
  article_content?: string;
  view_count?: number;
  published_at?: string;
}

// YouTube API functions
export async function fetchYouTubeVideos(query: string, limit: number = 5): Promise<Resource[]> {
  try {
    const response = await youtube.search.list({
      key: process.env.YOUTUBE_API_KEY,
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults: limit,
      videoDuration: 'medium',
      relevanceLanguage: 'en',
      regionCode: 'US'
    });

    const videoIds = response.data.items?.map(item => item.id?.videoId).filter(Boolean);
    
    if (!videoIds?.length) return [];

    const videoDetails = await youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY,
      part: ['contentDetails', 'statistics'],
      id: videoIds
    });

    return response.data.items?.map((item, index) => {
      const details = videoDetails.data.items?.[index];
      const duration = details?.contentDetails?.duration || '';
      const viewCount = parseInt(details?.statistics?.viewCount || '0');

      return {
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        thumbnail_url: item.snippet?.thumbnails?.high?.url || '',
        source: 'YouTube',
        author: item.snippet?.channelTitle || '',
        duration: formatDuration(duration),
        media_url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
        view_count: viewCount,
        published_at: item.snippet?.publishedAt
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

// Spotify API functions
export async function fetchSpotifyPodcasts(query: string, limit: number = 5): Promise<Resource[]> {
  try {
    // Get access token
    const tokenResponse = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(tokenResponse.body.access_token);

    const response = await spotifyApi.searchEpisodes(query, {
      limit,
      market: 'US'
    });

    return response.body.episodes?.items.map(episode => ({
      title: episode.name,
      description: episode.description,
      thumbnail_url: episode.images[0]?.url || '',
      source: 'Spotify',
      author: episode.show.publisher,
      duration: formatDuration(episode.duration_ms.toString()),
      media_url: episode.external_urls.spotify,
      published_at: episode.release_date
    })) || [];
  } catch (error) {
    console.error('Error fetching Spotify podcasts:', error);
    return [];
  }
}

// News API functions
export async function fetchNewsArticles(query: string, limit: number = 5): Promise<Resource[]> {
  try {
    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
      params: {
        q: query,
        apiKey: NEWS_API_KEY,
        language: 'en',
        sortBy: 'relevancy',
        pageSize: limit
      }
    });

    return response.data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      thumbnail_url: article.urlToImage || '',
      source: article.source.name,
      author: article.author || 'Unknown',
      duration: '5 min read',
      media_url: article.url,
      article_content: article.content,
      published_at: article.publishedAt
    }));
  } catch (error) {
    console.error('Error fetching news articles:', error);
    return [];
  }
}

// Utility functions
function formatDuration(duration: string): string {
  if (duration.includes('PT')) {
    // YouTube duration format (PT1H2M3S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'Unknown duration';

    const hours = match[1] ? `${match[1]}h ` : '';
    const minutes = match[2] ? `${match[2]}m ` : '';
    const seconds = match[3] ? `${match[3]}s` : '';
    return `${hours}${minutes}${seconds}`.trim();
  } else {
    // Spotify duration format (milliseconds)
    const ms = parseInt(duration);
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

// Content filtering and validation
export function validateResource(resource: Resource): boolean {
  return (
    Boolean(resource.title) &&
    Boolean(resource.description) &&
    Boolean(resource.thumbnail_url) &&
    Boolean(resource.source) &&
    Boolean(resource.author) &&
    Boolean(resource.duration) &&
    (Boolean(resource.media_url) || Boolean(resource.article_content))
  );
}

// Content cleaning
export function cleanContent(content: string): string {
  return content
    .replace(/\[\+\d+ chars\]/g, '')
    .replace(/\{\+\s*\d+\}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Content relevance scoring
export function scoreContentRelevance(content: Resource, userInterests: string[]): number {
  let score = 0;
  
  // Check title and description for interest keywords
  const text = `${content.title} ${content.description}`.toLowerCase();
  userInterests.forEach(interest => {
    if (text.includes(interest.toLowerCase())) {
      score += 2;
    }
  });
  
  // Boost score for recent content
  if (content.published_at) {
    const publishedDate = new Date(content.published_at);
    const now = new Date();
    const daysOld = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) score += 1;
    if (daysOld < 30) score += 0.5;
  }
  
  // Boost score for popular content
  if (content.view_count && content.view_count > 1000) {
    score += 1;
  }
  
  return score;
} 