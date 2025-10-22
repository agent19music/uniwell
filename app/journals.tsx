import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  useColorScheme, TouchableOpacity,
  Modal, TextInput, Animated, PanResponder, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';

const JOURNAL_KEY = '@journals';
const AUDIO_DIRECTORY = `${FileSystem.documentDirectory}audio/`;

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [journals, setJournals] = useState([]);

  // Recording
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const lockAnimation = useRef(new Animated.Value(0)).current;
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    loadJournals();
    setupAudioDirectory();

    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const setupAudioDirectory = async () => {
    const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_DIRECTORY, { intermediates: true });
    }
  };

  const loadJournals = async () => {
    try {
      const saved = await AsyncStorage.getItem(JOURNAL_KEY);
      if (saved) setJournals(JSON.parse(saved));
    } catch (err) {
      console.error('Error loading journals:', err);
    }
  };

  const saveJournal =  async (entry: any) => {
    try {
      const updated = [...journals, entry];
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(updated));
      setJournals(updated as never[]);
    } catch (err) {
      console.error('Error saving journal:', err);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setIsLocked(false);
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy < -50) {
          setIsLocked(true);
          Animated.spring(lockAnimation, { toValue: -50, useNativeDriver: true }).start();
        }
        if (gs.dx < -50) {
          Animated.spring(slideAnimation, { toValue: -100, useNativeDriver: true }).start();
        }
      },
      onPanResponderRelease: async (_, gs) => {
        if (gs.dx < -50) {
          await audioRecorder.stop(); // Cancel
        } else if (!isLocked) {
          await audioRecorder.stop();
          handleRecordingSave(audioRecorder.uri as string);
        }
        Animated.parallel([
          Animated.spring(slideAnimation, { toValue: 0, useNativeDriver: true }),
          Animated.spring(lockAnimation, { toValue: 0, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  const handleRecordingSave = async (uri: string) => {
    if (!uri) return;
    const filename = `voice-note-${Date.now()}.m4a`;
    const dest = `${AUDIO_DIRECTORY}${filename}`;
    try {
      await FileSystem.moveAsync({ from: uri, to: dest });
      saveJournal({
        id: Date.now().toString(),
        type: 'voice',
        content: dest,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error saving voice note:', err);
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

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      {/* Header & Entry List */}
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>My Journal</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Ionicons name="pencil" size={24} color="#FF7F50" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.journalList}>
        {journals.map((j: any) => (
          <TouchableOpacity
            key={j.id}
            style={[styles.journalCard, isDark && styles.darkCard]}
            onPress={() => j.type === 'voice' && useAudioPlayer({ uri: j.content }).play()}
          >
            <View style={styles.journalContent}>
              <View style={styles.journalHeader}>
                <Text style={[styles.journalDate, isDark && styles.darkSubText]}>
                  {new Date(j.timestamp).toLocaleDateString()}
                </Text>
                <Ionicons
                  name={j.type === 'voice' ? 'mic' : 'document-text'}
                  size={20}
                  color="#FF7F50"
                />
              </View>
              {j.type === 'text' ? (
                <Text style={[styles.journalText, isDark && styles.darkText]}>
                  {j.content}
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

      {/* New Entry Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
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
              <TouchableOpacity style={styles.submitButton} onPress={handleTextSubmit}>
                <Text style={styles.submitButtonText}>Save</Text>
              </TouchableOpacity>
              <Animated.View
                style={[
                  styles.recordButton,
                  { transform: [{ translateX: slideAnimation }, { translateY: lockAnimation }] },
                ]}
                {...panResponder.panHandlers}
              >
                <Ionicons name="mic" size={24} color={recorderState.isRecording ? '#FF0000' : '#FF7F50'} />
              </Animated.View>
            </View>
            {recorderState.isRecording && (
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
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  journalList: {
    flex: 1,
    padding: 16,
  },
  journalCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  darkCard: {
    backgroundColor: '#222',
  },
  journalContent: {
    flex: 1,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journalDate: {
    fontSize: 14,
    color: '#666',
  },
  darkSubText: {
    color: '#999',
  },
  voiceNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceNoteText: {
    fontSize: 14,
    color: '#666',
  },
  recordingIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
  },
  recordingText: {
    color: '#fff',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  darkInput: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#FF7F50',
    padding: 10,
    borderRadius: 5,
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#FF7F50',
    padding: 10,
  },
  journalText: {
    fontSize: 16,
    color: '#333',
  },

});