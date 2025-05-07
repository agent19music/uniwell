import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  useColorScheme,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoutine } from '@/contexts/RoutineContext';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { format, subDays, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const encouragingMessages = [
  "Keep that streak burning! You're building something amazing! 🔥",
  "Every day you stick to it makes you stronger! 💪",
  "You're on fire! This streak shows your dedication! 🌟",
  "Consistency is your superpower! Keep going! ⚡",
  "Look at you go! Your future self will thank you! 🎯",
  "This streak is proof of your commitment! Amazing work! 🏆",
  "You're unstoppable! Each day adds to your success story! 🚀",
  "Building great habits, one day at a time! Fantastic! ✨",
  "Your dedication is inspiring! Keep that momentum! 💫",
  "This streak is just the beginning of your journey! 🌈"
];

// Constants for animations
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.7, 300);
const STROKE_WIDTH = 12;
const colors = {
  primary: '#FF7F50',
  secondary: '#FF6347',
  ring: '#FF4500',
  background: '#ffffff',
  text: '#333333',
  darkText: '#ffffff',
  darkBackground: '#121212',
  darkCard: '#1e1e1e',
  darkSubText: '#aaaaaa',
  lightText: '#666666',
  lightBackground: '#ffffff',
  lightCard: '#fff',
  lightSubText: '#666666',
};

