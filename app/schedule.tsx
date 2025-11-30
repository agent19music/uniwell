import { Pressable, View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useRef } from 'react';
import { ChartLine, X, Plus } from 'phosphor-react-native';
import FloatingActionButton from '../components/FloatingActionButton';
import ScheduleEditorModal from '../modals/ScheduleEditorModal';
import AddClassModal from '../modals/AddClassModal';
import EditClassModal from '../modals/EditClassModal';
import SemesterSelectionModal from '../modals/SemesterSelectionModal';
import CreateSemesterModal from '../modals/CreateSemesterModal';
import UpdateSemesterModal from '../modals/UpdateSemesterModal';
import { useSemester } from '@/contexts/SemesterContext';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

// Import our modular components
import {ScheduleHeader} from '@/components/schedule/ScheduleHeader';
import {CalendarDayHeader} from '@/components/schedule/CalendarDayHeader';
import {TimeGrid} from '@/components/schedule/TimeGrid';
import {ClassBlock} from '@/components/schedule/ClassBlock';
import {CurrentTimeIndicator} from '@/components/schedule/CurrentTimeIndicator';
import {EmptyState} from '@/components/schedule/EmptyState';
import {LoadingIndicator} from '@/components/schedule/LoadingIndicator';

// Import the proper types
import { ClassSchedule, Semester, NewSemester, SemesterType } from '@/types/TimetableTypes';

// Local interface for the rendered class blocks 
interface ClassInfo {
  id: string;
  startTime: number;
  endTime: number;
  startTimeString: string;
  endTimeString: string;
  duration: number;
  name: string;
  color: string;
  location?: string;
}

// Constants for the days of week and time increments
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

