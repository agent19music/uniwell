import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Switch,
  useColorScheme,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as burnt from 'burnt';
import { ClassSchedule, DayOfTheWeek } from '@/types/TimetableTypes'; // Ensure unified type is used
import { useSemester } from '../contexts/SemesterContext';


interface EditClassModalProps {
  visible: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  classSchedule: ClassSchedule; // Use unified type
}

export default function EditClassModal({
  visible,
  onClose,
  onDelete,
  classSchedule
}: EditClassModalProps) {
  const { updateClassSchedule } = useSemester();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [slideAnim] = useState(new Animated.Value(0));
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [morningNotification, setMorningNotification] = useState(
    classSchedule.notificationPreference?.onMorning ? true : false
  );

  // Initialize state with the string time values
  const [editingData, setEditingData] = useState<ClassSchedule>(classSchedule);

  // Add this import at the top of the file 

  useEffect(() => {
    setEditingData(classSchedule); // Sync with prop changes
  }, [classSchedule]);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const getTimeFromString = (timeString: string): Date => {
    try {
      const date = new Date();
      if (!timeString) return date;
      
      // Handle different time string formats
      const timeParts = timeString.split(':');
      const hours = parseInt(timeParts[0] || '0', 10);
      const minutes = parseInt(timeParts[1] || '0', 10);
      
      date.setHours(hours);
      date.setMinutes(minutes);
      date.setSeconds(0);
      return date;
    } catch (error) {
      console.error('Error parsing time string:', error);
      return new Date();
    }
  };

  // Modify the formatTime function to be more defensive
  const formatTime = (timeString: string | null | undefined): string => {
    if (!timeString) return "Select time";
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      
      if (isNaN(hour) || isNaN(minute)) {
        return "Invalid time";
      }

      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes.padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return "Invalid time";
    }
  };

  console.log(formatTime("18:00:00"))

  // Add this function to toggle days of week
  const toggleDay = (day: string) => {
    const dayLower = day.toLowerCase();
    setEditingData(prev => {
      const currentDays = Array.isArray(prev.daysOfWeek) ? [...prev.daysOfWeek] : [];
      const dayIndex = currentDays.indexOf(dayLower);
      
      if (dayIndex === -1) {
        currentDays.push(dayLower);
      } else {
        currentDays.splice(dayIndex, 1);
      }
      
      return {
        ...prev,
        daysOfWeek: currentDays
      };
    });
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:00`;
      setEditingData(prev => ({...prev, startTime: timeString}));
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:00`;
      setEditingData(prev => ({...prev, endTime: timeString}));
    }
  };

  const handleMorningNotificationChange = (value: boolean) => {
    setMorningNotification(value);
    setEditingData(prev => ({
      ...prev,
      notificationPreference: {
        ...prev.notificationPreference,
        morningReminder: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      if (!editingData.courseName.trim()) {
        burnt.toast({ title: 'Error', message: 'Course name is required', duration: 2 });
        return;
      }

      if (editingData.daysOfWeek.length === 0) {
        burnt.toast({ title: 'Error', message: 'Please select at least one day', duration: 2 });
        return;
      }

      await updateClassSchedule(editingData.id, editingData); // Persist changes
      burnt.toast({ title: 'Success', message: 'Class updated successfully', duration: 2 });
      onClose();
    } catch (error) {
      burnt.toast({ title: 'Error', message: 'Failed to update class', duration: 2 });
      console.error('Error updating class:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={styles.backdrop}>
        <Animated.View
          style={[
            styles.modalContainer,
            isDark && styles.darkModalContainer,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0],
                }),
              }],
            },
          ]}
        >
          <View style={[styles.header, isDark && styles.darkHeader]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FF7F50" />
            </TouchableOpacity>
            <Text style={[styles.title, isDark && styles.darkText]}>Edit Class</Text>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.editFormScroll, isDark && styles.darkEditFormScroll]}>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.darkLabel]}>Course Name</Text>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                value={editingData.courseName}
                onChangeText={(text) => setEditingData((prev) => ({ ...prev, courseName: text }))}
                placeholder="Enter course name"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.darkLabel]}>Course Code</Text>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                value={editingData.courseCode}
                onChangeText={(text) => setEditingData((prev) => ({ ...prev, courseCode: text }))}
                placeholder="Enter course code"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.darkLabel]}>Room</Text>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                value={editingData.room}
                onChangeText={(text) => setEditingData((prev) => ({ ...prev, room: text }))}
                placeholder="Enter room number"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.darkLabel]}>Instructor</Text>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                value={editingData.instructor}
                onChangeText={(text) => setEditingData((prev) => ({ ...prev, instructor: text }))}
                placeholder="Enter instructor name"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
            </View>

            <View style={[styles.divider, isDark && styles.darkDivider]} />

            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Class Time</Text>
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerRow}>
                <Text style={[styles.timeLabel, isDark && styles.darkLabel]}>Start Time</Text>
                <TouchableOpacity 
                  style={[styles.timeButton, isDark && styles.darkTimeButton]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={[styles.timeButtonText, isDark && styles.darkText]}>
                    {editingData?.startTime ? formatTime(editingData.startTime) : "Select time"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timePickerRow}>
                <Text style={[styles.timeLabel, isDark && styles.darkLabel]}>End Time</Text>
                <TouchableOpacity 
                  style={[styles.timeButton, isDark && styles.darkTimeButton]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={[styles.timeButtonText, isDark && styles.darkText]}>
                    {editingData?.endTime ? formatTime(editingData.endTime) : "Select time"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.divider, isDark && styles.darkDivider]} />

            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Days</Text>
            <View style={styles.dayButtonContainer}>
              {Object.values(DayOfTheWeek).map(day => (
                <TouchableOpacity 
                  key={day}
                  style={[
                    styles.dayButton,
                    isDark && styles.darkDayButton,
                    editingData?.daysOfWeek.includes(day) && styles.selectedDayButton,
                  ]}
                  onPress={() => {
                    setEditingData(prev => {
                      const newDays = prev.daysOfWeek.includes(day)
                        ? prev.daysOfWeek.filter(d => d !== day)
                        : [...prev.daysOfWeek, day];
                      return {...prev, daysOfWeek: newDays};
                    });
                  }}
                >
                  <Text style={[
                    styles.dayButtonText,
                    isDark && styles.darkDayButtonText,
                    editingData?.daysOfWeek.includes(day) && styles.selectedDayButtonText
                  ]}>
                    {day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.divider, isDark && styles.darkDivider]} />

            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Notifications</Text>
            <View style={styles.notificationContainer}>
              <View style={styles.notificationRow}>
                <Text style={[styles.notificationLabel, isDark && styles.darkLabel]}>
                  Morning Reminder
                </Text>
                <Switch
                  value={morningNotification}
                  onValueChange={handleMorningNotificationChange}
                  trackColor={{ false: '#767577', true: '#FF7F50' }}
                  thumbColor={morningNotification ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.notificationRow}>
                <Text style={[styles.notificationLabel, isDark && styles.darkLabel]}>
                  Remind Before Class
                </Text>
                <TextInput
                  style={[styles.notificationInput, isDark && styles.darkInput]}
                  value={editingData?.notificationPreference?.beforeClass?.toString() || "15"}
                  onChangeText={(text) => {
                    const minutes = parseInt(text) || 0;
                    setEditingData(prev => ({
                      ...prev,
                      notificationPreference: {
                        ...prev.notificationPreference,
                        beforeClass: minutes
                      }
                    }));
                  }}
                  keyboardType="numeric"
                  placeholder="Minutes"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                />
                <Text style={[styles.minutesText, isDark && styles.darkLabel]}>min</Text>
              </View>
            </View>

            {editingData?.id && (
              <TouchableOpacity 
                style={[styles.deleteButton, isDark && styles.darkDeleteButton]}
                onPress={() => onDelete?.(editingData.id)}
              >
                <Text style={styles.deleteText}>Remove This Class</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {showStartTimePicker && (
            <DateTimePicker
              value={getTimeFromString(editingData.startTime || '00:00:00')}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={handleStartTimeChange}
            />
          )}

          {showEndTimePicker && (
            <DateTimePicker
              value={getTimeFromString(editingData.endTime || '00:00:00')}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={handleEndTimeChange}
            />
          )}
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  darkDivider:{

  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  backButton: {
    padding: 8,
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'SF-Regular',
  },
  deleteButton: {
    margin: 32,
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 10,
    alignItems: 'center',
  },
  darkDeleteButton: {
    backgroundColor: '#3A2729',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  darkModalContainer: {
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  darkHeader: {
    borderBottomColor: '#38383A',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  darkText: {
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    color: '#FF7F50',
    fontSize: 17,
    fontWeight: '600',
  },
  editFormScroll: {
    padding: 16,
  },
  darkEditFormScroll: {
    backgroundColor: '#1C1C1E',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000',
  },
  darkLabel: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#000',
  },
  darkInput: {
    borderColor: '#38383A',
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
    color: '#000',
  },
  timePickerContainer: {
    marginBottom: 24,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 15,
    color: '#000',
  },
  timeButton: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  darkTimeButton: {
    borderColor: '#38383A',
    backgroundColor: '#2C2C2E',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#000',
  },
  dayButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dayButton: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  darkDayButton: {
    borderColor: '#38383A',
    backgroundColor: '#2C2C2E',
  },
  selectedDayButton: {
    backgroundColor: '#FF7F50',
    borderColor: '#FF7F50',
  },
  dayButtonText: {
    fontSize: 15,
    color: '#000',
  },
  darkDayButtonText: {
    color: '#FFFFFF',
  },
  selectedDayButtonText: {
    color: '#FFFFFF',
  },
  notificationContainer: {
    marginBottom: 24,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationLabel: {
    fontSize: 15,
    color: '#000',
  },
    notificationInput: {
      borderWidth: 1,
      borderColor: '#E5E5E5',
      borderRadius: 8,
      padding: 12,
      minWidth: 80,
      textAlign: 'center',
      fontSize: 16,
      backgroundColor: '#FFFFFF',
      color: '#000',
    },
    minutesText: {
      fontSize: 15,
      marginLeft: 8,
      color: '#000',
    },
  });






