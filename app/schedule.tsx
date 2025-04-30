import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import FloatingActionButton from '../components/FloatingActionButton';
import ScheduleEditorModal from '../modals/ScheduleEditorModal';
import { useTimetableManagement } from '../lib/useTimeTableManagement';
import { ClassSchedule } from '../types/TimetableTypes';
import SemesterSelectionModal from '../modals/SemesterSelectionModal';
import CreateSemesterModal from '../modals/CreateSemesterModal';
import UpdateSemesterModal from '../modals/UpdateSemesterModal';
import {Semester, NewSemester} from '../types/TimetableTypes';
import AddClassModal from '../modals/AddClassModal';
import EditClassModal from '../modals/EditClassModal';
import { useSemester } from '@/contexts/SemesterContext';

// Add these type definitions at the top of the file after imports
interface ClassInfo {
  id: string;
  startTime: number;
  duration: number;
  name: string;
  color: string;
}

interface ScheduleData {
  [key: string]: ClassInfo[];
}

// Update the constants with type annotations
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

export default function ClassScheduleScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentWeek, setCurrentWeek] = useState(1);
  const { width } = Dimensions.get('window');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [isCreatingSemester, setIsCreatingSemester] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [isSemesterModalVisible, setIsSemesterModalVisible] = useState(false);
  const [classSchedules, setClassSchedules] = useState<any[]>([]);
  const [isScheduleEditorVisible, setIsScheduleEditorVisible] = useState(false);
  
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

  const getClassForTimeSlot = (day: string, time: number): ClassInfo | undefined => {
    if (!classSchedules) return undefined;
    
    return classSchedules
      .filter(schedule => {
        // Parse days of week if it's a string
        const daysOfWeek = Array.isArray(schedule.daysOfWeek) 
          ? schedule.daysOfWeek 
          : JSON.parse(schedule.daysOfWeek || '[]');
        
        // Check if class occurs on this day (case-insensitive comparison)
        const isCorrectDay = daysOfWeek.some((d: string) => 
          d.toLowerCase() === day.toLowerCase()
        );
        
        // Parse time strings to hours and minutes
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
        
        // Convert to decimal hours for comparison
        const scheduleStart = startHour + (startMinute / 60);
        const scheduleEnd = endHour + (endMinute / 60);
        
        const isCorrectTime = time >= scheduleStart && time < scheduleEnd;
        
        return isCorrectDay && isCorrectTime;
      })
      .map(schedule => ({
        id: schedule.courseCode,
        startTime: parseInt(schedule.startTime.split(':')[0]),
        duration: 
          (parseInt(schedule.endTime.split(':')[0]) - 
           parseInt(schedule.startTime.split(':')[0])),
        name: schedule.courseName,
        color: generateColorFromString(schedule.courseCode)
      }))[0];
  };

  const generateColorFromString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  const renderClassBlock = (classInfo: ClassInfo, day: string, time: number) => {
    if (!classInfo) return null;

    return (
      <View
        key={`${day}-${time}`}
        style={[
          styles.classBlock,
          isDark && styles.darkClassBlock,
          { 
            backgroundColor: classInfo.color + (isDark ? '90' : ''),
            height: classInfo.duration * 50 - 4
          }
        ]}
      >
        <Text 
          style={[
            styles.className, 
            { color: isDark ? '#FFFFFF' : '#000000' }
          ]}
        >
          {classInfo.name}
        </Text>
        <Text 
          style={[
            styles.classTime, 
            isDark && styles.darkClassTime
          ]}
        >
          {classInfo.startTime > 12 
            ? `${classInfo.startTime - 12}` 
            : classInfo.startTime}{(classInfo.startTime >= 12) ? ' PM' : ' AM'} - 
          {(classInfo.startTime + classInfo.duration) > 12 
            ? `${(classInfo.startTime + classInfo.duration) - 12}` 
            : (classInfo.startTime + classInfo.duration)}{((classInfo.startTime + classInfo.duration) >= 12) ? ' PM' : ' AM'}
        </Text>
      </View>
    );
  };

  const navigateWeek = (direction: number): void => {
    setCurrentWeek(prev => prev + direction);
  };

  const handleCreateSemester = async (semester: NewSemester) => {
    try {
      setIsCreatingSemester(true);
      console.log('Creating semester with data:', semester);
      const freshlyCreatedSemester = await createSemester(semester);
      console.log('Response from createSemester:', freshlyCreatedSemester);
      
      if (freshlyCreatedSemester && freshlyCreatedSemester.id) {
        await setActiveSemesterById(freshlyCreatedSemester.id);
      } else {
        console.error('Failed to create semester: freshlyCreatedSemester is null or has no id');
      }
      setIsCreateModalVisible(false);  // Use this instead of setIsNewSemester
    } catch (error) {
      console.error('Failed to create semester:', error);
    } finally {
      setIsCreatingSemester(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      await deleteClassSchedule(classId);
    } catch (error) {
      console.error('Failed to delete class:', error);
    }
  };

  const handleUpdateSemester = async (updatedSemester: Semester) => {
    try {
      console.log('Updating semester with data:', updatedSemester);
      const success = await updateSemester(updatedSemester.id, updatedSemester);
      
      if (success) {
        setSelectedSemester(null);
        
        // If we're updating the active semester, refresh it
        if (activeSemester?.id === updatedSemester.id) {
          await setActiveSemesterById(updatedSemester.id);
        }
      } else {
        console.error('Failed to update semester');
      }
    } catch (error) {
      console.error('Failed to update semester:', error);
    }
  };

  const handleDeleteSemester = async (semesterId: string) => {
    try {
      console.log('Deleting semester:', semesterId);
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

  const ScheduleSkeleton = () => {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    return (
      <ScrollView style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.timeLabel} />
          {DAYS.map((day) => (
            <Animated.View
              key={day}
              style={[
                styles.dayHeader,
                {
                  opacity: pulseAnim,
                  backgroundColor: isDark ? '#333' : '#e0e0e0',
                },
              ]}
            />
          ))}
        </View>
        {TIME_SLOTS.map((time) => (
          <View key={time} style={styles.timeSlotRow}>
            <Animated.View
              style={[
                styles.timeLabel,
                {
                  opacity: pulseAnim,
                  backgroundColor: isDark ? '#333' : '#e0e0e0',
                },
              ]}
            />
            {DAYS.map((day) => (
              <Animated.View
                key={`${day}-${time}`}
                style={[
                  styles.emptySlot,
                  {
                    opacity: pulseAnim,
                    backgroundColor: isDark ? '#333' : '#e0e0e0',
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isDark && styles.darkText]}>Class Schedule</Text>
          <TouchableOpacity 
            style={styles.semesterButton}
            onPress={() => setIsSemesterModalVisible(true)}
          >
            <MaterialIcons name="edit-calendar" size={22} color={isDark ? '#FFFFFF' : '#FF7F50'} />
          </TouchableOpacity>
        </View>
        <View style={styles.subtitleContainer}>
          <Text style={[styles.subtitle, isDark && styles.darkSubText]}>
            {activeSemester ? activeSemester.name : 'No Active Semester'}
          </Text>
          <Text style={[styles.subtitle, isDark && styles.darkSubText]}>
            {activeSemester ? `Week ${currentWeek}` : ''}
          </Text>
        </View>
      </View>

      {activeSemester && (
        <View style={styles.weekNavigation}>
          <TouchableOpacity 
            onPress={() => navigateWeek(-1)} 
            style={styles.navButton}
            disabled={!hasClasses}
          >
            <Ionicons 
              name="chevron-back" 
              size={22}
              color={!hasClasses ? '#CCCCCC' : '#FF7F50'}
            />
          </TouchableOpacity>
          <Text style={[styles.weekText, isDark && styles.darkText]}>
            {activeSemester ? `${activeSemester.name} - ` : ''}Week {currentWeek}
          </Text>
          <TouchableOpacity 
            onPress={() => navigateWeek(1)} 
            style={styles.navButton}
            disabled={!hasClasses}
          >
            <Ionicons 
              name="chevron-forward" 
              size={22}
              color={!hasClasses ? '#CCCCCC' : '#FF7F50'}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading state */}
      {isLoading || isCreatingSemester ? (
        <View style={styles.placeholderContainer}>
          <Text style={[styles.placeholderText, isDark && styles.darkText]}>
            {isCreatingSemester ? 'Creating your semester...' : 'Loading your schedule...'}
          </Text>
        </View>
      ) : null}

      {!activeSemester ? (
        <View style={styles.placeholderContainer}>
          <Text style={[styles.placeholderText, isDark && styles.darkText]}>
            No semester selected yet. Please select a semester to view your class schedule.
          </Text>
        </View>
      ) : !hasClasses ? (
        <View style={styles.placeholderContainer}>
          <Text style={[styles.placeholderText, isDark && styles.darkText]}>
            No classes added for this semester yet.
          </Text>
          <TouchableOpacity 
            style={[styles.addClassButton, isDark && styles.darkAddClassButton]} 
            onPress={() => setIsAddModalVisible(true)}
          >
            <Text style={styles.addClassButtonText}>Add Classes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scheduleContainer}>
          <View style={styles.timelineHeader}>
            <View style={styles.dayLabelContainer}>
              <View style={{ width: 60 }} />
              {DAYS.map(day => (
                <Text 
                  key={day} 
                  style={[styles.dayLabel, isDark && styles.darkText]}
                >
                  {day.substring(0, 3)}
                </Text>
              ))}
            </View>
          </View>
          
          {TIME_SLOTS.map(time => (
            <View key={time} style={styles.timeSlotRow}>
              <Text style={[styles.timeLabel, isDark && styles.darkTimeLabel]}>
                {time > 12 ? `${time - 12} PM` : time === 12 ? '12 PM' : `${time} AM`}
              </Text>
              
              {DAYS.map(day => {
                const classInfo = getClassForTimeSlot(day, time);
                
                if (!classInfo) {
                  return (
                    <View 
                      key={`${day}-${time}`} 
                      style={[styles.emptySlot, isDark && styles.darkEmptySlot]} 
                    />
                  );
                }
                
                // If this class spans multiple time slots and this isn't the first,
                // return an empty fragment to avoid duplicate blocks
                if (
                  time > classInfo.startTime && 
                  time < (classInfo.startTime + classInfo.duration)
                ) {
                  return <View key={`${day}-${time}`} />;
                }
                
                return renderClassBlock(classInfo, day, time);
              })}
            </View>
          ))}
        </ScrollView>)}
      
      {/* Semester Selection Modal */}
      {isSemesterModalVisible && (
        <SemesterSelectionModal
          onClose={() => setIsSemesterModalVisible(false)}
          onNewSemester={() => {
            setIsSemesterModalVisible(false);
            setIsCreateModalVisible(true);  // Use this instead of setIsNewSemester
          }}
          onSemesterSelected={handleSelectSemester}
          semesters={semesters || []}
        />
      )}
      
      {/* Create Semester Modal */}
      {isCreateModalVisible && (
        <CreateSemesterModal
          onClose={() => setIsCreateModalVisible(false)}
        />
      )}
      
      {/* Update Semester Modal */}
      {selectedSemester && (
        <UpdateSemesterModal
          onClose={() => setSelectedSemester(null)}
          onSave={handleUpdateSemester}
          onDelete={handleDeleteSemester}
          semester={selectedSemester}
        />
      )}
      
      {/* FloatingActionButton - only visible when there's an active semester */}
      {activeSemester && (
        <FloatingActionButton
          onPress={() => setIsScheduleEditorVisible(true)}
          icon="pencil"
          color="#FF7F50"
        />
      )}
      
      {/* Add Class Modal */}
      {isAddModalVisible && (
        <AddClassModal
          visible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
          semesterId={activeSemester?.id || ''}
        />
      )}

      {/* Edit Class Modal */}
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

      {/* Schedule Editor Modal */}
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
    backgroundColor: '#F2F2F7', // iOS system background gray
  },
  darkContainer: {
    backgroundColor: '#1C1C1E', // Slightly softer than pure black for better contrast
  },
  header: {
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8', // iOS light separator color
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  semesterButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 34, // iOS large title size
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
    letterSpacing: 0.41, // iOS spec
  },
  subtitle: {
    fontSize: 15,
    color: '#6C6C70', // iOS secondary label color
    fontFamily: 'Vercetti-Regular',
    letterSpacing: -0.24,
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: '#98989F', // iOS dark mode secondary label
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
    color: '#FF7F50'
  },
  navButton: {
    padding: 12,
    borderRadius: 8,
    color: '#FF7F50'
  },
  weekText: {
    fontSize: 17, // iOS body text
    fontWeight: '600',
    marginHorizontal: 16,
    fontFamily: 'Vercetti-Regular',
    letterSpacing: -0.41,
    color: '#FF7F50'
  },
  scheduleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  timelineHeader: {
    marginBottom: 12,
    paddingTop: 8,
  },
  dayLabelContainer: {
    flexDirection: 'row',
    paddingRight: 16,
    paddingBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
    letterSpacing: -0.24,
  },
  timeSlotRow: {
    flexDirection: 'row',
    height: 50, // Slightly smaller for better density
    alignItems: 'flex-start',
  },
  emptySlot: {
    flex: 1,
    height: 50,
    borderWidth: 0.5,
    borderColor: '#C6C6C8', // iOS light separator
  },
  darkEmptySlot: {
    borderColor: '#38383A', // Subtle dark mode border
  },
  classBlock: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    margin: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkClassBlock: {
    shadowColor: '#FFF',
    shadowOpacity: 0.05,
  },
  className: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  timeLabel: {
    width: 60,
    fontSize: 14,
    textAlign: 'center',
    color: '#6C6C70',
    fontFamily: 'Vercetti-Regular',
  },
  darkTimeLabel: {
    color: '#98989F',
  },
  classTime: {
    fontSize: 12,
    color: '#6C6C70',
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  darkClassTime: {
    color: '#98989F',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#6C6C70',
    marginBottom: 20,
    fontFamily: 'Vercetti-Regular',
  },
  addClassButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  darkAddClassButton: {
    backgroundColor: '#FF7F50',
  },
  addClassButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  darkMessage: {
    color: '#999',
  },
  headerRow: {
    flexDirection: 'row',
    paddingLeft: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dayHeader: {
    flex: 1,
    height: 40,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  timeLabel: {
    width: 50,
    height: 20,
    marginVertical: 2,
    borderRadius: 4,
  },
});
