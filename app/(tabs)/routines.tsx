import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Dimensions, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { Octicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRoutine } from '../../contexts/RoutineContext';
import AddRoutineModal from '@/modals/AddRoutineModal';
import AddStreakModal from '@/modals/AddStreakModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function RoutinesScreen() {
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { height } = Dimensions.get('window');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const router = useRouter();
  const { habits, completeHabit, streaks } = useRoutine();
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [showAddStreak, setShowAddStreak] = useState(false);
  const [streakMenuVisible, setStreakMenuVisible] = useState(false);
  const [streakMenuPosition, setStreakMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedStreakId, setSelectedStreakId] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const streakCardRef = useRef(null);

  const handleSleepCardPress = () => {
    router.push('/sleepstats');
  };

  const handleTimetableCardPress = () => {
    router.push('/schedule');
  };

  const handleAddRoutine = () => {
    setShowAddRoutine(true);
  };

  const handleAddStreak = () => {
    setShowAddStreak(true);
  };

  const handleCompleteTask = async (habitId: string) => {
    try {
      await completeHabit(habitId, selectedDate);
    } catch (error) {
      console.error('Error completing habit:', error);
    }
  };

  const handleEditRoutine = (id: string) => {
    router.push(`/modals/edit-routine?id=${id}`);
  };

  const onMarkCompleted = async (streakId: string) => {
    try {
      console.log('Marking streak completed:', streakId);
    } catch (error) {
      console.error('Error marking streak completed:', error);
    }
  };

  const onDelete = async (streakId: string) => {
    try {
      console.log('Deleting streak:', streakId);
    } catch (error) {
      console.error('Error deleting streak:', error);
    }
  };

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
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (streakCardRef.current) {
                        (streakCardRef.current as unknown as {
                        measure: (
                          callback: (
                          x: number,
                          y: number,
                          width: number,
                          height: number,
                          pageX: number,
                          pageY: number
                          ) => void
                        ) => void
                        }).measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
                        setStreakMenuPosition({ x: px + width / 2 - 75, y: py - 10 });
                        setSelectedStreakId(streak.id);
                        setStreakMenuVisible(true); 
                        });
                    }
                  }}
                  delayLongPress={300}
                  ref={streakCardRef}
                >
                  <View style={styles.streakContent}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 127, 80, 0.1)' }]}>
                      <Octicons
                        name={streak.type === 'break' ? 'flame' : 'rocket'}
                        size={24}
                      />
                    </View>
                    <View style={styles.streakInfo}>
                      <Text
                        style={[styles.streakTitle, isDark && styles.darkText]}
                        numberOfLines={1}
                      >
                        {streak.title}
                      </Text>
                      <View style={styles.streakDetails}>
                        <Text style={[styles.streakCount, isDark && styles.darkText]}>
                          {streak.length} days
                        </Text>
                        <View style={styles.streakBadge}>
                          <Text style={styles.streakBadgeText}>
                            {streak.status || 'Active'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${Math.min(streak.length * 5, 100)}%` }
                      ]}
                    />
                  </View>
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

        <Modal
          transparent={true}
          visible={streakMenuVisible}
          animationType="fade"
          onRequestClose={() => setStreakMenuVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setStreakMenuVisible(false)}
          >
            <Animated.View
              style={[
                styles.streakContextMenu,
                isDark && styles.darkStreakContextMenu,
                {
                  left: streakMenuPosition.x,
                  top: streakMenuPosition.y,
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setStreakMenuVisible(false);
                  router.push(`/edit-streak/${selectedStreakId}`);
                }}
              >
                <Feather name="edit-2" size={16} color={isDark ? '#FFFFFF' : '#333333'} />
                <Text style={[styles.menuText, isDark && styles.darkMenuText]}>Edit</Text>
              </TouchableOpacity>

              <View style={[styles.menuDivider, isDark && styles.darkMenuDivider]} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setStreakMenuVisible(false);
                  if (selectedStreakId && onMarkCompleted) {
                    onMarkCompleted(selectedStreakId);
                  }
                }}
              >
                <Feather name="check-circle" size={16} color={isDark ? '#34C759' : '#34C759'} />
                <Text style={[styles.menuText, isDark && styles.darkMenuText]}>Mark Completed</Text>
              </TouchableOpacity>

              <View style={[styles.menuDivider, isDark && styles.darkMenuDivider]} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setStreakMenuVisible(false);
                  Alert.alert(
                    "Delete Streak",
                    "Are you sure you want to delete this streak? This action cannot be undone.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel"
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => selectedStreakId && onDelete && onDelete(selectedStreakId)
                      }
                    ]
                  );
                }}
              >
                <Feather name="trash-2" size={16} color={isDark ? '#FF453A' : '#FF3B30'} />
                <Text style={styles.menuDeleteText}>Delete</Text>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Modal>

        <TouchableOpacity
          style={[styles.routineCard, { marginLeft: 12 }]}
          onPress={handleTimetableCardPress}
        >
          <Text style={styles.routineTitle}>Timetable entry</Text>
          <Text style={styles.routineFrequency}>Test</Text>
        </TouchableOpacity>

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

        <View style={styles.routinesSection}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Daily Routines</Text>
          {habits.length > 0 ? (
            habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={[styles.routineCard, isDark && styles.darkCard]}
              >
                <View style={styles.routineInfo}>
                  <Text style={[styles.routineTitle, isDark && styles.darkText]}>{habit.title}</Text>
                  <Text style={[styles.routineFrequency, isDark && styles.darkSubText]}>
                    {habit.frequency}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.checkButton, habit.completed?.includes(selectedDate.toDateString()) && styles.checkedButton]}
                  onPress={() => handleCompleteTask(habit.id)}
                >
                  <Ionicons
                    name={habit.completed?.includes(selectedDate.toDateString()) ? "checkmark-circle" : "checkmark-circle-outline"}
                    size={24}
                    color="#FF7F50"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity style={styles.addButton} onPress={handleAddRoutine}>
              <Ionicons name="add-circle" size={24} color="#FF7F50" />
              <Text style={styles.addButtonText}>Add Your First Routine</Text>
            </TouchableOpacity>
          )}
        </View>

        {habits.length > 0 && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddRoutine}>
            <Ionicons name="add-circle" size={24} color="#FF7F50" />
            <Text style={styles.addButtonText}>Add New Routine</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <AddRoutineModal
        visible={showAddRoutine}
        onClose={() => setShowAddRoutine(false)}
      />
      <AddStreakModal
        visible={showAddStreak}
        onClose={() => setShowAddStreak(false)}
      />
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
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: 220,
  },
  darkStreakCard: {
    backgroundColor: '#1c1c1e',
    borderColor: '#2c2c2e',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 127, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  streakDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakCount: {
    fontSize: 14,
    color: '#FF7F50',
    fontFamily: 'Vercetti-Regular',
    fontWeight: '500',
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  streakBadgeText: {
    fontSize: 12,
    color: '#FF7F50',
    fontFamily: 'Vercetti-Regular',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF7F50',
    borderRadius: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  streakContextMenu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  darkStreakContextMenu: {
    backgroundColor: '#2C2C2E',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  menuText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'Vercetti-Regular',
  },
  darkMenuText: {
    color: '#FFFFFF',
  },
  menuDeleteText: {
    fontSize: 14,
    color: '#FF3B30',
    fontFamily: 'Vercetti-Regular',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  darkMenuDivider: {
    backgroundColor: '#3A3A3C',
  },
});