export default function ClassScheduleScreen() {
  const { colors, isDark } = useTheme();
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [isCreatingSemester, setIsCreatingSemester] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [isSemesterModalVisible, setIsSemesterModalVisible] = useState(false);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [isScheduleEditorVisible, setIsScheduleEditorVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAttendanceStats, setShowAttendanceStats] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = Dimensions.get('window');
  
  const { 
    activeSemester, 
    isLoading,
    semesters,
    createSemester,
    setActiveSemesterById,
    classSchedules: storedClassSchedules,
    deleteSemester,
    updateSemester,
    deleteClassSchedule,
    attendanceRecords,
    calculateAttendance
  } = useSemester();
  
  // Track if we have content to display
  const hasClasses = useMemo(() => {
    return storedClassSchedules && storedClassSchedules.length > 0;
  }, [storedClassSchedules]);
  
  // Whether to show the timetable or not
  const shouldShowTimetable = useMemo(() => {
    return !isLoading && activeSemester && hasClasses;
  }, [isLoading, activeSemester, hasClasses]);
  
  // Animation values for view transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Show semester selection modal if no active semester is found after loading
    if (!isLoading && !activeSemester) {
      setIsSemesterModalVisible(true);
    } else if (activeSemester && isSemesterModalVisible) {
      // Hide modal if active semester is found
      setIsSemesterModalVisible(false);
    }
  }, [isLoading, activeSemester]);
  
  useEffect(() => {
    if (storedClassSchedules) {
      setClassSchedules(storedClassSchedules);
    }
  }, [storedClassSchedules]);

  // Scroll to current time on initial render
  useEffect(() => {
    if (scrollRef.current && viewMode === 'day') {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Calculate position to scroll to (slightly above current hour)
      const position = Math.max(0, (currentHour - 2) * 60);
      
      // Delayed scroll for layout to complete
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ y: position, animated: true });
        }
      }, 500);
    }
  }, [viewMode, scrollRef.current]);

  // Format date for header
  const formatHeaderDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    return currentDate.toLocaleDateString('en-US', options);
  };

  // Get current day index (0 = Sunday, 1 = Monday, etc.)
  const getCurrentDayIndex = () => {
    return currentDate.getDay();
  };

  // Navigate to previous/next day
  const navigateDay = (direction: number): void => {
    // Begin animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: direction > 0 ? 0.95 : 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update date
      const newDate = new Date(currentDate);
      if (viewMode === 'day') {
        newDate.setDate(currentDate.getDate() + direction);
      } else {
        // For week view, jump 7 days
        newDate.setDate(currentDate.getDate() + (direction * 7));
      }
      setCurrentDate(newDate);
      
      // Animate back in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };
  
  // Toggle between day and week views with animation
  const toggleViewMode = (newMode: 'day' | 'week'): void => {
    if (newMode === viewMode) return;
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate transition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: newMode === 'day' ? 1.1 : 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setViewMode(newMode);
      
      // Animate new view in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };
  
  // Navigate to today
  const goToToday = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Set to today
      setCurrentDate(new Date());
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Select a specific day from week view
  const handleDaySelect = (date: Date): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate zoom effect
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Set the selected date and switch to day view
      setCurrentDate(date);
      setViewMode('day');
      
      // Animate in day view
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Calculate overall attendance rate
  const calculateOverallAttendance = useMemo(() => {
    if (!storedClassSchedules || storedClassSchedules.length === 0) return 0;
    
    let totalRate = 0;
    let classCount = 0;
    
    storedClassSchedules.forEach(schedule => {
      const attendanceRate = calculateAttendance(schedule.id);
      if (attendanceRate > 0 || attendanceRecords.some(r => r.classId === schedule.id)) {
        totalRate += attendanceRate;
        classCount++;
      }
    });
    
    return classCount > 0 ? Math.round(totalRate / classCount) : 0;
  }, [storedClassSchedules, attendanceRecords, calculateAttendance]);

  // Process class schedules to fit the day view
  const getClassesForDay = (dayIndex:number) => {
    if (!classSchedules) return [];

    const dayName = DAYS[dayIndex].toLowerCase();
    
    return classSchedules
      .filter(schedule => {
        try {
          // Handle daysOfWeek regardless of format (array or string that needs parsing)
          const daysOfWeek = Array.isArray(schedule.daysOfWeek) 
            ? schedule.daysOfWeek 
            : JSON.parse(typeof schedule.daysOfWeek === 'string' ? schedule.daysOfWeek : '[]');
          
          // Check if class occurs on this day (case-insensitive comparison)
          return Array.isArray(daysOfWeek) && daysOfWeek.some((d: string) => {
            return typeof d === 'string' && d.toLowerCase() === dayName;
          });
        } catch (error) {
          console.warn('Error processing days of week:', error, schedule);
          return false;
        }
      })
      .map(schedule => {
        // Parse time strings properly - ensure we have numbers
        const startTimeParts = schedule.startTime.split(':');
        const endTimeParts = schedule.endTime.split(':');
        
        const startHour = parseInt(startTimeParts[0], 10) || 0;
        const startMinute = parseInt(startTimeParts[1], 10) || 0;
        const endHour = parseInt(endTimeParts[0], 10) || 0;
        const endMinute = parseInt(endTimeParts[1], 10) || 0;
        
        // Convert to decimal hours for position calculation
        const startDecimal = startHour + (startMinute / 60);
        const endDecimal = endHour + (endMinute / 60);
        const duration = Math.max(0.5, endDecimal - startDecimal); // Ensure minimum duration
        
        // Format times for display
        const formatTime = (hour:number, minute:number) => {
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        };

        // Calculate attendance rate for this class
        const attendanceRate = calculateAttendance(schedule.id);

        return {
          id: schedule.courseCode,
          startTime: startDecimal,
          endTime: endDecimal,
          startTimeString: formatTime(startHour, startMinute),
          endTimeString: formatTime(endHour, endMinute),
          duration: duration,
          name: schedule.courseName,
          color: generateColorFromString(schedule.courseCode),
          location: schedule.room || 'No location',
          attendanceRate: attendanceRate,
          classId: schedule.id
        };
      })
      .sort((a, b) => a.startTime - b.startTime);
  };

  const generateColorFromString = (str:string) => {
    if (!str) return '#FF7F50'; // Default color
    
    // Generate a pastel color based on the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Apple Calendar-like color palette
    const colors = [
      '#FF9500', // Orange
      '#FF2D55', // Pink
      '#5AC8FA', // Blue
      '#4CD964', // Green
      '#5856D6', // Purple
      '#FF3B30', // Red
      '#007AFF', // Deep Blue
      '#FFCC00', // Yellow
    ];
    
    // Use the hash to select a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleDeleteClass = async (classId:string) => {
    try {
      await deleteClassSchedule(classId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to delete class:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleEditClass = (classInfo: ClassInfo) => {
    // Find the original class schedule
    const originalClass = storedClassSchedules.find(
      schedule => schedule.courseCode === classInfo.id
    );
    if (originalClass) {
      setSelectedClass(originalClass);
      setIsEditModalVisible(true);
    }
  };

  const handleCreateSemester = async (semester: Omit<NewSemester, "userId">) => {
    try {
      setIsCreatingSemester(true);
      const freshlyCreatedSemester = await createSemester(semester);
      
      if (freshlyCreatedSemester && freshlyCreatedSemester.id) {
        await setActiveSemesterById(freshlyCreatedSemester.id);
      }
      setIsCreateModalVisible(false);
    } catch (error) {
      console.error('Failed to create semester:', error);
    } finally {
      setIsCreatingSemester(false);
    }
  };

  const handleUpdateSemester = async (updatedSemester: Partial<Semester>) => {
    try {
      const success = await updateSemester(updatedSemester.id!, updatedSemester);
      
      if (success) {
        setSelectedSemester(null);
        
        // If we're updating the active semester, refresh it
        if (activeSemester?.id === updatedSemester.id) {
          await setActiveSemesterById(updatedSemester.id!);
        }
      }
    } catch (error) {
      console.error('Failed to update semester:', error);
    }
  };

  const handleDeleteSemester = async (semesterId: string) => {
    try {
      await deleteSemester(semesterId);
      setSelectedSemester(null);
      
      // If we deleted the active semester, we need to handle that
      if (activeSemester?.id === semesterId) {
        // Find the first available semester to set as active, or null if none exist
        const firstAvailableSemester = semesters.find(s => s.id !== semesterId);
        if (firstAvailableSemester) {
          await setActiveSemesterById(firstAvailableSemester.id);
        }
      }
    } catch (error) {
      console.error('Failed to delete semester:', error);
    }
  };

  const handleSelectSemester = async (semesterId: string) => {
    try {
      await setActiveSemesterById(semesterId);
      setIsSemesterModalVisible(false);
    } catch (error) {
      console.error('Failed to set active semester:', error);
    }
  };

  const currentDayIndex = getCurrentDayIndex();
  const classes = getClassesForDay(currentDayIndex);

  const getClassesForDate = (date: Date) => {
    return getClassesForDay(date.getDay());
  };

  // Render attendance statistics panel
  const renderAttendanceStats = () => {
    if (!showAttendanceStats || !storedClassSchedules || storedClassSchedules.length === 0) return null;
    
    return (
      <View style={[styles.attendanceStatsPanel, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
        <View style={styles.attendanceStatsHeader}>
          <Text style={[styles.attendanceStatsTitle, { color: colors.textPrimary }]}>Attendance Overview</Text>
          <TouchableOpacity onPress={() => setShowAttendanceStats(false)}>
            <X size={20} color={colors.textSecondary} weight="bold" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.overallAttendance}>
          <Text style={[styles.overallAttendanceLabel, { color: colors.textSecondary }]}>Overall Attendance</Text>
          <Text style={[styles.overallAttendanceValue, { color: colors.textPrimary }]}>
            {calculateOverallAttendance}%
          </Text>
        </View>
        
        <ScrollView style={styles.classAttendanceList} showsVerticalScrollIndicator={false}>
          {storedClassSchedules.map(schedule => {
            const rate = calculateAttendance(schedule.id);
            const rateColor = rate >= 80 ? colors.success : rate >= 60 ? colors.warning : colors.error;
            
            return (
              <View key={schedule.id} style={[styles.classAttendanceItem, { borderBottomColor: colors.divider }]}>
                <View style={styles.classAttendanceInfo}>
                  <Text style={[styles.classAttendanceName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {schedule.courseName}
                  </Text>
                  <Text style={[styles.classAttendanceCode, { color: colors.textSecondary }]}>
                    {schedule.courseCode}
                  </Text>
                </View>
                <View style={[styles.attendanceBadge, { backgroundColor: rateColor + '20' }]}>
                  <Text style={[styles.attendanceBadgeText, { color: rateColor }]}>
                    {rate}%
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <ScheduleHeader
          activeSemester={activeSemester?.name || null}
          isDark={isDark}
          viewMode={viewMode}
          setViewMode={toggleViewMode}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          formatHeaderDate={formatHeaderDate}
          navigateDay={navigateDay}
          onSemesterPress={() => setIsSemesterModalVisible(true)}
          onTodayPress={goToToday}
        />
      
      {/* Attendance Stats Toggle */}
      {shouldShowTimetable && (
        <TouchableOpacity 
          style={[styles.attendanceToggle, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}
          onPress={() => setShowAttendanceStats(!showAttendanceStats)}
        >
          <ChartLine size={20} color={colors.textPrimary} weight="bold" />
          <Text style={[styles.attendanceToggleText, { color: colors.textPrimary }]}>
            Attendance: {calculateOverallAttendance}%
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Attendance Statistics Panel */}
      {renderAttendanceStats()}

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {isLoading || isCreatingSemester ? (
          <LoadingIndicator 
            isDark={isDark} 
            isCreatingSemester={isCreatingSemester} 
          />
        ) : !activeSemester ? (
          <EmptyState 
            message="No semester selected yet. Please select a semester to view your class schedule."
            isDark={isDark}
            activeSemester={false}
            onAddClass={() => setIsSemesterModalVisible(true)}
          />
        ) : !hasClasses ? (
          <EmptyState 
            message="No classes added for this semester yet."
            isDark={isDark}
            activeSemester={true}
            onAddClass={() => setIsAddModalVisible(true)}
          />
        ) : (
          <ScrollView 
            ref={scrollRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <TimeGrid 
              isDark={isDark}
              currentDate={currentDate}
              classes={classes}
              viewMode={viewMode as 'day' | 'week'}
              onDaySelect={handleDaySelect}
              onSwipeChangeWeek={navigateDay}
              getClassesForDay={getClassesForDate}
              calculateAttendance={calculateAttendance}
            />
          </ScrollView>
        )}
      </View>
      
      {/* Floating Action Button - only visible when there's an active semester */}
      {activeSemester && (
        <FloatingActionButton
          onPress={() => setIsAddModalVisible(true)}
          icon="plus"
          color="#FF7F50"
          iconSize={24}
          iconColor="#FFFFFF"
        />
      )}
      
      {/* Modals */}
      {isSemesterModalVisible && (
        <SemesterSelectionModal
          onClose={() => setIsSemesterModalVisible(false)}
          onNewSemester={() => {
            setIsSemesterModalVisible(false);
            setIsCreateModalVisible(true);
          }}
          onSemesterSelected={handleSelectSemester}
          semesters={semesters || []}
        />
      )}
      
      {isCreateModalVisible && (
        <CreateSemesterModal
          onClose={() => setIsCreateModalVisible(false)}
        />
      )}
      
      {selectedSemester && (
        <UpdateSemesterModal
          onClose={() => setSelectedSemester(null)}
          onSave={handleUpdateSemester}
          onDelete={handleDeleteSemester}
          semester={selectedSemester}
        />
      )}
      
      {isAddModalVisible && (
        <AddClassModal
          visible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
          semesterId={activeSemester?.id || ''}
        />
      )}

      {isEditModalVisible && selectedClass && (
        <EditClassModal
          visible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setSelectedClass(null);
          }}
          onDelete={handleDeleteClass}
          classSchedule={selectedClass}
        />
      )}

      {isScheduleEditorVisible && (
        <ScheduleEditorModal
          visible={isScheduleEditorVisible}
          onClose={() => setIsScheduleEditorVisible(false)}
          onAddNew={() => {
            setIsScheduleEditorVisible(false);
            setIsAddModalVisible(true);
          }}
          onEditClass={(classData) => {
            setIsScheduleEditorVisible(false);
            setSelectedClass(classData);
            setIsEditModalVisible(true);
          }}
          semesterId={activeSemester?.id || ''}
          isLoading={isLoading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  attendanceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 8,
  },
  attendanceToggleText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  attendanceStatsPanel: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    maxHeight: 400,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  attendanceStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  attendanceStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  overallAttendance: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  overallAttendanceLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  overallAttendanceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
  },
  classAttendanceList: {
    maxHeight: 200,
  },
  classAttendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  classAttendanceInfo: {
    flex: 1,
    marginRight: 12,
  },
  classAttendanceName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  classAttendanceCode: {
    fontSize: 13,
    fontFamily: 'Vercetti-Regular',
  },
  attendanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  attendanceBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
});