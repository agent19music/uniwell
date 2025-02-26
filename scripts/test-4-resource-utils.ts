// Test 4: Test resource utils imports
console.log('Test 4: Testing resource utils');

// Import individual functions to see which one fails
try {
  const { fetchYouTubeVideos } = require('../lib/resourceUtils');
  console.log('✅ fetchYouTubeVideos import successful');
} catch (error) {
  if (error instanceof Error) {
    console.error('❌ fetchYouTubeVideos import failed:', error.message);
  } else {
    console.error('❌ fetchYouTubeVideos import failed:', error);
  }
}

try {
  const { fetchSpotifyPodcasts } = require('../lib/resourceUtils');
  console.log('✅ fetchSpotifyPodcasts import successful');
} catch (error) {
  if (error instanceof Error) {
    console.error('❌ fetchSpotifyPodcasts import failed:', error.message);
  } else {
    console.error('❌ fetchSpotifyPodcasts import failed:', error);
  }
}

try {
  const { fetchNewsArticles } = require('../lib/resourceUtils');
  console.log('✅ fetchNewsArticles import successful');
} catch (error) {
  if (error instanceof Error) {
    console.error('❌ fetchNewsArticles import failed:', error.message);
  } else {
    console.error('❌ fetchNewsArticles import failed:', error);
  }
}
    
try {
  const { addResourceToDatabase } = require('../lib/resourceUtils');
  console.log('✅ addResourceToDatabase import successful');
} catch (error) {
  if (error instanceof Error) {
    console.error('❌ addResourceToDatabase import failed:', error.message);
  } else {
    console.error('❌ addResourceToDatabase import failed:', error);
  }
} 