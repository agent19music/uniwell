import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

type Post = {
  id: number;
  user: {
    name: string;
    image: string;
    role: string;
  };
  timestamp: string;
  content: string;
  likes: number;
  comments: number;
};

const POST_DETAILS: Record<string, Post> = {
  "1": {
    id: 1,
    user: {
      name: 'Coal Dingo',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
      role: 'Community Member',
    },
    timestamp: 'just now',
    content: "Is there a therapy which can cure crossdressing & bdsm compulsion? I've been struggling with these urges for years and I'm looking for professional help. I want to understand if this is something that can be addressed through therapy or counseling. Has anyone here had experience with similar situations?",
    likes: 2,
    comments: 12,
  },
  "2": {
    id: 2,
    user: {
      name: 'Pigeon Car',
      image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop',
      role: 'Community Member',
    },
    timestamp: '5 hrs ago',
    content: "Looking for advice on managing anxiety during exams. Any tips? I've tried deep breathing but still find myself panicking during tests. My grades are suffering and I really need help developing better coping strategies.",
    likes: 8,
    comments: 24,
  }
};

type Reply = {
  id: number;
  user: {
    name: string;
    image: string;
    role: string;
  };
  content: string;
  timestamp: string;
  likes: number;
};

const REPLIES: Record<string, Array<Reply>> = {
  "1": [
    {
      id: 1,
      user: {
        name: 'Dr. Sarah Wilson',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        role: 'Licensed Therapist',
      },
      content: "It's important to approach this with understanding and self-compassion. I would recommend seeking a sex-positive therapist who specializes in sexual identity and compulsive behaviors. They can help you explore these feelings in a safe, non-judgmental environment.",
      timestamp: '2h ago',
      likes: 15,
    },
    {
      id: 2,
      user: {
        name: 'Michael Chen',
        image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop',
        role: 'Community Member',
      },
      content: "Have you considered joining support groups? There are many online communities where you can connect with others who share similar experiences. Remember, you're not alone in this journey.",
      timestamp: '1h ago',
      likes: 8,
    },
    {
      id: 3,
      user: {
        name: 'Emma Thompson',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
        role: 'Peer Support Specialist',
      },
      content: 'While seeking professional help is important, also remember that many aspects of BDSM between consenting adults are considered healthy expressions of sexuality. A good therapist will help you understand the difference between compulsive behavior and healthy sexual expression.',
      timestamp: '30m ago',
      likes: 12,
    },
  ],
  "2": [
    {
      id: 1,
      user: {
        name: 'Study Coach Alex',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
        role: 'Academic Counselor',
      },
      content: 'Try the 5-4-3-2-1 grounding technique before exams: identify 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This helps anchor you to the present moment.',
      timestamp: '4h ago',
      likes: 20,
    },
    {
      id: 2,
      user: {
        name: 'Jessica Lee',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
        role: 'Student Counselor',
      },
      content: "Regular exercise and proper sleep are crucial for managing anxiety. Try to establish a consistent study routine and take breaks every 45 minutes. Also, consider talking to your school's counseling services.",
      timestamp: '3h ago',
      likes: 15,
    },
  ],
};

export default function PostScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const postId = typeof id === 'string' ? parseInt(id) : 1;
  const post = POST_DETAILS[postId.toString()];
  const postReplies = REPLIES[postId.toString()] || [];

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.postCard, isDark && styles.darkCard]}>
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              <Image source={{ uri: post.user.image }} style={styles.userImage} />
              <View>
                <Text style={[styles.userName, isDark && styles.darkText]}>{post.user.name}</Text>
                <Text style={[styles.userRole, isDark && styles.darkSubText]}>{post.user.role}</Text>
                <Text style={[styles.timestamp, isDark && styles.darkSubText]}>{post.timestamp}</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.postContent, isDark && styles.darkText]}>{post.content}</Text>
          <View style={styles.postStats}>
            <Text style={[styles.statsText, isDark && styles.darkSubText]}>
              {post.likes} likes • {post.comments} comments
            </Text>
          </View>
        </View>

        <View style={styles.replyInput}>
          <TextInput
            placeholder="Write a reply..."
            placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
            style={[styles.input, isDark && styles.darkInput]}
            multiline
          />
          <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="send" size={24} color="#FF7F50" />
          </TouchableOpacity>
        </View>

        <View style={styles.replies}>
          {postReplies.map((reply) => (
            <View key={reply.id} style={[styles.replyCard, isDark && styles.darkCard]}>
              <View style={styles.userInfo}>
                <Image source={{ uri: reply.user.image }} style={styles.userImage} />
                <View>
                  <Text style={[styles.userName, isDark && styles.darkText]}>{reply.user.name}</Text>
                  <Text style={[styles.userRole, isDark && styles.darkSubText]}>{reply.user.role}</Text>
                  <Text style={[styles.timestamp, isDark && styles.darkSubText]}>{reply.timestamp}</Text>
                </View>
              </View>
              <Text style={[styles.replyContent, isDark && styles.darkText]}>{reply.content}</Text>
              <View style={styles.replyActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="heart-outline" size={20} color={isDark ? '#aaaaaa' : '#666666'} />
                  <Text style={[styles.actionText, isDark && styles.darkSubText]}>{reply.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={20} color={isDark ? '#aaaaaa' : '#666666'} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  darkContainer: {
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  postCard: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 16,
  },
  darkCard: {
    backgroundColor: '#1a1a1a',
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
  userRole: {
    fontSize: 12,
    color: '#666',
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
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  replyInput: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 20,
    fontFamily: 'Vercetti-Regular',
  },
  darkInput: {
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
  },
  sendButton: {
    padding: 8,
  },
  replies: {
    padding: 16,
    gap: 16,
  },
  replyCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
  },
  replyContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 8,
    fontFamily: 'Vercetti-Regular',
  },
  postStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  replyActions: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
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
  },
});

