import {Pressable, View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Dimensions, ActivityIndicator, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Ionicons, MaterialIcons , Feather} from '@expo/vector-icons';
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
import * as Haptics from 'expo-haptics';
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
  
console.log(classSchedules)
  
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
    
    // Find matching class for this time slot
    const matchingClass = classSchedules.find(schedule => {
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
      
      // Only return true if this is the starting hour of the class
      const isStartingHour = Math.floor(scheduleStart) === time;
      
      return isCorrectDay && isStartingHour;
    });

    if (!matchingClass) return undefined;

    // Calculate duration in hours
    const [startHour, startMinute] = matchingClass.startTime.split(':').map(Number);
    const [endHour, endMinute] = matchingClass.endTime.split(':').map(Number);
    const duration = (endHour + endMinute/60) - (startHour + startMinute/60);

    return {
      id: matchingClass.courseCode,
      startTime: startHour,
      duration: duration,
      name: matchingClass.courseName,
      color: generateColorFromString(matchingClass.courseCode)
    };
  };

  const generateColorFromString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

interface ClassBlockProps {
  classInfo: ClassInfo;
  day: string;
  time: number;
  isDark: boolean;
  onEdit?: (classInfo: ClassInfo) => void;
  onDelete?: (id: string) => void;
  onMarkCompleted?: (classInfo: ClassInfo) => void;
}

const ClassBlock: React.FC<ClassBlockProps> = ({ 
  classInfo, 
  day, 
  time, 
  isDark, 
  onEdit, 
  onDelete, 
  onMarkCompleted 
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const blockRef = useRef<View>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    blockRef.current?.measure((fx, fy, width, height, px, py) => {
      setMenuPosition({ 
        x: px + width - 150,
        y: py - 10
      });
      setMenuVisible(true);
    });
  };

  return (
    <>
      <Animated.View
        ref={blockRef}
        style={{
          transform: [{ scale: scaleAnim }],
          flex: 1,
        }}
      >
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={300}
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
            numberOfLines={1}
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
        </Pressable>
      </Animated.View>

      {/* Context Menu */}
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View 
            style={[
              styles.contextMenu, 
              isDark && styles.darkContextMenu,
              {
                left: menuPosition.x,
                top: menuPosition.y,
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setMenuVisible(false);
                onEdit && onEdit(classInfo);
              }}
            >
              <Feather name="edit-2" size={18} color={isDark ? '#FFFFFF' : '#333333'} />
              <Text style={[styles.menuText, isDark && styles.darkMenuText]}>Edit</Text>
            </TouchableOpacity>
            
            <View style={[styles.divider, isDark && styles.darkDivider]} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onMarkCompleted && onMarkCompleted(classInfo);
              }}
            >
              <Feather name="check-circle" size={18} color={isDark ? '#FFFFFF' : '#333333'} />
              <Text style={[styles.menuText, isDark && styles.darkMenuText]}>Mark Completed</Text>
            </TouchableOpacity>
            
            <View style={[styles.divider, isDark && styles.darkDivider]} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onDelete && onDelete(classInfo.id);
              }}
            >
              <Feather name="trash-2" size={18} color={isDark ? '#FF453A' : '#FF3B30'} />
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};
  
  // Now update the renderClassBlock function in your main component to use this new component
  interface RenderClassBlockProps {
    classInfo: ClassInfo;
    day: string;
    time: number;
    isDark: boolean;
    onEditClass?: (classInfo: ClassInfo) => void;
    onDeleteClass?: (classId: string) => void;
  }

  const renderClassBlock = ({ 
    classInfo, 
    day, 
    time, 
    isDark, 
    onEditClass, 
    onDeleteClass 
  }: RenderClassBlockProps): React.ReactNode => {
    if (!classInfo) return null;

    return (
    <ClassBlock
      key={`${day}-${time}`}
      classInfo={classInfo}
      day={day}
      time={time}
      isDark={isDark}
      onEdit={(classData: ClassInfo) => {
              // Find the original class schedule from stored data
              const originalClass = storedClassSchedules.find(
                schedule => schedule.courseCode === classData.id 
              );
              if (originalClass) {
                // Use the found class schedule instead of classData
                setSelectedClass(originalClass);
                setIsEditModalVisible(true);
              }
            }}
        onDelete={(classId: string) => handleDeleteClass(classId)}
        onMarkCompleted={(classData: ClassInfo) => {
          // Implement completion marking logic here
          console.log('Marked as completed:', classData.name);
          // Show a confirmation toast or some visual indicator
        }}
      />
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
      
      return renderClassBlock({
        classInfo,
        day,
        time,
        isDark,
        onEditClass: (classData: ClassInfo) => {
          const originalClass = storedClassSchedules.find(
            schedule => schedule.courseCode === classData.id
          );
          if (originalClass) {
            setSelectedClass(originalClass);
            setIsEditModalVisible(true);
          }
        },
        onDeleteClass: handleDeleteClass
      });
    })}
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
                
                return renderClassBlock({
                  classInfo,
                  day,
                  time,
                  isDark,
                  onEditClass: (classData: ClassInfo) => {
                    const originalClass = storedClassSchedules.find(
                      schedule => schedule.courseCode === classData.id
                    );
                    if (originalClass) {
                      setSelectedClass(originalClass);
                      setIsEditModalVisible(true);
                    }
                  },
                  onDeleteClass: handleDeleteClass
                });
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
          iconSize={24}
          iconColor="#FFFFFF"
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
  classBlock: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    margin: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  darkClassBlock: {
    shadowColor: '#FFF',
    shadowOpacity: 0.05,
  },
  className: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 4,
  },
  classTime: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.7)',
    fontFamily: 'Vercetti-Regular',
  },
  darkClassTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  contextMenu: {
    position: 'absolute',
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  darkContextMenu: {
    backgroundColor: '#2C2C2E',
    shadowColor: '#000',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 15,
    color: '#000000',
    marginLeft: 10,
    fontFamily: 'Vercetti-Regular',
  },
  darkMenuText: {
    color: '#FFFFFF',
  },
  deleteText: {
    fontSize: 15,
    color: '#FF3B30',
    marginLeft: 10,
    fontFamily: 'Vercetti-Regular',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
  },
  darkDivider: {
    backgroundColor: '#38383A',
  },
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
  }
});
