import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, DotsThree, XCircle, PaperPlaneTilt } from 'phosphor-react-native';
import { supabase } from '../../lib/supabase';
import { useCommunity } from '../../contexts/CommunityContext';
import { usePostNavigation } from '../../contexts/PostNavigationContext';
import ThreadedReply from '../../components/ThreadedReply';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Post } from '@/types/community';

// Define local Reply interface that matches ThreadedReply component requirements
interface Reply {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  hasChildren: boolean;
  media_url?: string;
  isLiked?: boolean;
  likes?: number;
  children?: Reply[];
}

export default function PostScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { currentPost, getCachedPost } = usePostNavigation();
  const [post, setPost] = useState<Post | null>(currentPost);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(!post);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { createReply, likePost, deletePost } = useCommunity();
  
  useEffect(() => {
    const stringId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    
    // First, check if we have a currentPost from navigation
    if (currentPost && currentPost.id === stringId) {
      setPost(currentPost);
      setIsLoading(false);
      fetchReplies();
    } 
    // Then, check if we have a cached post
    else if (stringId) {
      const cachedPost = getCachedPost(stringId);
      if (cachedPost) {
        setPost(cachedPost);
        setIsLoading(false);
        fetchReplies();
      } else {
        // Fallback to fetch from API
        fetchPost(stringId);
      }
    }
    
    // Set up subscription regardless of data source
    if (stringId) {
      const unsubscribe = subscribeToReplies(stringId);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [id, currentPost]);

  const fetchPost = async (postId: string) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          post_likes (count),
          post_replies (count),
          user_likes:post_likes!inner (
            user_id
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
      fetchReplies();
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReplies = async () => {
    const postId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    if (!postId) return;
    
    try {
      const { data, error } = await supabase
        .from('post_replies')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(organizeReplies(data));
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const organizeReplies = (flatReplies: any[]) => {
    // Convert flat array into threaded structure
    const threadedReplies: Reply[] = [];
    const replyMap = new Map();

    flatReplies.forEach(reply => {
      // Add timestamp, user, and hasChildren properties to match ThreadedReply component expectations
      const enrichedReply = {
        ...reply,
        timestamp: reply.created_at,
        user: {
          id: reply.user_id,
          name: 'Anonymous',
          avatar: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png'
        },
        hasChildren: false,
        children: []
      };
      replyMap.set(reply.id, enrichedReply);
    });

    flatReplies.forEach(reply => {
      if (reply.parent_id) {
        const parent = replyMap.get(reply.parent_id);
        if (parent) {
          parent.hasChildren = true;
          parent.children.push(replyMap.get(reply.id));
        } else {
          // Fallback if parent not found
          threadedReplies.push(replyMap.get(reply.id));
        }
      } else {
        threadedReplies.push(replyMap.get(reply.id));
      }
    });

    return threadedReplies;
  };

  const subscribeToReplies = (postId: string) => {
    const subscription = supabase
      .channel(`post_replies_${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_replies',
        filter: `post_id=eq.${postId}`
      }, () => {
        fetchReplies();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    const postId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    if (!postId) return;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      await createReply({
        postId,
        parentId: replyingTo || undefined,
        content: replyContent.trim()
      });

      // Create optimistic reply to immediately show in the UI (always anonymous)
      const optimisticReply: any = {
        id: `temp-${Date.now()}`,
        post_id: postId,
        user_id: user.id,
        parent_id: replyingTo,
        content: replyContent.trim(),
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          name: 'Anonymous',
          avatar: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png'
        },
        hasChildren: false,
        children: []
      };
      
      // Update replies state with the new reply
      setReplies(prevReplies => {
        if (replyingTo) {
          // If replying to a parent, find that parent and add to its children
          return prevReplies.map(reply => {
            if (reply.id === replyingTo) {
              return {
                ...reply,
                hasChildren: true,
                children: [...(reply.children || []), optimisticReply]
              };
            }
            return reply;
          });
        } else {
          // If top-level reply, just add to the array
          return [...prevReplies, optimisticReply];
        }
      });
      
      // Clear form
      setReplyContent('');
      setReplyingTo(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Refresh after a short delay to get the actual data
      setTimeout(() => {
        fetchReplies();
      }, 1000);
      
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const handlePostOptions = () => {
    Alert.alert(
      'Post Options',
      undefined,
      [
        {
          text: 'Delete Post',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Post',
              'Are you sure you want to delete this post?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      if (typeof id === 'string') {
                        await deletePost(id);
                        router.back();
                      }
                    } catch (error) {
                      console.error('Error deleting post:', error);
                    }
                  }
                }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={isDark ? '#fff' : '#000'} weight="regular" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePostOptions}>
          <DotsThree size={24} color={isDark ? '#fff' : '#000'} weight="regular" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {post && (
            <View style={[styles.postContainer, isDark && styles.postContainerDark]}>
              <View style={styles.postHeader}>
                <Image
                  source={{ uri: post.is_anonymous ? 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png' : (post.profiles?.avatar_url || 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png') }}
                  style={styles.avatar}
                />
                <View style={styles.postHeaderText}>
                  <Text style={[styles.username, isDark && styles.usernameDark]}>
                    {post.is_anonymous ? 'Anonymous' : (post.profiles?.username || 'Member')}
                  </Text>
                  <Text style={[styles.timestamp, isDark && styles.timestampDark]}>
                    {format(new Date(post.created_at), 'MMM d, yyyy')}
                  </Text>
                </View>
              </View>

              {post.title && (
                <Text style={[styles.postTitle, isDark && styles.postTitleDark]}>
                  {post.title}
                </Text>
              )}
            
              <Text style={[styles.postContent, isDark && styles.postContentDark]}>
                {post.content}
              </Text>

              {post.media_url?.map((url, index) => (
                <Image 
                  key={index}
                  source={{ uri: url }} 
                  style={styles.postMedia} 
                />
              ))}
            </View>
          )}

          <View style={styles.repliesContainer}>
            <Text style={[styles.repliesTitle, isDark && styles.textDark]}>
              Replies ({replies.length})
            </Text>
            {replies.map(reply => (
              <ThreadedReply
                key={reply.id}
                reply={reply}
                depth={0}
                onReply={(parentId) => setReplyingTo(parentId)}
                onLike={(replyId) => {/* Handle reply like */}}
              />
            ))}
          </View>
        </ScrollView>

        <View style={[styles.replySection, isDark && styles.replySectionDark]}>
          {replyingTo && (
            <View style={[styles.replyingToContainer, isDark && styles.replyingToContainerDark]}>
              <Text style={[styles.replyingToText, isDark && styles.replyingToTextDark]}>
                Replying to a comment
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <XCircle size={20} color={isDark ? '#aaa' : '#666'} weight="fill" />
              </TouchableOpacity>
            </View>
          )}
          <View style={[styles.replyInput, isDark && styles.replyInputDark]}>
            <TextInput
              placeholder="Write a reply..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={replyContent}
              onChangeText={setReplyContent}
              style={[styles.input, isDark && styles.inputDark]}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !replyContent.trim() && styles.sendButtonDisabled]} 
              onPress={handleReply}
              disabled={!replyContent.trim()}
            >
              <PaperPlaneTilt
                size={24}
                color={!replyContent.trim() ? (isDark ? '#444' : '#ccc') : "#FF7F50"}
                weight="fill"
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingContainerDark: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerDark: {
    borderBottomColor: '#2a2a2a',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postContainerDark: {
    backgroundColor: '#1a1a1a',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postHeaderText: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    fontFamily: 'Vercetti-Regular',
  },
  usernameDark: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  timestampDark: {
    color: '#aaa',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  postTitleDark: {
    color: '#fff',
  },
  postContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  postContentDark: {
    color: '#fff',
  },
  postMedia: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  repliesContainer: {
    padding: 16,
  },
  repliesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  replySection: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  replySectionDark: {
    backgroundColor: '#121212',
    borderTopColor: '#2a2a2a',
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 12,
    marginBottom: 8
  },
  replyingToContainerDark: {
    backgroundColor: '#2a2a2a'
  },
  replyingToText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  replyingToTextDark: {
    color: '#aaa',
  },
  replyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
  },
  replyInputDark: {
    backgroundColor: '#1a1a1a',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
    marginRight: 12,
  },
  inputDark: {
    color: '#fff',
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  textDark: {
    color: '#fff',
  },
});