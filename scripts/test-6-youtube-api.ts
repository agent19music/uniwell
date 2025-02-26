// Test 6: Test YouTube API
console.log('Test 6: Testing YouTube API');
require('dotenv').config();

try {
  const axios = require('axios');
  console.log('✅ axios import successful');
  
  // Test YouTube API
  async function testYouTubeAPI() {
    try {
      const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
      console.log('YouTube API Key available:', !!YOUTUBE_API_KEY);
      
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          maxResults: 1,
          q: 'test',
          type: 'video',
          key: YOUTUBE_API_KEY
        }
      });
      
      console.log('✅ YouTube API request successful');
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ YouTube API request failed:', error.message);
      } else {
        console.error('❌ YouTube API request failed:', error);
      }
    }
  }
  
  testYouTubeAPI();
} catch (error) {
  console.error('❌ axios import failed:', error.message);
} 