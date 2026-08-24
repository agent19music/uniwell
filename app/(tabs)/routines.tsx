import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlusCircle, Plus, Eye, PencilSimple, ArrowCounterClockwise, CheckCircle, Trash, Fire, TrendUp, XCircle, WarningCircle, Warning } from 'phosphor-react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useRoutine } from '../../contexts/RoutineContext';
import AddRoutineModal from '@/modals/AddRoutineModal';
import AddStreakModal from '@/modals/AddStreakModal';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { format, differenceInDays, isToday, isYesterday, isTomorrow, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Streak } from '@/contexts/RoutineContext';
import NextActivityWidget from '@/components/NextActivityWidget';
import EditRoutineModal from '@/modals/EditRoutineModal';
import { useTheme } from '../../hooks/useTheme';
import RoutineActivityGraph from '@/components/RoutineActivityGraph';

type RoutineStatus = 'completed' | 'upcoming' | 'warning' | 'urgent' | 'due' | 'missed';

export default function RoutinesScreen() {
  const { currentUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { width, height } = Dimensions.get('window');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const router = useRouter();
  const { 
    routines, 
    completeRoutine, 
    streaks, 
    terminateStreak, 
    resetStreak, 
    deleteRoutine,
    isRoutineCompleted,
    getRoutineStatus: getContextRoutineStatus
  } = useRoutine();
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [showAddStreak, setShowAddStreak] = useState(false);
  const [streakMenuVisible, setStreakMenuVisible] = useState(false);
  const [streakMenuPosition, setStreakMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedStreakId, setSelectedStreakId] = useState<string | null>(null);
  const [showEditRoutine, setShowEditRoutine] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [routineMenuVisible, setRoutineMenuVisible] = useState(false);
  const [routineMenuPosition, setRoutineMenuPosition] = useState({ x: 0, y: 0 });

  const handleAddRoutine = () => {
    setShowAddRoutine(true);
  };

  const handleAddStreak = () => {
    setShowAddStreak(true);
  };

  const handleCompleteTask = async (routineId: string) => {
    try {
      const localDate = startOfDay(selectedDate);
      console.log('Attempting to complete routine:', routineId, 'for date:', format(localDate, 'yyyy-MM-dd'));
      
      // Check if already completed first
      const alreadyCompleted = isRoutineCompleted(routineId, localDate);
      if (alreadyCompleted) {
        console.log('This routine is already completed for today');
        Alert.alert('Already Done', 'This routine has already been marked as completed.');
        return;
      }
      
      // Show loading indicator or disable button
      // (Would normally do this with state, but keeping it simple for now)
      
      await completeRoutine(routineId, localDate);
      console.log('Routine successfully completed:', routineId);
      
      // Force UI refresh with better feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Manually trigger a state update to force re-render
      setSelectedDate(prevDate => {
        // This is a trick to force a re-render by creating a new Date object with the same value
        return new Date(prevDate.getTime());
      });
    } catch (error) {
      console.error('Error completing routine:', error);
      
      // Show more helpful error messages
      if (error instanceof Error && error.message.includes("42501")) {
        Alert.alert('Permission Error', 'You don\'t have permission to complete this routine. Please check your account settings or contact support.');
      } else {
        Alert.alert('Error', 'Failed to mark routine as completed. Please try again.');
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleStreakPress = (streakId: string) => {
    router.push(`/streak-details/${streakId}`);
  };

  const handleStreakLongPress = (streakId: string, event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedStreakId(streakId);
    
    // Calculate initial position
    let x = event.nativeEvent.pageX - 75;
    let y = event.nativeEvent.pageY - 20;
    
    // Ensure menu stays within screen bounds
    if (x < 10) x = 10;
    if (x + 160 > width) x = width - 170;
    if (y < 10) y = 10;
    if (y + 200 > height) y = height - 210;
    
    setStreakMenuPosition({ x, y });
    setStreakMenuVisible(true);
    
  };

  const handleStreakMenuClose = () => {
    setStreakMenuVisible(false);
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

  const getRoutineStatus = (routine: any): RoutineStatus => {
    const today = new Date();
    const localSelectedDate = startOfDay(selectedDate);
    const routineCreatedAt = routine?.created_at ? parseISO(routine.created_at) : new Date();
    const localRoutineCreatedAt = startOfDay(routineCreatedAt);
    
    // If the selected date is before the routine was created, don't show it
    if (localSelectedDate < localRoutineCreatedAt) {
      return 'upcoming';
    }

    // Use the context's isRoutineCompleted function directly
    const isCompleted = isRoutineCompleted(routine.id, localSelectedDate);
    
    // Get the day of week (0-6, Sunday is 0)
    const dayOfWeek = localSelectedDate.getDay();
    
    // Check if this routine is due on this day
    const isDue = 
      routine.frequency === 'daily' || 
      (routine.frequency === 'weekly' && routine.customDays && 
        (routine.customDays.includes(dayOfWeek) || routine.customDays.includes(dayOfWeek.toString()))) ||
      (routine.frequency === 'custom' && routine.customDays && 
        (routine.customDays.includes(dayOfWeek) || routine.customDays.includes(dayOfWeek.toString())));

    console.log('Routine day check:', routine.title, 'Day:', dayOfWeek, 'CustomDays:', routine.customDays, 'IsDue:', isDue);

    if (isCompleted) return 'completed';
    if (!isDue) return 'upcoming';
    
    // For past dates, show missed status
    if (localSelectedDate < startOfDay(today)) {
      return 'missed';
    }
    
    // For today, use time-based status
    if (isToday(localSelectedDate)) {
      const currentHour = today.getHours();
      if (currentHour >= 16 && currentHour < 22) { // 4 PM to 10 PM
        return 'warning';
      } else if (currentHour >= 22) { // After 10 PM
        return 'urgent';
      }
      return 'due';
    }
    
    return 'upcoming';
  };

  // Filter routines based on creation date using local timezone
  const filteredRoutines = routines.filter(routine => {
    if (!routine?.created_at) return false;
    const routineCreatedAt = parseISO(routine.created_at);
    console.log(routineCreatedAt);
    const localSelectedDate = startOfDay(selectedDate);
    const localRoutineCreatedAt = startOfDay(routineCreatedAt);
    console.log(localSelectedDate, localRoutineCreatedAt);
    return localSelectedDate >= localRoutineCreatedAt;
  });

  const getRoutineIcon = (routine: any, size: number, color: string) => {
    const status = getRoutineStatus(routine);
    switch (status) {
      case 'completed': return <CheckCircle size={size} color={color} weight="fill" />;
      case 'missed': return <XCircle size={size} color={color} weight="fill" />;
      case 'warning': return <WarningCircle size={size} color={color} weight="regular" />;
      case 'urgent': return <Warning size={size} color={color} weight="regular" />;
      case 'due': return <WarningCircle size={size} color={color} weight="regular" />;
      default: return <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color }} />;
    }
  };

  const getRoutineIconColor = (routine: any) => {
    const status = getRoutineStatus(routine);
    switch (status) {
      case 'completed':
        return "#34C759";
      case 'missed':
        return "#FF3B30";
      case 'warning':
        return "#FF9500";
      case 'urgent':
        return "#FF3B30";
      case 'due':
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  const getDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(startOfDay(date));
    }
    return dates;
  };

  // Minimal Streak Card Component
  const MinimalStreakCard = ({ streak }: { streak: Streak }) => {
    const progress = Math.min(100, (streak.currentStreak / streak.targetCount) * 100);
    
    return (
      <TouchableOpacity
        style={[styles.minimalStreakCard, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}
        onPress={() => handleStreakPress(streak.id)}
        onLongPress={(e) => handleStreakLongPress(streak.id, e)}
        delayLongPress={300}
      >
        <View style={styles.streakCardTop}>
          <View style={styles.streakIconContainer}>
            {streak.type === 'break'
              ? <Fire size={16} color={streak.color} weight="regular" />
              : <TrendUp size={16} color={streak.color} weight="regular" />}
          </View>
          <View style={[
            styles.statusDot, 
            { backgroundColor: streak.status === 'active' ? colors.success : colors.error }
          ]} />
        </View>
        
        <Text style={[styles.streakCardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {streak.title}
        </Text>
        
        <View style={styles.streakCardCount}>
          <Text style={[styles.streakCardNumber, { color: colors.textPrimary }]}>
            {streak.currentStreak}
          </Text>
          <Text style={[styles.streakCardUnit, { color: colors.textSecondary }]}>days</Text>
        </View>
        
        <View style={[styles.miniProgressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.miniProgressFill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
        </View>
      </TouchableOpacity>
    );
  };

  const handleRoutineLongPress = (routineId: string, event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRoutineId(routineId);
    
    // Calculate initial position
    let x = event.nativeEvent.pageX - 75;
    let y = event.nativeEvent.pageY - 20;
    
    // Ensure menu stays within screen bounds
    if (x < 10) x = 10;
    if (x + 160 > width) x = width - 170;
    if (y < 10) y = 10;
    if (y + 200 > height) y = height - 210;
    
    setRoutineMenuPosition({ x, y });
    setRoutineMenuVisible(true);
    
  };

  const handleRoutineMenuClose = () => {
    setRoutineMenuVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Progress</Text>
        </View>
        
        <View style={styles.content}>
          <NextActivityWidget />
          
          <View style={styles.section}>
            <RoutineActivityGraph />
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Streaks</Text>
              <TouchableOpacity onPress={handleAddStreak}>
                <PlusCircle size={20} color={colors.textPrimary} weight="regular" />
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
                  style={[styles.emptyStreakCard, { backgroundColor: colors.card }]}
                  onPress={handleAddStreak}
                >
                  <Plus size={24} color={colors.textSecondary} weight="regular" />
                  <Text style={[styles.emptyStreakText, { color: colors.textSecondary }]}>
                    Add streak
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
          
          <View style={styles.section}>
            <View style={styles.calendarSection}>
              {getDates().map((date) => {
                const isSelected = startOfDay(date).getTime() === startOfDay(selectedDate).getTime();
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[
                      styles.dateButton,
                      { backgroundColor: isSelected ? colors.accent : colors.transparent }
                    ]}
                    onPress={() => setSelectedDate(startOfDay(date))}
                  >
                    <Text style={[
                      styles.dayText,
                      { color: isSelected ? colors.textOnAccent : colors.textSecondary }
                    ]}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)}
                    </Text>
                    <Text style={[
                      styles.dateText,
                      { color: isSelected ? colors.textOnAccent : colors.textPrimary }
                    ]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily Routines</Text>
              <TouchableOpacity onPress={handleAddRoutine}>
                <PlusCircle size={20} color={colors.textPrimary} weight="regular" />
              </TouchableOpacity>
            </View>
            
            {filteredRoutines.length > 0 ? (
              filteredRoutines.map((routine) => {
                const status = getRoutineStatus(routine);
                const completed = isRoutineCompleted(routine.id, selectedDate);
                console.log('Rendering routine:', routine.id, routine.title, 'Status:', status, 'Completed:', completed);
                
                return (
                  <TouchableOpacity
                    key={routine.id}
                    style={[styles.routineCard, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}
                    onLongPress={(e) => handleRoutineLongPress(routine.id, e)}
                    delayLongPress={300}
                  >
                    <View style={styles.routineInfo}>
                      <Text style={[styles.routineTitle, { color: colors.textPrimary }]}>{routine.title}</Text>
                      <Text style={[styles.routineFrequency, { color: colors.textSecondary }]}>
                        {routine.frequency === 'weekly' ? `Every ${routine.customDays?.[0]}` : 
                         routine.frequency === 'custom' ? routine.customDays?.join(', ') : 
                         'Daily'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.checkButton, completed && styles.checkedButton]}
                      onPress={() => handleCompleteTask(routine.id)}
                    >
                      {getRoutineIcon(routine, 24, getRoutineIconColor(routine))}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={[styles.emptyRoutineCard, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
                <Text style={[styles.emptyRoutineText, { color: colors.textSecondary }]}>
                  {routines.length === 0 
                    ? 'No routines yet' 
                    : startOfDay(selectedDate) < startOfDay(new Date())
                      ? 'No routines were set for this day'
                      : 'No routines for this date'}
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
        onRequestClose={handleStreakMenuClose}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleStreakMenuClose}
        >
          <View
            style={[
              styles.streakContextMenu,
              {
                backgroundColor: colors.card,
                shadowColor: colors.shadow.dark,
                left: streakMenuPosition.x,
                top: streakMenuPosition.y,
              }
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleStreakMenuClose();
                router.push(`/streak-details/${selectedStreakId}`);
              }}
            >
              <Eye size={16} color={colors.textPrimary} weight="regular" />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>View Details</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleStreakMenuClose();
                router.push(`/edit-streak/${selectedStreakId}`);
              }}
            >
              <PencilSimple size={16} color={colors.textPrimary} weight="regular" />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Edit</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleStreakMenuClose();
                if (selectedStreakId) {
                  onReset(selectedStreakId);
                }
              }}
            >
              <ArrowCounterClockwise size={16} color={colors.warning} weight="regular" />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Reset Streak</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Routine Context Menu */}
      <Modal
        transparent={true}
        visible={routineMenuVisible}
        animationType="none"
        onRequestClose={handleRoutineMenuClose}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleRoutineMenuClose}
        >
          <View
            style={[
              styles.routineContextMenu,
              {
                backgroundColor: colors.card,
                shadowColor: colors.shadow.dark,
                left: routineMenuPosition.x,
                top: routineMenuPosition.y,
              }
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleRoutineMenuClose();
                setShowEditRoutine(true);
              }}
            >
              <PencilSimple size={16} color={colors.textPrimary} weight="regular" />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Edit</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleRoutineMenuClose();
                if (selectedRoutineId) {
                  handleCompleteTask(selectedRoutineId);
                }
              }}
            >
              <CheckCircle size={16} color={colors.success} weight="regular" />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Mark Completed</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleRoutineMenuClose();
                if (selectedRoutineId) {
                  deleteRoutine(selectedRoutineId);
                }
              }}
            >
              <Trash size={16} color={colors.error} weight="regular" />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Delete</Text>
            </TouchableOpacity>
          </View>
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
      <EditRoutineModal
        visible={showEditRoutine}
        onClose={() => setShowEditRoutine(false)}
        routineId={selectedRoutineId || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontFamily: 'Vercetti-Regular',
  },
  streaksContainer: {
    paddingRight: 16,
    paddingVertical: 4,
    gap: 12,
  },
  minimalStreakCard: {
    borderRadius: 16,
    padding: 12,
    width: 110,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    fontFamily: 'Vercetti-Regular',
  },
  streakCardUnit: {
    fontSize: 13,
    marginLeft: 4,
    fontFamily: 'Vercetti-Regular',
  },
  miniProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyStreakCard: {
    borderRadius: 16,
    padding: 12,
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStreakText: {
    fontSize: 12,
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
  dayText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  routineInfo: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  routineFrequency: {
    fontSize: 13,
    fontFamily: 'Vercetti-Regular',
  },
  checkButton: {
    padding: 4,
  },
  checkedButton: {
    opacity: 0.8,
  },
  emptyRoutineCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyRoutineText: {
    fontSize: 15,
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
    borderRadius: 12,
    padding: 8,
    width: 160,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  menuText: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  menuDivider: {
    height: 1,
  },
  routineContextMenu: {
    position: 'absolute',
    borderRadius: 12,
    padding: 8,
    width: 160,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});