import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, BookmarkSimple, ArrowSquareOut, PlayCircle } from 'phosphor-react-native';
import { WebView } from 'react-native-webview';
import { Image as ExpoImage } from 'expo-image';
import { supabase } from '../lib/supabase';
import * as  Burnt from 'burnt';
import { useTheme } from '../hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingState } from '@/components/ui/LoadingState';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { SafeText } from '@/components/ThemedText';
import { spacing } from '@/constants/theme';

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
  const { colors } = useTheme();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchResourceDetails();
    checkIfSaved();
  }, [resourceId]);

  const fetchResourceDetails = async () => {
    try {
      setLoading(true);
      setLoadError(null);
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
      setLoadError('Check your connection and try again.');

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
            <MediaFrame
              accessibilityLabel={`${resource.title} video`}
              error={mediaError}
              loading={mediaLoading}
              style={styles.videoFrame}
            >
              <WebView
                source={{ uri: resource.media_url, html: '' }}
                style={styles.videoPlayer}
                allowsFullscreenVideo
                javaScriptEnabled
                domStorageEnabled
                onError={() => setMediaError('This video could not be loaded.')}
                onLoadEnd={() => setMediaLoading(false)}
                onLoadStart={() => {
                  setMediaError(null);
                  setMediaLoading(true);
                }}
              />
            </MediaFrame>
            <Button
              label="Open in browser"
              leading={<ArrowSquareOut size={20} color={colors.textOnAccent} weight="regular" />}
              onPress={handleOpenInBrowser}
            />
          </View>
        );
      
      case 'article':
        return (
          <ScrollView style={styles.articleContainer}>
            <SafeText variant="body" style={styles.articleContent}>
              {resource.article_content}
            </SafeText>
            {resource.media_url && (
              <Button
                label="Read full article"
                leading={<ArrowSquareOut size={20} color={colors.textOnAccent} weight="regular" />}
                onPress={handleOpenInBrowser}
              />
            )}
          </ScrollView>
        );
      
      case 'podcast':
        return (
          <View style={styles.podcastContainer}>
            <MediaFrame
              accessibilityLabel={`${resource.title} podcast cover art`}
              error={mediaError}
              loading={mediaLoading}
              style={styles.podcastFrame}
            >
            <ExpoImage
              source={{ uri: resource.thumbnail_url }}
              accessibilityLabel={`${resource.title} podcast cover art`}
              contentFit="cover"
              onError={() => setMediaError('This podcast artwork could not be loaded.')}
              onLoadEnd={() => setMediaLoading(false)}
              onLoadStart={() => {
                setMediaError(null);
                setMediaLoading(true);
              }}
              style={styles.podcastImage}
            />
            </MediaFrame>
            <Button
              label="Listen on Spotify"
              leading={<PlayCircle size={20} color={colors.textOnAccent} weight="regular" />}
              onPress={handleOpenInBrowser}
            />
          </View>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState label="Loading resource…" />
      </SafeAreaView>
    );
  }

  if (!resource) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          action={<Button label={loadError ? 'Try again' : 'Go back'} onPress={loadError ? fetchResourceDetails : onClose} />}
          description={loadError ?? 'The resource may have been removed or is no longer available.'}
          title={loadError ? 'Unable to load resource' : 'Resource not found'}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <IconButton accessibilityLabel="Close resource" onPress={onClose}>
          <X size={24} color={colors.textPrimary} weight="regular" />
        </IconButton>
        <IconButton accessibilityLabel={isSaved ? 'Remove from saved resources' : 'Save resource'} onPress={toggleSaveResource}>
          <BookmarkSimple
            size={24}
            color={colors.textPrimary}
            weight={isSaved ? "fill" : "regular"}
          />
        </IconButton>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SafeText variant="title" style={styles.title}>
          {resource.title}
        </SafeText>
        
        <View style={styles.metaContainer}>
          <SafeText variant="caption" color={colors.textSecondary}>
            {resource.source} • {resource.duration}
          </SafeText>
          {resource.author && (
            <SafeText variant="caption" color={colors.textSecondary}>
              By {resource.author}
            </SafeText>
          )}
        </View>

        <SafeText variant="body" style={styles.description}>
          {resource.description}
        </SafeText>

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
    padding: spacing.control,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 6,
  },
  saveButton: {
    padding: 6,
  },
  content: {
    gap: spacing.control,
    padding: spacing.control,
    paddingBottom: spacing.page,
  },
  title: {
    marginBottom: 0,
  },
  metaContainer: {
    gap: spacing.optical,
  },
  description: {
    marginBottom: 0,
  },
  videoContainer: {
    width: '100%',
    marginBottom: 16,
  },
  videoFrame: {
    aspectRatio: 16 / 9,
    width: '100%',
  },
  videoPlayer: {
    flex: 1,
  },
  articleContainer: {
    marginBottom: 16,
  },
  articleContent: {
    lineHeight: 24,
  },
  podcastContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  podcastFrame: {
    aspectRatio: 1,
    marginBottom: 16,
    width: '100%',
  },
  podcastImage: {
    flex: 1,
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