import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Switch
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useTimetableManagement } from '@/lib/useTimeTableManagement';
import { 
  ClassFrequency, 
  ClassType, 
  ClassSchedule ,
  DayOfTheWeek
} from '@/types/TimetableTypes';
import { useColorScheme } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';

interface StudyTimetableModalProps {
  visible: boolean;
  onClose: () => void;
}

interface TimeSlot {
  day: DayOfTheWeek;
  startTime: Date;
  endTime: Date;
}

export const StudyTimetableModal: React.FC<StudyTimetableModalProps> = ({ 
  visible, 
  onClose 
}) => {
  const { addClassSchedule } = useTimetableManagement();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [classType, setClassType] = useState<ClassType>(ClassType.LECTURE);
  const [frequency, setFrequency] = useState<ClassFrequency>(ClassFrequency.WEEKLY);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [location, setLocation] = useState('');
  const [notificationBefore, setNotificationBefore] = useState('1');
  const [morningNotification, setMorningNotification] = useState(true);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const router = useRouter();
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleAddTimeSlot = () => {
    if (frequency === ClassFrequency.MULTIPLE_TIMES_PER_WEEK) {
      setTimeSlots([...timeSlots, {
        day: DayOfTheWeek.MONDAY,
        startTime: new Date(),
        endTime: new Date(),
      }]);
    }
  };

  const updateTimeSlot = (index: number, updates: Partial<TimeSlot>) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index] = { ...newTimeSlots[index], ...updates };
    setTimeSlots(newTimeSlots);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const toggleDay = (day: DayOfTheWeek) => {
    if (frequency === ClassFrequency.WEEKLY) {
      // For weekly, replace the entire timeSlots array with just one slot
      setTimeSlots([{
        day,
        startTime: timeSlots[0]?.startTime || new Date(),
        endTime: timeSlots[0]?.endTime || new Date(),
      }]);
    } else if (frequency === ClassFrequency.MULTIPLE_TIMES_PER_WEEK) {
      // For multiple times per week, check if the day is already selected
      const existingSlotIndex = timeSlots.findIndex(slot => slot.day === day);
      if (existingSlotIndex >= 0) {
        // If day exists, remove it
        setTimeSlots(timeSlots.filter((_, index) => index !== existingSlotIndex));
      } else {
        // If day doesn't exist, add it
        setTimeSlots([...timeSlots, {
          day,
          startTime: new Date(),
          endTime: new Date(),
        }]);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!courseName.trim()) newErrors.courseName = 'Course name is required';
    if (!courseCode.trim()) newErrors.courseCode = 'Course code is required';
    if (timeSlots.length === 0) newErrors.timeSlots = 'At least one time slot is required';
    
    timeSlots.forEach((slot, index) => {
      if (slot.endTime <= slot.startTime) {
        newErrors[`timeSlot${index}`] = 'End time must be after start time';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSchedule = async () => {
    if (!validateForm()) return;

    const newSchedule: Omit<ClassSchedule, 'id'> = {
      courseName,
      courseCode,
      classType,
      frequency,
      daysOfWeek: timeSlots.map(slot => slot.day),
      startTime: timeSlots[0].startTime, // For backward compatibility
      endTime: timeSlots[0].endTime, // For backward compatibility
      room: location,
      instructor: '',
      type: classType,
      notificationPreference: {
        beforeClass: Number(notificationBefore),
        onMorning: Number(morningNotification ? 1 : 0),
        afterClass: null
      }
    };

    await addClassSchedule(newSchedule);
    onClose();
  };

  // Update the frequency handler to reset time slots appropriately
  const handleFrequencyChange = (newFrequency: ClassFrequency) => {
    setFrequency(newFrequency);
    // Reset time slots when frequency changes
    setTimeSlots([]);
  };

  // Helper function to format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderDayButtons = () => {
    const days: DayOfTheWeek[] = [
      DayOfTheWeek.MONDAY, 
      DayOfTheWeek.TUESDAY, 
      DayOfTheWeek.WEDNESDAY, 
      DayOfTheWeek.THURSDAY, 
      DayOfTheWeek.FRIDAY
    ];

    return (
      <View style={[styles.dayButtonContainer, isDark && styles.darkDayButtonContainer]}>
        {days.map(day => (
          <TouchableOpacity 
            key={day} 
            style={[
              styles.dayButton, 
              isDark && styles.darkDayButton,
              timeSlots.some(slot => slot.day === day) && styles.selectedDayButton,
            ]}
            onPress={() => toggleDay(day)}
          >
            <Text style={[
              styles.dayButtonText,
              isDark && styles.darkText,
              timeSlots.some(slot => slot.day === day) && styles.selectedDayButtonText
            ]}>
              {day.charAt(0).toUpperCase() + day.slice(1).toLowerCase().substring(0, 2)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTimeSlots = () => {
    if (frequency === ClassFrequency.MULTIPLE_TIMES_PER_WEEK) {
      return (
        <View>
          {timeSlots.map((slot, index) => (
            <View key={index} style={styles.timeSlotContainer}>
              <Picker
                selectedValue={slot.day}
                onValueChange={(day) => updateTimeSlot(index, { day: day as DayOfTheWeek })}
                style={[styles.picker, isDark && styles.darkPicker]}
              >
                {Object.values(DayOfTheWeek).map(day => (
                  <Picker.Item 
                    key={day} 
                    label={day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()} 
                    value={day}
                  />
                ))}
              </Picker>
              {/* Add time pickers for start and end time */}
              <TouchableOpacity onPress={() => removeTimeSlot(index)}>
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={handleAddTimeSlot}>
            <Text style={styles.addButtonText}>Add Time Slot</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // For weekly and daily, show the existing day selection UI
    return renderDayButtons();
  };

  return (
  
      <View style={[styles.modalContainer, isDark && styles.darkModalContainer]}>
        <View style={[styles.header]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#FF7F50" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>Add Study Schedule</Text>
          <TouchableOpacity onPress={handleAddSchedule}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={[styles.modalContent, isDark && styles.darkModalContent]}>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            placeholder="Course Name"
            placeholderTextColor={isDark ? '#888' : '#666'}
            value={courseName}
            onChangeText={setCourseName}
          />
          
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            placeholder="Course Code"
            placeholderTextColor={isDark ? '#888' : '#666'}
            value={courseCode}
            onChangeText={setCourseCode}
          />
          
          <View style={[styles.pickerContainer, isDark && styles.darkPickerContainer]}>
            <Picker
              selectedValue={classType}
              onValueChange={(itemValue) => setClassType(itemValue as ClassType)}
              style={[styles.picker, isDark && styles.darkPicker]}
            >
              {Object.values(ClassType).map(type => (
                <Picker.Item 
                  key={type} 
                  label={type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()} 
                  value={type}
                  color={isDark ? '#fff' : '#333'}
                  style={{ backgroundColor: isDark ? '#1e1e1e' : 'white' }}
                />
              ))}
            </Picker>
          </View>
          
          <View style={[styles.pickerContainer, isDark && styles.darkPickerContainer]}>
            <Picker
              selectedValue={frequency}
              onValueChange={(itemValue) => handleFrequencyChange(itemValue as ClassFrequency)}
              style={[styles.picker, isDark && styles.darkPicker]}
            >
              {Object.values(ClassFrequency)
                .map(freq => (
                  <Picker.Item 
                    key={freq} 
                    label={freq.charAt(0).toUpperCase() + freq.slice(1).toLowerCase()} 
                    value={freq}
                    color={isDark ? '#fff' : '#333'}
                    style={{ backgroundColor: isDark ? '#1e1e1e' : 'white' }}
                  />
              ))}
            </Picker>
          </View>
          <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerLine} />
              </View>
          
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Select Days</Text>
          {renderTimeSlots()}
          <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerLine} />
              </View>
          <View style={styles.timePickerContainer}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Class Time</Text>
            
            <View style={styles.timePickerRow}>
              <Text style={[styles.timeLabel, isDark && styles.darkText]}>Start:</Text>
              <TouchableOpacity 
                style={[styles.timeButton, isDark && styles.darkTimeButton]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={[styles.timeButtonText, isDark && styles.darkText]}>
                  {formatTime(timeSlots[0]?.startTime || new Date())}
                </Text>
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={timeSlots[0]?.startTime || new Date()}
                  mode="time"
                  onChange={(event, selectedTime) => {
                    setShowStartTimePicker(false);
                    if (selectedTime) {
                      updateTimeSlot(0, { startTime: selectedTime });
                    }
                  }}
                />
              )}
            </View>
            
            <View style={styles.timePickerRow}>
              <Text style={[styles.timeLabel, isDark && styles.darkText]}>End:</Text>
              <TouchableOpacity 
                style={[styles.timeButton, isDark && styles.darkTimeButton]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={[styles.timeButtonText, isDark && styles.darkText]}>
                  {formatTime(timeSlots[0]?.endTime || new Date())}
                </Text>
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={timeSlots[0]?.endTime || new Date()}
                  mode="time"
                  onChange={(event, selectedTime) => {
                    setShowEndTimePicker(false);
                    if (selectedTime) {
                      updateTimeSlot(0, { endTime: selectedTime });
                    }
                  }}
                />
              )}
            </View>
          </View>
          
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            placeholder="Location (Optional)"
            placeholderTextColor={isDark ? '#888' : '#666'}
            value={location}
            onChangeText={setLocation}
          />
          <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerLine} />
              </View>
          <View style={styles.notificationSection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Notifications</Text>
            <View style={styles.notificationRow}>
              <Text style={[styles.notificationLabel, isDark && styles.darkText]}>Notify before class</Text>
              <TextInput
                style={[styles.notificationInput, isDark && styles.darkInput]}
                placeholder="Hours"
                placeholderTextColor={isDark ? '#888' : '#666'}
                keyboardType="numeric"
                value={notificationBefore}
                onChangeText={setNotificationBefore}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.morningNotificationToggle}
              onPress={() => setMorningNotification(!morningNotification)}
            >
              <Text style={[styles.notificationLabel, isDark && styles.darkText]}>
                Morning Notification
              </Text>
              <Switch
                value={morningNotification}
                onValueChange={setMorningNotification}
                trackColor={{ false: '#767577', true: '#FF7F50' }}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    marginTop: 12
  },
  darkModalContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'SF-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  saveButton: {
    color: '#FF7F50',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'SF-Regular',
  },
  modalContent: {
    padding: 20,
  },
  darkModalContent: {
    backgroundColor: '#121212',
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
    fontFamily: 'SF-Regular',
  },
  darkInput: {
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'SF-Regular',
  },
  darkPickerContainer: {
    backgroundColor: '#1e1e1e',
  },
  picker: {
    height: 50,
    backgroundColor: 'transparent',
  },
  darkPicker: {
    color: '#ffffff',
    backgroundColor: '#1e1e1e',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  dayButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  darkDayButtonContainer: {
    backgroundColor: '#1e1e1e',
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF7F50',
  },
  darkDayButton: {
    backgroundColor: '#1e1e1e',
  },
  selectedDayButton: {
    backgroundColor: '#FF7F50',
    borderColor: '#FF7F50',
  },
  dayButtonText: {
    color: '#FF7F50',
    fontFamily: 'SF-Regular',
  },
  selectedDayButtonText: {
    color: 'white',
  },
  timePickerContainer: {
    marginBottom: 20,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    width: 80,
    fontSize: 16,
    color: '#333',
    fontFamily: 'SF-Regular',
  },
  timeButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkTimeButton: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'SF-Regular',
  },
  notificationSection: {
    marginBottom: 20,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'SF-Regular',
  },
  notificationInput: {
    width: 80,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    textAlign: 'center',
  },
  morningNotificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  timeSlotContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#FF7F50',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    color: '#FF4444',
    textAlign: 'right',
    marginTop: 8,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },
});

export default StudyTimetableModal;
