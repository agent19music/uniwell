import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  Animated,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRoutine } from '../contexts/RoutineContext';
import { supabase } from '../lib/supabase';
import { scheduleLocalNotification } from '../lib/NotificationHandler';
import ResourceDetail from '@/components/ResourceDetail';
import LibraryFilter from '../components/LibraryFilter';
import ResourceCard from '../components/ResourceCard';
import FeaturedCard from '../components/FeaturedCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const SPACING = 16;

// Resource types
interface Resource {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  type: 'article' | 'podcast' | 'video' | 'book';
  duration: string; // e.g., "5 min read", "25 min listen"
  source: string;
  url: string;
  tags: string[];
  relevantStreaks: string[];
  dateAdded: string;
  isFeatured: boolean;
  isNew: boolean;
  relevanceScore?: number;
}

interface Streak {
  id: string;
  title: string; // Changed from habitId to title
  currentCount: number;
}

// Categories for content
const CONTENT_CATEGORIES = [
  { id: 'featured', label: 'Featured For You' },
  { id: 'streak-related', label: 'Based On Your Streaks' },
  { id: 'trending', label: 'Trending Now' },
  { id: 'new', label: 'New Additions' },
  { id: 'saved', label: 'Saved Items' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { streaks } = useRoutine();
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [savedResources, setSavedResources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('featured');
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string, color: string}[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [150, 80],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 120],
    outputRange: [1, 0.8, 0.6],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    fetchUserData();
    fetchCategories();
    fetchResources();
  }, []);

  useEffect(() => {
    // Refetch resources when streaks change to update recommendations
    if (streaks.length > 0) {
      fetchResources();
    }
  }, [streaks]);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user preferences
        const { data: profileData } = await supabase
          .from('profiles')
          .select('interests, saved_resources')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setUserPreferences(profileData.interests || []);
          setSavedResources(profileData.saved_resources || []);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
        
      if (error) throw error;
      
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      // Fetch resources from Supabase
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          resource_content(*),
          resource_categories(category_id),
          resource_tags(tag_id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      if (data) {
        // Transform data to match Resource interface
        const transformedResources: Resource[] = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          imageUrl: item.thumbnail_url,
          type: item.content_type,
          duration: item.duration,
          source: item.source,
          url: item.resource_content[0]?.media_url || '',
          tags: item.resource_tags.map((tag: any) => tag.tag_id),
          relevantStreaks: [], // We'll populate this based on tags
          dateAdded: item.created_at,
          isFeatured: item.is_featured,
          isNew: new Date(item.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // New if less than 7 days old
        }));
        
        // Personalize resources
        const personalizedResources = personalizeResources(transformedResources);
        setResources(personalizedResources);
        
        // Schedule notification for new content
        if (personalizedResources.some(r => r.isNew)) {
          scheduleNewContentNotification();
        }
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const personalizeResources = (allResources: Resource[]) => {
    // Get streak titles for recommendation matching
    const userStreakTitles = streaks.map(streak => streak.title.toLowerCase());
    
    // Score each resource based on relevance to user
    const scoredResources = allResources.map(resource => {
      let score = 0;
      
      // Check if resource matches user streaks
      const streakRelevance = resource.tags.some(tagId => 
        userStreakTitles.some(userStreak => userStreak.includes(tagId))
      );
      if (streakRelevance) score += 3;
      
      // Check if resource matches user interests
      const interestRelevance = resource.tags.some(tagId => 
        userPreferences.includes(tagId)
      );
      if (interestRelevance) score += 2;
      
      // Boost score for new content
      if (resource.isNew) score += 1;
      
      // Boost featured content
      if (resource.isFeatured) score += 2;
      
      return { ...resource, relevanceScore: score };
    });
    
    // Sort by relevance score
    return scoredResources.sort((a, b) => b.relevanceScore! - a.relevanceScore!);
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchResources();
  }, []);

  const toggleSaveResource = useCallback(async (resourceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      let updatedSavedResources;
      if (savedResources.includes(resourceId)) {
        // Remove from saved
        updatedSavedResources = savedResources.filter(id => id !== resourceId);
      } else {
        // Add to saved
        updatedSavedResources = [...savedResources, resourceId];
      }
      
      // Update state
      setSavedResources(updatedSavedResources);
      
      // Update in database
      await supabase
        .from('profiles')
        .update({ saved_resources: updatedSavedResources })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving resource:', error);
    }
  }, [savedResources]);

  const handleResourcePress = useCallback((resourceId: string) => {
    setSelectedResourceId(resourceId);
    setModalVisible(true);
  }, []);
  
  const closeResourceDetail = useCallback(() => {
    setModalVisible(false);
    setSelectedResourceId(null);
  }, []);

  const scheduleNewContentNotification = async () => {
    // Schedule a notification for new content
    await scheduleLocalNotification(
      "New in Your Library",
      "Fresh content based on your interests has been added to your library!"
    );
  };

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  const renderResourceCard = useCallback(({ item }: { item: Resource }) => {
    return (
      <ResourceCard
        id={item.id}
        title={item.title}
        description={item.description}
        imageUrl={item.imageUrl}
        type={item.type}
        duration={item.duration}
        source={item.source}
        isNew={item.isNew}
        isSaved={savedResources.includes(item.id)}
        onPress={handleResourcePress}
        onSave={toggleSaveResource}
      />
    );
  }, [savedResources, handleResourcePress, toggleSaveResource]);

  const renderFeaturedItem = useCallback(({ item }: { item: Resource }) => {
    if (!item.isFeatured) return null;
    
    return (
      <FeaturedCard
        id={item.id}
        title={item.title}
        description={item.description}
        imageUrl={item.imageUrl}
        type={item.type}
        onPress={handleResourcePress}
      />
    );
  }, [handleResourcePress]);

  const getFilteredResources = useCallback(() => {
    switch (selectedCategory) {
      case 'featured':
        return resources.filter(r => r.isFeatured);
      case 'streak-related':
        const userStreakTitles = streaks.map(streak => streak.title.toLowerCase());
        return resources.filter(r => 
          r.relevantStreaks.some(streakTag => 
            userStreakTitles.some(userStreak => userStreak.includes(streakTag))
          )
        );
      case 'trending':
        // For better performance, we'll just sort by view count rather than doing a random sort
        return [...resources].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      case 'new':
        return resources.filter(r => r.isNew);
      case 'saved':
        return resources.filter(r => savedResources.includes(r.id));
      default:
        return resources;
    }
  }, [resources, selectedCategory, streaks, savedResources]);

  const EmptyListComponent = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="library-outline" size={64} color="#CCCCCC" />
      <Text style={[styles.emptyStateText, isDark && styles.darkText]}>
        No resources found
      </Text>
      <Text style={[styles.emptyStateSubText, isDark && styles.darkSubText]}>
        {selectedCategory === 'saved' 
          ? "You haven't saved any resources yet." 
          : "Try selecting a different category."}
      </Text>
    </View>
  ), [selectedCategory, isDark]);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <Animated.View 
        style={[
          styles.header, 
          { 
            height: headerHeight,
            opacity: headerOpacity,
            backgroundColor: isDark ? '#121212' : '#ffffff'
          }
        ]}
      >
        <BlurView 
          intensity={isDark ? 40 : 60} 
          tint={isDark ? 'dark' : 'light'} 
          style={styles.headerBlur}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isDark && styles.darkText]}>Library</Text>
            <TouchableOpacity onPress={() => router.push('/search')} style={styles.searchButton}>
              <Ionicons name="search" size={24} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          <LibraryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        </BlurView>
      </Animated.View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7F50" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Curating your personal library...
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          style={styles.resourceList}
          contentContainerStyle={styles.resourceListContent}
          data={getFilteredResources()}
          renderItem={renderResourceCard}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Featured Carousel */}
              {selectedCategory === 'featured' && resources.some(r => r.isFeatured) && (
                <View style={styles.featuredSection}>
                  <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                    Featured For You
                  </Text>
                  <FlatList
                    data={resources.filter(r => r.isFeatured)}
                    renderItem={renderFeaturedItem}
                    keyExtractor={item => `featured-${item.id}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    snapToInterval={width * 0.7 + 16}
                    contentContainerStyle={styles.featuredList}
                  />
                </View>
              )}
              
              {/* Streak-based Recommendations */}
              {streaks.length > 0 && selectedCategory === 'streak-related' && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                    Based on your {streaks[0]?.title} streak
                  </Text>
                  <Text style={[styles.sectionSubtitle, isDark && styles.darkSubText]}>
                    Resources to help you maintain your momentum
                  </Text>
                </View>
              )}
              
              {/* Section Title */}
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                {selectedCategory === 'saved' ? 'Your Saved Items' : 'Resources'}
              </Text>
            </>
          }
          ListEmptyComponent={EmptyListComponent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#FF7F50']}
              tintColor={isDark ? '#ffffff' : '#FF7F50'}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
        />
      )}

      {/* Resource Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeResourceDetail}
      >
        {selectedResourceId && (
          <ResourceDetail 
            resourceId={selectedResourceId} 
            onClose={closeResourceDetail}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBlur: {
    flex: 1,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  searchButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  resourceList: {
    flex: 1,
  },
  resourceListContent: {
    paddingTop: 180,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666666',
  },
  featuredSection: {
    marginBottom: 24,
  },
  featuredList: {
    paddingRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    color: '#666666',
  },
}); 