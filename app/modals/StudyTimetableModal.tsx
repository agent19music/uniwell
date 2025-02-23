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
  const [selectedDays, setSelectedDays] = useState<DayOfTheWeek[]>([]);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [notificationBefore, setNotificationBefore] = useState('1');
  const [morningNotification, setMorningNotification] = useState(true);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const router = useRouter();

  const handleAddSchedule = async () => {
    const newSchedule: Omit<ClassSchedule, 'id'> = {
      courseName,
      courseCode,
      classType,
      frequency,
      daysOfWeek: selectedDays,
      startTime,
      endTime,
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

  const toggleDay = (day: DayOfTheWeek) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
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
              selectedDays.includes(day) && styles.selectedDayButton,
              isDark && styles.darkDayButton
            ]}
            onPress={() => toggleDay(day)}
          >
            <Text style={[styles.dayButtonText, isDark && styles.darkText]}>
              {day.substring(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
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
                  label={type} 
                  value={type}
                  color={isDark ? '#fff' : '#333'}
                />
              ))}
            </Picker>
          </View>
          
          <View style={[styles.pickerContainer, isDark && styles.darkPickerContainer]}>
            <Picker
              selectedValue={frequency}
              onValueChange={(itemValue) => setFrequency(itemValue as ClassFrequency)}
              style={[styles.picker, isDark && styles.darkPicker]}
            >
              {Object.values(ClassFrequency).map(freq => (
                <Picker.Item 
                  key={freq} 
                  label={freq} 
                  value={freq}
                  color={isDark ? '#fff' : '#333'}
                />
              ))}
            </Picker>
          </View>
          
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Select Days</Text>
          {renderDayButtons()}
          
          <View style={styles.timePickerContainer}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Class Time</Text>
            
            <View style={styles.timePickerRow}>
              <Text style={[styles.timeLabel, isDark && styles.darkText]}>Start:</Text>
              <TouchableOpacity 
                style={[styles.timeButton, isDark && styles.darkTimeButton]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={[styles.timeButtonText, isDark && styles.darkText]}>
                  {formatTime(startTime)}
                </Text>
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  onChange={(event, selectedTime) => {
                    setShowStartTimePicker(false);
                    if (selectedTime) {
                      setStartTime(selectedTime);
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
                  {formatTime(endTime)}
                </Text>
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  onChange={(event, selectedTime) => {
                    setShowEndTimePicker(false);
                    if (selectedTime) {
                      setEndTime(selectedTime);
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
    marginTop: 100,
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
    fontWeight: '600',
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
  darkPickerContainer: {
    backgroundColor: '#1e1e1e',
  },
  picker: {
    height: 50,
  },
  darkPicker: {
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
    fontFamily: 'SF-Regular',
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
});

export default StudyTimetableModal;
