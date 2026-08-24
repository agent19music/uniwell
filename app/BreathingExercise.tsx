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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUp, Pause, ArrowDown, Pulse, Play, XCircle, Microphone, MicrophoneSlash, Barbell } from 'phosphor-react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { VideoView, useVideoPlayer } from 'expo-video';
import Reanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  Easing, 
  withSequence,
  interpolateColor 
} from 'react-native-reanimated';
import { useEvent } from 'expo';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

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
  const router = useRouter();
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
  
  // Reanimated values for enhanced animations
  const pulseAnimation = useSharedValue(1);
  const colorAnimation = useSharedValue(0);
  const widgetExpansion = useSharedValue(0);
  
  // Audio setup
  const [sound, setSound] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // User preferences
  const [hapticEnabled, setHapticEnabled] = useState(true);

  // Timer setup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = useRef(0);
  const phaseTimings = useRef<number[]>([]);
  const currentPhaseIndex = useRef(0);
  // Update the video player setup with loop functionality
  const videoSource = "https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/gradientvideobglong.mp4"
  const videoPlayer = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  // Add video playing state tracking
  const { isPlaying } = useEvent(videoPlayer, 'playingChange', { 
    isPlaying: videoPlayer?.playing ?? false 
  });

  useEffect(() => {
    setupAudio();
    startPulseAnimation();
    
    // Video player is now configured in the initialization callback
    
    return () => {
      cleanupAudio();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // No need to explicitly stop video as it will be cleaned up automatically
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
        if (sound.remove) {
          sound.remove();
        }
      } catch (error) {
        console.error('Error cleaning up audio:', error);
      }
    }
  };

  // Start subtle pulse animation for background
  const startPulseAnimation = () => {
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
  };

  // Animated styles using Reanimated
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorAnimation.value,
      [0, 0.5, 1],
      [
        selectedPattern.colors[0],
        selectedPattern.colors[1],
        selectedPattern.colors[0]
      ]
    );
    
    return {
      backgroundColor,
      transform: [{ scale: pulseAnimation.value }]
    };
  });

  const animatedWidgetStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(widgetExpansion.value ? 280 : 200, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      height: withTiming(widgetExpansion.value ? 120 : 48, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    };
  });

  const playBreathingCue = async (phase: 'inhale' | 'hold' | 'exhale' | 'holdEnd') => {
    if (isMuted) return;
    
    try {
      const soundFile = phase === 'inhale' 
        ? require('../assets/sounds/inhale.mp3') 
        : phase === 'exhale'
          ? require('../assets/sounds/exhale.mp3')
          : require('../assets/sounds/hold.mp3');
          
      // Create and play the sound using expo-audio
      const newSound = createAudioPlayer(soundFile);
      setSound(newSound);
      newSound.play();
    } catch (error) {
      console.error('Error playing breathing cue:', error);
    }
  };

  const startBreathing = (pattern = selectedPattern) => {
    setIsActive(true);
    setIsPaused(false);
    setSelectedPattern(pattern);
    colorAnimation.value = 0;
    
    // Parse the pattern string to get timings
    const timings = pattern.pattern.split('-').map(Number);
    const [inhale, hold, exhale, holdEnd = 0] = timings;
    
    phaseTimings.current = [
      inhale * 1000, // inhale
      hold * 1000,   // hold
      exhale * 1000, // exhale
      holdEnd * 1000 // holdEnd
    ];
    
    totalDuration.current = phaseTimings.current.reduce((a, b) => a + b, 0);
    setRemainingTime(totalDuration.current);
    currentPhaseIndex.current = 0;
    setCurrentPhase('inhale');
    
    // Start with inhale phase
    startPhase('inhale');
    
    // Background color animation
    colorAnimation.value = withRepeat(
      withTiming(1, { duration: totalDuration.current }),
      -1 // Infinite repeat
    );

    // Start timer
    startTimer();
  };

  const startPhase = (phase: 'inhale' | 'hold' | 'exhale' | 'holdEnd') => {
    setCurrentPhase(phase);
    playBreathingCue(phase);
    
    if (hapticEnabled) {
      switch (phase) {
        case 'inhale':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'hold':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'exhale':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'holdEnd':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
      }
    }
    
    // Breathing animation
    switch (phase) {
      case 'inhale':
        Animated.timing(breathAnimation, {
          toValue: 1.5,
          duration: phaseTimings.current[0],
          useNativeDriver: true,
        }).start(() => {
          if (!isPaused && isActive) {
            setTimeout(() => {
              currentPhaseIndex.current = 1;
              startPhase('hold');
            }, 100);
          }
        });
        break;
      case 'hold':
        Animated.timing(breathAnimation, {
          toValue: 1.5,
          duration: phaseTimings.current[1],
          useNativeDriver: true,
        }).start(() => {
          if (!isPaused && isActive) {
            setTimeout(() => {
              currentPhaseIndex.current = 2;
              startPhase('exhale');
            }, 100);
          }
        });
        break;
      case 'exhale':
        Animated.timing(breathAnimation, {
          toValue: 1,
          duration: phaseTimings.current[2],
          useNativeDriver: true,
        }).start(() => {
          if (!isPaused && isActive) {
            if (phaseTimings.current[3] > 0) {
              setTimeout(() => {
                currentPhaseIndex.current = 3;
                startPhase('holdEnd');
              }, 100);
            } else {
              // If no hold at end, go back to inhale
              setTimeout(() => {
                currentPhaseIndex.current = 0;
                startPhase('inhale');
              }, 100);
            }
          }
        });
        break;
      case 'holdEnd':
        Animated.timing(breathAnimation, {
          toValue: 1,
          duration: phaseTimings.current[3],
          useNativeDriver: true,
        }).start(() => {
          if (!isPaused && isActive) {
            setTimeout(() => {
              currentPhaseIndex.current = 0;
              startPhase('inhale');
            }, 100);
          }
        });
        break;
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsActive(false);
          onComplete?.();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000) as unknown as NodeJS.Timeout;
  };

  const pauseBreathing = () => {
    setIsPaused(true);
    breathAnimation.stopAnimation();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resumeBreathing = () => {
    setIsPaused(false);
    startPhase(currentPhase);
    startTimer();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (sound) {
      sound.volume = isMuted ? 1 : 0;
    }
  };

  const toggleHaptic = () => {
    setHapticEnabled(!hapticEnabled);
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'inhale':
        return 'Inhale';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Exhale';
      case 'holdEnd':
        return 'Hold';
      default:
        return 'Breathe';
    }
  };

  const getPhaseIcon = (size: number, color: string) => {
    switch (currentPhase) {
      case 'inhale': return <ArrowUp size={size} color={color} weight="regular" />;
      case 'hold': return <Pause size={size} color={color} weight="regular" />;
      case 'exhale': return <ArrowDown size={size} color={color} weight="regular" />;
      case 'holdEnd': return <Pause size={size} color={color} weight="regular" />;
      default: return <Pulse size={size} color={color} weight="regular" />;
    }
  };

  const handleEndSession = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsActive(false);
    setCurrentPhase('inhale');
    onComplete?.();
  };

  const renderTimerWidget = () => (
    <Reanimated.View
      style={[
        styles.timerWidget, 
        isDark && styles.darkTimerWidget,
        animatedWidgetStyle
      ]}
    >
      <TouchableOpacity
        style={styles.timerContent}
        onPress={() => {
          widgetExpansion.value = widgetExpansion.value ? 0 : 1;
          setShowControls(!showControls);
        }}
      >
        {getPhaseIcon(18, selectedPattern.colors[0])}
        <Text style={[styles.timerText, isDark && styles.darkText]}>
          {isActive ? getPhaseLabel() : 'Tap to Start'}
        </Text>
        <Text style={[styles.timerDigits, { color: selectedPattern.colors[0] }]}>
          {formatTime(remainingTime)}
        </Text>
      </TouchableOpacity>

      {showControls && (
        <View style={styles.controls}>
          {isActive ? (
            <View style={styles.controlRow}>
              {isPaused ? (
                <TouchableOpacity onPress={resumeBreathing} style={styles.controlButton}>
                  <Play size={22} color={selectedPattern.colors[0]} weight="fill" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={pauseBreathing} style={styles.controlButton}>
                  <Pause size={22} color={selectedPattern.colors[0]} weight="fill" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity onPress={handleEndSession} style={styles.controlButton}>
                <XCircle size={22} color={selectedPattern.colors[0]} weight="regular" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
                {isMuted
                  ? <MicrophoneSlash size={22} color={selectedPattern.colors[0]} weight="regular" />
                  : <Microphone size={22} color={selectedPattern.colors[0]} weight="regular" />}
              </TouchableOpacity>
              
              <TouchableOpacity onPress={toggleHaptic} style={styles.controlButton}>
                <Barbell size={22} color={selectedPattern.colors[0]} weight={hapticEnabled ? "regular" : "thin"} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: selectedPattern.colors[0] }]}
              onPress={() => startBreathing()}
            >
              <Text style={styles.startButtonText}>Begin Exercise</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Reanimated.View>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      

      <View style={styles.mainContent}>
        <VideoView
          player={videoPlayer}
          style={styles.backgroundVideo}
          contentFit="cover"
        />
        <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} />

        <View style={styles.content}>
          {isActive ? (
            <>
              <Text style={[styles.title, isDark && styles.darkText]}>
                {selectedPattern.name}
              </Text>
              <Text style={[styles.description, isDark && styles.darkSubText]}>
                {currentPhase === 'inhale' ? 'Breathe in...' : 
                 currentPhase === 'exhale' ? 'Breathe out...' : 'Hold...'}
              </Text>

              <Animated.View
                style={[
                  styles.breathingCircle,
                  {
                    transform: [{ scale: breathAnimation }],
                    backgroundColor: selectedPattern.colors[0] + '40',
                    borderColor: selectedPattern.colors[0],
                  },
                ]}
              >
                {getPhaseIcon(36, selectedPattern.colors[0])}
                <Text style={[styles.breathingText, { color: selectedPattern.colors[0] }]}>
                  {getPhaseLabel()}
                </Text>
              </Animated.View>
            </>
          ) : (
            <>
              <Text style={[styles.title, isDark && styles.darkText]}>
                Breathing Exercise
              </Text>
              <Text style={[styles.description, isDark && styles.darkSubText]}>
                Select a breathing pattern to begin
              </Text>

              <View style={styles.patternContainer}>
                {BREATHING_PATTERNS.map((pattern) => (
                  <TouchableOpacity
                    key={pattern.id}
                    style={[
                      styles.patternButton,
                      selectedPattern.id === pattern.id && styles.selectedPattern,
                      selectedPattern.id === pattern.id && { backgroundColor: pattern.colors[0] + '20' },
                      isDark && styles.darkPatternButton,
                    ]}
                    onPress={() => setSelectedPattern(pattern)}
                  >
                    <View style={styles.patternHeader}>
                      <Text
                        style={[
                          styles.patternName,
                          selectedPattern.id === pattern.id && styles.selectedPatternText,
                          selectedPattern.id === pattern.id && { color: pattern.colors[0] },
                          isDark && styles.darkText,
                        ]}
                      >
                        {pattern.name}
                      </Text>
                      <View 
                        style={[
                          styles.patternDot, 
                          { backgroundColor: pattern.colors[0] }
                        ]} 
                      />
                    </View>
                    <Text
                      style={[
                        styles.patternDuration,
                        selectedPattern.id === pattern.id && { color: pattern.colors[0] },
                        isDark && styles.darkSubText,
                      ]}
                    >
                      {pattern.description} · {pattern.duration}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {renderTimerWidget()}
      </View>
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBlur: {
    flex: 1,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerRight: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    position: 'relative',
  },
  backgroundVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
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
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  breathIcon: {
    marginBottom: 8,
  },
  breathingText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
    color: '#fff',
  },
  patternContainer: {
    width: '100%',
    gap: 12,
  },
  patternButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  patternDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  selectedPattern: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Vercetti-Regular',
  },
  patternDuration: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Vercetti-Regular',
  },
  selectedPatternText: {
    color: '#fff',
  },
  darkPatternButton: {
    backgroundColor: 'rgba(30, 30, 30, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    alignSelf: 'center',
    width: 200,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
  },
  timerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  phaseIcon: {
    marginRight: 8,
  },
  darkTimerWidget: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Vercetti-Regular',
    flex: 1,
  },
  timerDigits: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Vercetti-Regular',
  },
  controls: {
    padding: 12,
    paddingTop: 0,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
});