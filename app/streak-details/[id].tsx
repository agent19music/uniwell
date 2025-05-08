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
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoutine } from '@/contexts/RoutineContext';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { format, subDays, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Path } from 'react-native-svg';
import StreakTimer from '@/components/StreakTimer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  const { getStreak, deleteStreak, updateStreak, breakStreak } = useRoutine();
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStreakData();

    // Set up periodic refresh every minute
    const refreshInterval = setInterval(() => {
      loadStreakData();
    }, 60000); // Refresh every minute

    return () => {
      clearInterval(refreshInterval);
    };
  }, [id]);

  const loadStreakData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const streakData = await getStreak(id);
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

  const handleBreakStreak = () => {
    Alert.alert(
      'Break Streak',
      'Are you sure you want to break this streak? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Break Streak',
          style: 'destructive',
          onPress: async () => {
            await breakStreak(id);
            await loadStreakData();
          }
        }
      ]
    );
  };

  const handleEditStreak = () => {
    router.push(`/edit-streak/${id}`);
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

  const progress = streak?.currentStreak || 0;
  const target = streak?.targetCount || 30;
  const percentage = Math.min(100, (progress / target) * 100);

  return (
    <ScrollView 
      style={[styles.container, isDark && styles.darkContainer]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditStreak}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isDark && styles.darkText]}>{streak?.title}</Text>
          <View style={[styles.typeBadge, streak?.type === 'break' ? styles.breakBadge : styles.buildBadge]}>
            <Octicons 
              name={streak?.type === 'break' ? 'flame' : 'rocket'} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.typeBadgeText}>
              {streak?.type === 'break' ? 'Breaking Habit' : 'Building Habit'}
            </Text>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <View style={[styles.timerCard, isDark && styles.darkTimerCard]}>
            <Text style={[styles.timerLabel, isDark && styles.darkText]}>Time Elapsed</Text>
            <StreakTimer 
              startDate={streak?.startDate || ''} 
              startTime={streak?.startTime || ''} 
            />
            <Text style={[styles.streakCount, isDark && styles.darkText]}>
              {progress} days
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Svg width={SCREEN_WIDTH - 48} height={200} viewBox="0 0 300 200">
            <Path
              d="M 50,100 Q 150,0 250,100"
              stroke={isDark ? '#333' : '#eee'}
              strokeWidth="2"
              fill="none"
            />
            <Path
              d="M 50,100 Q 150,0 250,100"
              stroke={colors.primary}
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${percentage * 3} 300`}
            />
            <Circle
              cx={50 + (percentage * 2)}
              cy={100 - (percentage * 0.8)}
              r="8"
              fill={colors.primary}
            />
          </Svg>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>{progress}</Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubText]}>Current</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>{streak?.longestStreak || 0}</Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubText]}>Longest</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>{target}</Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubText]}>Target</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>About This Streak</Text>
          <View style={[styles.infoCard, isDark && styles.darkCard]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.darkSubText]}>Started</Text>
              <Text style={[styles.infoValue, isDark && styles.darkText]}>
                {format(parseISO(streak?.startDate), 'MMMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.darkSubText]}>Status</Text>
              <Text style={[styles.infoValue, isDark && styles.darkText]}>
                {streak?.status || 'Active'}
              </Text>
            </View>
          </View>
        </View>

        {streak?.status === 'active' && (
          <View style={styles.breakSection}>
            <Text style={[styles.breakSectionTitle, isDark && styles.darkText]}>
              Need to Break Your Streak?
            </Text>
            <Text style={[styles.breakSectionSubtitle, isDark && styles.darkSubText]}>
              This action cannot be undone. Make sure you're certain.
            </Text>
            <TouchableOpacity 
              style={[styles.breakButton, isDark && styles.darkBreakButton]}
              onPress={handleBreakStreak}
            >
              <Text style={styles.breakButtonText}>Break Streak</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    padding: 24,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  buildBadge: {
    backgroundColor: '#FF7F50',
  },
  breakBadge: {
    backgroundColor: '#FF4500',
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Vercetti-Regular',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  breakSection: {
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.1)',
  },
  breakSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
  },
  breakSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
  },
  breakButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  darkBreakButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  breakButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  infoCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
  },
  darkCard: {
    backgroundColor: '#1c1c1e',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#fff',
  },
  darkSubText: {
    color: '#aaa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
    fontFamily: 'Vercetti-Regular',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 24,
    fontFamily: 'Vercetti-Regular',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#FF7F50',
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
  },
  timerContainer: {
    marginBottom: 24,
  },
  timerCard: {
    backgroundColor: 'rgba(255, 127, 80, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 127, 80, 0.1)',
  },
  darkTimerCard: {
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    borderColor: 'rgba(255, 127, 80, 0.2)',
  },
  timerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
  },
  editButton: {
    padding: 8,
  },
  streakCount: {
    fontSize: 16,
    color: '#FF7F50',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
  },
});