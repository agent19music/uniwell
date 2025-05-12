import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Post } from '../types/community';
import { router } from 'expo-router';

interface PostNavigationContextType {
  currentPost: Post | null;
  setCurrentPost: (post: Post | null) => void;
  navigateToPost: (post: Post) => void;
  clearCurrentPost: () => void;
  getCachedPost: (id: string) => Post | null;
}

const PostNavigationContext = createContext<PostNavigationContextType | undefined>(undefined);

export function PostNavigationProvider({ children }: { children: ReactNode }) {
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [postCache, setPostCache] = useState<Record<string, Post>>({});

  const navigateToPost = (post: Post) => {
    setCurrentPost(post);
    // Also cache the post for future reference
    setPostCache(prev => ({
      ...prev,
      [post.id]: post
    }));
    router.push(`/post/${post.id}`);
  };

  const clearCurrentPost = () => {
    setCurrentPost(null);
  };

  const getCachedPost = (id: string): Post | null => {
    return postCache[id] || null;
  };

  return (
    <PostNavigationContext.Provider
      value={{
        currentPost,
        setCurrentPost,
        navigateToPost,
        clearCurrentPost,
        getCachedPost,
      }}
    >
      {children}
    </PostNavigationContext.Provider>
  );
}

export const usePostNavigation = () => {
  const context = useContext(PostNavigationContext);
  if (!context) {
    throw new Error('usePostNavigation must be used within a PostNavigationProvider');
  }
  return context;
}; 