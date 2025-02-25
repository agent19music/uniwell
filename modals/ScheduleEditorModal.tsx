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
  PanResponder,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { 
  ClassSchedule, 
  ClassType, 
  ClassFrequency, 
  DayOfTheWeek,
  EditableClass 
} from '../types/TimetableTypes';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Switch } from 'react-native';
import * as burnt from 'burnt';

interface ScheduleEditorModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (classData: ClassSchedule) => void;
  onDelete?: (id: string) => void;
  initialData?: ClassSchedule;
}

const SAMPLE_CLASSES: Record<string, EditableClass> = {
  "CSE101": {
    id: "CSE101",
    courseName: "Computer Science Fundamentals",
    courseCode: "CSE101",
    room: "Lab 204",
    instructor: "Dr. Smith",
    frequency: ClassFrequency.WEEKLY,
    type: ClassType.LECTURE,
    startTime: "09:00",
    endTime: "10:30",
    classType: ClassType.LECTURE,
    daysOfWeek: [DayOfTheWeek.MONDAY, DayOfTheWeek.WEDNESDAY],
    notificationPreference: {
      beforeClass: 30,
      afterClass: null,
      onMorning: 120
    }
  },
  "MATH201": {
    id: "MATH201",
    courseName: "Advanced Calculus",
    courseCode: "MATH201",
    room: "Hall 101",
    instructor: "Prof. Johnson",
    frequency: ClassFrequency.WEEKLY,
    type: ClassType.LECTURE,
    startTime: "11:00",
    endTime: "12:30",
    classType: ClassType.LECTURE,
    daysOfWeek: [DayOfTheWeek.TUESDAY, DayOfTheWeek.THURSDAY],
    notificationPreference: {
      beforeClass: 15,
      afterClass: 30,
      onMorning: 60
    }
  }
};

