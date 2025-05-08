import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Dimensions, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useRoutine } from '../../contexts/RoutineContext';
import AddRoutineModal from '@/modals/AddRoutineModal';
import AddStreakModal from '@/modals/AddStreakModal';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { format, differenceInDays } from 'date-fns';
import { Streak } from '@/contexts/RoutineContext';
import NextActivityWidget from '@/components/NextActivityWidget';

export default function RoutinesScreen() {
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = Dimensions.get('window');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const router = useRouter();
  const { habits, completeHabit, streaks, terminateStreak, resetStreak } = useRoutine();
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [showAddStreak, setShowAddStreak] = useState(false);
  const [streakMenuVisible, setStreakMenuVisible] = useState(false);
  const [streakMenuPosition, setStreakMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedStreakId, setSelectedStreakId] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

  const handleStreakPress = (streakId: string) => {
    router.push(`/streak-details/${streakId}`);
  };

  const handleStreakLongPress = (streakId: string, event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedStreakId(streakId);
    // Position menu near the touch point
    setStreakMenuPosition({ 
      x: event.nativeEvent.pageX - 75, 
      y: event.nativeEvent.pageY - 20 
    });
    setStreakMenuVisible(true);
    
    // Animate menu appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onReset = async (streakId: string) => {
    Alert.alert(
      "Reset Streak",
      "Are you sure you want to reset this streak? This will clear your current progress.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetStreak(streakId);
            } catch (error) {
              console.error('Error resetting streak:', error);
            }
          }
        }
      ]
    );
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

  // Minimal Streak Card Component
  const MinimalStreakCard = ({ streak }: { streak: Streak }) => {
    const progress = Math.min(100, (streak.currentStreak / streak.targetCount) * 100);
    
    return (
      <TouchableOpacity
        style={[styles.minimalStreakCard, isDark && styles.darkMinimalStreakCard]}
        onPress={() => handleStreakPress(streak.id)}
        onLongPress={(e) => handleStreakLongPress(streak.id, e)}
        delayLongPress={300}
      >
        <View style={styles.streakCardTop}>
          <View style={styles.streakIconContainer}>
            <Ionicons 
              name={streak.type === 'break' ? 'flame' : 'trending-up'} 
              size={16} 
              color={streak.color} 
            />
          </View>
          <View style={[
            styles.statusDot, 
            { backgroundColor: streak.status === 'active' ? '#34C759' : '#FF3B30' }
          ]} />
        </View>
        
        <Text style={[styles.streakCardTitle, isDark && styles.darkText]} numberOfLines={1}>
          {streak.title}
        </Text>
        
        <View style={styles.streakCardCount}>
          <Text style={[styles.streakCardNumber, isDark && styles.darkText]}>
            {streak.currentStreak}
          </Text>
          <Text style={[styles.streakCardUnit, isDark && styles.darkSubText]}>days</Text>
        </View>
        
        <View style={[styles.miniProgressBar, isDark && styles.darkMiniProgressBar]}>
          <View style={[styles.miniProgressFill, { width: `${progress}%` }]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>My Progress</Text>
        </View>
        
        <View style={styles.content}>
          <NextActivityWidget />
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Streaks</Text>
              <TouchableOpacity onPress={handleAddStreak}>
                <Ionicons name="add-circle-outline" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.streaksContainer}
            >
              {streaks.length > 0 ? (
                streaks.map((streak) => (
                  <MinimalStreakCard key={streak.id} streak={streak} />
                ))
              ) : (
                <TouchableOpacity 
                  style={[styles.emptyStreakCard, isDark && styles.darkEmptyStreakCard]}
                  onPress={handleAddStreak}
                >
                  <Ionicons name="add" size={24} color={isDark ? '#8E8E93' : '#8E8E93'} />
                  <Text style={[styles.emptyStreakText, isDark && styles.darkSubText]}>
                    Add streak
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
          
          <View style={styles.section}>
            <View style={styles.calendarSection}>
              {getDates().map((date) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[styles.dateButton, isSelected && styles.selectedDate]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.selectedDateText]}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)}
                    </Text>
                    <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Daily Routines</Text>
              <TouchableOpacity onPress={handleAddRoutine}>
                <Ionicons name="add-circle-outline" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
            
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
              <View style={[styles.emptyRoutineCard, isDark && styles.darkEmptyRoutineCard]}>
                <Text style={[styles.emptyRoutineText, isDark && styles.darkSubText]}>
                  No routines yet
                </Text>
                <TouchableOpacity 
                  style={styles.addRoutineButton}
                  onPress={handleAddRoutine}
                >
                  <Text style={styles.addRoutineButtonText}>Add Routine</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Streak Context Menu */}
      <Modal
        transparent={true}
        visible={streakMenuVisible}
        animationType="none"
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
                router.push(`/streak-details/${selectedStreakId}`);
              }}
            >
              <Feather name="eye" size={16} color={isDark ? '#FFFFFF' : '#333333'} />
              <Text style={[styles.menuText, isDark && styles.darkMenuText]}>View Details</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, isDark && styles.darkMenuDivider]} />

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
                if (selectedStreakId) {
                  onReset(selectedStreakId);
                }
              }}
            >
              <Feather name="refresh-cw" size={16} color={isDark ? '#FF9500' : '#FF9500'} />
              <Text style={[styles.menuText, isDark && styles.darkMenuText]}>Reset Streak</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

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
    backgroundColor: '#F2F2F7',
  },
  darkContainer: {
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  streaksContainer: {
    paddingRight: 16,
    paddingVertical: 4,
    gap: 12,
  },
  minimalStreakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    width: 110,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkMinimalStreakCard: {
    backgroundColor: '#1C1C1E',
  },
  streakCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  streakCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 10,
    fontFamily: 'Vercetti-Regular',
  },
  streakCardCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  streakCardNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  streakCardUnit: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
    fontFamily: 'Vercetti-Regular',
  },
  miniProgressBar: {
    height: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  darkMiniProgressBar: {
    backgroundColor: '#2C2C2E',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#FF7F50',
    borderRadius: 2,
  },
  emptyStreakCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 12,
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkEmptyStreakCard: {
    backgroundColor: '#1C1C1E',
  },
  emptyStreakText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  calendarSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 64,
    borderRadius: 18,
  },
  selectedDate: {
    backgroundColor: '#FF7F50',
  },
  dayText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#1C1C1E',
  },
  routineInfo: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  routineFrequency: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'Vercetti-Regular',
  },
  checkButton: {
    padding: 4,
  },
  checkedButton: {
    opacity: 0.8,
  },
  emptyRoutineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkEmptyRoutineCard: {
    backgroundColor: '#1C1C1E',
  },
  emptyRoutineText: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  addRoutineButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addRoutineButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  streakContextMenu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  darkMenuText: {
    color: '#FFFFFF',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  darkMenuDivider: {
    backgroundColor: '#3A3A3C',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: '#8E8E93',
  },
});