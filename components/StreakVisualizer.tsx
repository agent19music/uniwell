import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  useColorScheme,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRoutine } from '@/contexts/RoutineContext';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StreakVisualizerProps {
  currentStreak?: number;
  isActive?: boolean;
  maxDaysToShow?: number;
  onPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.7, 300);
const STROKE_WIDTH = 12;

const StreakVisualizer: React.FC<StreakVisualizerProps> = ({
  currentStreak = 0,
  isActive = true,
  maxDaysToShow = 30,
  onPress = () => {},
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { fetchStreaks, streaks } = useRoutine();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  // Colors
  const colors = {
    primary: isDark ? '#34C759' : '#32CD32',
    secondary: isDark ? '#30D158' : '#228B22',
    background: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    subtext: isDark ? '#8E8E93' : '#666666',
    ring: isDark ? '#2C2C2E' : '#E5E5EA',
  };

  useEffect(() => {
    const loadStreaks = async () => {
      try {
        setLoading(true);
        await fetchStreaks();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadStreaks();
  }, []);

  useEffect(() => {
    if (isActive) {
      // Animate progress ring
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(progressAnim, {
            toValue: currentStreak / maxDaysToShow,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (currentStreak > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      });
    } else {
      // Reset animations
      Animated.parallel([
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.5,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      });
    }
  }, [isActive, currentStreak]);

  // Calculate progress ring
  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.subtext }]}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: '#FF3B30' }]}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <BlurView
        intensity={isDark ? 30 : 50}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
        <Animated.View
          style={[
            styles.progressContainer,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: rotationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }) },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Background Ring */}
          <View
            style={[
              styles.ring,
              {
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                borderRadius: CIRCLE_SIZE / 2,
                borderWidth: STROKE_WIDTH,
                borderColor: colors.ring,
              },
            ]}
          />

          {/* Progress Ring */}
          <Animated.View
            style={[
              styles.progressRing,
              {
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                borderRadius: CIRCLE_SIZE / 2,
                borderWidth: STROKE_WIDTH,
                borderColor: colors.primary,
                transform: [{ rotate: '-90deg' }],
                opacity: progressAnim,
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Center Content */}
          <View style={styles.centerContent}>
            <Text style={[styles.streakCount, { color: colors.text }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.subtext }]}>
              {currentStreak === 1 ? 'Day' : 'Days'}
            </Text>
          </View>
        </Animated.View>

        {/* Streak Status */}
        <View style={styles.statusContainer}>
          <MaterialCommunityIcons
            name={isActive ? 'fire' : 'fire-off'}
            size={24}
            color={isActive ? colors.primary : colors.subtext}
          />
          <Text style={[styles.statusText, { color: colors.subtext }]}>
            {isActive ? 'Active Streak' : 'Streak Ended'}
          </Text>
        </View>

        {/* Motivation Text */}
        <Text style={[styles.motivationText, { color: colors.subtext }]}>
          {isActive
            ? getMotivationalText(currentStreak)
            : "Don't worry! You can start again."}
        </Text>
      </BlurView>
    </TouchableOpacity>
  );
};

const getMotivationalText = (streak: number): string => {
  if (streak === 0) return "Start your journey today!";
  if (streak < 7) return "Great start! Keep going!";
  if (streak < 30) return "You're building momentum!";
  if (streak < 100) return "Impressive dedication!";
  return "You're unstoppable!";
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    margin: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  blurContainer: {
    padding: 24,
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ring: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  motivationText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default StreakVisualizer; 