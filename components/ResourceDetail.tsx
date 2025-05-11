import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { supabase } from '../lib/supabase';
import * as burnt from 'burnt';

interface ResourceDetailProps {
  resourceId: string;
  onClose: () => void;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  content_type: string;
  thumbnail_url: string;
  source: string;
  author: string;
  duration: string;
  media_url?: string;
  article_content?: string;
  created_at: string;
}

export default function ResourceDetail({ resourceId, onClose }: ResourceDetailProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

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
          ...data,
          media_url: data.resource_content[0]?.media_url,
          article_content: data.resource_content[0]?.article_content,
        });
      }
    } catch (error) {
      console.error('Error fetching resource details:', error);
      burnt.toast({
        title: 'Error',
        message: 'Failed to load resource details',
        preset: 'error',
      });
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
      
      burnt.toast({
        title: isSaved ? 'Removed from Saved' : 'Saved to Library',
        message: isSaved ? 'Resource removed from your saved items' : 'Resource added to your saved items',
        preset: 'done',
      });
    } catch (error) {
      console.error('Error toggling save status:', error);
      burnt.toast({
        title: 'Error',
        message: 'Failed to update saved status',
        preset: 'error',
      });
    }
  };

  const handleOpenInBrowser = async () => {
    if (!resource?.media_url) return;
    
    try {
      const supported = await Linking.canOpenURL(resource.media_url);
      
      if (supported) {
        await Linking.openURL(resource.media_url);
      } else {
        burnt.toast({
          title: 'Error',
          message: 'Cannot open this URL',
          preset: 'error',
        });
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      burnt.toast({
        title: 'Error',
        message: 'Failed to open in browser',
        preset: 'error',
      });
    }
  };

  const renderContent = () => {
    if (!resource) return null;

    switch (resource.content_type) {
      case 'video':
        return (
          <View style={styles.videoContainer}>
            <WebView
              source={{ uri: resource.media_url }}
              style={styles.videoPlayer}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF7F50" />
                </View>
              )}
            />
            <TouchableOpacity
              style={styles.browserButton}
              onPress={handleOpenInBrowser}
            >
              <Ionicons name="open-outline" size={20} color="#ffffff" />
              <Text style={styles.browserButtonText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'article':
        return (
          <ScrollView style={styles.articleContainer}>
            <Text style={[styles.articleContent, isDark && styles.darkText]}>
              {resource.article_content}
            </Text>
            {resource.media_url && (
              <TouchableOpacity
                style={styles.browserButton}
                onPress={handleOpenInBrowser}
              >
                <Ionicons name="open-outline" size={20} color="#ffffff" />
                <Text style={styles.browserButtonText}>Read Full Article</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        );
      
      case 'podcast':
        return (
          <View style={styles.podcastContainer}>
            <Image
              source={{ uri: resource.thumbnail_url }}
              style={styles.podcastImage}
            />
            <TouchableOpacity
              style={styles.browserButton}
              onPress={handleOpenInBrowser}
            >
              <Ionicons name="play-circle-outline" size={20} color="#ffffff" />
              <Text style={styles.browserButtonText}>Listen on Spotify</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7F50" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Loading resource...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!resource) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF7F50" />
          <Text style={[styles.errorText, isDark && styles.darkText]}>
            Resource not found
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleSaveResource} style={styles.saveButton}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isDark ? '#ffffff' : '#000000'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.title, isDark && styles.darkText]}>
          {resource.title}
        </Text>
        
        <View style={styles.metaContainer}>
          <Text style={[styles.metaText, isDark && styles.darkSubText]}>
            {resource.source} • {resource.duration}
          </Text>
          {resource.author && (
            <Text style={[styles.authorText, isDark && styles.darkSubText]}>
              By {resource.author}
            </Text>
          )}
        </View>

        <Text style={[styles.description, isDark && styles.darkText]}>
          {resource.description}
        </Text>

        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  metaContainer: {
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 14,
    color: '#666666',
  },
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 24,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 16,
  },
  videoPlayer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  articleContainer: {
    marginBottom: 16,
  },
  articleContent: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  podcastContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  podcastImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  browserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  browserButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
}); 