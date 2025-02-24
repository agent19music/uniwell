import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, TextInput } from 'react-native';


const CATEGORIES = [
  { id: 'trending', label: 'Trending', active: true },
  { id: 'relationship', label: 'Relationship', active: false },
  { id: 'selfcare', label: 'Self Care', active: false },
];

const POSTS = [
  {
    id: 1,
    user: {
      name: 'Coal Dingo',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
    },
    timestamp: 'just now',
    content: 'Is there a therapy which can cure crossdressing & bdsm compulsion?',
    likes: 2,
    comments: 12,
  },
  {
    id: 2,
    user: {
      name: 'Pigeon Car',
      image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop',
    },
    timestamp: '5 hrs ago',
    content: 'Looking for advice on managing anxiety during exams. Any tips?',
    likes: 8,
    comments: 24,
  },
];

export default function CommunityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Add state variables
  const [modalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState('');

  // Add handlePostSubmit function
  const handlePostSubmit = () => {
    // Here you would typically send the post to your backend
    console.log('Submitting post:', postText);
    
    // Clear the input and close modal
    setPostText('');
    setModalVisible(false);
  };

  // const handlePostPress = (postId: number) => {
  //   router.push(`/post/${postId}`);
  // };

  function handlePostPress(){
    router.push('/PostScreen')
  }
  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.darkText]}>Wellness Hub</Text>
          <TouchableOpacity 
            style={styles.writeButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="create-outline" size={24} color={isDark ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categories}
          contentContainerStyle={styles.categoriesContent}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                category.active && styles.activeCategoryButton,
                isDark && styles.darkCategoryButton,
                category.active && isDark && styles.darkActiveCategoryButton,
              ]}>
              <Text
                style={[
                  styles.categoryText,
                  category.active && styles.activeCategoryText,
                  isDark && styles.darkCategoryText,
                  category.active && isDark && styles.darkActiveCategoryText,
                ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.posts}>
          {POSTS.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={[styles.postCard, isDark && styles.darkCard]}
              onPress={() => handlePostPress()}
            >
              <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                  <Image source={{ uri: post.user.image }} style={styles.userImage} />
                  <View>
                    <Text style={[styles.userName, isDark && styles.darkText]}>{post.user.name}</Text>
                    <Text style={[styles.timestamp, isDark && styles.darkSubText]}>{post.timestamp}</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-horizontal" size={20} color={isDark ? '#ffffff' : '#000000'} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.postContent, isDark && styles.darkText]}>{post.content}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="heart-outline" size={20} color={isDark ? '#aaaaaa' : '#666666'} />
                  <Text style={[styles.actionText, isDark && styles.darkSubText]}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={20} color={isDark ? '#aaaaaa' : '#666666'} />
                  <Text style={[styles.actionText, isDark && styles.darkSubText]}>{post.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-outline" size={20} color={isDark ? '#aaaaaa' : '#666666'} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* New Post Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDark && styles.darkCard]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.darkText]}>Create New Post</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#333'} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              multiline
              placeholder="Share your thoughts..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={postText}
              onChangeText={setPostText}
            />

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handlePostSubmit}
            >
              <Text style={styles.submitButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  writeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categories: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoriesContent: {
    gap: 12,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  darkCategoryButton: {
    backgroundColor: '#1e1e1e',
  },
  activeCategoryButton: {
    backgroundColor: '#FF7F50',
  },
  darkActiveCategoryButton: {
    backgroundColor: '#FF7F50',
  },
  categoryText: {
    color: '#666666',
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  darkCategoryText: {
    color: '#aaaaaa',
    fontFamily: 'Vercetti-Regular',
  },
  activeCategoryText: {
    color: '#ffffff',
    fontFamily: 'Vercetti-Regular',
  },
  darkActiveCategoryText: {
    color: '#ffffff',
    fontFamily: 'Vercetti-Regular',
  },
  posts: {
    padding: 20,
    gap: 16,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  postActions: {
    flexDirection: 'row',
    gap: 24,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkInput: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#FF7F50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
});