export default function StreakDetailsScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const router = useRouter();
  const { getStreak, deleteStreak, updateStreak } = useRoutine();
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const screenWidth = Dimensions.get('window').width;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Generate random encouraging message
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
    setEncouragement(encouragingMessages[randomIndex]);
  }, []);

  useEffect(() => {
    loadStreakData();
  }, [id]);

  const loadStreakData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // First check if we already have the streak data
      if (streak) {
        // Animate the progress ring to show current streak
        Animated.timing(progressAnim, {
          toValue: (streak.currentStreak || 0) / 100,
          duration: 1000,
          useNativeDriver: true,
        }).start();
        setLoading(false);
        return;
      }
      // If not, fetch it
      const streakData = await getStreak(id as string);
      if (streakData) {
        setStreak(streakData);
        Animated.timing(progressAnim, {
          toValue: (streakData.currentStreak || 0) / 100,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
      setError('Could not load streak details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    // In a real app, this would call an API to record a check-in
    console.log('Checking in for streak:', id);
  };
  
  const handleEditStreak = () => {
    router.push(`/edit-streak/${id}`);
  };
  
  const handleDeleteStreak = async () => {
    try {
      await deleteStreak(id as string);
      router.back();
    } catch (error) {
      console.error('Error deleting streak:', error);
      setError('Could not delete streak');
    }
  };

  console.log('this is explicit id',id);
  console.log('this is streak',streak);
  console.log('this is params',params);
  
  
  // Calculate progress ring parameters
  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  // Generate last 30 days for chart
  const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
  
  // Generate chart data
  const generateChartData = () => {
    return {
      labels: last30Days.map(date => format(date, 'MM/dd')),
      datasets: [{
        data: last30Days.map(date => {
          if (!streak?.history) return 0;
          return streak.history.some((entry: any) => 
            isSameDay(parseISO(entry.date), date)
          ) ? 1 : 0;
        })
      }]
    };
  };

  // Calculate consistency percentage
  const getConsistencyPercentage = () => {
    if (!streak?.history) return 0;
    const totalDays = differenceInDays(new Date(), parseISO(streak.startDate)) + 1;
    return Math.round((streak.history.length / totalDays) * 100);
  };
  
  // Function to generate mock check-in history
  // In a real app, this would be replaced by actual API calls
  const generateMockCheckInHistory = (streakData: any) => {
    if (!streakData) return [];
    
    const history = [];
    const today = new Date();
    const startDate = parseISO(streakData.startDate);
    const totalDays = differenceInDays(today, startDate) + 1;
    
    for (let i = 0; i < totalDays; i++) {
      const date = subDays(today, i);
      history.push({
        date,
        checked: i < streakData.length // Assume all days in the streak length were checked
      });
    }
    
    return history.reverse(); // Most recent last
  };

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading streak details...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FF7F50" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditStreak}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#FF7F50" />
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.title, isDark && styles.darkText]}>{streak?.title || 'My Streak'}</Text>
        <View style={[styles.typeBadge, streak?.type === 'break' ? styles.breakBadge : styles.buildBadge]}>
          <Text style={styles.typeBadgeText}>{streak?.type === 'break' ? 'Breaking Habit' : 'Building Habit'}</Text>
        </View>
      </View>
      
      {/* Streak Visualizer */}
      <BlurView
        intensity={isDark ? 30 : 50}
        tint={isDark ? 'dark' : 'light'}
        style={styles.visualizerContainer}
      >
        <Animated.View
          style={[
            styles.progressContainer,
            {
              transform: [{ scale: scaleAnim }],
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
            <Text style={[styles.streakCount, isDark && styles.darkText]}>
              {streak?.length || 0}
            </Text>
            <Text style={[styles.streakLabel, isDark && styles.darkSubText]}>
              {streak?.length === 1 ? 'Day' : 'Days'}
            </Text>
          </View>
        </Animated.View>

        {/* Streak Status */}
        <View style={styles.statusContainer}>
          <Octicons
            name={streak?.type === 'break' ? 'flame' : 'rocket'}
            size={24}
            color="#FF7F50"
          />
          <Text style={[styles.statusText, isDark && styles.darkSubText]}>
            Started on {format(parseISO(streak?.startDate || new Date().toISOString()), 'MMMM d, yyyy')}
          </Text>
        </View>

        {/* Motivation Text */}
        <Text style={[styles.motivationText, isDark && styles.darkSubText]}>
          {encouragement}
        </Text>
      </BlurView>
      
      {/* Streak History Chart */}
      <View style={[styles.chartContainer, isDark && styles.darkCard]}>
        <Text style={[styles.chartTitle, isDark && styles.darkText]}>Last 30 Days</Text>
        <LineChart
          data={generateChartData()}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: isDark ? '#1E1E1E' : '#ffffff',
            backgroundGradientFrom: isDark ? '#1E1E1E' : '#ffffff',
            backgroundGradientTo: isDark ? '#1E1E1E' : '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 127, 80, ${opacity})`,
            labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(51, 51, 51, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#FF7F50"
            }
          }}
          bezier
          style={styles.chart}
          withDots={true}
          fromZero={true}
        />
      </View>
      
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, isDark && styles.darkCard]}>
          <Text style={[styles.statValue, { color: '#FF7F50' }]}>
            {streak?.length || 0}
          </Text>
          <Text style={[styles.statLabel, isDark && styles.darkSubText]}>Current Streak</Text>
        </View>
        
        <View style={[styles.statCard, isDark && styles.darkCard]}>
          <Text style={[styles.statValue, { color: '#FF7F50' }]}>
            {getConsistencyPercentage()}%
          </Text>
          <Text style={[styles.statLabel, isDark && styles.darkSubText]}>Consistency</Text>
        </View>
      </View>
      
      {/* Check-in Button */}
      <TouchableOpacity 
        style={styles.checkInButton}
        onPress={handleCheckIn}
      >
        <Text style={styles.checkInButtonText}>Check In Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    fontFamily: 'Vercetti-Regular',
    textAlign: 'center',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  buildBadge: {
    backgroundColor: 'rgba(255, 127, 80, 0.2)',
  },
  breakBadge: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
  },
  typeBadgeText: {
    color: '#FF7F50',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  visualizerContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
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
    color: '#000000',
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
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
    color: '#666666',
  },
  motivationText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    color: '#666666',
    lineHeight: 20,
  },
  chartContainer: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Vercetti-Regular',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  checkInButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#FF7F50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  checkInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 40,
    color: '#333333',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 40,
    color: '#FF3B30',
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF7F50',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
});