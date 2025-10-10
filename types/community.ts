export interface Post {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    title?: string;
    media_url?: string[];
    is_anonymous?: boolean;
    edited_at?: string;
    profiles: {
      username: string;
      avatar_url: string;
    };
    post_likes: { count: number }[];
    post_replies?: { count: number }[];
    tags?: string[];
    user_likes?: {
      user_id: string;
    }[];
  }
  
  export interface Reply {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    post_id: string;
    parent_id: string | null;
    profiles: {
      username: string;
      avatar_url: string;
    };
    media_url?: string;
    likes?: number;
    isLiked?: boolean;
    timestamp?: string;
    user?: {
      id: string;
      name: string;
      avatar: string;
    };
    hasChildren?: boolean;
    children?: Reply[];
  }
  
  export interface CreatePostData {
    title?: string;
    content: string;
    media_url?: string[];
    tags?: string[];
    is_anonymous: boolean;
  }
  
  export interface EditPostData {
    content: string;
    media_url?: string[];
  }
  
  export interface CreateReplyData {
    content: string;
    postId: string;
    parentId?: string | null;
  }