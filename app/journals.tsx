import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Modal, TextInput, Animated, PanResponder, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const JOURNAL_KEY = '@journals';
const AUDIO_DIRECTORY = `${FileSystem.documentDirectory}audio/`;

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [journals, setJournals] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  // Animation values
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const lockAnimation = useRef(new Animated.Value(0)).current;
  
  // Load journals on mount
  useEffect(() => {
    loadJournals();
    setupAudioDirectory();
  }, []);

  const setupAudioDirectory = async () => {
    const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_DIRECTORY, { intermediates: true });
    }
  };

  const loadJournals = async () => {
    try {
      const savedJournals = await AsyncStorage.getItem(JOURNAL_KEY);
      if (savedJournals) {
        setJournals(JSON.parse(savedJournals));
      }
    } catch (error) {
      console.error('Error loading journals:', error);
    }
  };

  // Pan Responder for voice recording gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRecording();
        setIsLocked(false);
      },
      onPanResponderMove: (_, gestureState) => {
        // Handle vertical slide for lock
        if (gestureState.dy < -50) {
          setIsLocked(true);
          Animated.spring(lockAnimation, {
            toValue: -50,
            useNativeDriver: true,
          }).start();
        }
        // Handle horizontal slide for cancel
        if (gestureState.dx < -50) {
          Animated.spring(slideAnimation, {
            toValue: -100,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          // Cancel recording
          stopRecording(true);
        } else if (!isLocked) {
          // Stop recording if not locked
          stopRecording();
        }
        // Reset animations
        Animated.parallel([
          Animated.spring(slideAnimation, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(lockAnimation, {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async (cancel = false) => {
    if (!isLocked || cancel) {
      setIsRecording(false);
      setIsLocked(false);
      
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
          if (!cancel) {
            const uri = recording.getURI();
            const fileName = `voice-note-${Date.now()}.m4a`;
            const newUri = `${AUDIO_DIRECTORY}${fileName}`;
            
            await FileSystem.moveAsync({
              from: uri,
              to: newUri,
            });

            saveJournal({
              id: Date.now().toString(),
              type: 'voice',
              content: newUri,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Failed to stop recording:', error);
        }
      }
      setRecording(null);
    }
  };

  const saveJournal = async (newJournal) => {
    try {
      const updatedJournals = [...journals, newJournal];
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(updatedJournals));
      setJournals(updatedJournals);
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  };

  const handleTextSubmit = async () => {
    if (journalText.trim()) {
      await saveJournal({
        id: Date.now().toString(),
        type: 'text',
        content: journalText,
        timestamp: new Date().toISOString(),
      });
      setJournalText('');
      setIsModalVisible(false);
    }
  };

  const playVoiceNote = async (uri) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing voice note:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>My Journal</Text>
        <TouchableOpacity 
          style={styles.newEntryButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="pencil" size={24} color="#FF7F50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.journalList}>
        {journals.map((journal) => (
          <TouchableOpacity
            key={journal.id}
            style={[styles.journalCard, isDark && styles.darkCard]}
            onPress={() => journal.type === 'voice' && playVoiceNote(journal.content)}
          >
            <View style={styles.journalContent}>
              <View style={styles.journalHeader}>
                <Text style={[styles.journalDate, isDark && styles.darkSubText]}>
                  {new Date(journal.timestamp).toLocaleDateString()}
                </Text>
                <Ionicons 
                  name={journal.type === 'voice' ? 'mic' : 'document-text'} 
                  size={20} 
                  color="#FF7F50" 
                />
              </View>
              {journal.type === 'text' ? (
                <Text style={[styles.journalText, isDark && styles.darkText]}>
                  {journal.content}
                </Text>
              ) : (
                <View style={styles.voiceNoteContainer}>
                  <Ionicons name="play" size={20} color="#FF7F50" />
                  <Text style={[styles.voiceNoteText, isDark && styles.darkText]}>
                    Voice Note
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* New Journal Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDark && styles.darkCard]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.darkText]}>New Journal Entry</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#333'} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              multiline
              placeholder="Write your thoughts..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={journalText}
              onChangeText={setJournalText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleTextSubmit}
              >
                <Text style={styles.submitButtonText}>Save</Text>
              </TouchableOpacity>

              <Animated.View
                style={[
                  styles.recordButton,
                  {
                    transform: [
                      { translateX: slideAnimation },
                      { translateY: lockAnimation }
                    ]
                  }
                ]}
                {...panResponder.panHandlers}
              >
                <Ionicons 
                  name="mic" 
                  size={24} 
                  color={isRecording ? '#FF0000' : '#FF7F50'} 
                />
              </Animated.View>
            </View>

            {isRecording && (
              <View style={styles.recordingIndicator}>
                <Text style={styles.recordingText}>
                  {isLocked ? 'Recording Locked' : 'Slide up to lock, left to cancel'}
                </Text>
              </View>
            )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  newEntryButton: {
    padding: 8,
  },
  journalList: {
    flex: 1,
  },
  journalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  journalDate: {
    color: '#666',
    fontSize: 14,
  },
  journalText: {
    color: '#333',
    fontSize: 16,
  },
  voiceNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceNoteText: {
    color: '#333',
    fontSize: 16,
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
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    fontSize: 16,
    color: '#333',
  },
  darkInput: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#FF7F50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  recordButton: {
    backgroundColor: '#f5f5f5',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    alignItems: 'center',
    marginTop: 16,
  },
  recordingText: {
    color: '#FF0000',
    fontSize: 14,
  },
});