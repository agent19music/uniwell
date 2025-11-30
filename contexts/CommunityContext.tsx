import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { File } from 'expo-file-system';
import { Post } from '../types/community';





interface CommunityContextType {
  uploadMedia: (file: string, type: 'image' | 'video') => Promise<string>;
  createPost: (data: CreatePostData) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  editPost: (postId: string, data: EditPostData) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  createReply: (data: CreateReplyData) => Promise<void>;
  getTrendingPosts: () => Promise<Post[]>;
  mutePost: (postId: string) => Promise<void>;
  notInterestedPost: (postId: string) => Promise<void>;
  muteUser: (userId: string) => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

import { CreatePostData, EditPostData, CreateReplyData } from '../types/community';

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_posts'
      }, () => {
        getTrendingPosts();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_likes'
      }, () => {
        getTrendingPosts();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_replies'
      }, () => {
        getTrendingPosts();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const uploadMedia = async (file: string, type: 'image' | 'video') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isVideo = type === 'video';
      const manipResult = await ImageManipulator.manipulateAsync(
        file,
        isVideo ? [] : [{ resize: { width: 1080 } }],
        isVideo
          ? { compress: 0.7 } // leave original container, manipulate returns same format
          : { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Use new File API
      const fileInstance = new File(manipResult.uri);
      const base64 = await fileInstance.base64();

      const fileName = `${user.id}/${type}-${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`;
      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(fileName, decode(base64), {
          contentType: type === 'image' ? 'image/jpeg' : 'video/mp4',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('community-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  };

  const createPost = async (postData: CreatePostData) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Create post
    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user?.id,
        title: postData.title,
        content: postData.content,
        media_url: postData.media_url,
        is_anonymous: postData.is_anonymous
      })
      .select()
      .single();

    if (error) throw error;

    // Create tag relationships
    if (postData.tags?.length) {
      const { error: tagError } = await supabase
        .from('post_tag_relations')
        .insert(postData.tags.map(tagId => ({
          post_id: post.id,
          tag_id: tagId
        })));

      if (tagError) console.error('Error creating tag relations:', tagError);
    }
  };

  const editPost = async (postId: string, { content, media_url }: EditPostData) => {
    const { error } = await supabase
      .from('community_posts')
      .update({ 
        content,
        media_url,
        edited_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (error) throw new Error('Failed to edit post');
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);

    if (error) throw new Error('Failed to delete post');
  };

  const createReply = async ({ content, postId, parentId }: CreateReplyData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Sanitize IDs to ensure they're valid for ltree path
    // ltree requires only alphanumeric and underscore characters
    const sanitizedPostId = postId.replace(/[^a-zA-Z0-9_]/g, '_');
    const sanitizedParentId = parentId ? parentId.replace(/[^a-zA-Z0-9_]/g, '_') : null;
    
    const { error } = await supabase.from('post_replies').insert({
      post_id: postId,
      user_id: user.id,
      content,
      parent_id: parentId,
      thread_path: sanitizedParentId ? `${sanitizedPostId}.${sanitizedParentId}` : `${sanitizedPostId}`
    });

    if (error) throw new Error(error.message || 'Failed to create reply');
  };

  const likePost = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic update
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.id === postId) {
          const currentLikes = post.post_likes?.count || 0;
          const isLiked = post.user_likes?.some(like => like.user_id === user.id);
          return {
            ...post,
            post_likes: { count: isLiked ? currentLikes - 1 : currentLikes + 1 },
            user_likes: isLiked 
              ? post.user_likes?.filter(like => like.user_id !== user.id) || []
              : [...(post.user_likes || []), { user_id: user.id }]
          };
        }
        return post;
      })
    );

    try {
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
    } catch (error) {
      // Revert optimistic update on error
      getTrendingPosts();
    }
  };

  const getTrendingPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          post_likes (count),
          post_replies (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  };

  const mutePost = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_post_preferences')
      .upsert({
        user_id: user.id,
        post_id: postId,
        is_muted: true
      });

    if (error) throw new Error('Failed to mute post');
  };

  const notInterestedPost = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_post_preferences')
      .upsert({
        user_id: user.id,
        post_id: postId,
        is_not_interested: true
      });

    if (error) throw new Error('Failed to mark as not interested');
  };

  const muteUser = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('user_post_preferences')
      .upsert({
        user_id: user?.id,
        muted_user_id: userId,
        is_muted: true
      });

    if (error) throw new Error('Failed to mute user');
  };

  // Add other community functions here...
  return (
    <CommunityContext.Provider value={{
      uploadMedia,
      createPost,
      deletePost,
      editPost,
      likePost,
      createReply,
      getTrendingPosts,
      mutePost,
      notInterestedPost,
      muteUser,
      
    }}>
      {children}
    </CommunityContext.Provider>
  );
}

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};