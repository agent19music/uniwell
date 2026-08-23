import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet,
  Modal, PanResponder, Alert,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Microphone, 
  CaretUp, 
  LockSimple,
  VideoCamera 
} from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import * as Burnt from 'burnt';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { Menu } from '../components/Menu';
import { JournalCard } from '../components/JournalCard';
import { CircularVideoRecorder } from '../components/CircularVideoRecorder';
import { JournalEntry } from '../types/journal';
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { spacing } from '@/constants/theme';

const JOURNAL_KEY = '@journals';
const AUDIO_DIRECTORY = `${FileSystem.documentDirectory}audio/`;
const VIDEO_DIRECTORY = `${FileSystem.documentDirectory}video/`;

export default function JournalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  // State
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [titleText, setTitleText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isRecordingModalVisible, setIsRecordingModalVisible] = useState(false);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Audio
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    setupAudioDirectory();
    setupVideoDirectory();
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

  const setupVideoDirectory = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(VIDEO_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(VIDEO_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error('Error setting up video directory:', error);
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
          const formattedJournals = data.map((entry: any) => {
            let type: 'text' | 'voice' | 'video' = 'text';
            if (entry.content.includes('/audio/')) {
              type = 'voice';
            } else if (entry.content.includes('/video/')) {
              type = 'video';
            }
            return {
              id: entry.id,
              user_id: entry.user_id,
              title: entry.title,
              is_pinned: entry.is_pinned || false,
              type,
              content: entry.content,
              created_at: entry.created_at,
              timestamp: entry.created_at,
            };
          });
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

  const handleVideoSave = async (uri: string) => {
    if (!uri) return;
    
    try {
      setIsVideoModalVisible(false);
      const filename = `video-note-${Date.now()}.mp4`;
      const dest = `${VIDEO_DIRECTORY}${filename}`;
      await FileSystem.moveAsync({ from: uri, to: dest });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title: 'Video Note',
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
          type: 'video',
          is_pinned: false,
          created_at: data.created_at,
          timestamp: data.created_at,
        };
        setJournals(prev => [newEntry, ...prev]);
        await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify([newEntry, ...journals]));
      }

      Burnt.toast({ title: 'Video Note Saved', preset: 'done' });

    } catch (err) {
      console.error('Error saving video note:', err);
      Burnt.toast({ title: 'Error', message: 'Failed to save video note', preset: 'error' });
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
        } catch (err) {
          console.error('Failed to start recording', err);
        }
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy < -100) {
          if (!isLocked) {
            setIsLocked(true);
          }
        }
      },
      onPanResponderRelease: async (_, gs) => {
        if (isLocked) return;
        await audioRecorder.stop();
        handleRecordingSave(audioRecorder.uri as string);
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
          <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.textPrimary} weight="bold" />
          </IconButton>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Journal</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Journal List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? <LoadingState label="Loading your journal…" style={styles.loadingState} /> : <View style={styles.grid}>
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
          </View>}
          {journals.length === 0 && !loading && (
            <EmptyState
              description="Capture a thought, voice note, or video reflection when you are ready."
              icon={<Microphone size={48} color={colors.textMuted} weight="regular" />}
              style={styles.emptyState}
              title="Your journal is waiting"
            />
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
          <Card style={styles.inputContainer}>
            <Input
              label="Title"
              placeholder="Title"
              value={titleText}
              onChangeText={setTitleText}
            />
            <Input
              label="Reflection"
              containerStyle={styles.bodyField}
              placeholder="Write your thoughts..."
              value={bodyText}
              onChangeText={setBodyText}
              multiline
            />
            <View style={styles.actionButtons}>
              <View style={styles.mediaButtons}>
                <IconButton accessibilityLabel="Record voice note" onPress={() => setIsRecordingModalVisible(true)}>
                  <Microphone size={24} color={colors.textPrimary} />
                </IconButton>
                <IconButton accessibilityLabel="Record video note" onPress={() => setIsVideoModalVisible(true)}>
                  <VideoCamera size={24} color={colors.textPrimary} />
                </IconButton>
              </View>
              
              {(bodyText.trim().length > 0 || titleText.trim().length > 0) && (
                <Button
                  label={editingId ? 'Update' : 'Save'}
                  onPress={handleSave}
                  loading={isSaving}
                  size="compact"
                />
              )}
            </View>
          </Card>
        </View>
      </KeyboardAvoidingView>

      {/* Voice Recording Modal */}
      <Dialog
        visible={isRecordingModalVisible}
        onClose={() => setIsRecordingModalVisible(false)}
        dismissible
        title={isLocked ? 'Recording locked' : 'Hold to record'}
        footer={<Button label="Close" onPress={() => setIsRecordingModalVisible(false)} variant="secondary" />}
      >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {isLocked ? 'Recording Locked' : 'Hold to Record'}
            </Text>
            
            <View style={styles.micContainer}>
              <View
                style={[
                  styles.micButton, 
                  { 
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
              </View>
              
              {!isLocked && (
                <View style={styles.lockHint}>
                  <CaretUp size={20} color={colors.textSecondary} weight="bold" />
                  <Text style={[styles.hintText, { color: colors.textSecondary }]}>Swipe up to lock</Text>
                </View>
              )}
            </View>
      </Dialog>

      {/* Video Recording Modal */}
      <Modal
        visible={isVideoModalVisible}
        animationType="slide"
        onRequestClose={() => setIsVideoModalVisible(false)}
      >
        <CircularVideoRecorder
          onSave={handleVideoSave}
          onClose={() => setIsVideoModalVisible(false)}
        />
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
    paddingHorizontal: spacing.control,
    paddingVertical: spacing.micro,
  },
  headerSpacer: {
    width: 48,
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
    paddingHorizontal: spacing.control,
    paddingTop: spacing.micro,
    paddingBottom: 240,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    paddingVertical: spacing.page,
  },
  loadingState: {
    paddingVertical: spacing.page,
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.control,
    paddingBottom: Platform.OS === 'ios' ? spacing.section : spacing.control,
  },
  inputContainer: {
    gap: spacing.micro,
    padding: spacing.control,
  },
  bodyField: {
    maxHeight: 156,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.micro,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: spacing.micro,
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
