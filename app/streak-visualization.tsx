import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, useColorScheme, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoutine } from '../contexts/RoutineContext';
import FlameAnimation from '../components/FlameAnimation';
import { format, subDays, isSameDay, isAfter } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Octicons } from '@expo/vector-icons';

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

export default function StreakVisualizationScreen() {
  const { id } = useLocalSearchParams();
  const { habits, getHabitHistory, streaks } = useRoutine();
  const [streakHistory, setStreakHistory] = useState<any[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [encouragement, setEncouragement] = useState('');
  const screenWidth = Dimensions.get('window').width;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadStreakData();
      // Set random encouraging message if there's a streak
      if (currentStreak > 0) {
        const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
        setEncouragement(encouragingMessages[randomIndex]);
      }
    }
  }, [id, currentStreak]);

  const loadStreakData = async () => {
    try {
      const habitHistory = await getHabitHistory(id as string);
      if (!habitHistory || habitHistory.length === 0) {
        setStreakHistory([]);
        setCurrentStreak(0);
        return;
      }
      const streakData = calculateStreakHistory(habitHistory);
      setStreakHistory(streakData);
      setCurrentStreak(streakData[streakData.length - 1]?.length || 0);
    } catch (error) {
      console.error('Error loading streak data:', error);
      setStreakHistory([]);
      setCurrentStreak(0);
    }
  };

  const calculateStreakHistory = (history: any[]) => {
    if (!history || history.length === 0) return [];

    const streaks = [];
    let currentStreak = 0;
    let currentStartDate: Date | null = null;
    
    // Sort history by date in ascending order
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedHistory.forEach((attempt, index) => {
      const currentDate = new Date(attempt.date);
      
      if (!currentStartDate) {
        currentStartDate = currentDate;
        currentStreak = 1;
      } else {
        const prevDate = new Date(sortedHistory[index - 1].date);
        const dayDiff = Math.floor(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dayDiff === 1) {
          // Consecutive day
          currentStreak++;
        } else {
          // Streak broken
          if (currentStreak > 0) {
            streaks.push({
              start_date: currentStartDate,
              end_date: prevDate,
              length: currentStreak
            });
          }
          currentStartDate = currentDate;
          currentStreak = 1;
        }
      }
    });

    // Add the last streak if exists
    if (currentStreak > 0) {
      streaks.push({
        start_date: currentStartDate,
        end_date: new Date(sortedHistory[sortedHistory.length - 1].date),
        length: currentStreak
      });
    }

    return streaks;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateWrapper}>
      <View style={[styles.emptyContainer, isDark && styles.darkCard]}>
        <Octicons 
          name="flame" 
          size={64} 
          color="#FF7F50" 
        />
        <Text style={[styles.emptyTitle, isDark && styles.darkText]}>
          Start Your First Streak!
        </Text>
        <Text style={[styles.emptyDescription, isDark && styles.darkSubText]}>
          Building positive habits starts with a single day. Ready to begin your journey?
        </Text>
        <TouchableOpacity 
          style={styles.startButton}
          onPress={() => router.push('/AddStreakScreen')}
        >
          <Text style={styles.startButtonText}>Create New Streak</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  console.log(streaks.length);
  

  if (!streaks.length) {
    return (
      <ScrollView style={[styles.container, isDark && styles.darkContainer]}>
        {renderEmptyState()}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.flameContainer, isDark && styles.darkCard]}>
        <FlameAnimation 
          streakCount={streaks.length} 
          isActive={streaks.length > 0} 
        />
        <Text style={styles.streakCount}>{streaks.length} {streaks.length === 1 ? 'Day' : 'Days'}</Text>
        {streaks.length > 0 && (
          <Text style={[styles.encouragement, isDark && styles.darkSubText]}>
            {encouragement}
          </Text>
        )}
      </View>

      <View style={[styles.chartContainer, isDark && styles.darkCard]}>
        <Text style={[styles.chartTitle, isDark && styles.darkText]}>Streak History</Text>
        <LineChart
          data={{
            labels: streaks.length > 0 
              ? streaks.map(s => format(new Date(s.startDate), 'MMM d'))
              : [''],
            datasets: [{
              data: streaks.length > 0 
                ? streaks.map(s => s.length)
                : [0]
            }]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: isDark ? '#1E1E1E' : '#ffffff',
            backgroundGradientFrom: isDark ? '#1E1E1E' : '#ffffff',
            backgroundGradientTo: isDark ? '#1E1E1E' : '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 127, 80, ${opacity})`,
            labelColor: (opacity = 1) => isDark 
              ? `rgba(255, 255, 255, ${opacity})`
              : `rgba(51, 51, 51, ${opacity})`,
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  flameContainer: {
    alignItems: 'center',
    marginVertical: 30,
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
    backgroundColor: '#1E1E1E',
  },
  chartContainer: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF7F50',
    marginTop: 10,
    fontFamily: 'Vercetti-Regular',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'SF-Regular',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'SF-Regular',
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  streaksContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  streakCard: {
    padding: 16,
    borderRadius: 16,
    width: 160,
    marginRight: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  streakSubtext: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  emptyStateWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: 'Vercetti-Regular',
  },
  startButton: {
    backgroundColor: '#FF7F50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#FF7F50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  encouragement: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    fontFamily: 'Vercetti-Regular',
    lineHeight: 22,
  },
  darkSubText: {
    color: '#AAAAAA',
  },
}); 