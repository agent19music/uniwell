import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  useColorScheme,
  ActivityIndicator,
  Platform,
  SafeAreaView
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { supabase } from '@/lib/supabase';
import { StatusBar } from 'expo-status-bar';

interface ResourceDetailProps {
  resourceId: string;
  onClose: () => void;
}

export default function ResourceDetail({ resourceId, onClose }: ResourceDetailProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const webViewRef = useRef<WebView>(null);
  
  useEffect(() => {
    fetchResourceDetails();
    checkIfSaved();
  }, [resourceId]);
  
  const fetchResourceDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          resource_content(*)
        `)
        .eq('id', resourceId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setResource({
          id: data.id,
          title: data.title,
          description: data.description,
          thumbnail_url: data.thumbnail_url,
          type: data.content_type,
          duration: data.duration,
          source: data.source,
          content: data.resource_content[0] || {}
        });
      }
    } catch (err) {
      console.error('Error fetching resource details:', err);
      setError('Failed to load resource details');
    } finally {
      setLoading(false);
    }
  };
  
  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('saved_resources')
          .eq('id', user.id)
          .single();
          
        if (data && data.saved_resources) {
          setIsSaved(data.saved_resources.includes(resourceId));
        }
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };
  
  const toggleSaveResource = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('saved_resources')
        .eq('id', user.id)
        .single();
        
      let savedResources = data?.saved_resources || [];
      
      if (isSaved) {
        savedResources = savedResources.filter((id: string) => id !== resourceId);
      } else {
        savedResources.push(resourceId);
      }
      
      await supabase
        .from('profiles')
        .update({ saved_resources: savedResources })
        .eq('id', user.id);
        
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error toggling save status:', error);
    }
  };
  
  const handleOpenSpotify = async () => {
    if (!resource?.content?.media_url) return;
    
    const spotifyUrl = resource.content.media_url;
    const spotifyAppUrl = spotifyUrl.replace('https://open.spotify.com', 'spotify:');
    
    try {
      const canOpenSpotify = await Linking.canOpenURL(spotifyAppUrl);
      
      if (canOpenSpotify) {
        await Linking.openURL(spotifyAppUrl);
      } else {
        await Linking.openURL(spotifyUrl);
      }
    } catch (error) {
      console.error('Error opening Spotify:', error);
      await Linking.openURL(spotifyUrl);
    }
  };
  
  const renderYouTubeEmbed = () => {
    if (!resource?.content?.media_url) return null;
    
    // Extract video ID from YouTube URL
    const getYoutubeVideoId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };
    
    const videoId = getYoutubeVideoId(resource.content.media_url);
    
    if (!videoId) return null;
    
    const youtubeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            body, html {
              margin: 0;
              padding: 0;
              background-color: ${isDark ? '#000' : '#fff'};
              overflow: hidden;
              height: 100%;
            }
            .video-container {
              position: relative;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <div class="video-container">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&showinfo=0&autoplay=0" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
        </body>
      </html>
    `;
    
    return (
      <View style={styles.videoContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: youtubeHtml }}
          style={styles.webView}
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onShouldStartLoadWithRequest={() => true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF7F50" />
            </View>
          )}
        />
        {!isFullscreen && (
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={() => setIsFullscreen(true)}
          >
            <Ionicons name="expand" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  const cleanArticleContent = (content: string) => {
    if (!content) return '';
    // Remove the "chars" pattern that appears in article content
    return content.replace(/\[\+\d+ chars\]/g, '').replace(/\{\+\s*\d+\}/g, '');
  };
  
  const renderArticleContent = () => {
    if (!resource?.content?.article_content) return null;
    
    const cleanedContent = cleanArticleContent(resource.content.article_content);
    
    return (
      <View style={styles.articleContainer}>
        <ScrollView style={styles.articleScrollView}>
          <Text style={[styles.articleText, isDark && styles.darkText]}>
            {cleanedContent}
          </Text>
          
          {resource.content.media_url && (
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={() => Linking.openURL(resource.content.media_url)}
            >
              <Text style={styles.readMoreButtonText}>Read Full Article</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };
  
  const renderPodcastInfo = () => {
    if (!resource?.content?.media_url) return null;
    
    return (
      <View style={styles.podcastContainer}>
        <Image
          source={{ uri: resource.thumbnail_url }}
          style={styles.podcastImage}
          resizeMode="cover"
        />
        
        <View style={styles.podcastInfo}>
          <Text style={[styles.podcastInfoText, isDark && styles.darkText]}>
            Listen to this podcast on Spotify
          </Text>
          
          <TouchableOpacity
            style={styles.spotifyButton}
            onPress={handleOpenSpotify}
          >
            <Ionicons name="musical-notes" size={20} color="#FFFFFF" />
            <Text style={styles.spotifyButtonText}>Open in Spotify</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#FF7F50" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error || !resource) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isDark && styles.darkText]}>
            {error || 'Resource not found'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchResourceDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (isFullscreen && resource.type === 'video') {
    return (
      <View style={styles.fullscreenContainer}>
        <StatusBar style="light" />
        {renderYouTubeEmbed()}
        <TouchableOpacity
          style={styles.exitFullscreenButton}
          onPress={() => setIsFullscreen(false)}
        >
          <Ionicons name="contract" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, isDark && styles.darkText]} numberOfLines={1}>
          {resource.source}
        </Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={toggleSaveResource}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isSaved ? "#FF7F50" : isDark ? '#FFFFFF' : '#000000'} 
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, isDark && styles.darkText]}>
          {resource.title}
        </Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.typeContainer}>
            <Ionicons 
              name={
                resource.type === 'article' ? 'document-text' : 
                resource.type === 'podcast' ? 'headset' : 
                resource.type === 'video' ? 'videocam' : 'book'
              } 
              size={16} 
              color="#FF7F50" 
            />
            <Text style={styles.typeText}>{resource.type}</Text>
          </View>
          
          <Text style={[styles.duration, isDark && styles.darkSubText]}>
            {resource.duration}
          </Text>
        </View>
        
        <Text style={[styles.description, isDark && styles.darkSubText]}>
          {resource.description}
        </Text>
        
        {resource.type === 'video' && renderYouTubeEmbed()}
        {resource.type === 'article' && renderArticleContent()}
        {resource.type === 'podcast' && renderPodcastInfo()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  darkHeader: {
    backgroundColor: 'rgba(18,18,18,0.8)',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
    color: '#FF7F50',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  duration: {
    fontSize: 14,
    color: '#666666',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    color: '#333333',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: '#AAAAAA',
  },
  videoContainer: {
    height: 230,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  webView: {
    backgroundColor: 'transparent',
  },
  fullscreenButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  articleContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  articleScrollView: {
    maxHeight: 500,
  },
  articleText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  readMoreButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  readMoreButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  podcastContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  podcastImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  podcastInfo: {
    alignItems: 'center',
  },
  podcastInfoText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  spotifyButton: {
    backgroundColor: '#1DB954', // Spotify green
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '80%',
  },
  spotifyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    color: '#333333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#333333',
  },
  retryButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  fullscreenContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  exitFullscreenButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 100,
  },
}); 