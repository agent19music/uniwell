import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaretLeft, Books, Gear } from 'phosphor-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRoutine } from '../contexts/RoutineContext';
import { supabase } from '../lib/supabase';
import { scheduleLocalNotification } from '../lib/NotificationHandler';
import ResourceDetail from '@/components/ResourceDetail';
import LibraryFilter from '../components/LibraryFilter';
import ResourceCard from '../components/ResourceCard';
import FeaturedCard from '../components/FeaturedCard';
import InterestSelectionModal from '../components/InterestSelectionModal';
import { useTheme } from '../hooks/useTheme';
import { SafeText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingState } from '@/components/ui/LoadingState';
import { spacing, typography } from '@/constants/theme';

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

export default function LibraryScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { colors } = useTheme();
  const { streaks } = useRoutine();

  const [resources, setResources] = useState<Resource[]>([]);
  const [savedResources, setSavedResources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(tab || 'featured');
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [hasInterests, setHasInterests] = useState(false);

  useEffect(() => {
    fetchUserData();
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
    <EmptyState
      action={selectedCategory === 'saved' ? <Button label="Browse resources" onPress={() => setSelectedCategory('featured')} /> : undefined}
      description={selectedCategory === 'saved'
        ? 'Save useful resources to keep them together here.'
        : 'Try another category or update your interests.'}
      icon={<Books size={48} color={colors.textMuted} weight="regular" />}
      style={styles.emptyState}
      title={selectedCategory === 'saved' ? 'No saved resources yet' : 'No resources found'}
    />
  ), [selectedCategory, colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.canvas, borderBottomColor: colors.divider }]}>
        <View style={styles.headerContent}>
          <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
            <CaretLeft size={24} color={colors.text} weight="regular" />
          </IconButton>
          <SafeText variant="heading">Library</SafeText>
          <IconButton accessibilityLabel="Search library" onPress={() => router.push('/search')}>
            <Gear size={22} color={colors.text} weight="regular" />
          </IconButton>
        </View>
        <LibraryFilter selectedCategory={selectedCategory} onSelectCategory={handleCategorySelect} />
      </View>

      {loading && !refreshing ? (
        <LoadingState label="Curating your library…" style={styles.loadingContainer} />
      ) : (
        <FlatList
          style={styles.resourceList}
          contentContainerStyle={styles.resourceListContent}
          data={getFilteredResources()}
          renderItem={renderResourceCard}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <>
              {selectedCategory === 'featured' && (
                <View style={styles.featuredSection}>
                  <SafeText variant="heading">Featured for you</SafeText>
                  <SafeText variant="body" color={colors.textSecondary}>Personalized recommendations based on your interests.</SafeText>
                  {!hasInterests ? (
                    <EmptyState
                      action={<Button label="Select interests" onPress={() => setShowInterestModal(true)} />}
                      description="Choose topics to receive more relevant recommendations."
                      icon={<Books size={48} color={colors.textMuted} weight="regular" />}
                      style={styles.emptyState}
                      title="Personalize your library"
                    />
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
              <SafeText variant="heading" style={styles.resourcesHeading}>
                {selectedCategory === 'saved' ? 'Saved items' : 'Resources'}
              </SafeText>
            </>
          }
          ListEmptyComponent={EmptyListComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent as string}
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
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.control,
    paddingTop: spacing.micro,
  },
  loadingContainer: {
    flex: 1,
  },
  resourceList: {
    flex: 1,
  },
  resourceListContent: {
    gap: spacing.control,
    padding: spacing.control,
    paddingBottom: spacing.page,
  },
  featuredSection: {
    gap: spacing.micro,
  },
  featuredList: {
    marginTop: spacing.micro,
  },
  featuredListContent: {
    gap: spacing.micro,
  },
  emptyState: {
    paddingVertical: spacing.section,
  },
  resourcesHeading: {
    marginTop: spacing.micro,
  },
}); 