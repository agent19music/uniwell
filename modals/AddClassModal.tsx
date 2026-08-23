import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  useColorScheme,
} from 'react-native';
import { X } from 'phosphor-react-native';
import { BlurView } from 'expo-blur';
import { 
  ClassSchedule, 
  ClassType, 
  ClassFrequency, 
  DayOfTheWeek
} from '../types/TimetableTypes';
import { TimePickerInteraction } from '@/components/TimePickerInteraction';
import { Switch } from 'react-native';
import * as burnt from 'burnt';
import { useSemester } from '../contexts/SemesterContext';
import { useAuth } from '../contexts/AuthContext';

interface AddClassModalProps {
  visible: boolean;
  onClose: () => void;
  semesterId: string;
}

export default function AddClassModal({
  visible,
  onClose,
  semesterId
}: AddClassModalProps) {
  const { addClassSchedule } = useSemester();
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [slideAnim] = useState(new Animated.Value(visible ? 1 : 0));
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [morningNotification, setMorningNotification] = useState(true);

  const [editingData, setEditingData] = useState<ClassSchedule>({
    id: Date.now().toString(),
    userId: currentUser?.id || '',
    semesterId: semesterId,
    courseName: '',
    courseCode: '',
    room: '',
    instructor: '',
    frequency: ClassFrequency.WEEKLY,
    type: ClassType.LECTURE,
    startTime: '09:00',
    endTime: '10:30',
    daysOfWeek: [],
    notificationPreference: {
      beforeClass: 15,
      afterClass: null,
      onMorning: 60
    }
  });

  // Update animation when visible prop changes
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [onClose]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleStartTimeChange = (date: Date) => {
    const timeString = `${date.getHours()}:${date.getMinutes()}`;
    setEditingData(prev => ({...prev, startTime: timeString}));
  };

  const handleEndTimeChange = (date: Date) => {
    const timeString = `${date.getHours()}:${date.getMinutes()}`;
    setEditingData(prev => ({...prev, endTime: timeString}));
  };

  const handleSave = async () => {
    try {
      if (!currentUser) {
        burnt.toast({
          title: 'Error',
          message: 'You must be logged in to add classes',
          duration: 2,
        });
        return;
      }

      if (!editingData.courseName.trim()) {
        burnt.toast({
          title: 'Error',
          message: 'Course name is required',
          duration: 2,
        });
        return;
      }

      if (editingData.daysOfWeek.length === 0) {
        burnt.toast({
          title: 'Error',
          message: 'Please select at least one day',
          duration: 2,
        });
        return;
      }

      const success = await addClassSchedule(editingData);
      if (success) {
        burnt.toast({
          title: 'Class Created',
          message: 'Your class has been created successfully.',
          duration: 2,
        });
        handleClose();
      }
    } catch (error) {
      burnt.toast({
        title: 'Error',
        message: 'Failed to save class schedule.',
        duration: 2,
      });
      console.error('Error saving class schedule:', error);
    }
  };

  const renderEditForm = () => (
    <ScrollView style={[styles.editFormScroll, isDark && styles.darkEditFormScroll]}>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkLabel]}>Course Name</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput]}
          value={editingData.courseName}
          onChangeText={(text) => setEditingData(prev => ({...prev, courseName: text}))}
          placeholder="Enter course name"
          placeholderTextColor={isDark ? '#666' : '#999'}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkLabel]}>Course Code</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput]}
          value={editingData.courseCode}
          onChangeText={(text) => setEditingData(prev => ({...prev, courseCode: text}))}
          placeholder="Enter course code"
          placeholderTextColor={isDark ? '#666' : '#999'}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkLabel]}>Room</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput]}
          value={editingData.room}
          onChangeText={(text) => setEditingData(prev => ({...prev, room: text}))}
          placeholder="Enter room number"
          placeholderTextColor={isDark ? '#666' : '#999'}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkLabel]}>Instructor</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput]}
          value={editingData.instructor}
          onChangeText={(text) => setEditingData(prev => ({...prev, instructor: text}))}
          placeholder="Enter instructor name"
          placeholderTextColor={isDark ? '#666' : '#999'}
        />
      </View>

      <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Class Time</Text>
      <View style={styles.timePickerContainer}>
        <View style={styles.timePickerRow}>
          <Text style={[styles.timeLabel, isDark && styles.darkLabel]}>Start Time</Text>
          <TimePickerInteraction
            value={(() => {
              const [hours, minutes] = editingData.startTime.split(':');
              const date = new Date();
              date.setHours(parseInt(hours, 10));
              date.setMinutes(parseInt(minutes, 10));
              return date;
            })()}
            onChange={handleStartTimeChange}
          />
        </View>

        <View style={styles.timePickerRow}>
          <Text style={[styles.timeLabel, isDark && styles.darkLabel]}>End Time</Text>
          <TimePickerInteraction
            value={(() => {
              const [hours, minutes] = editingData.endTime.split(':');
              const date = new Date();
              date.setHours(parseInt(hours, 10));
              date.setMinutes(parseInt(minutes, 10));
              return date;
            })()}
            onChange={handleEndTimeChange}
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Days</Text>
      <View style={styles.dayButtonContainer}>
        {Object.values(DayOfTheWeek).map(day => (
          <TouchableOpacity 
            key={day}
            style={[
              styles.dayButton,
              isDark && styles.darkDayButton,
              editingData.daysOfWeek.includes(day) && styles.selectedDayButton,
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
              editingData.daysOfWeek.includes(day) && styles.selectedDayButtonText
            ]}>
              {day.slice(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Notifications</Text>
      <View style={styles.notificationContainer}>
        <View style={styles.notificationRow}>
          <Text style={[styles.notificationLabel, isDark && styles.darkLabel]}>
            Morning Reminder
          </Text>
          <Switch
            value={morningNotification}
            onValueChange={(value) => {
              setMorningNotification(value);
              setEditingData(prev => ({
                ...prev,
                notificationPreference: {
                  ...prev.notificationPreference,
                  onMorning: value ? 60 : 0
                }
              }));
            }}
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
            value={editingData.notificationPreference.beforeClass.toString()}
            onChangeText={(text) => {
              const minutes = parseInt(text) || 15;
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
        </View>
      </View>
    </ScrollView>
  );

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
              <X size={24} color="#FF7F50" weight="regular" />
            </TouchableOpacity>
            <Text style={[styles.title, isDark && styles.darkText]}>Add Class</Text>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          {renderEditForm()}
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

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
  },});


