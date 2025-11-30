import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  FlatList,
  Dimensions,
  RefreshControl,
  Modal,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaretLeft, Books, Sparkle, Gear } from 'phosphor-react-native';
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
import InterestSelectionModal from '../components/InterestSelectionModal';
import { useTheme } from '../hooks/useTheme';
import { LoadingIndicator } from '@rn-nui/loading-indicator';

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
  { id: 'academic', label: 'Academic Success' },
  { id: 'career', label: 'Career Development' },
  { id: 'wellness', label: 'Student Wellness' },
];

// Expanded interest categories for university students

export default function LibraryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [hasInterests, setHasInterests] = useState(false);
  const [firstVisit, setFirstVisit] = useState(true);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [130, 75],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.9, 0.8],
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
          .select('interests, saved_resources, onboarding_completed')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setUserPreferences(profileData.interests || []);
          setSavedResources(profileData.saved_resources || []);
          setHasInterests(profileData.interests?.length > 0);
          setFirstVisit(!profileData.onboarding_completed);
          
          // Show interest modal if it's first visit
          if (!profileData.onboarding_completed) {
            setShowInterestModal(true);
          }
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
        const transformedResources: Resource[] = data.map((item: any) => ({
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

  const handleInterestsUpdated = useCallback(async (newInterests: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile with new interests
      await supabase
        .from('profiles')
        .update({ 
          interests: newInterests,
          onboarding_completed: true 
        })
        .eq('id', user.id);

      // Update user interests table
      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id);

      const interestRecords = newInterests.map(interest => ({
        user_id: user.id,
        interest: interest
      }));

      await supabase
        .from('user_interests')
        .insert(interestRecords);

      // Generate new recommendations
      await supabase.rpc('generate_user_recommendations', {
        user_uuid: user.id
      });

      setUserPreferences(newInterests);
      setHasInterests(newInterests.length > 0);
      setFirstVisit(false);
      fetchResources(); // Refetch resources with new interests
    } catch (error) {
      console.error('Error updating interests:', error);
    }
  }, []);

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
      
      // Boost content that matches multiple interests
      const matchingInterests = resource.tags.filter(tagId => 
        userPreferences.includes(tagId)
      ).length;
      score += matchingInterests * 0.5;
      
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
    if (Platform.OS !== 'web') {
      // Schedule a notification for new content
      await scheduleLocalNotification(
        "New in Your Library",
        "Fresh content based on your interests has been added to your library!"
      );
    }
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
        key={item.id}
        id={item.id}
        title={item.title}
        description={item.description}
        imageUrl={item.imageUrl}
        type={item.type}
        onPress={() => handleResourcePress(item.id)}
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
    <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
      <View style={[styles.emptyStateIconContainer, { backgroundColor: colors.input.background }]}>
        <Books 
          size={64} 
          color={colors.textTertiary} 
          weight="regular"
        />
      </View>
      <Text style={[styles.emptyStateText, { color: colors.textPrimary }]}>
        {selectedCategory === 'saved' 
          ? "Your Saved Collection is Empty" 
          : "No Resources Found"}
      </Text>
      <Text style={[styles.emptyStateSubText, { color: colors.textSecondary }]}>
        {selectedCategory === 'saved' 
          ? "Save interesting resources to build your personal collection" 
          : "Try selecting a different category or update your interests"}
      </Text>
      {selectedCategory === 'saved' && (
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }, styles.emptyStateButton]}
          onPress={() => setSelectedCategory('featured')}
        >
          <Text style={[styles.primaryButtonText, { color: colors.background }]}>Browse Resources</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [selectedCategory, colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <BlurView 
          intensity={isDark ? 40 : 60} 
          tint={isDark ? 'dark' : 'light'} 
          style={styles.headerBlur}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CaretLeft 
                size={28} 
                color={colors.textPrimary} 
                weight="regular"
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Library</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                onPress={() => setShowInterestModal(true)} 
                style={styles.interestButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Sparkle 
                  size={24} 
                  color={colors.textPrimary} 
                  weight="regular"
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push('/search')} 
                style={styles.searchButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Gear 
                  size={24} 
                  color={colors.textPrimary} 
                  weight="regular"
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <LibraryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        </BlurView>
      </Animated.View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator containerSize={50} containerColor={colors.primary} animating={true} color={colors.background} />
          <Text style={[styles.loadingText, { color: colors.textPrimary, marginTop: 16 }]}>
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
          ListHeaderComponent={
            <>
              {selectedCategory === 'featured' && (
                <View style={styles.featuredSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Featured For You
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Personalized recommendations based on your interests
                  </Text>
                  {!hasInterests ? (
                    <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                      <Books size={64} color={colors.textTertiary} weight="regular" />
                      <Text style={[styles.emptyStateText, { color: colors.textPrimary }]}>
                        Personalize Your Library
                      </Text>
                      <Text style={[styles.emptyStateSubText, { color: colors.textSecondary }]}>
                        Select your interests to get personalized recommendations
                      </Text>
                      <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                        onPress={() => setShowInterestModal(true)}
                      >
                        <Text style={[styles.primaryButtonText, { color: colors.background }]}>Select Interests</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.featuredList}
                      contentContainerStyle={styles.featuredListContent}
                    >
                      {resources
                        .filter(r => r.isFeatured)
                        .map(resource => (
                          <FeaturedCard
                            key={resource.id}
                            id={resource.id}
                            title={resource.title}
                            description={resource.description}
                            imageUrl={resource.imageUrl}
                            type={resource.type}
                            onPress={() => handleResourcePress(resource.id)}
                          />
                        ))}
                    </ScrollView>
                  )}
                </View>
              )}
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
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
              colors={[colors.primary]}
              tintColor={colors.primary}
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

      {/* Interest Selection Modal */}
      <InterestSelectionModal
        visible={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        onInterestsUpdated={handleInterestsUpdated}
        initialInterests={userPreferences}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingTop: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
  },
  searchButton: {
    padding: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interestButton: {
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
    textAlign: 'center',
    fontWeight: '500',
  },
  resourceList: {
    flex: 1,
  },
  resourceListContent: {
    paddingTop: 145,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
    marginBottom: 16,
    fontWeight: '400',
    lineHeight: 21,
  },
  featuredSection: {
    marginBottom: 28,
  },
  featuredList: {
    paddingRight: 4,
  },
  featuredListContent: {
    paddingLeft: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderRadius: 20,
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  emptyStateIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateSubText: {
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
  },
  emptyStateButton: {
    marginTop: 20,
    minWidth: 180,
  },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
  },
}); 