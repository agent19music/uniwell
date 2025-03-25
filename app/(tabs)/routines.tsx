import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Octicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRoutine } from '../../contexts/RoutineContext';

const SAMPLE_HABITS = [
  {
    id: '1',
    title: 'Smoke Free',
    streak: 15,
    type: 'break',
    color: '#FF69B4',
  },
  {
    id: '2',
    title: 'Gym Workout',
    streak: 8,
    type: 'build',
    color: '#8A8AFF',
  }
];

type RoutineTask = {
  id: string;
  title: string;
  frequency: string;
  completed: string[];
};

const ROUTINE_TASKS: RoutineTask[] = [
  { id: '1', title: 'Morning Meditation', frequency: 'Daily', completed: [] },
  { id: '2', title: 'Gym Session', frequency: '3x Week', completed: [] },
  { id: '3', title: 'Read 30 mins', frequency: 'Daily', completed: [] },
];

export default function RoutinesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { height } = Dimensions.get('window');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const router = useRouter();
  const { habits, completeHabit, streaks } = useRoutine();

  const handleSleepCardPress = () => {
    router.push('/sleepstats'); // Use router.push for navigation
  };

  const handleTimetableCardPress = () => {
    router.push('/schedule');
  };  

  const handleAddRoutine = () => {
    router.push('/AddRoutineScreen');
  };

  const handleAddStreak = () => {
    router.push('/AddStreakScreen');
  };  

  const handleCompleteTask = async (habitId: string) => {
    try {
      await completeHabit(habitId, selectedDate);
      // Refresh habits list or update UI as needed
    } catch (error) {
      console.error('Error completing habit:', error);
    }
  };

  const handleEditRoutine = (id: string) => {
    router.push(`/modals/edit-routine?id=${id}`);
  };

  // Generate last 7 days for the calendar strip
  const getDates = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { minHeight: height - 60 }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.darkText]}>My Progress</Text>
          <Text style={[styles.subtitle, isDark && styles.darkSubText]}>Keep going, you're doing great!</Text>
        </View>

        {/* Streaks Section */}
        <View style={styles.streaksContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.streaksScrollContainer}
          >
            {streaks.length > 0 ? (
              streaks.map((streak) => (
                <TouchableOpacity 
                  key={streak.id} 
                  style={[styles.streakCard, isDark && styles.darkStreakCard]}
                  onPress={() => router.push(`/streak-details/${streak.id}`)}
                >
                  <View style={styles.streakHeader}>
                    <Octicons 
                      name={streak.type === 'break' ? 'flame' : 'rocket'} 
                      size={56} 
                      color="#FF7F50" 
                    />
                    <Text style={[styles.streakCount, isDark && styles.darkText]}>{streak.length} Days</Text>
                  </View>
                  <Text style={[styles.streakTitle, isDark && styles.darkText]}>{streak.title}</Text>
                  <Text style={[styles.streakSubtext, isDark && styles.darkText]}>Keep it up!</Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity style={styles.addStreakButton} onPress={handleAddStreak}>
                <Ionicons name="add-circle" size={24} color="#FF7F50" />
                <Text style={styles.addButtonText}>Add New Streak</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
        {/* Sleep Card */}
        <TouchableOpacity 
          style={[styles.routineCard, { marginLeft: 12 }]} 
          onPress={handleTimetableCardPress}
        >
          <Text style={[styles.routineTitle,]}>Timetable entry</Text>
          <Text style={styles.routineFrequency}>Test</Text>
        </TouchableOpacity>

        {/* Calendar Strip */}
        <View style={styles.calendarStrip}>
          {getDates().map((date) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity 
                key={date.toISOString()} 
                style={[styles.dateButton, isSelected && styles.selectedDate]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dayText, isSelected && styles.selectedDateText]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Daily Routines */}
        <View style={styles.routinesSection}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Daily Routines</Text>
          {ROUTINE_TASKS.map((task) => (
            <TouchableOpacity 
              key={task.id} 
              style={[styles.routineCard, isDark && styles.darkCard]}
            >
              <View style={styles.routineInfo}>
                <Text style={[styles.routineTitle, isDark && styles.darkText]}>{task.title}</Text>
                <Text style={[styles.routineFrequency, isDark && styles.darkSubText]}>{task.frequency}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.checkButton, task.completed.includes(selectedDate.toDateString()) && styles.checkedButton]}
                onPress={() => handleCompleteTask(task.id)}
              >
                <Ionicons 
                  name={task.completed.includes(selectedDate.toDateString()) ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={24} 
                  color="#FF7F50" 
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add New Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddRoutine}>
          <Ionicons name="add-circle" size={24} color="#FF7F50" />
          <Text style={styles.addButtonText}>Add New Routine</Text>
        </TouchableOpacity>

        {habits.map((habit) => (
          <View key={habit.id} style={styles.habitContainer}>
            <Text>{habit.title}</Text>
            <TouchableOpacity onPress={() => handleEditRoutine(habit.id)}>
              <Ionicons name="ellipsis-vertical" size={24} color="#FF7F50" />
            </TouchableOpacity>
          </View>
        ))}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  streaksContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  streaksScrollContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  streakCard: {
    padding: 20,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    width: 250,
  },
  darkStreakCard: {
    backgroundColor: '#2C2C2C',
    borderColor: '#444444',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  streakCount: {
    fontSize: 20,
    color: '#FF7F50',
    marginLeft: 10,
    fontFamily: 'Vercetti-Regular',
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  streakSubtext: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  addStreakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 24,
  },
  dateButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    width: 45,
  },
  selectedDate: {
    backgroundColor: '#FF7F50',
  },
  dayText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  selectedDateText: {
    color: 'white',
  },
  routinesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  routineInfo: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  routineFrequency: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  checkButton: {
    padding: 4,
  },
  checkedButton: {
    opacity: 0.8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#FF7F50',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  habitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
});