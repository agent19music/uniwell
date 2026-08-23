import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

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

interface ThreadedReplyProps {
  reply: Reply;
  depth: number;
  onReply: (parentId: string) => void;
  onLike: (replyId: string) => void;
}

export default function ThreadedReply({ reply, depth, onReply, onLike }: ThreadedReplyProps) {
  const [isCollapsed, setIsCollapsed] = useState(depth > 2);
  const [showMore, setShowMore] = useState(false);
  const isDark = useColorScheme() === 'dark';
  
  // Format time ago from timestamp or created_at
  const getTimeAgo = () => {
    try {
      const date = new Date(reply.timestamp || reply.created_at);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  return (
    <View style={[
      styles.container, 
      isDark && styles.containerDark,
      { marginLeft: depth * 16 }
    ]}>
      <View style={styles.replyHeader}>
        <Image
          source={{ uri: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png' }}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={[styles.username, isDark && styles.usernameDark]}>
            Anonymous
          </Text>
          <Text style={[styles.timestamp, isDark && styles.timestampDark]}>
            {getTimeAgo()}
          </Text>
        </View>
        {reply.hasChildren && (
          <TouchableOpacity onPress={() => setIsCollapsed(!isCollapsed)}>
            <Ionicons 
              name={isCollapsed ? 'chevron-down' : 'chevron-up'} 
              size={20} 
              color={isDark ? "#aaa" : "#666"} 
            />
          </TouchableOpacity>
        )}
      </View>

      {!isCollapsed && (
        <>
          <Text 
            numberOfLines={showMore ? undefined : 3} 
            style={[styles.content, isDark && styles.contentDark]}
          >
            {reply.content}
          </Text>
          
          {reply.content.length > 150 && !showMore && (
            <TouchableOpacity 
              style={styles.showMoreButton} 
              onPress={() => setShowMore(true)}
            >
              <Text style={styles.showMoreText}>Read more</Text>
            </TouchableOpacity>
          )}
          
          {reply.media_url && (
            <Image 
              source={{ uri: reply.media_url }} 
              style={styles.media} 
            />
          )}
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onLike(reply.id)}
            >
              <Ionicons 
                name={reply.isLiked ? "heart" : "heart-outline"} 
                size={20} 
                color={reply.isLiked ? "#FF4D4D" : isDark ? "#aaa" : "#666"} 
              />
              <Text style={[styles.actionText, isDark && styles.actionTextDark]}>
                {reply.likes || 0}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onReply(reply.id)}
            >
              <Ionicons 
                name="chatbubble-outline" 
                size={20} 
                color={isDark ? "#aaa" : "#666"} 
              />
              <Text style={[styles.actionText, isDark && styles.actionTextDark]}>
                Reply
              </Text>
            </TouchableOpacity>
          </View>
          
          {reply.children?.map(childReply => (
            <ThreadedReply
              key={childReply.id}
              reply={childReply}
              depth={depth + 1}
              onReply={onReply}
              onLike={onLike}
            />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  username: {
    fontSize: 14,
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
  content: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  contentDark: {
    color: '#fff',
  },
  media: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    padding: 4,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  actionTextDark: {
    color: '#aaa',
  },
  collapseButton: {
    padding: 4,
  },
  threadLine: {
    position: 'absolute',
    left: -16,
    top: 40,
    bottom: 0,
    width: 2,
    backgroundColor: '#eee',
  },
  threadLineDark: {
    backgroundColor: '#2a2a2a',
  },
  showMoreButton: {
    paddingVertical: 4,
    marginTop: -4,
    marginBottom: 8,
  },
  showMoreText: {
    color: '#FF7F50',
    fontSize: 12,
    fontFamily: 'Vercetti-Regular',
  },
  replyCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  replyCountDark: {
    color: '#aaa',
  },
}); 