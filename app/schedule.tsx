import { Pressable, View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Dimensions, ActivityIndicator, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import FloatingActionButton from '../components/FloatingActionButton';
import ScheduleEditorModal from '../modals/ScheduleEditorModal';
import AddClassModal from '../modals/AddClassModal';
import EditClassModal from '../modals/EditClassModal';
import SemesterSelectionModal from '../modals/SemesterSelectionModal';
import CreateSemesterModal from '../modals/CreateSemesterModal';
import UpdateSemesterModal from '../modals/UpdateSemesterModal';
import { useSemester } from '@/contexts/SemesterContext';
import * as Haptics from 'expo-haptics';

// Import our modular components
import {ScheduleHeader} from '@/components/schedule/ScheduleHeader';
import {CalendarDayHeader} from '@/components/schedule/CalendarDayHeader';
import {TimeGrid} from '@/components/schedule/TimeGrid';
import {ClassBlock} from '@/components/schedule/ClassBlock';
import {CurrentTimeIndicator} from '@/components/schedule/CurrentTimeIndicator';
import {EmptyState} from '@/components/schedule/EmptyState';
import {LoadingIndicator} from '@/components/schedule/LoadingIndicator';

// Type definitions
interface ClassSchedule {
  courseCode: string;
  courseName: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[] | string;
  room?: string;
}

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', or 'month'
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isCreatingSemester, setIsCreatingSemester] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [isSemesterModalVisible, setIsSemesterModalVisible] = useState(false);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [isScheduleEditorVisible, setIsScheduleEditorVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
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
    deleteClassSchedule
  } = useSemester();
  
  // Track if we have content to display
  const hasClasses = useMemo(() => {
    return storedClassSchedules && storedClassSchedules.length > 0;
  }, [storedClassSchedules]);
  
  // Whether to show the timetable or not
  const shouldShowTimetable = useMemo(() => {
    return !isLoading && activeSemester && hasClasses;
  }, [isLoading, activeSemester, hasClasses]);
  
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
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction); 
    setCurrentDate(newDate);
  };

  // Process class schedules to fit the day view
  const getClassesForDay = (dayIndex:number) => {
    if (!classSchedules) return [];

    const dayName = DAYS[dayIndex];
    
    return classSchedules
      .filter(schedule => {
        try {
          // Parse days of week if it's a string
          const daysOfWeek = Array.isArray(schedule.daysOfWeek) 
            ? schedule.daysOfWeek 
            : JSON.parse(schedule.daysOfWeek || '[]');
          
          // Check if class occurs on this day (case-insensitive comparison)
          return Array.isArray(daysOfWeek) && daysOfWeek.some((d: string) => {
            return typeof d === 'string' && d.toLowerCase() === dayName.toLowerCase();
          });
        } catch (error) {
          console.warn('Error parsing days of week:', error);
          return false;
        }
      })
      .map(schedule => {
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
        
        // Convert to decimal hours for comparison
        const startDecimal = startHour + (startMinute / 60);
        const endDecimal = endHour + (endMinute / 60);
        
        // Format times for display
        const formatTime = (hour:number, minute:number) => {
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        };

        return {
          id: schedule.courseCode,
          startTime: startDecimal,
          endTime: endDecimal,
          startTimeString: formatTime(startHour, startMinute),
          endTimeString: formatTime(endHour, endMinute),
          duration: endDecimal - startDecimal,
          name: schedule.courseName,
          color: generateColorFromString(schedule.courseCode),
          location: schedule.room || 'No location'
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

  const handleCreateSemester = async (semester) => {
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

  const handleUpdateSemester = async (updatedSemester) => {
    try {
      const success = await updateSemester(updatedSemester.id, updatedSemester);
      
      if (success) {
        setSelectedSemester(null);
        
        // If we're updating the active semester, refresh it
        if (activeSemester?.id === updatedSemester.id) {
          await setActiveSemesterById(updatedSemester.id);
        }
      }
    } catch (error) {
      console.error('Failed to update semester:', error);
    }
  };

  const handleDeleteSemester = async (semesterId) => {
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

  const handleSelectSemester = async (semesterId) => {
    try {
      await setActiveSemesterById(semesterId);
      setIsSemesterModalVisible(false);
    } catch (error) {
      console.error('Failed to set active semester:', error);
    }
  };

  const currentDayIndex = getCurrentDayIndex();
  const classes = getClassesForDay(currentDayIndex);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      {/* Header */}
      <ScheduleHeader
        activeSemester={activeSemester?.name || null}
        isDark={isDark}
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentDate={currentDate}
        formatHeaderDate={formatHeaderDate}
        navigateDay={navigateDay}
        onSemesterPress={() => setIsSemesterModalVisible(true)}
      />

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
    backgroundColor: '#F2F2F7',
  },
  darkContainer: {
    backgroundColor: '#1C1C1E',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});