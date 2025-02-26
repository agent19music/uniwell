import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Spotify API credentials (store these in environment variables in production)
const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;

// Token storage keys
const SPOTIFY_TOKEN_KEY = 'spotify_access_token';
const SPOTIFY_TOKEN_EXPIRY_KEY = 'spotify_token_expiry';

/**
 * Get a valid Spotify access token, refreshing if necessary
 * @returns {Promise<string>} A valid Spotify access token
 */
export async function getSpotifyToken(): Promise<string> {
  try {
    // Check if we have a cached token
    const cachedToken = await AsyncStorage.getItem(SPOTIFY_TOKEN_KEY);
    const tokenExpiry = await AsyncStorage.getItem(SPOTIFY_TOKEN_EXPIRY_KEY);
    
    // If token exists and is not expired (with 5 minute buffer), return it
    if (cachedToken && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry);
      const currentTime = Date.now();
      
      // Add 5 minute buffer (300000 ms) to ensure token doesn't expire during use
      if (expiryTime > currentTime + 300000) {
        return cachedToken;
      }
    }
    
    // Otherwise, request a new token
    return await refreshSpotifyToken();
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    throw new Error('Failed to get Spotify access token');
  }
}

/**
 * Request a new Spotify access token
 * @returns {Promise<string>} A new Spotify access token
 */
async function refreshSpotifyToken(): Promise<string> {
  try {
    // Request new token from Spotify
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'client_credentials'
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET
          ).toString('base64')
        }
      }
    );
    
    const { access_token, expires_in } = response.data;
    
    // Calculate expiry time (current time + expires_in seconds)
    const expiryTime = Date.now() + (expires_in * 1000);
    
    // Cache the token and expiry time
    await AsyncStorage.setItem(SPOTIFY_TOKEN_KEY, access_token);
    await AsyncStorage.setItem(SPOTIFY_TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    return access_token;
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
    throw new Error('Failed to refresh Spotify access token');
  }
}

/**
 * Make an authenticated request to the Spotify API
 * @param {string} endpoint - The Spotify API endpoint (without base URL)
 * @param {Object} params - Query parameters for the request
 * @returns {Promise<any>} The response data
 */
export async function spotifyApiRequest(endpoint: string, params: any = {}): Promise<any> {
  try {
    // Get a valid token
    const token = await getSpotifyToken();
    
    // Make the request
    const response = await axios.get(`https://api.spotify.com/v1${endpoint}`, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    // Handle token expiration errors
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Force token refresh and retry once
      await AsyncStorage.removeItem(SPOTIFY_TOKEN_KEY);
      await AsyncStorage.removeItem(SPOTIFY_TOKEN_EXPIRY_KEY);
      
      const token = await refreshSpotifyToken();
      
      // Retry the request with new token
      const response = await axios.get(`https://api.spotify.com/v1${endpoint}`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    }
    
    console.error('Spotify API request failed:', error);
    throw error;
  }
} 