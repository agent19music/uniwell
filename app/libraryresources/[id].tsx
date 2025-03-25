import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  Animated,
  Share,
  useColorScheme,
  useWindowDimensions,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { VideoView, useVideoPlayer } from 'expo-video';
import RenderHtml, { defaultSystemFonts } from 'react-native-render-html';
import { supabase } from '../../lib/supabase';
import { useEvent } from 'expo';

interface ResourceTag {
  id: string;
  name: string;
}

interface ResourceCategory {
  id: string;
  name: string;
  color: string;
}

interface ResourceContent {
  id: string;
  resource_id: string;
  content_type: string;
  article_content?: string;
  media_url?: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  content_type: 'article' | 'podcast' | 'video' | 'book';
  duration: string;
  source: string;
  author: string;
  created_at: string;
  content: ResourceContent;
  categories: ResourceCategory[];
  tags: ResourceTag[];
}

const formatArticleContent = (content: string) => {
  if (!content) return '';
  // Remove the character count suffix pattern {+ <number>}
  return content.replace(/\{\+\s*\d+\}/g, '');
};

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [relatedResources, setRelatedResources] = useState<Resource[]>([]);
  const [webViewLoading, setWebViewLoading] = useState(true);
  
  const videoRef = useRef<VideoView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showRelatedFully, setShowRelatedFully] = useState(false);
  
  // Move video player hooks to component level
  const videoPlayer = useVideoPlayer(
    resource?.content?.media_url,
    player => {
      if (player) {
        player.loop = false;
        player.volume = 1.0;
        player.play();
      }
    }
  );

  const { isPlaying } = useEvent(videoPlayer, 'playingChange', { 
    isPlaying: videoPlayer?.playing || false 
  });
  
  // Use the useEvent hook to track playback status
  const { position, duration } = useEvent(videoPlayer, 'positionChange', { 
    position: videoPlayer?.position || 0,
    duration: videoPlayer?.duration || 0
  });
  
  // Update progress when position changes
  useEffect(() => {
    if (duration > 0) {
      const newProgress = (position / duration) * 100;
      setProgress(newProgress);
      
      // Save progress if completed
      if (newProgress > 90) {
        updateProgress(newProgress);
      }
    }
  }, [position, duration]);
  
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, 60],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [200, 300],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.2, 1, 0.8],
    extrapolate: 'clamp'
  });
  
  const headerStyle = {
    height: headerHeight,
    opacity: headerOpacity
  };
  
  const imageStyle = {
    transform: [{ scale: imageScale }]
  };
  
  const scrollHandler = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );
  
  useEffect(() => {
    fetchResource();
    checkIfSaved();
  }, [id]);
  
  const fetchResource = async () => {
    try {
      setLoading(true);
      
      // Fetch the resource with its related data
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          resource_content(*),
          resource_categories(
            category_id,
            categories:category_id(*)
          ),
          resource_tags(
            tag_id,
            tags:tag_id(*)
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        console.log("Resource data:", JSON.stringify(data, null, 2));
        
        // Transform the data to match our Resource interface
        const transformedResource: Resource = {
          id: data.id,
          title: data.title,
          description: data.description,
          thumbnail_url: data.thumbnail_url,
          content_type: data.content_type,
          duration: data.duration,
          source: data.source,
          author: data.author || data.source,
          created_at: data.created_at,
          content: data.resource_content[0] || {},
          categories: data.resource_categories.map((rc: any) => ({
            id: rc.category_id,
            name: rc.categories?.name || '',
            color: rc.categories?.color || '#FF7F50'
          })),
          tags: data.resource_tags.map((rt: any) => ({
            id: rt.tag_id,
            name: rt.tags?.name || ''
          }))
        };
        
        setResource(transformedResource);
        fetchRelatedResources(transformedResource.categories.map(c => c.id));
      }
    } catch (error) {
      console.error('Error fetching resource:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRelatedResources = async (categoryIds: string[]) => {
    try {
      if (!categoryIds.length) return;
      
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          resource_categories!inner(category_id)
        `)
        .in('resource_categories.category_id', categoryIds)
        .neq('id', id as string)
        .limit(5);
        
      if (error) throw error;
      
      if (data) {
        const transformedRelated = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          thumbnail_url: item.thumbnail_url,
          content_type: item.content_type,
          duration: item.duration,
          source: item.source,
          author: item.author,
          created_at: item.created_at,
          content: {},
          categories: [],
          tags: []
        }));
        
        setRelatedResources(transformedRelated);
      }
    } catch (error) {
      console.error('Error fetching related resources:', error);
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
          setIsSaved(data.saved_resources.includes(id));
        }
      }
    } catch (error) {
      console.error('Error checking if resource is saved:', error);
    }
  };
  
  const toggleSaveResource = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Prompt user to sign in
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('saved_resources')
        .eq('id', user.id)
        .single();
        
      let savedResources = data?.saved_resources || [];
      
      if (isSaved) {
        // Remove from saved
        savedResources = savedResources.filter((resourceId: string) => resourceId !== id);
      } else {
        // Add to saved
        savedResources.push(id as string);
      }
      
      // Update profile
      await supabase
        .from('profiles')
        .update({ saved_resources: savedResources })
        .eq('id', user.id);
        
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error toggling save resource:', error);
    }
  };
  
  const handleShare = async () => {
    if (!resource) return;
    
    try {
      await Share.share({
        message: `Check out this ${resource.content_type}: ${resource.title}\n\n${resource.description}`,
        url: resource.content.media_url
      });
    } catch (error) {
      console.error('Error sharing resource:', error);
    }
  };
  
  const updateProgress = async (newProgress: number) => {
    try {
      setProgress(newProgress);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update progress in database
        const { data } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('resource_id', id)
          .single();
          
        if (data) {
          // Update existing progress
          await supabase
            .from('user_progress')
            .update({ progress: newProgress, last_accessed: new Date().toISOString() })
            .eq('id', data.id);
        } else {
          // Create new progress entry
          await supabase
            .from('user_progress')
            .insert({
              user_id: user.id,
              resource_id: id,
              progress: newProgress,
              last_accessed: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };
  
  const renderContentByType = () => {
    if (!resource || !resource.content) return null;
    
    switch (resource.content_type) {
      case 'article':
        return (
          <View style={[styles.articleContainer, isDark && styles.darkArticleContainer]}>
            {resource.content.article_content ? (
              <RenderHtml
                contentWidth={width - 48}
                source={{ html: formatArticleContent(resource.content.article_content) }}
                systemFonts={[...defaultSystemFonts, 'SF-Regular']}
                baseStyle={{
                  color: isDark ? '#FFFFFF' : '#333333',
                  fontSize: 16,
                  lineHeight: 24,
                  fontFamily: 'SF-Regular',
                }}
                tagsStyles={{
                  body: {
                    color: isDark ? '#FFFFFF' : '#333333',
                    fontSize: 16,
                    lineHeight: 24,
                  },
                  p: {
                    marginBottom: 16,
                  },
                  a: {
                    color: '#FF7F50',
                    textDecorationLine: 'none',
                  },
                  img: {
                    borderRadius: 8,
                    marginVertical: 16,
                    width: '100%',
                    height: 'auto',
                  },
                  h1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    marginVertical: 16,
                    color: isDark ? '#FFFFFF' : '#333333',
                    fontFamily: 'SF-Regular',
                  },
                  h2: {
                    fontSize: 20,
                    fontWeight: 'bold',
                    marginVertical: 12,
                    color: isDark ? '#FFFFFF' : '#333333',
                    fontFamily: 'SF-Regular',
                  }
                }}
                renderersProps={{
                  img: {
                    enableExperimentalPercentWidth: true
                  }
                }}
              />
            ) : (
              <Text style={[styles.noContentText, isDark && styles.darkText]}>
                Article content not available
              </Text>
            )}
          </View>
        );
        
      case 'video':
        return (
          <View style={styles.videoContainer}>
            {resource.content.media_url ? (
              <>
                <VideoView
                  style={styles.videoPlayer}
                  player={videoPlayer}
                  videoStyle={styles.videoContent}
                  allowsFullscreen
                  allowsPictureInPicture
                  posterSource={{ uri: resource.thumbnail_url }}
                  usePoster={true}
                />
                
                <View style={styles.videoControls}>
                  <TouchableOpacity 
                    style={styles.playButton}
                    onPress={() => {
                      if (isPlaying) {
                        videoPlayer?.pause();
                      } else {
                        videoPlayer?.play();
                      }
                    }}
                  >
                    <Ionicons 
                      name={isPlaying ? "pause" : "play"} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={[styles.noVideoContainer, isDark && { backgroundColor: '#1E1E1E' }]}>
                <Ionicons name="videocam-off-outline" size={48} color="#CCCCCC" />
                <Text style={[styles.noContentText, isDark && styles.darkText]}>
                  Video not available
                </Text>
              </View>
            )}
          </View>
        );
        
      case 'podcast':
        return (
          <View style={styles.podcastContainer}>
            {resource.content.media_url ? (
              <>
                <WebView
                  source={{ uri: resource.content.media_url }}
                  style={styles.webView}
                  onLoadStart={() => setWebViewLoading(true)}
                  onLoadEnd={() => setWebViewLoading(false)}
                />
                {webViewLoading && (
                  <View style={styles.webViewLoading}>
                    <ActivityIndicator size="large" color="#FF7F50" />
                  </View>
                )}
              </>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={[styles.noPreviewText, isDark && styles.darkText]}>
                  Podcast not available
                </Text>
              </View>
            )}
          </View>
        );
        
      case 'book':
        return (
          <View style={[styles.bookContainer, isDark && styles.darkCard]}>
            <Text style={[styles.noPreviewText, isDark && styles.darkText]}>
              Book preview not available
            </Text>
            
            <TouchableOpacity style={styles.purchaseButton}>
              <Text style={styles.purchaseButtonText}>
                Purchase Book
              </Text>
            </TouchableOpacity>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
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
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF7F50" />
          <Text style={[styles.errorText, isDark && styles.darkText]}>
            Resource not found
          </Text>
          <TouchableOpacity 
            style={styles.backToLibraryButton}
            onPress={() => router.push('/library')}
          >
            <Text style={styles.backToLibraryText}>
              Back to Library
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      {/* Animated header */}
      <Animated.View style={[styles.animatedHeader, headerStyle, isDark && styles.darkHeader]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons 
            name="arrow-back-outline" 
            size={24} 
            color={isDark ? "#FFFFFF" : "#333333"} 
          />
        </TouchableOpacity>
        
        <Animated.Text 
          style={[
            styles.headerTitle, 
            { opacity: headerOpacity },
            isDark && styles.darkText
          ]}
          numberOfLines={1}
        >
          {resource?.title}
        </Animated.Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={toggleSaveResource}
          >
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isDark ? "#FFFFFF" : "#333333"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleShare}
          >
            <Ionicons 
              name="share-outline" 
              size={24} 
              color={isDark ? "#FFFFFF" : "#333333"} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7F50" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Loading resource...
          </Text>
        </View>
      ) : (
        <>
          <Animated.ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={scrollHandler}
          >
            {/* Hero section */}
            <View style={styles.heroSection}>
              <Animated.Image 
                source={{ uri: resource?.thumbnail_url }} 
                style={[styles.heroImage, imageStyle]}
                resizeMode="cover"
              />
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.heroGradient}
              >
                <View style={styles.heroContent}>
                  <View style={styles.categoryContainer}>
                    {resource?.categories.map(category => (
                      <View 
                        key={category.id}
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: category.color + '33' }
                        ]}
                      >
                        <Text 
                          style={[
                            styles.categoryText,
                            { color: category.color }
                          ]}
                        >
                          {category.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <Text style={[styles.heroTitle, isDark && styles.darkText]}>
                    {resource?.title}
                  </Text>
                  
                  <View style={styles.metaContainer}>
                    <Text style={[styles.metaText, isDark && styles.darkSubText]}>
                      By {resource?.author}
                    </Text>
                    
                    <View style={styles.typeContainer}>
                      <Ionicons 
                        name={
                          resource?.content_type === 'article' ? 'document-text' : 
                          resource?.content_type === 'podcast' ? 'headset' : 
                          resource?.content_type === 'video' ? 'videocam' : 'book'
                        } 
                        size={16} 
                        color="#FF7F50" 
                      />
                      <Text style={styles.typeText}>
                        {resource?.content_type}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.description, isDark && styles.darkSubText]}>
                    {resource?.description}
                  </Text>
                </View>
              </LinearGradient>
            </View>
            
            {progress > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBackground} />
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progress}%` }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, isDark && styles.darkSubText]}>
                  {progress >= 95 ? 'Completed' : `${Math.round(progress)}% complete`}
                </Text>
              </View>
            )}
            
            {/* Content based on type */}
            {renderContentByType()}
            
            {/* Tags */}
            {resource?.tags?.length > 0 && (
              <View style={[styles.tagsContainer, isDark && styles.darkTagsContainer]}>
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                  Tags
                </Text>
                <View style={styles.tagsList}>
                  {resource.tags.map(tag => (
                    <View 
                      key={tag.id}
                      style={[styles.tagBadge, isDark && styles.darkTagBadge]}
                    >
                      <Text style={[styles.tagText, isDark && styles.darkTagText]}>
                        {tag.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Related resources section header only */}
            {relatedResources.length > 0 && (
              <View style={styles.relatedHeaderSection}>
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                  Related Resources
                </Text>
                <Text style={[styles.relatedSubtext, isDark && styles.darkSubText]}>
                  Tap below to explore related content
                </Text>
              </View>
            )}
            
            {/* Source attribution */}
            <View style={[styles.sourceContainer, isDark && styles.darkCard]}>
              <Text style={[styles.sourceText, isDark && styles.darkSubText]}>
                Source: {resource?.source}
              </Text>
            </View>
            
            {/* Add padding at the bottom to account for the related resources panel */}
            {relatedResources.length > 0 && (
              <View style={{ height: showRelatedFully ? 220 : 80 }} />
            )}
          </Animated.ScrollView>
          
          {/* Adaptive Related Resources Panel - Outside of ScrollView */}
          {relatedResources.length > 0 && (
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.relatedListContainer, 
                isDark && styles.darkRelatedContainer,
                { height: showRelatedFully ? 200 : 60 }
              ]}
              onPress={() => setShowRelatedFully(!showRelatedFully)}
            >
              <View style={styles.relatedHeader}>
                <Text style={[styles.relatedHeaderText, isDark && styles.darkText]}>
                  Related Resources
                </Text>
                <Ionicons 
                  name={showRelatedFully ? "chevron-down" : "chevron-up"} 
                  size={20} 
                  color={isDark ? "#FFFFFF" : "#333333"} 
                />
              </View>
              
              {showRelatedFully && (
                <View style={styles.relatedListWrapper}>
                  {relatedResources.map((item) => (
                    <TouchableOpacity 
                      key={item.id}
                      style={[styles.relatedCard, isDark && styles.darkCard]}
                      onPress={() => {
                        router.push(`/libraryresources/${item.id}`);
                      }}
                    >
                      <Image 
                        source={{ uri: item.thumbnail_url }} 
                        style={styles.relatedImage}
                        resizeMode="cover"
                      />
                      <View style={styles.relatedContent}>
                        <View style={styles.relatedTypeContainer}>
                          <Ionicons 
                            name={
                              item.content_type === 'article' ? 'document-text' : 
                              item.content_type === 'podcast' ? 'headset' : 
                              item.content_type === 'video' ? 'videocam' : 'book'
                            } 
                            size={12} 
                            color="#FF7F50" 
                          />
                          <Text style={styles.relatedType}>
                            {item.content_type}
                          </Text>
                        </View>
                        <Text style={[styles.relatedTitle, isDark && styles.darkText]} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={[styles.relatedSource, isDark && styles.darkSubText]}>
                          {item.source}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(248, 248, 248, 0.9)',
    zIndex: 100,
  },
  darkHeader: {
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroSection: {
    height: 400,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  relatedDuration: {
    fontSize: 12,
    color: '#666666',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#666666',
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
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  progressSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#EEEEEE',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
  },
  articleContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  videoContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 240,
    backgroundColor: '#000000',
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoContent: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  videoControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 127, 80, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  podcastContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 240,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  bookContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noPreviewText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 24,
  },
  purchaseButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tagsContainer: {
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: '#EEEEEE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  darkTagBadge: {
    backgroundColor: '#2A2A2A',
  },
  tagText: {
    fontSize: 14,
    color: '#666666',
  },
  darkTagText: {
    color: '#AAAAAA',
  },
  relatedContainer: {
    padding: 16,
    marginTop: 16,
  },
  relatedList: {
    paddingRight: 16,
  },
  relatedCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  relatedImage: {
    width: '100%',
    height: 120,
  },
  relatedContent: {
    padding: 12,
  },
  relatedTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  relatedType: {
    fontSize: 12,
    color: '#FF7F50',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  relatedSource: {
    fontSize: 12,
    color: '#666666',
  },
  sourceContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sourceText: {
    fontSize: 14,
    color: '#666666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF7F50',
    marginBottom: 16,
  },
  backToLibraryButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backToLibraryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: '#AAAAAA',
  },
  darkCard: {
    backgroundColor: '#1E1E1E',
  },
  darkArticleContainer: {
    backgroundColor: '#1E1E1E',
  },
  darkBookContainer: {
    backgroundColor: '#1E1E1E',
  },
  darkTagsContainer: {
    backgroundColor: '#1E1E1E',
  },
  relatedListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(248, 248, 248, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  darkRelatedContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  relatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  relatedHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  noVideoContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  noContentText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  relatedHeaderSection: {
    padding: 16,
    marginTop: 16,
  },
  relatedSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  relatedListWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    overflow: 'scroll',
  },
});