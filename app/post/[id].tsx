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
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useCommunity } from '../../contexts/CommunityContext';
import ThreadedReply from '../../components/ThreadedReply';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Post, Reply } from '@/types/community';




export default function PostScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { createReply, likePost, deletePost } = useCommunity();

  useEffect(() => {
    fetchPost();
    subscribeToReplies();
  }, [id]);

  const fetchPost = async () => {
    try {
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
        .eq('id', id)
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
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(organizeReplies(data));
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const organizeReplies = (flatReplies: any[]) => {
    // Convert flat array into threaded structure
    const threadedReplies: any[] = [];
    const replyMap = new Map();

    flatReplies.forEach(reply => {
      replyMap.set(reply.id, { ...reply, children: [] });
    });

    flatReplies.forEach(reply => {
      if (reply.parent_id) {
        const parent = replyMap.get(reply.parent_id);
        if (parent) {
          parent.children.push(replyMap.get(reply.id));
        }
      } else {
        threadedReplies.push(replyMap.get(reply.id));
      }
    });

    return threadedReplies;
  };

  const subscribeToReplies = () => {
    const subscription = supabase
      .channel('post_replies')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_replies',
        filter: `post_id=eq.${id}`
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
        content: replyContent.trim()
    try {
      await createReply({
        post_id: id,
        parent_id: replyingTo,
        content: replyContent.trim()
      });
      console.error('Error creating reply:', error);
      setReplyContent('');
      setReplyingTo(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
                      await deletePost(id);
                      router.back();
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
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePostOptions}>
          <Ionicons name="ellipsis-horizontal" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {post && (
          <View style={[styles.postContainer, isDark && styles.postContainerDark]}>
            <View style={styles.postHeader}>
              <Image 
                source={{ uri: post.profiles.avatar_url }} 
                style={styles.avatar} 
              />
              <View style={styles.postHeaderText}>
                <Text style={[styles.username, isDark && styles.usernameDark]}>
                  {post.profiles.username}
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

        <View style={styles.replySection}>
          <View style={[styles.replyInput, isDark && styles.replyInputDark]}>
            <TextInput
              placeholder="Write a reply..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={replyContent}
              onChangeText={setReplyContent}
              style={[styles.input, isDark && styles.inputDark]}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleReply(post?.id)}>
              <Ionicons name="send" size={24} color="#FF7F50" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
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
  textDark: {
    color: '#fff',
  },
});