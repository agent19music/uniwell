import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Post } from '@/types/community';
import { useCommunity } from '@/contexts/CommunityContext';
import { usePostNavigation } from '@/contexts/PostNavigationContext';
import { Menu } from '@/components/Menu';

export default function PostCard({ post, isOwner }: { post: Post, isOwner: boolean }) {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { deletePost, mutePost, notInterestedPost, likePost } = useCommunity();
  const { navigateToPost } = usePostNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = isOwner ? [
    {
      label: 'Edit',
      icon: 'pencil',
      onPress: () => router.push(`/post/edit/${post.id}`)
    },
    {
      label: 'Delete',
      icon: 'trash',
      onPress: async () => {
        await deletePost(post.id);
        setMenuVisible(false);
      }
    }
  ] : [
    {
      label: 'Not Interested',
      icon: 'eye-off',
      onPress: async () => {
        await notInterestedPost(post.id);
        setMenuVisible(false);
      }
    },
    {
      label: 'Mute Post',
      icon: 'volume-mute',
      onPress: async () => {
        await mutePost(post.id);
        setMenuVisible(false);
      }
    }
  ];

  const handlePostPress = () => {
    navigateToPost(post);
  };

  return (
    <TouchableOpacity
      style={[styles.postCard, isDark && styles.darkCard]}
      onPress={handlePostPress}
    >
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png' }} style={styles.userImage} />
          <View>
            <Text style={[styles.userName, isDark && styles.darkText]}>
              {post.is_anonymous ? 'Anonymous' : post.profiles.username}
            </Text>
            <Text style={[styles.timestamp, isDark && styles.darkSubText]}>
              {format(new Date(post.created_at), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          items={menuItems}
          trigger={
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Ionicons name="ellipsis-horizontal" size={20} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          }
        />
      </View>

      {post.title && (
        <Text style={[styles.postTitle, isDark && styles.darkText]}>
          {post.title}
        </Text>
      )}

      <Text style={[styles.postContent, isDark && styles.darkText]}>{post.content}</Text>

      {post.media_url && post.media_url.length > 0 && (
        <Image 
          source={{ uri: post.media_url[0] }} 
          style={styles.postMedia}
          resizeMode="cover"
        />
      )}

      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => likePost(post.id)}
        >
          <Ionicons 
            name={post.user_likes?.length > 0 ? "heart" : "heart-outline"} 
            size={20} 
            color={post.user_likes?.length > 0 ? "#FF7F50" : isDark ? '#aaaaaa' : '#666666'} 
          />
          <Text style={[styles.actionText, isDark && styles.darkSubText]}>
            {post.post_likes?.[0]?.count || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color={isDark ? '#aaaaaa' : '#666666'} />
          <Text style={[styles.actionText, isDark && styles.darkSubText]}>
            {post.post_replies?.[0]?.count || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={isDark ? '#aaaaaa' : '#666666'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 16,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  postMedia: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  postActions: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
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
  }
}); 