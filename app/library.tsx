import React, { useState, useEffect, useRef } from 'react';
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
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRoutine } from '../contexts/RoutineContext';
import { supabase } from '../lib/supabase';
import { scheduleLocalNotification } from '../lib/NotificationHandler';

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
    const userStreakTitles = streaks.map(streak => streak.habitId.toLowerCase());
    
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
    return scoredResources.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResources();
  };

  const toggleSaveResource = async (resourceId: string) => {
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
  };

  const handleResourcePress = (resourceId: string) => {
    router.push(`/libraryresources/${resourceId}`);
  };
  

  const scheduleNewContentNotification = async () => {
    // Schedule a notification for new content
    await scheduleLocalNotification({
      title: "New in Your Library",
      body: "Fresh content based on your interests has been added to your library!",
      data: { screen: 'library' },
      trigger: { seconds: 60 * 60 * 24 }, // 24 hours from now
      identifier: 'new-library-content'
    });
  };

  const renderResourceCard = ({ item }: { item: Resource }) => {
    const isSaved = savedResources.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.resourceCard, isDark && styles.darkCard]} 
        onPress={() => handleResourcePress(item.id)}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.resourceImage} 
          resizeMode="cover"
        />
        
        <View style={styles.resourceContent}>
          <View style={styles.resourceHeader}>
            <View style={styles.resourceTypeContainer}>
              <Ionicons 
                name={
                  item.type === 'article' ? 'document-text' : 
                  item.type === 'podcast' ? 'headset' : 
                  item.type === 'video' ? 'videocam' : 'book'
                } 
                size={14} 
                color="#FF7F50" 
              />
              <Text style={styles.resourceType}>{item.type}</Text>
            </View>
            
            {item.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.resourceTitle, isDark && styles.darkText]} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={[styles.resourceDescription, isDark && styles.darkSubText]} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.resourceFooter}>
            <Text style={[styles.resourceDuration, isDark && styles.darkSubText]}>
              {item.duration}
            </Text>
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => toggleSaveResource(item.id)}
            >
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={isSaved ? "#FF7F50" : isDark ? "#ffffff" : "#333333"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFeaturedItem = ({ item }: { item: Resource }) => {
    if (!item.isFeatured) return null;
    
    return (
      <TouchableOpacity 
        style={styles.featuredCard}
        onPress={() => handleResourcePress(item.id)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.featuredGradient}
        >
          <View style={styles.featuredContent}>
            <View style={styles.featuredTypeContainer}>
              <Ionicons 
                name={
                  item.type === 'article' ? 'document-text' : 
                  item.type === 'podcast' ? 'headset' : 
                  item.type === 'video' ? 'videocam' : 'book'
                } 
                size={14} 
                color="#ffffff" 
              />
              <Text style={styles.featuredType}>{item.type}</Text>
            </View>
            
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {item.title}
            </Text>
            
            <Text style={styles.featuredDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderCategoryTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryTabsContainer}
    >
      {CONTENT_CATEGORIES.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryTab,
            selectedCategory === category.id && styles.selectedCategoryTab,
            isDark && styles.darkCategoryTab,
            selectedCategory === category.id && isDark && styles.darkSelectedCategoryTab
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Text 
            style={[
              styles.categoryTabText,
              selectedCategory === category.id && styles.selectedCategoryTabText,
              isDark && styles.darkText
            ]}
          >
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const getFilteredResources = () => {
    switch (selectedCategory) {
      case 'featured':
        return resources.filter(r => r.isFeatured);
      case 'streak-related':
        const userStreakTitles = streaks.map(streak => streak.habitId.toLowerCase());
        return resources.filter(r => 
          r.relevantStreaks.some(streakTag => 
            userStreakTitles.some(userStreak => userStreak.includes(streakTag))
          )
        );
      case 'trending':
        // In a real app, this would be based on popularity metrics
        return resources.sort(() => 0.5 - Math.random());
      case 'new':
        return resources.filter(r => r.isNew);
      case 'saved':
        return resources.filter(r => savedResources.includes(r.id));
      default:
        return resources;
    }
  };

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
          
          {renderCategoryTabs()}
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
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#FF7F50']}
              tintColor={isDark ? '#ffffff' : '#FF7F50'}
            />
          }
        >
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
                snapToInterval={CARD_WIDTH + SPACING}
                decelerationRate="fast"
                contentContainerStyle={styles.featuredList}
              />
            </View>
          )}
          
          {/* Streak-based Recommendations */}
          {streaks.length > 0 && selectedCategory === 'streak-related' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                Based on your {streaks[0]?.habitId} streak
              </Text>
              <Text style={[styles.sectionSubtitle, isDark && styles.darkSubText]}>
                Resources to help you maintain your momentum
              </Text>
              
              <FlatList
                data={getFilteredResources()}
                renderItem={renderResourceCard}
                keyExtractor={item => `streak-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.resourcesList}
              />
            </View>
          )}
          
          {/* Main Content List */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
              {selectedCategory === 'saved' ? 'Your Saved Items' : 'All Resources'}
            </Text>
            
            {!loading && (
              <FlatList
                data={getFilteredResources()}
                renderItem={renderResourceCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.resourceList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={isDark ? "#ffffff" : "#FF7F50"}
                  />
                }
                ListEmptyComponent={
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
                }
              />
            )}
          </View>
        </Animated.ScrollView>
      )}
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
  categoryTabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCategoryTab: {
    backgroundColor: '#FF7F50',
  },
  darkCategoryTab: {
    backgroundColor: '#333333',
  },
  darkSelectedCategoryTab: {
    backgroundColor: '#FF7F50',
  },
  categoryTabText: {
    fontWeight: '500',
  },
  selectedCategoryTabText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 180,
    paddingBottom: 40,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    color: '#666666',
  },
  resourcesList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  resourceList: {
    paddingHorizontal: 16,
    paddingTop: 160,
    paddingBottom: 24,
  },
  resourceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  resourceImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  resourceContent: {
    padding: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceType: {
    fontSize: 12,
    marginLeft: 4,
    color: '#FF7F50',
    textTransform: 'uppercase',
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceDuration: {
    fontSize: 12,
    color: '#888888',
  },
  saveButton: {
    padding: 4,
  },
  featuredSection: {
    marginBottom: 24,
  },
  featuredList: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 8,
  },
  featuredCard: {
    width: CARD_WIDTH,
    height: 220,
    marginRight: SPACING,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  featuredContent: {
    padding: 16,
  },
  featuredTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredType: {
    fontSize: 12,
    marginLeft: 4,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  featuredDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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