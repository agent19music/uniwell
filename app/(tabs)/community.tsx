import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { PencilSimple, Chats } from 'phosphor-react-native';
import AddPostModal from '@/modals/AddPostModal';
import { useCommunity } from '@/contexts/CommunityContext';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';
import { SafeText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { HeaderAction } from '@/components/ui/Navigation';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Post } from '@/types/community';

export default function CommunityScreen() {
  const { colors } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { getTrendingPosts } = useCommunity();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => setUserId(user?.id ?? null));
  }, []);

  const fetchPosts = async (isRefresh = false) => {
    try {
      setError(false);
      if (!isRefresh) setLoading(true);
      const posts = await getTrendingPosts();
      setPosts(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <View>
          <SafeText variant="title">Wellness Hub</SafeText>
          <SafeText variant="caption" color={colors.textSecondary}>Share support and learn from others.</SafeText>
        </View>
        <HeaderAction accessibilityLabel="Create a post" onPress={() => setModalVisible(true)}>
          <PencilSimple size={22} color={colors.text} weight="regular" />
        </HeaderAction>
      </View>

      {loading ? (
        <LoadingState label="Loading community posts…" style={styles.state} />
      ) : error ? (
        <ErrorState
          title="Couldn’t load the community"
          description="Check your connection and try again."
          action={<Button label="Try again" onPress={() => fetchPosts()} />}
          style={styles.state}
        />
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
          contentContainerStyle={posts.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No posts yet"
              description="Start a thoughtful conversation with the community."
              icon={<Chats size={48} color={colors.textMuted} weight="regular" />}
              action={<Button label="Write a post" onPress={() => setModalVisible(true)} />}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPosts(true);
              }}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
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
    </Screen>
  );
}


const styles = StyleSheet.create({
  screenContent: { paddingBottom: 0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.control,
  },
  list: { paddingBottom: spacing.page },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  state: { flex: 1 },
});