import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import FloatingActionButton from '../components/FloatingActionButton';
import ScheduleEditorModal from '../modals/ScheduleEditorModal';
import { useTimetableManagement } from '../lib/useTimeTableManagement';
import SemesterSelectionModal from '../modals/SemesterSelectionModal';
import SemesterManagementModal from '../modals/SemesterManagementModal';
import {Semester} from '../types/TimetableTypes';

// Add these type definitions at the top of the file after imports
interface ClassInfo {
  id: string;
  startTime: number;
  duration: number;
}

interface ClassDetails {
  name: string;
  color: string;
}

interface ScheduleData {
  [key: string]: ClassInfo[];
}

interface SampleClasses {
  [key: string]: ClassDetails;
}

// Update the constants with type annotations
const SAMPLE_CLASSES: SampleClasses = {
  "CSE101": { name: "Intro to Programming", color: "#FF7F50" },
  "MATH201": { name: "Calculus II", color: "#8A8AFF" },
  "PHY301": { name: "Physics Lab", color: "#FF69B4" },
  "ENG102": { name: "Technical Writing", color: "#50C878" }
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

// Update the schedule data with type annotation
const schedule: ScheduleData = {
  "Monday": [
    { id: "CSE101", startTime: 9, duration: 2 },
    { id: "MATH201", startTime: 13, duration: 1 }
  ],
  "Wednesday": [
    { id: "PHY301", startTime: 10, duration: 3 },
    { id: "ENG102", startTime: 15, duration: 1 }
  ],
  "Friday": [
    { id: "CSE101", startTime: 14, duration: 2 }
  ]
};

export default function ClassScheduleScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentWeek, setCurrentWeek] = useState(1);
  const { width } = Dimensions.get('window');
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [isSemesterModalVisible, setIsSemesterModalVisible] = useState(false);
  const [isNewSemester, setIsNewSemester] = useState(false);
  const [isCreatingSemester, setIsCreatingSemester] = useState(false);
  const [classSchedules, setClassSchedules] = useState<any[]>([]);
  
  const { 
    activeSemester, 
    isLoading,
    loadStoredData,
    semesters,
    createSemester,
    setActiveSemesterById,
    classSchedules: storedClassSchedules
  } = useTimetableManagement();
  
  // Track if we have content to display
  const hasClasses = useMemo(() => {
    return storedClassSchedules && storedClassSchedules.length > 0;
  }, [storedClassSchedules]);
  
  // Whether to show the timetable or not
  const shouldShowTimetable = useMemo(() => {
    return !isLoading && activeSemester && hasClasses;
  }, [isLoading, activeSemester, hasClasses]);
  
  useEffect(() => {
    loadStoredData();
  }, []);
  
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
    // If using real data from Supabase, you would transform it to the schedule format
    // For now, we'll keep using the sample data
    return schedule[day]?.find(cls => 
      time >= cls.startTime && time < (cls.startTime + cls.duration)
    );
  };

  const navigateWeek = (direction: number): void => {
    setCurrentWeek(prev => prev + direction);
  };

  const handleCreateSemester = async (semester:Semester) => {
    try {
      setIsCreatingSemester(true);
      const newSemester = await createSemester(semester);
      if (newSemester) {
        await setActiveSemesterById(newSemester.id);
      } else {
        console.error('Failed to create semester: newSemester is null');
      }
      setIsSemesterModalVisible(false);
    } catch (error) {
      console.error('Failed to create semester:', error);
    } finally {
      setIsCreatingSemester(false);
    }
  };

  const handleSelectSemester = async (semesterId:string) => {
    try {
      await setActiveSemesterById(semesterId);
      setIsSemesterModalVisible(false);
    } catch (error) {
      console.error('Failed to set active semester:', error);
    }
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
            onPress={() => setIsEditorVisible(true)}
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
                
                const details = SAMPLE_CLASSES[classInfo.id];
                
                return (
                  <View
                    key={`${day}-${time}`}
                    style={[
                      styles.classBlock,
                      isDark && styles.darkClassBlock,
                      { 
                        backgroundColor: details.color + (isDark ? '90' : ''),
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
                      {details.name}
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
              })}
            </View>
          ))}
        </ScrollView>)}
      
      {/* Semester Selection Modal */}
      {isSemesterModalVisible && !isNewSemester && (
        <SemesterSelectionModal
          onClose={() => setIsSemesterModalVisible(false)}
          onNewSemester={() => {
            // Close semester selection modal and open semester creation modal
            setIsSemesterModalVisible(false);
            setIsNewSemester(true);
          }}
          onSemesterSelected={handleSelectSemester}
          semesters={semesters || []}
        />
      )}
      
      {/* Semester Management Modal */}
      {isNewSemester && (
        <SemesterManagementModal
          onClose={() => {
            setIsNewSemester(false);
            // If no active semester, show selection modal again
            if (!activeSemester) {
              setIsSemesterModalVisible(true);
            }
          }}
          onSave={(semester) => {
            handleCreateSemester(semester);
          }}
          semester={undefined}
        />
      )}
      
      {/* FloatingActionButton - only visible when there's an active semester */}
      {activeSemester && (
        <FloatingActionButton
          onPress={() => setIsEditorVisible(true)}
          color="#FF7F50"
        />
      )}
      
      {/* Schedule Editor Modal */}
      <ScheduleEditorModal
        visible={isEditorVisible}
        onClose={() => setIsEditorVisible(false)}
        onSave={(data) => {
          // Handle save
          setIsEditorVisible(false);
        }}
      />
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
  }
});
