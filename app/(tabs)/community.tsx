import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Image, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AddPostModal from '@/modals/AddPostModal';
import { useCommunity } from '@/contexts/CommunityContext';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';
import { Post } from '@/types/community';
import { log } from 'console';


const CATEGORIES = [
  { id: 'trending', label: 'Trending', active: true },
  { id: 'relationship', label: 'Relationship', active: false },
  { id: 'selfcare', label: 'Self Care', active: false },
];

const POSTS = [
  {
    id: 1,
    user: {
      name: 'Coal Dingo',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
    },
    timestamp: 'just now',
    content: 'Is there a therapy which can cure crossdressing & bdsm compulsion?',
    likes: 2,
    comments: 12,
  },
  {
    id: 2,
    user: {
      name: 'Pigeon Car',
      image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop',
    },
    timestamp: '5 hrs ago',
    content: 'Looking for advice on managing anxiety during exams. Any tips?',
    likes: 8,
    comments: 24,
  },
];

export default function CommunityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const { getTrendingPosts } = useCommunity();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

console.log('Rendering CommunityScreen with posts:', posts);

  const fetchPosts = async () => {
    try {
      const posts = await getTrendingPosts();
      setPosts(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  function handlePostPress(){
    router.push('/PostScreen')
  }

  // Update the header write button
  function HeaderRight() {
    return (
      <TouchableOpacity 
        style={styles.writeButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="create-outline" size={24} color={isDark ? '#ffffff' : '#000000'} />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>Wellness Hub</Text>
        <HeaderRight />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              isOwner={userId === item.user_id}
            />
          )}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchPosts} />
          }
        />
      )}

      <AddPostModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          fetchPosts();
        }}
      />
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  writeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categories: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoriesContent: {
    gap: 12,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  darkCategoryButton: {
    backgroundColor: '#1e1e1e',
  },
  activeCategoryButton: {
    backgroundColor: '#FF7F50',
  },
  darkActiveCategoryButton: {
    backgroundColor: '#FF7F50',
  },
  categoryText: {
    color: '#666666',
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  darkCategoryText: {
    color: '#aaaaaa',
    fontFamily: 'Vercetti-Regular',
  },
  activeCategoryText: {
    color: '#ffffff',
    fontFamily: 'Vercetti-Regular',
  },
  darkActiveCategoryText: {
    color: '#ffffff',
    fontFamily: 'Vercetti-Regular',
  },
  posts: {
    padding: 20,
    gap: 16,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Vercetti-Regular',
  },
  postActions: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});