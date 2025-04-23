import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Animated, Vibration } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

const COLORING_PALETTE = [
  { id: '1', color: '#FF69B4', name: 'Pink' },
  { id: '2', color: '#87CEEB', name: 'Sky Blue' },
  { id: '3', color: '#98FB98', name: 'Mint' },
  { id: '4', color: '#DDA0DD', name: 'Plum' },
  { id: '5', color: '#F0E68C', name: 'Khaki' },
];

const NATURE_SOUNDS = [
  { id: '1', name: 'Rain', icon: 'rainy',  source: require('@/assets/nature-sounds/rain.mp3') },
  { id: '2', name: 'Forest', icon: 'leaf',  source: require('@/assets/nature-sounds/forest.mp3') },
  { id: '3', name: 'Waves', icon: 'water',  source: require('@/assets/nature-sounds/waves.mp3') },
];


const BREATHING_PATTERNS = [
  { id: '1', name: 'Square Breathing', duration: 16, pattern: '4-4-4-4' },
  { id: '2', name: 'Deep Calm', duration: 11, pattern: '4-7' },
  { id: '3', name: 'Relaxing Breath', duration: 14, pattern: '4-7-3' },
];

export default function GamesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedColor, setSelectedColor] = useState(COLORING_PALETTE[0].color);
  const [selectedSound, setSelectedSound] = useState(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const breathAnimation = useRef(new Animated.Value(1)).current;

  const startBreathing = (pattern) => {
    setIsBreathing(true);
    const [inhale, hold, exhale, holdEnd = 0] = pattern.pattern.split('-').map(Number);
    const totalDuration = (inhale + hold + exhale + holdEnd) * 1000;

    // Breathing animation
    Animated.sequence([
      // Inhale
      Animated.timing(breathAnimation, {
        toValue: 1.5,
        duration: inhale * 1000,
        useNativeDriver: true,
      }),
      // Hold
      Animated.timing(breathAnimation, {
        toValue: 1.5,
        duration: hold * 1000,
        useNativeDriver: true,
      }),
      // Exhale
      Animated.timing(breathAnimation, {
        toValue: 1,
        duration: exhale * 1000,
        useNativeDriver: true,
      }),
      // Hold at end if specified
      Animated.timing(breathAnimation, {
        toValue: 1,
        duration: holdEnd * 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Vibration.vibrate();
      setIsBreathing(false);
    });

    // Vibration feedback
    const vibratePattern = [0];
    vibratePattern.push(inhale * 1000, 100, hold * 1000, 100, exhale * 1000);
    if (holdEnd) vibratePattern.push(100, holdEnd * 1000);
    Vibration.vibrate(vibratePattern);
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
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

  interface SoundItem {
    id: string;
    name: string;
    icon: string;
    source: any;
  }

  const playSound = async (soundItem: SoundItem): Promise<void> => {
    try {
      // If there's already a sound playing, stop and unload it
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // If we're selecting the same sound that's already selected, just stop it
      if (selectedSound === soundItem.name && isPlaying) {
        setSelectedSound(null);
        setIsPlaying(false);
        return;
      }

      // Load and play the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        soundItem.source,
        { isLooping: true, volume: 1.0 }
      );

      setSound(newSound);
      setSelectedSound(soundItem.name);
      setIsPlaying(true);
      await newSound.playAsync();

      // Add status update listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          // Handle end of sound if needed
        }
      });

    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Add volume control
  const adjustVolume = async (volume) => {
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
          <Ionicons
            name={soundItem.icon}
            size={24}
            color={selectedSound === soundItem.name && isPlaying ? '#FF7F50' : '#666'}
          />
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
        <View style={[styles.section, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Peaceful Coloring</Text>
          
          {/* Color Palette */}
          <View style={styles.palette}>
            {COLORING_PALETTE.map((color) => (
              <TouchableOpacity
                key={color.id}
                style={[
                  styles.colorOption,
                  { backgroundColor: color.color },
                  selectedColor === color.color && styles.selectedColor,
                ]}
                onPress={() => setSelectedColor(color.color)}
              />
            ))}
          </View>

          {/* Coloring Canvas */}
          <View style={styles.canvas}>
            {/* This would be replaced with actual SVG or canvas for coloring */}
            <Text style={styles.canvasText}>Coloring Canvas Here</Text>
          </View>

          {/* Nature Sounds */}
          <View style={styles.soundControls}>
          
          </View>
          <Text style={[styles.sectionSubtitle, isDark && styles.darkSubText]}>
        Nature Sounds
      </Text>
      {renderSoundControls()}
      
      {selectedSound && (
        <View style={styles.volumeControl}>
          <Ionicons name="volume-low" size={20} color="#666" />
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
          <Ionicons name="volume-high" size={20} color="#666" />
        </View>
      )}
    </View>
   

        {/* Breathing Exercises */}
        <View style={[styles.section, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Breathing Exercises</Text>
          
          {/* Breathing Animation Circle */}
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                transform: [{ scale: breathAnimation }],
              },
            ]}
          >
            <Text style={styles.breathingText}>
              {isBreathing ? 'Breathe with the circle' : 'Tap a pattern to begin'}
            </Text>
          </Animated.View>

          {/* Breathing Patterns */}
          <View style={styles.patternContainer}>
            {BREATHING_PATTERNS.map((pattern) => (
              <TouchableOpacity
                key={pattern.id}
                style={[styles.patternButton, isDark && styles.darkPatternButton]}
                onPress={() => startBreathing(pattern)}
                disabled={isBreathing}
              >
                <Text style={[styles.patternName, isDark && styles.darkText]}>{pattern.name}</Text>
                <Text style={[styles.patternDuration, isDark && styles.darkSubText]}>
                  {pattern.duration} seconds
                </Text>
              </TouchableOpacity>
            ))}
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
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  palette: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FF7F50',
    transform: [{ scale: 1.1 }],
  },
  canvas: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  canvasText: {
    color: '#666',
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
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF7F5020',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  breathingText: {
    color: '#FF7F50',
    textAlign: 'center',
    padding: 20,
  },
  patternContainer: {
    gap: 12,
  },
  patternButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
  },
  darkPatternButton: {
    backgroundColor: '#2a2a2a',
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  patternDuration: {
    fontSize: 14,
    color: '#666',
  },
  soundControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  soundButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  selectedSound: {
    backgroundColor: '#FF7F5020',
  },
  playingIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF7F50',
    marginTop: 4,
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
});