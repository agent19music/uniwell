import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  useColorScheme,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Enhanced breathing patterns with more options
const BREATHING_PATTERNS = [
  {
    id: '1',
    name: 'Square Breathing',
    description: 'Equal parts inhale, hold, exhale, and hold',
    duration: 16,
    pattern: '4-4-4-4',
    colors: ['#4A90E2', '#357ABD'],
  },
  {
    id: '2',
    name: 'Deep Calm',
    description: 'Long exhale for relaxation',
    duration: 11,
    pattern: '4-7',
    colors: ['#50E3C2', '#2E8B57'],
  },
  {
    id: '3',
    name: 'Relaxing Breath',
    description: 'Extended exhale for stress relief',
    duration: 14,
    pattern: '4-7-3',
    colors: ['#9B59B6', '#8E44AD'],
  },
  {
    id: '4',
    name: 'Box Breathing',
    description: 'Military technique for focus',
    duration: 16,
    pattern: '4-4-4-4',
    colors: ['#E74C3C', '#C0392B'],
  },
  {
    id: '5',
    name: '4-7-8 Breathing',
    description: 'Natural tranquilizer for the nervous system',
    duration: 19,
    pattern: '4-7-8',
    colors: ['#3498DB', '#2980B9'],
  },
];

interface BreathingExerciseProps {
  onComplete?: () => void;
}

export default function BreathingExercise({ onComplete }: BreathingExerciseProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // State management
  const [selectedPattern, setSelectedPattern] = useState(BREATHING_PATTERNS[0]);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdEnd'>('inhale');
  const [showControls, setShowControls] = useState(false);
  
  // Animation refs
  const breathAnimation = useRef(new Animated.Value(1)).current;
  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const timerAnimation = useRef(new Animated.Value(0)).current;
  
  // Audio setup
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Timer setup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = useRef(0);

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

  const startBreathing = (pattern = selectedPattern) => {
    setIsActive(true);
    setIsPaused(false);
    setSelectedPattern(pattern);
    
    const [inhale, hold, exhale, holdEnd = 0] = pattern.pattern.split('-').map(Number);
    totalDuration.current = (inhale + hold + exhale + holdEnd) * 1000;
    setRemainingTime(totalDuration.current);

    // Breathing animation sequence
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
      if (!isPaused) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsActive(false);
        onComplete?.();
      }
    });

    // Background color animation
    Animated.timing(backgroundAnimation, {
      toValue: 1,
      duration: totalDuration.current,
      useNativeDriver: false,
    }).start();

    // Start timer
    startTimer();
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  };

  const pauseBreathing = () => {
    setIsPaused(true);
    breathAnimation.stopAnimation();
    backgroundAnimation.stopAnimation();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resumeBreathing = () => {
    setIsPaused(false);
    startBreathing();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (sound) {
      sound.setVolumeAsync(isMuted ? 1 : 0);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderTimerWidget = () => (
    <TouchableOpacity
      style={[styles.timerWidget, isDark && styles.darkTimerWidget]}
      onPress={() => setShowControls(!showControls)}
    >
      <Text style={[styles.timerText, isDark && styles.darkText]}>
        {formatTime(remainingTime)}
      </Text>
      {showControls && (
        <View style={styles.controls}>
          {isActive ? (
            isPaused ? (
              <TouchableOpacity onPress={resumeBreathing}>
                <Ionicons name="play" size={24} color="#FF7F50" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={pauseBreathing}>
                <Ionicons name="pause" size={24} color="#FF7F50" />
              </TouchableOpacity>
            )
          ) : null}
          <TouchableOpacity onPress={toggleMute}>
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={24}
              color="#FF7F50"
            />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.background,
          {
            backgroundColor: backgroundAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [selectedPattern.colors[0], selectedPattern.colors[1]],
            }),
          },
        ]}
      />

      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.darkText]}>
          {selectedPattern.name}
        </Text>
        <Text style={[styles.description, isDark && styles.darkSubText]}>
          {selectedPattern.description}
        </Text>

        <Animated.View
          style={[
            styles.breathingCircle,
            {
              transform: [{ scale: breathAnimation }],
              backgroundColor: selectedPattern.colors[0] + '40',
            },
          ]}
        >
          <Text style={[styles.breathingText, { color: selectedPattern.colors[0] }]}>
            {isActive
              ? currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)
              : 'Tap to begin'}
          </Text>
        </Animated.View>

        <View style={styles.patternContainer}>
          {BREATHING_PATTERNS.map((pattern) => (
            <TouchableOpacity
              key={pattern.id}
              style={[
                styles.patternButton,
                selectedPattern.id === pattern.id && styles.selectedPattern,
                isDark && styles.darkPatternButton,
              ]}
              onPress={() => startBreathing(pattern)}
              disabled={isActive}
            >
              <Text
                style={[
                  styles.patternName,
                  selectedPattern.id === pattern.id && styles.selectedPatternText,
                  isDark && styles.darkText,
                ]}
              >
                {pattern.name}
              </Text>
              <Text
                style={[
                  styles.patternDuration,
                  selectedPattern.id === pattern.id && styles.selectedPatternText,
                  isDark && styles.darkSubText,
                ]}
              >
                {pattern.duration} seconds
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {renderTimerWidget()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Vercetti-Regular',
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
  },
  breathingText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
  },
  patternContainer: {
    width: '100%',
    gap: 12,
  },
  patternButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedPattern: {
    backgroundColor: '#FF7F50',
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  patternDuration: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  selectedPatternText: {
    color: 'white',
  },
  darkPatternButton: {
    backgroundColor: '#1e1e1e',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  timerWidget: {
    position: 'absolute',
    bottom: 32,
    left: '50%',
    transform: [{ translateX: -100 }],
    width: 200,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkTimerWidget: {
    backgroundColor: '#1e1e1e',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  controls: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 