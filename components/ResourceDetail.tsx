import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, BookmarkSimple, ArrowSquareOut, PlayCircle, WarningCircle } from 'phosphor-react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../lib/supabase';
import * as  Burnt from 'burnt';
import { useTheme } from '../hooks/useTheme';
import { LoadingIndicator } from '@rn-nui/loading-indicator';

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
  const { colors, isDark } = useTheme();
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

      Burnt.toast({
        title: "Error",
        message: 'Failed to load resource details.',
        preset: 'error',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
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

      Burnt.toast({
        title: isSaved ? 'Removed from Saved' : 'Saved to Library',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
      });
    } catch (error) {
      console.error('Error toggling save status:', error);
      Burnt.toast({
        title: 'Error',
        message: 'Failed to update saved status',
        preset: 'error',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
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
        Burnt.toast({
          title: 'Error',
          message: 'Cannot open this URL',
          preset: 'error',
          duration: 2,
          from: 'top',
          shouldDismissByDrag: true
        });
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Burnt.toast({
        title: 'Error',
        message: 'Failed to open in browser',
        preset: 'error',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
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
              source={{ uri: resource.media_url, html: '' }}
              style={styles.videoPlayer}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <LoadingIndicator containerSize={40} containerColor={colors.primary} animating={true} color={colors.background} />
                </View>
              )}
            />
            <TouchableOpacity
              style={[styles.browserButton, { backgroundColor: colors.primary }]}
              onPress={handleOpenInBrowser}
            >
              <ArrowSquareOut size={20} color={colors.background} weight="regular" />
              <Text style={[styles.browserButtonText, { color: colors.background }]}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'article':
        return (
          <ScrollView style={styles.articleContainer}>
            <Text style={[styles.articleContent, { color: colors.textPrimary }]}>
              {resource.article_content}
            </Text>
            {resource.media_url && (
              <TouchableOpacity
                style={[styles.browserButton, { backgroundColor: colors.primary }]}
                onPress={handleOpenInBrowser}
              >
                <ArrowSquareOut size={20} color={colors.background} weight="regular" />
                <Text style={[styles.browserButtonText, { color: colors.background }]}>Read Full Article</Text>
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
              style={[styles.browserButton, { backgroundColor: colors.primary }]}
              onPress={handleOpenInBrowser}
            >
              <PlayCircle size={20} color={colors.background} weight="regular" />
              <Text style={[styles.browserButtonText, { color: colors.background }]}>Listen on Spotify</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingIndicator containerSize={50} containerColor={colors.primary} animating={true} color={colors.background} />
          <Text style={[styles.loadingText, { color: colors.textPrimary, marginTop: 16 }]}>
            Loading resource...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!resource) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <WarningCircle size={64} color={colors.error} weight="regular" />
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>
            Resource not found
          </Text>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={[styles.closeButtonText, { color: colors.background }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <X size={24} color={colors.textPrimary} weight="regular" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleSaveResource} style={styles.saveButton}>
          <BookmarkSimple
            size={24}
            color={colors.textPrimary}
            weight={isSaved ? "fill" : "regular"}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  backButton: {
    padding: 6,
  },
  saveButton: {
    padding: 6,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
    marginBottom: 12,
  },
  metaContainer: {
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
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
    fontFamily: 'Vercetti-Regular',
    lineHeight: 24,
  },
  podcastContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  podcastImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 16,
  },
  browserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  browserButtonText: {
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
  },
}); 