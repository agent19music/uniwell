import React, { useState, useRef, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Platform, 
  useColorScheme,
  Animated,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { useRoutine } from '@/contexts/RoutineContext';
import { Ionicons, Octicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';

interface AddStreakModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddStreakModal({ visible, onClose }: AddStreakModalProps) {
  const { createStreak } = useRoutine();
  const [title, setTitle] = useState('');
  const [targetCount, setTargetCount] = useState('30');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [type, setType] = useState<'build' | 'break'>('build');
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const typeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    Animated.spring(typeAnim, {
      toValue: type === 'build' ? 0 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  }, [type]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      if (Platform.OS === 'android') {
        setShowTimePicker(true);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const newDateTime = new Date(startDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setStartTime(newDateTime);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    
    try {
      await createStreak(
        title, 
        type, 
        startDate, 
        startTime,
        parseInt(targetCount, 10)
      );
      onClose();
      // Reset form
      setTitle('');
      setType('build');
      setStartDate(new Date());
      setStartTime(new Date());
      setTargetCount('30');
    } catch (error) {
      console.error('Error creating streak:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.overlayTouchable}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContent,
            isDark && styles.darkModalContent,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <BlurView
            intensity={isDark ? 30 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurContainer}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, isDark && styles.darkText]}>New Streak</Text>
              <TouchableOpacity 
                onPress={handleSave}
                disabled={!title.trim()}
              >
                <Text style={[
                  styles.saveButton,
                  !title.trim() && styles.saveButtonDisabled
                ]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.form}
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                placeholder="Streak Title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Target Days</Text>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                placeholder="Enter target days (e.g., 30)"
                value={targetCount}
                onChangeText={(text) => {
                  // Only allow numbers
                  if (/^\d*$/.test(text)) {
                    setTargetCount(text);
                  }
                }}
                keyboardType="numeric"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Streak Type</Text>
              <View style={styles.typeContainer}>
                <Animated.View
                  style={[
                    styles.typeButton,
                    type === 'build' && styles.selectedType,
                    isDark && styles.darkTypeButton,
                    {
                      transform: [
                        {
                          scale: typeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1.05, 0.95]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.typeButtonContent}
                    onPress={() => setType('build')}
                  >
                    <Octicons 
                      name="rocket" 
                      size={24} 
                      color={type === 'build' ? 'white' : isDark ? '#fff' : '#333'} 
                    />
                    <Text style={[
                      styles.typeText,
                      type === 'build' && styles.selectedText,
                      isDark && styles.darkText
                    ]}>
                      Build Habit
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.typeButton,
                    type === 'break' && styles.selectedType,
                    isDark && styles.darkTypeButton,
                    {
                      transform: [
                        {
                          scale: typeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.95, 1.05]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.typeButtonContent}
                    onPress={() => setType('break')}
                  >
                    <Octicons 
                      name="flame" 
                      size={24} 
                      color={type === 'break' ? 'white' : isDark ? '#fff' : '#333'} 
                    />
                    <Text style={[
                      styles.typeText,
                      type === 'break' && styles.selectedText,
                      isDark && styles.darkText
                    ]}>
                      Break Habit
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Start Date & Time</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity 
                  style={[styles.dateTimeButton, isDark && styles.darkDateTimeButton]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={24} color={isDark ? '#fff' : '#666'} />
                  <Text style={[styles.dateTimeText, isDark && styles.darkText]}>
                    {startDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.dateTimeButton, isDark && styles.darkDateTimeButton]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={24} color={isDark ? '#fff' : '#666'} />
                  <Text style={[styles.dateTimeText, isDark && styles.darkText]}>
                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                  is24Hour={false}
                />
              )}
            </ScrollView>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  darkModalContent: {
    backgroundColor: '#1c1c1e',
  },
  blurContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#fff',
  },
  saveButton: {
    color: '#FF7F50',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 24,
    fontFamily: 'Vercetti-Regular',
  },
  darkInput: {
    backgroundColor: '#2c2c2e',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
    fontFamily: 'Vercetti-Regular',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  darkTypeButton: {
    backgroundColor: '#2c2c2e',
  },
  selectedType: {
    backgroundColor: '#FF7F50',
  },
  typeText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Vercetti-Regular',
  },
  selectedText: {
    color: 'white',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  darkDateTimeButton: {
    backgroundColor: '#2c2c2e',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Vercetti-Regular',
  },
  typeButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
});
