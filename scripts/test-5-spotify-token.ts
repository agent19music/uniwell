// Test 5: Test Spotify token manager
console.log('Test 5: Testing Spotify token manager');

try {
  const { getSpotifyToken } = require('../lib/spotifyTokenManager');
  console.log('✅ getSpotifyToken import successful');
  
  // Test token retrieval
  async function testSpotifyToken() {
    try {
      const token = await getSpotifyToken();
      console.log('✅ Spotify token retrieved successfully');
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Spotify token retrieval failed:', error.message);
      } else {
        console.error('❌ Spotify token retrieval failed:', error);
      }
    }
  }
  
  testSpotifyToken();
} catch (error) {
  if (error instanceof Error) {
    console.error('❌ getSpotifyToken import failed:', error.message);
  } else {
    console.error('❌ getSpotifyToken import failed:', error);
  }
} 