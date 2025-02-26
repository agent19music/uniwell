import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config();

// Spotify API credentials
const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;

// Token cache file path
const TOKEN_CACHE_PATH = path.join(__dirname, '.spotify-token-cache.json');

// Get a valid Spotify access token
export async function getSpotifyToken(): Promise<string> {
  try {
    // Check if we have a cached token
    if (fs.existsSync(TOKEN_CACHE_PATH)) {
      const tokenData = JSON.parse(fs.readFileSync(TOKEN_CACHE_PATH, 'utf8'));
      const expiryTime = tokenData.expiryTime;
      const currentTime = Date.now();
      
      // Add 5 minute buffer to ensure token doesn't expire during use
      if (expiryTime > currentTime + 300000) {
        return tokenData.accessToken;
      }
    }
    
    // Request a new token
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'client_credentials'
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')
        }
      }
    );
    
    const { access_token, expires_in } = response.data;
    
    // Calculate expiry time (current time + expires_in seconds)
    const expiryTime = Date.now() + (expires_in * 1000);
    
    // Cache the token and expiry time
    fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify({
      accessToken: access_token,
      expiryTime
    }));
    
    return access_token;
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    throw new Error('Failed to get Spotify access token');
  }
} 