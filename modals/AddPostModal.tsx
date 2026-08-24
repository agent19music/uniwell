import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image,
  ScrollView,
  useColorScheme 
} from 'react-native';
import { ImageIcon, VideoCamera, XCircle, EyeSlash, Eye } from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useCommunity } from '../contexts/CommunityContext';
import TagSelector from '@/components/TagSelector';
import * as ImageManipulator from 'expo-image-manipulator';



export default function AddPostModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadMedia, createPost } = useCommunity();
  const isDark = useColorScheme() === 'dark';

  const compressVideo = async (uri: string) => {
    try {
      const compressedFile = await ImageManipulator.manipulateAsync(
        uri,
        [],
        {
          compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return compressedFile;
    } catch (error) {
      console.error('Video compression error:', error);
      return { uri };
    }
  };

  const handleMediaPicker = async (type: 'image' | 'video') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'image' 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: type === 'video',
        quality: 0.8,
      });

      if (!result.canceled) {
        let processedUri = result.assets[0].uri;
        
        if (type === 'video') {
          const compressed = await compressVideo(processedUri);
          processedUri = compressed.uri;
        }

        setMedia([...media, { uri: processedUri, type }]);
      }
    } catch (error) {
      console.error('Media picker error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsUploading(true);

    try {
      // Upload all media files
      const mediaUrls = await Promise.all(
        media.map(m => uploadMedia(m.uri, m.type))
      );

      await createPost({
        title: title.trim(),
        content: content.trim(),
        media_url: mediaUrls,
        tags: selectedTags,
        is_anonymous: isAnonymous
      });

      // Reset form
      setTitle('');
      setContent('');
      setMedia([]);
      setSelectedTags([]);
      setIsAnonymous(true);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
          <View style={[styles.header, isDark && styles.headerDark]}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.headerButton, isDark && styles.headerButtonDark]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.postButton, !content.trim() && styles.postButtonDisabled]}
              onPress={handleSubmit}
              disabled={!content.trim() || isUploading}
            >
              <Text style={[
                styles.postButtonText,
                !content.trim() && styles.postButtonTextDisabled
              ]}>
                {isUploading ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <TextInput
              placeholder="Title (optional)"
              value={title}
              onChangeText={setTitle}
              style={[styles.titleInput, isDark && styles.titleInputDark]}
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
            
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="What's on your mind?"
                value={content}
                onChangeText={setContent}
                multiline
                style={[styles.contentInput, isDark && styles.contentInputDark]}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
              
              <View style={styles.mediaButtons}>
                <TouchableOpacity 
                  style={styles.mediaButton} 
                  onPress={() => handleMediaPicker('image')}
                >
                  <ImageIcon
                    size={22}
                    color={isDark ? '#FF7F50' : '#FF7F50'}
                    weight="regular"
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.mediaButton} 
                  onPress={() => handleMediaPicker('video')}
                >
                  <VideoCamera
                    size={22}
                    color={isDark ? '#FF7F50' : '#FF7F50'}
                    weight="regular"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {media.length > 0 && (
              <ScrollView 
                horizontal 
                style={styles.mediaPreview}
                showsHorizontalScrollIndicator={false}
              >
                {media.map((m, index) => (
                  <View key={index} style={[styles.mediaContainer, isDark && styles.mediaContainerDark]}>
                    {m.type === 'image' ? (
                      <Image source={{ uri: m.uri }} style={styles.mediaItem} />
                    ) : (
                      <VideoView
                        player={useVideoPlayer({ uri: m.uri })}
                        style={styles.mediaItem}
                        contentFit="cover"
                      />
                    )}
                    <TouchableOpacity
                      style={styles.removeMedia}
                      onPress={() => setMedia(media.filter((_, i) => i !== index))}
                    >
                      <XCircle size={24} color="#fff" weight="fill" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />

            <TouchableOpacity
              style={[styles.anonymousToggle, isDark && styles.anonymousToggleDark]}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              {isAnonymous
                ? <EyeSlash size={24} color={isDark ? '#fff' : '#000'} weight="regular" />
                : <Eye size={24} color={isDark ? '#fff' : '#000'} weight="regular" />
              }
              <Text style={[styles.anonymousText, isDark && styles.anonymousTextDark]}>
                Post anonymously
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
    width: '100%',
    overflow: 'hidden',
  },
  modalContentDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerDark: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerButton: {
    fontSize: 17,
    color: '#FF7F50',
    fontFamily: 'Vercetti-Regular',
  },
  headerButtonDark: {
    color: '#FF7F50',
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#FF7F50',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  postButtonTextDisabled: {
    opacity: 0.5,
  },
  content: {
    padding: 16,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  contentInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    paddingBottom: 40,
    fontFamily: 'Vercetti-Regular',
  },
  contentInputDark: {
    color: '#fff',
  },
  mediaButtons: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    gap: 16,
  },
  mediaButton: {
    padding: 4,
  },
  titleInput: {
    fontSize: 18,
    marginBottom: 12,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
    paddingVertical: 8,
  },
  titleInputDark: {
    color: '#fff',
  },
  mediaPreview: {
    marginBottom: 20,
  },
  mediaContainer: {
    position: 'relative',
    marginRight: 12,
    backgroundColor: '#f5f5f0',
    borderRadius: 8,
  },
  mediaContainerDark: {
    backgroundColor: '#2a2a2a',
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover'
  },
  mediaItemDark: {
    backgroundColor: '#2a2a2a',
  },
  removeMedia: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 2,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 20,
  },
  anonymousToggleDark: {
    backgroundColor: '#2a2a2a',
  },
  anonymousText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  anonymousTextDark: {
    color: '#fff',
  },
  tagSection: {
    marginBottom: 20,
  },
  tagTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Vercetti-Regular',
  },
  tagTitleDark: {
    color: '#fff',
  },
  tagScrollView: {
    maxHeight: 120,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  tagDark: {
    backgroundColor: '#2a2a2a',
  },
  tagSelected: {
    backgroundColor: '#FF7F50',
  },
  tagText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  tagTextDark: {
    color: '#aaa',
  },
  tagTextSelected: {
    color: '#fff',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Vercetti-Regular',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
  }
});