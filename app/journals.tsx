import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, Modal, TextInput, Animated,
  PanResponder, Alert, Dimensions, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Microphone, 
  ArrowCircleUp, 
  CheckCircle, 
  X, 
  CaretUp, 
  LockSimple 
} from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import * as Burnt from 'burnt';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { Menu } from '../components/Menu';
import { JournalCard } from '../components/JournalCard';
import { JournalEntry } from '../types/journal';
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

const { width } = Dimensions.get('window');

export default function JournalScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  // State
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [titleText, setTitleText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isRecordingModalVisible, setIsRecordingModalVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animations
  const lockAnimation = useRef(new Animated.Value(0)).current;
  const micScaleAnimation = useRef(new Animated.Value(1)).current;

  // Audio
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    setupAudioDirectory();
    loadJournals();
    setupAudioPermissions();
  }, []);

  const setupAudioPermissions = async () => {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      Alert.alert('Permission to access microphone was denied');
    }
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });
  };

  const setupAudioDirectory = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(AUDIO_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error('Error setting up audio directory:', error);
    }
  };

  const loadJournals = async () => {
    try {
      setLoading(true);
      // Load from cache first
      const saved = await AsyncStorage.getItem(JOURNAL_KEY);
      if (saved) setJournals(JSON.parse(saved));

      // Fetch from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data) {
          const formattedJournals = data.map((entry: any) => ({
            id: entry.id,
            user_id: entry.user_id,
            title: entry.title,
            is_pinned: entry.is_pinned || false,
            type: entry.content.startsWith('file://') || entry.content.includes('/audio/') ? 'voice' : 'text',
            content: entry.content,
            created_at: entry.created_at,
            timestamp: entry.created_at,
          }));
          setJournals(formattedJournals);
          await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(formattedJournals));
        }
      }
    } catch (err) {
      console.error('Error loading journals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bodyText.trim() && !titleText.trim()) return;

    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const entryData = {
        user_id: user.id,
        title: titleText,
        content: bodyText,
        entry_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        is_pinned: false, // Default to not pinned
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('journal_entries')
          .update({ title: titleText, content: bodyText })
          .eq('id', editingId);

        if (error) throw error;

        setJournals(prev => prev.map(j => j.id === editingId ? { ...j, title: titleText, content: bodyText } : j));
        setEditingId(null);
        Burnt.toast({ title: 'Journal Updated', preset: 'done' });
      } else {
        // Create new
        const { data, error } = await supabase
          .from('journal_entries')
          .insert(entryData)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const newEntry: JournalEntry = {
            id: data.id,
            user_id: user.id,
            title: data.title,
            content: data.content,
            type: 'text',
            is_pinned: false,
            created_at: data.created_at,
            timestamp: data.created_at,
          };
          setJournals(prev => [newEntry, ...prev]);
        }
        Burnt.toast({ title: 'Journal Saved', preset: 'done' });
      }

      setTitleText('');
      setBodyText('');
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(journals));

    } catch (error) {
      console.error('Error saving journal:', error);
      Burnt.toast({ title: 'Error', message: 'Failed to save journal', preset: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePin = async (id: string, current: boolean) => {
    try {
      // Optimistic update
      const updatedJournals = journals.map(j => j.id === id ? { ...j, is_pinned: !current } : j)
        .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setJournals(updatedJournals);

      const { error } = await supabase
        .from('journal_entries')
        .update({ is_pinned: !current })
        .eq('id', id);

      if (error) throw error;
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(updatedJournals));

    } catch (error) {
      console.error('Error pinning journal:', error);
      loadJournals(); // Revert on error
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Journal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            const updatedJournals = journals.filter(j => j.id !== id);
            setJournals(updatedJournals);

            const { error } = await supabase
              .from('journal_entries')
              .delete()
              .eq('id', id);

            if (error) throw error;
            await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(updatedJournals));
            Burnt.toast({ title: 'Deleted', preset: 'done' });
          } catch (error) {
            console.error('Error deleting:', error);
            loadJournals();
          }
        }
      }
    ]);
  };

  const handleEdit = (item: JournalEntry) => {
    if (item.type === 'voice') {
      Burnt.toast({ title: 'Cannot edit voice notes yet', preset: 'error' });
      return;
    }
    setTitleText(item.title || '');
    setBodyText(item.content);
    setEditingId(item.id);
  };

  const handleRecordingSave = async (uri: string) => {
    if (!uri) return;
    
    try {
      setIsRecordingModalVisible(false);
      const filename = `voice-note-${Date.now()}.m4a`;
      const dest = `${AUDIO_DIRECTORY}${filename}`;
      await FileSystem.moveAsync({ from: uri, to: dest });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title: 'Voice Note',
          entry_date: new Date().toISOString().split('T')[0],
          content: dest,
          created_at: new Date().toISOString(),
          is_pinned: false,
        })
        .select()
        .single();

      if (!error && data) {
        const newEntry: JournalEntry = {
          id: data.id,
          user_id: user.id,
          title: data.title,
          content: data.content,
          type: 'voice',
          is_pinned: false,
          created_at: data.created_at,
          timestamp: data.created_at,
        };
        setJournals(prev => [newEntry, ...prev]);
        await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify([newEntry, ...journals]));
      }

      Burnt.toast({ title: 'Voice Note Saved', preset: 'done' });

    } catch (err) {
      console.error('Error saving voice note:', err);
      Burnt.toast({ title: 'Error', message: 'Failed to save voice note', preset: 'error' });
    }
  };

  // Pan Responder for Voice Recording
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: async () => {
        try {
          await audioRecorder.prepareToRecordAsync();
          audioRecorder.record();
          setIsLocked(false);
          Animated.spring(micScaleAnimation, { toValue: 1.2, useNativeDriver: true }).start();
        } catch (err) {
          console.error('Failed to start recording', err);
        }
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy < -100) {
          if (!isLocked) {
            setIsLocked(true);
            Animated.spring(lockAnimation, { toValue: -50, useNativeDriver: true }).start();
          }
        }
      },
      onPanResponderRelease: async (_, gs) => {
        Animated.spring(micScaleAnimation, { toValue: 1, useNativeDriver: true }).start();
        if (isLocked) return;
        await audioRecorder.stop();
        handleRecordingSave(audioRecorder.uri as string);
        Animated.spring(lockAnimation, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} weight="bold" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Journal</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Journal List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {journals.map((item, index) => (
              <JournalCard 
                key={item.id}
                item={item} 
                onPin={handlePin} 
                onDelete={handleDelete} 
                onEdit={handleEdit}
                index={index}
              />
            ))}
          </View>
          {journals.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No journals yet. Start writing!
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
          <View style={[styles.inputContainer, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
            <TextInput
              style={[styles.titleInput, { color: colors.textPrimary }]}
              placeholder="Title"
              placeholderTextColor={colors.textSecondary}
              value={titleText}
              onChangeText={setTitleText}
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <TextInput
              style={[styles.bodyInput, { color: colors.textPrimary }]}
              placeholder="Write your thoughts..."
              placeholderTextColor={colors.textSecondary}
              value={bodyText}
              onChangeText={setBodyText}
              multiline
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => setIsRecordingModalVisible(true)} style={styles.iconButton}>
                <Microphone size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              
              {(bodyText.trim().length > 0 || titleText.trim().length > 0) && (
                <TouchableOpacity 
                  onPress={handleSave}
                  disabled={isSaving}
                  style={styles.iconButton}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : editingId ? (
                    <CheckCircle size={28} color={colors.primary} weight="fill" />
                  ) : (
                    <ArrowCircleUp size={28} color={colors.primary} weight="fill" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Voice Recording Modal */}
      <Modal
        visible={isRecordingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsRecordingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A1A' : '#fff' }]}>
            <TouchableOpacity 
              style={styles.closeModal}
              onPress={() => setIsRecordingModalVisible(false)}
            >
              <X size={24} color={colors.textPrimary} weight="bold" />
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {isLocked ? 'Recording Locked' : 'Hold to Record'}
            </Text>
            
            <View style={styles.micContainer}>
              <Animated.View 
                style={[
                  styles.micButton, 
                  { 
                    transform: [
                      { scale: micScaleAnimation },
                      { translateY: lockAnimation }
                    ],
                    backgroundColor: isLocked ? colors.primary : colors.card
                  }
                ]}
                {...panResponder.panHandlers}
              >
                {isLocked ? (
                  <LockSimple size={40} color="#fff" weight="fill" />
                ) : (
                  <Microphone size={40} color={colors.primary} weight="fill" />
                )}
              </Animated.View>
              
              {!isLocked && (
                <View style={styles.lockHint}>
                  <CaretUp size={20} color={colors.textSecondary} weight="bold" />
                  <Text style={[styles.hintText, { color: colors.textSecondary }]}>Swipe up to lock</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 160, // Space for input
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  inputContainer: {
    borderRadius: 20,
    padding: 12,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  separator: {
    height: 1,
    marginVertical: 8,
    opacity: 0.2,
  },
  bodyInput: {
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
    maxHeight: 100,
    paddingHorizontal: 4,
    minHeight: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  iconButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    minHeight: 300,
  },
  closeModal: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 40,
    marginTop: 10,
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  lockHint: {
    alignItems: 'center',
    marginTop: 20,
    opacity: 0.6,
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
  },
});