export default function ScheduleEditorModal({
  visible,
  onClose,
  onSave,
  onDelete,
  initialData
}: ScheduleEditorModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [modalVisible, setModalVisible] = useState(visible);
  const [slideAnim] = useState(new Animated.Value(0));
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<EditableClass | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [morningNotification, setMorningNotification] = useState(false);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
      });
    }
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

  const [panResponder] = useState(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(1 - (gestureState.dy / 300));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  );

  const handleEdit = (classId: string) => {
    setSelectedClass(classId);
    setEditingData(SAMPLE_CLASSES[classId]);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setEditingData({
      id: Date.now().toString(),
      courseName: "",
      courseCode: "",
      room: "",
      instructor: "",
      frequency: ClassFrequency.WEEKLY,
      type: ClassType.LECTURE,
      startTime: "09:00",
      endTime: "10:30",
      classType: ClassType.LECTURE,
      daysOfWeek: [],
      notificationPreference: {
        beforeClass: 15,
        afterClass: null,
        onMorning: 60
      }
    });
    setIsEditing(true);
  };

  const formatTime = (timeString: string) => {
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleMorningNotificationChange = (value: boolean) => {
    setMorningNotification(value);
    if (editingData) {
      setEditingData(prev => prev ? { 
        ...prev, 
        notificationPreference: { 
          ...prev.notificationPreference, 
          onMorning: value ? 60 : 0 
        } 
      } : null);
    }
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(false);
    if (selectedDate && editingData) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setEditingData(prev => prev ? {...prev, startTime: timeString} : null);
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(false);
    if (selectedDate && editingData) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setEditingData(prev => prev ? {...prev, endTime: timeString} : null);
    }
  };

  const renderEditForm = () => (
    <ScrollView style={[styles.editFormScroll, isDark && styles.darkEditFormScroll]}>
      <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.backButton}>
        <Ionicons name="chevron-back-outline" size={24} color="#FF7F50" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkLabel]}>Course Name</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput]}
          value={editingData?.courseName}
          onChangeText={(text) => setEditingData(prev => prev ? {...prev, courseName: text} : null)}
          placeholder="Enter course name"
          placeholderTextColor={isDark ? '#666' : '#999'}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkLabel]}>Course Code</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput]}
          value={editingData?.courseCode}
          onChangeText={(text) => setEditingData(prev => prev ? {...prev, courseCode: text} : null)}
          placeholder="Enter course code"
          placeholderTextColor={isDark ? '#666' : '#999'}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkLabel]}>Room</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput]}
          value={editingData?.room}
          onChangeText={(text) => setEditingData(prev => prev ? {...prev, room: text} : null)}
          placeholder="Enter room number"
          placeholderTextColor={isDark ? '#666' : '#999'}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && styles.darkLabel]}>Instructor</Text>
        <TextInput
          style={[styles.input, isDark && styles.darkInput]}
          value={editingData?.instructor}
          onChangeText={(text) => setEditingData(prev => prev ? {...prev, instructor: text} : null)}
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
        {Object.values(DayOfTheWeek).slice(0, 5).map(day => (
          <TouchableOpacity 
            key={day}
            style={[
              styles.dayButton,
              isDark && styles.darkDayButton,
              editingData?.daysOfWeek.includes(day) && styles.selectedDayButton,
            ]}
            onPress={() => {
              setEditingData(prev => {
                if (!prev) return null;
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
              setEditingData(prev => prev ? {
                ...prev,
                notificationPreference: {
                  ...prev.notificationPreference,
                  beforeClass: minutes
                }
              } : null);
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
  );

  const renderTimePickers = () => (
    <>
      {showStartTimePicker && (
        <DateTimePicker
          value={editingData?.startTime ? new Date(`2000-01-01T${editingData.startTime}`) : new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleStartTimeChange}
        />
      )}
      {showEndTimePicker && (
        <DateTimePicker
          value={editingData?.endTime ? new Date(`2000-01-01T${editingData.endTime}`) : new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleEndTimeChange}
        />
      )}
    </>
  );

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={styles.backdrop}>
        <Animated.View 
          {...panResponder.panHandlers}
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
            <Text style={[styles.title, isDark && styles.darkText]}>
              {isEditing ? (editingData?.id ? 'Edit Class' : 'Add Class') : 'Schedule Editor'}
            </Text>
            {isEditing ? (
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={() => {
                  onSave(editingData as unknown as ClassSchedule);
                  burnt.toast({
                    title: 'Class Saved',
                    message: 'Your class has been saved successfully.',
                    duration: 2,
                  });
                  setIsEditing(false);
                }}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
                <Ionicons name="add" size={24} color="#FF7F50" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.content}>
            {!isEditing ? (
                <View style={[styles.classList, isDark && styles.darkClassList]}>
                {Object.entries(SAMPLE_CLASSES).map(([id, classData]) => (
                  <TouchableOpacity
                  key={id}
                  style={[styles.classItem, isDark && styles.darkClassItem]}
                  onPress={() => handleEdit(id)}
                  >
                  <View style={styles.classItemContent}>
                    <View style={[styles.colorDot, { backgroundColor: '#FF7F50' }]} />
                    <View style={styles.classInfo}>
                    <Text style={[styles.className, isDark && styles.darkText]}>{classData.courseName}</Text>
                    <Text style={[styles.classDetails, isDark && styles.darkText]}>
                      {classData.daysOfWeek.join(', ')} • {classData.startTime}
                    </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={isDark ? "#8E8E93" : "#C7C7CC"} />
                  </View>
                  </TouchableOpacity>
                ))}
                </View>
            ) : (
              renderEditForm()
            )}
          </ScrollView>

          {renderTimePickers()}
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  darkClassList: {
    backgroundColor: '#1C1C1E',
  },
  darkClassItem: {
    backgroundColor: '#2C2C2E',
    borderBottomColor: '#38383A',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    color: '#FF7F50',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  content: {
    flex: 1,
  },
  classList: {
    paddingTop: 8,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  className: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  editFormScroll: {
    flex: 1,
    padding: 16,
  },
  classItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classInfo: {
    flex: 1,
    marginLeft: 12,
  },
  classDetails: {
    color: '#6C6C70',
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#6C6C70',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  input: {
    fontSize: 17,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  timePickerContainer: {
    marginBottom: 16,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    width: 100,
    fontSize: 15,
    color: '#6C6C70',
    fontFamily: 'Vercetti-Regular',
  },
  timeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 17,
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  dayButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#FF7F50',
  },
  selectedDayButton: {
    backgroundColor: '#FF7F50',
  },
  dayButtonText: {
    color: '#FF7F50',
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
  },
  selectedDayButtonText: {
    color: '#FFFFFF',
  },
  deleteButton: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  addButton: {
    padding: 8,
  },
  darkModalContainer: {
    backgroundColor: '#1C1C1E',
  },
  darkHeader: {
    borderBottomColor: '#38383A',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkLabel: {
    color: '#98989F',
  },
  darkInput: {
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
  },
  darkEditFormScroll: {
    backgroundColor: '#1C1C1E',
  },
  darkDivider: {
    backgroundColor: '#38383A',
  },
  darkTimeButton: {
    backgroundColor: '#2C2C2E',
  },
  darkDayButton: {
    backgroundColor: '#2C2C2E',
    borderColor: '#FF7F50',
  },
  darkDayButtonText: {
    color: '#FF7F50',
  },
  darkDeleteButton: {
    backgroundColor: '#3A1212',
  },
  notificationContainer: {
    marginBottom: 24,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notificationLabel: {
    fontSize: 15,
    color: '#6C6C70',
    flex: 1,
    fontFamily: 'Vercetti-Regular',
  },
  notificationInput: {
    width: 60,
    fontSize: 17,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    textAlign: 'center',
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  minutesText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#6C6C70',
    fontFamily: 'Vercetti-Regular',
  },
  backButtonText: {
    color: '#FF7F50',
    fontSize: 16,
    marginLeft: 4,
    fontFamily: 'Vercetti-Regular',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
});

