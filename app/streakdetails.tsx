import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoutine } from '@/contexts/RoutineContext';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';

export default function StreakDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { habits, getHabitHistory } = useRoutine();
  const [history, setHistory] = useState<any[]>([]);
  const screenWidth = Dimensions.get('window').width;

  const habit = habits.find(h => h.id === id);
  
  useEffect(() => {
    loadHistory();
  }, [id]);

  const loadHistory = async () => {
    if (id) {
      const habitHistory = await getHabitHistory(id as string);
      setHistory(habitHistory);
    }
  };

  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date()
  });

  const generateCompletionData = (history: any[], days: Date[]) => {
    return {
        labels: days.map(date => format(date, 'MM/dd')),
        datasets: [{
            data: days.map(date => {
                const formattedDate = format(date, 'yyyy-MM-dd');
                return history.some(entry => 
                    format(new Date(entry.date), 'yyyy-MM-dd') === formattedDate && 
                    entry.is_completed
                ) ? 1 : 0;
            })
        }]
    };
};

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#FF7F50" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>{habit?.title}</Text>
        <View style={styles.streakContainer}>
          <Text style={styles.streakCount}>
            Current Streak: {habit?.streak?.current_streak || 0} days
          </Text>
          <Text style={styles.bestStreak}>
            Best Streak: {habit?.streak?.longest_streak || 0} days
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Last 30 Days Progress</Text>
        <LineChart
          data={generateCompletionData(history, last30Days)}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 127, 80, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {((history.filter(h => h.is_completed).length / history.length) * 100).toFixed(1)}%
          </Text>
          <Text style={styles.statLabel}>Completion Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {history.filter(h => h.is_completed).length}
          </Text>
          <Text style={styles.statLabel}>Total Completions</Text>
        </View>
      </View>

      <View style={styles.motivationCard}>
        <Text style={styles.motivationTitle}>Keep Going!</Text>
        <Text style={styles.motivationText}>
          You're making great progress. Every day you complete this habit brings you closer to your goals.
        </Text>
      </View>
    </ScrollView>
  );
}

function eachDayOfInterval({ start, end }: { start: Date; end: Date; }): Date[] {
  const dates = [];
  let currentDate = start;
  while (currentDate <= end) {
    dates.push(currentDate);
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    fontFamily: 'Vercetti-Regular',
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF7F50',
    marginBottom: 5,
    fontFamily: 'Vercetti-Regular',
  },
  bestStreak: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
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
    color: '#FF7F50',
    marginBottom: 5,
    fontFamily: 'Vercetti-Regular',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  motivationCard: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 30,
  },
  motivationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    fontFamily: 'Vercetti-Regular',
  },
  motivationText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
}); 
  
