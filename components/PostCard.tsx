import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ChatCircle, DotsThree, Export, Heart } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

import { Menu } from '@/components/Menu';
import { SafeText } from '@/components/ThemedText';
import { IconButton } from '@/components/ui/IconButton';
import { radius, spacing } from '@/constants/theme';
import { useCommunity } from '@/contexts/CommunityContext';
import { usePostNavigation } from '@/contexts/PostNavigationContext';
import { useTheme } from '@/hooks/useTheme';
import { Post } from '@/types/community';

const DEFAULT_AVATAR = 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png';

export default function PostCard({ post, isOwner }: { post: Post; isOwner: boolean }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { deletePost, mutePost, notInterestedPost, likePost } = useCommunity();
  const { navigateToPost } = usePostNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  const liked = (post.user_likes?.length ?? 0) > 0;
  const likeCount = post.post_likes?.[0]?.count ?? 0;
  const replyCount = post.post_replies?.[0]?.count ?? 0;

  const menuItems = isOwner
    ? [
        { label: 'Edit', icon: 'pencil', onPress: () => router.push(`/post/edit/${post.id}`) },
        {
          label: 'Delete',
          icon: 'trash',
          onPress: async () => {
            await deletePost(post.id);
            setMenuVisible(false);
          },
        },
      ]
    : [
        {
          label: 'Not Interested',
          icon: 'eye-off',
          onPress: async () => {
            await notInterestedPost(post.id);
            setMenuVisible(false);
          },
        },
        {
          label: 'Mute Post',
          icon: 'volume-mute',
          onPress: async () => {
            await mutePost(post.id);
            setMenuVisible(false);
          },
        },
      ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open post by ${post.is_anonymous ? 'Anonymous' : (post.profiles?.username ?? 'Member')}`}
      onPress={() => navigateToPost(post)}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.divider },
        pressed && { backgroundColor: colors.surfacePressed },
      ]}
    >
      {/* Avatar */}
      <Image
        source={{ uri: post.is_anonymous ? DEFAULT_AVATAR : (post.profiles?.avatar_url ?? DEFAULT_AVATAR) }}
        style={[styles.avatar, { borderColor: colors.border }]}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <SafeText variant="bodyStrong" style={styles.username} numberOfLines={1}>
            {post.is_anonymous ? 'Anonymous' : (post.profiles?.username ?? 'Member')}
          </SafeText>
          <SafeText variant="caption" color={colors.textMuted} style={styles.timestamp}>
            {format(new Date(post.created_at), 'MMM d')}
          </SafeText>
          <View style={styles.menuWrap}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              items={menuItems}
              trigger={
                <IconButton accessibilityLabel="Post options" onPress={() => setMenuVisible(true)}>
                  <DotsThree size={18} color={colors.textMuted} weight="regular" />
                </IconButton>
              }
            />
          </View>
        </View>

        {/* Title */}
        {post.title ? (
          <SafeText variant="bodyStrong" style={styles.title}>{post.title}</SafeText>
        ) : null}

        {/* Body */}
        <SafeText variant="body" color={colors.textSecondary} numberOfLines={4} style={styles.body}>
          {post.content}
        </SafeText>

        {/* Media */}
        {post.media_url && post.media_url.length > 0 ? (
          <Image
            source={{ uri: post.media_url[0] }}
            style={[styles.media, { borderColor: colors.border }]}
            resizeMode="cover"
          />
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.action}
            onPress={() => likePost(post.id)}
            hitSlop={8}
          >
            <Heart
              size={18}
              color={liked ? colors.danger : colors.textMuted}
              weight={liked ? 'fill' : 'regular'}
            />
            {likeCount > 0 ? (
              <SafeText variant="caption" color={colors.textMuted}>{likeCount}</SafeText>
            ) : null}
          </Pressable>

          <Pressable style={styles.action} hitSlop={8}>
            <ChatCircle size={18} color={colors.textMuted} weight="regular" />
            {replyCount > 0 ? (
              <SafeText variant="caption" color={colors.textMuted}>{replyCount}</SafeText>
            ) : null}
          </Pressable>

          <Pressable style={styles.action} hitSlop={8}>
            <Export size={18} color={colors.textMuted} weight="regular" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.control,
    paddingVertical: 14,
    gap: spacing.macro,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: spacing.optical,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.micro,
  },
  username: {
    flexShrink: 1,
  },
  timestamp: {
    flexShrink: 0,
  },
  menuWrap: {
    marginLeft: 'auto',
  },
  title: {
    marginTop: spacing.optical,
  },
  body: {
    marginTop: 2,
  },
  media: {
    width: '100%',
    height: 180,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.macro,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.field,
    marginTop: spacing.macro,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.optical,
  },
});
