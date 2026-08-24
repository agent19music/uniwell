import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Animated, Vibration } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloudRain, Leaf, Drop, SpeakerLow, SpeakerHigh, Barbell, CaretRight } from 'phosphor-react-native';
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import BreathingExercise from '@/app/BreathingExercise';
import { useRouter } from 'expo-router';
import ColoringCanvas from '@/components/ColoringCanvas';

const COLORING_PALETTE = [
  { id: '1', color: '#FF69B4', name: 'Pink' },
  { id: '2', color: '#87CEEB', name: 'Sky Blue' },
  { id: '3', color: '#98FB98', name: 'Mint' },
  { id: '4', color: '#DDA0DD', name: 'Plum' },
  { id: '5', color: '#F0E68C', name: 'Khaki' },
];

interface SoundItem {
  id: string;
  name: string;
  icon: (size: number, color: string) => React.ReactNode;
  source: any;
}

const NATURE_SOUNDS: SoundItem[] = [
  { id: '1', name: 'Rain', icon: (s, c) => <CloudRain size={s} color={c} weight="regular" />, source: require('@/assets/nature-sounds/rain.mp3') },
  { id: '2', name: 'Forest', icon: (s, c) => <Leaf size={s} color={c} weight="regular" />, source: require('@/assets/nature-sounds/forest.mp3') },
  { id: '3', name: 'Waves', icon: (s, c) => <Drop size={s} color={c} weight="regular" />, source: require('@/assets/nature-sounds/waves.mp3') },
];

export default function GamesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [sound, setSound] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBreathingFullscreen, setIsBreathingFullscreen] = useState(false);
  const router = useRouter();

  const handleBreathingExercisePress = () => {
    setIsBreathingFullscreen(false);
    router.push('/BreathingExercise');
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      Vibration.cancel();
    };
  }, [sound]);

  useEffect(() => {
    setupAudio();
    return () => {
      cleanupAudio();
    };
  }, []);

  const setupAudio = async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
        interruptionMode: 'mixWithOthers',
        interruptionModeAndroid: 'duckOthers'
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const cleanupAudio = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error cleaning up audio:', error);
      }
    }
  };

  const playSound = async (soundItem: SoundItem): Promise<void> => {
    try {
      // If there's already a sound playing, stop and unload it
      if (sound) {
        sound.pause();
        sound.remove();
      }

      // If we're selecting the same sound that's already selected, just stop it
      if (selectedSound === soundItem.name && isPlaying) {
        setSelectedSound(null);
        setIsPlaying(false);
        return;
      }

      // Load and play the new sound
      const newSound = createAudioPlayer(soundItem.source);
      newSound.loop = true;
      newSound.volume = 1.0;

      setSound(newSound);
      setSelectedSound(soundItem.name);
      setIsPlaying(true);
      newSound.play();

      // Add status update listener
      newSound.addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish) {
          // Handle end of sound if needed
        }
      });

    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Add volume control
  const adjustVolume = async (volume: number) => {
    if (sound) {
      try {
        await sound.setVolumeAsync(volume);
      } catch (error) {
        console.error('Error adjusting volume:', error);
      }
    }
  };

  // Update the sound controls section in the render
  const renderSoundControls = () => (
    <View style={styles.soundControls}>
      {NATURE_SOUNDS.map((soundItem) => (
        <TouchableOpacity
          key={soundItem.id}
          style={[
            styles.soundButton,
            selectedSound === soundItem.name && isPlaying && styles.selectedSound,
          ]}
          onPress={() => playSound(soundItem)}
        >
          {soundItem.icon(24, selectedSound === soundItem.name && isPlaying ? '#FF7F50' : '#666')}
          <Text style={styles.soundText}>{soundItem.name}</Text>
          {selectedSound === soundItem.name && isPlaying && (
            <View style={styles.playingIndicator} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.darkText]}>Mind Games</Text>
          <Text style={[styles.subtitle, isDark && styles.darkSubText]}>Take a moment to relax</Text>
        </View>

        {/* Coloring Section */}
        {/* <View style={[styles.section, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Peaceful Coloring</Text>
          <Text style={[styles.sectionDescription, isDark && styles.darkSubText]}>
            Express your creativity with these beautiful illustrations
          </Text>
          <ColoringCanvas />
        </View> */}

        {/* Nature Sounds */}
        {/* <View style={[styles.section, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Nature Sounds</Text>
          <Text style={[styles.sectionDescription, isDark && styles.darkSubText]}>
            Relax with soothing ambient sounds
          </Text>
          {renderSoundControls()}
          
          {selectedSound && (
            <View style={styles.volumeControl}>
              <SpeakerLow size={20} color="#666" weight="regular" />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={1}
                onValueChange={adjustVolume}
                minimumTrackTintColor="#FF7F50"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#FF7F50"
              />
              <SpeakerHigh size={20} color="#666" weight="regular" />
            </View>
          )}
        </View> */}

        {/* Breathing Exercises */}
        <View style={[styles.section, isDark && styles.darkCard, styles.breathingSection]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Breathing Exercises</Text>
          <Text style={[styles.sectionDescription, isDark && styles.darkSubText]}>
            Practice guided breathing to reduce stress and promote relaxation
          </Text>
          <View style={styles.breathingWidget}>
            <TouchableOpacity 
              style={[styles.breathingWidgetButton, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}
              onPress={handleBreathingExercisePress}
            >
              <Barbell size={24} color="#4A90E2" weight="regular" />
              <Text style={[styles.breathingWidgetText, isDark && styles.darkText]}>Start Breathing Exercise</Text>
              <CaretRight size={20} color="#4A90E2" weight="regular" />
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    padding: 20,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  soundControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  soundButton: {
    alignItems: 'center',
    padding: 10,
  },
  selectedSound: {
    backgroundColor: '#FF7F5020',
    borderRadius: 12,
  },
  soundText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
    height: 40,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  playingIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF7F50',
    marginTop: 4,
  },
  breathingSection: {
    minHeight: 200,
    padding: 20,
  },
  breathingWidget: {
    marginTop: 16,
  },
  breathingWidgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  breathingWidgetText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
});