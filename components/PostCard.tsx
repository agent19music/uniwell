import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DotsThree, Heart, ChatCircle, Export } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { SafeText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Post } from '@/types/community';
import { useCommunity } from '@/contexts/CommunityContext';
import { usePostNavigation } from '@/contexts/PostNavigationContext';
import { Menu } from '@/components/Menu';

export default function PostCard({ post, isOwner }: { post: Post, isOwner: boolean }) {
  const router = useRouter();
  const { colors } = useTheme();
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
    <Card
      accessibilityLabel={`Open post by ${post.is_anonymous ? 'Anonymous' : (post.profiles?.username || 'Member')}`}
      style={styles.postCard}
      onPress={handlePostPress}
    >
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ 
              uri: post.is_anonymous
                ? 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png'
                : (post.profiles?.avatar_url || 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png')
            }} 
            style={[styles.userImage, { borderColor: colors.border }]}
          />
          <View>
            <SafeText variant="bodyStrong">
              {post.is_anonymous ? 'Anonymous' : (post.profiles?.username || 'Member')}
            </SafeText>
            <SafeText variant="caption" color={colors.textMuted}>
              {format(new Date(post.created_at), 'MMM d, yyyy')}
            </SafeText>
          </View>
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          items={menuItems}
          trigger={
            <IconButton accessibilityLabel="Post options" onPress={() => setMenuVisible(true)}>
              <DotsThree size={20} color={colors.text} weight="regular" />
            </IconButton>
          }
        />
      </View>

      {post.title && (
        <SafeText variant="heading" style={styles.postTitle}>
          {post.title}
        </SafeText>
      )}

      <SafeText variant="caption" style={styles.postContent}>{post.content}</SafeText>

      {post.media_url && post.media_url.length > 0 && (
        <Image 
          source={{ uri: post.media_url[0] }} 
          style={[styles.postMedia, { borderColor: colors.border }]}
          resizeMode="cover"
        />
      )}

      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => likePost(post.id)}
        >
          <Heart
            size={20}
            color={post.user_likes?.length > 0 ? colors.danger : colors.textSecondary}
            weight={post.user_likes?.length > 0 ? "fill" : "regular"}
          />
          <SafeText variant="caption" color={colors.textSecondary}>
            {post.post_likes?.[0]?.count || 0}
          </SafeText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <ChatCircle size={20} color={colors.textSecondary} weight="regular" />
          <SafeText variant="caption" color={colors.textSecondary}>
            {post.post_replies?.[0]?.count || 0}
          </SafeText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Export size={20} color={colors.textSecondary} weight="regular" />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  postCard: {
    margin: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.macro,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.macro,
  },
  userImage: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  postContent: {
    marginBottom: spacing.macro,
  },
  postMedia: {
    width: '100%',
    height: 200,
    borderCurve: 'continuous',
    borderRadius: radius.control,
    borderWidth: 1,
    marginBottom: spacing.macro,
  },
  postActions: {
    flexDirection: 'row',
    gap: spacing.field,
    marginTop: spacing.micro,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.optical,
    minHeight: 48,
    minWidth: 48,
    paddingVertical: spacing.optical,
  }
}); 