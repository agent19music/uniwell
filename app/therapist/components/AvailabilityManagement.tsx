import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  useColorScheme,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTherapist } from '../../../contexts/TherapistContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DayAvailabilityInput {
  active: boolean;
  start: string;
  end: string;
}

export default function AvailabilityManagement() {
  const { profile, updateAvailability, addAvailabilityException, removeAvailabilityException } = useTherapist();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Weekly Schedule
  const [schedule, setSchedule] = useState<Record<string, DayAvailabilityInput>>({
    monday: { active: false, start: "09:00", end: "17:00" },
    tuesday: { active: false, start: "09:00", end: "17:00" },
    wednesday: { active: false, start: "09:00", end: "17:00" },
    thursday: { active: false, start: "09:00", end: "17:00" },
    friday: { active: false, start: "09:00", end: "17:00" },
    saturday: { active: false, start: "09:00", end: "17:00" },
    sunday: { active: false, start: "09:00", end: "17:00" },
  });
  
  // Exception modal
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionDate, setExceptionDate] = useState(new Date());
  const [exceptionStart, setExceptionStart] = useState("09:00");
  const [exceptionEnd, setExceptionEnd] = useState("17:00");
  const [isAvailable, setIsAvailable] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentField, setCurrentField] = useState<'date' | 'start' | 'end'>('date');
  const [tempTime, setTempTime] = useState(new Date());
  
  // Load existing availability
  useEffect(() => {
    setIsLoading(true);
    if (profile?.availability) {
      const currentAvailability = profile.availability as Record<string, any>;
      const updatedSchedule = { ...schedule };
      
      Object.entries(currentAvailability).forEach(([day, data]) => {
        if (data && data.start && data.end) {
          updatedSchedule[day] = {
            active: true,
            start: data.start,
            end: data.end
          };
        }
      });
      
      setSchedule(updatedSchedule);
    }
    setIsLoading(false);
  }, [profile]);
  
  const toggleDayAvailability = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        active: !prev[day].active,
      }
    }));
  };
  
  const updateDaySchedule = (day: string, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }));
  };
  
  const convertToAvailabilityFormat = () => {
    const formattedAvailability: Record<string, any> = {};
    
    Object.entries(schedule).forEach(([day, data]) => {
      if (data.active) {
        formattedAvailability[day] = {
          start: data.start,
          end: data.end,
        };
      }
    });
    
    return formattedAvailability;
  };
  
  const saveAvailability = async () => {
    try {
      setIsSaving(true);
      const availability = convertToAvailabilityFormat();
      
      if (Object.keys(availability).length === 0) {
        Alert.alert('Availability Required', 'Please set your availability for at least one day of the week.');
        setIsSaving(false);
        return;
      }
      
      const { error } = await updateAvailability(availability);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to update availability');
      } else {
        Alert.alert('Success', 'Your availability has been updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  const addException = async () => {
    try {
      setIsSaving(true);
      
      // Format date for API
      const formattedDate = exceptionDate.toISOString().split('T')[0];
      
      const exception = {
        date: formattedDate,
        start_time: exceptionStart,
        end_time: exceptionEnd,
        is_available: isAvailable,
        reason: exceptionReason
      };
      
      const { error } = await addAvailabilityException(exception);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to add exception');
      } else {
        Alert.alert('Success', 'Availability exception has been added');
        setShowExceptionModal(false);
        resetExceptionForm();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetExceptionForm = () => {
    setExceptionDate(new Date());
    setExceptionStart("09:00");
    setExceptionEnd("17:00");
    setIsAvailable(false);
    setExceptionReason("");
  };
  
  const openDatePicker = (field: 'date' | 'start' | 'end') => {
    setCurrentField(field);
    
    if (field === 'date') {
      setTempTime(new Date(exceptionDate));
    } else {
      const now = new Date();
      const [hours, minutes] = (field === 'start' ? exceptionStart : exceptionEnd).split(':').map(Number);
      now.setHours(hours, minutes, 0, 0);
      setTempTime(now);
    }
    
    setShowDatePicker(true);
  };
  
  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (!selectedDate) return; // User cancelled
    
    if (currentField === 'date') {
      setExceptionDate(selectedDate);
    } else {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      if (currentField === 'start') {
        setExceptionStart(timeString);
      } else {
        setExceptionEnd(timeString);
      }
    }
  };
  
  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.darkContainer]}>
        <ActivityIndicator size="large" color="#FF7F50" />
        <Text style={[styles.loadingText, isDark && styles.darkText]}>
          Loading availability settings...
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>Manage Availability</Text>
        <TouchableOpacity 
          style={[styles.addExceptionButton, isDark && styles.darkAddButton]} 
          onPress={() => setShowExceptionModal(true)}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FF7F50" />
          <Text style={styles.addExceptionText}>Add Exception</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Weekly Schedule</Text>
          <Text style={[styles.sectionSubtitle, isDark && styles.darkSubText]}>
            Set your regular working hours. This won't affect any previously booked appointments.
          </Text>
          
          {/* Weekly schedule list */}
          {Object.entries(schedule).map(([day, data]) => (
            <View key={day} style={styles.daySchedule}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayName, isDark && styles.darkText]}>{formatDayName(day)}</Text>
                <Switch
                  trackColor={{ false: '#767577', true: '#FF7F5050' }}
                  thumbColor={data.active ? '#FF7F50' : '#f4f3f4'}
                  onValueChange={() => toggleDayAvailability(day)}
                  value={data.active}
                />
              </View>
              
              {data.active && (
                <View style={styles.timePickerContainer}>
                  <View style={styles.timePicker}>
                    <Text style={[styles.timePickerLabel, isDark && styles.darkSubText]}>From</Text>
                    <TextInput
                      style={[styles.timeInput, isDark && styles.darkInput]}
                      value={data.start}
                      onChangeText={(value) => updateDaySchedule(day, 'start', value)}
                      placeholder="09:00"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  
                  <View style={styles.timePicker}>
                    <Text style={[styles.timePickerLabel, isDark && styles.darkSubText]}>To</Text>
                    <TextInput
                      style={[styles.timeInput, isDark && styles.darkInput]}
                      value={data.end}
                      onChangeText={(value) => updateDaySchedule(day, 'end', value)}
                      placeholder="17:00"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
          
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={saveAvailability}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Weekly Schedule</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Exception Modal */}
      <Modal
        visible={showExceptionModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.darkCard]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.darkText]}>Add Availability Exception</Text>
              <TouchableOpacity onPress={() => setShowExceptionModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#fff" : "#333"} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark && styles.darkText]}>Date</Text>
                <TouchableOpacity 
                  style={[styles.dateInput, isDark && styles.darkInput]}
                  onPress={() => openDatePicker('date')}
                >
                  <Text style={isDark ? styles.darkText : undefined}>
                    {exceptionDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar" size={20} color={isDark ? "#aaa" : "#666"} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark && styles.darkText]}>Status</Text>
                <View style={styles.statusOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.statusOption, 
                      !isAvailable && styles.selectedOption,
                      isDark && styles.darkOption
                    ]}
                    onPress={() => setIsAvailable(false)}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      !isAvailable && styles.selectedOptionText,
                      isDark && styles.darkText
                    ]}>Unavailable</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.statusOption, 
                      isAvailable && styles.selectedOption,
                      isDark && styles.darkOption
                    ]}
                    onPress={() => setIsAvailable(true)}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      isAvailable && styles.selectedOptionText,
                      isDark && styles.darkText
                    ]}>Available</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.timeRow}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, isDark && styles.darkText]}>Start Time</Text>
                  <TouchableOpacity 
                    style={[styles.timeInputModal, isDark && styles.darkInput]}
                    onPress={() => openDatePicker('start')}
                  >
                    <Text style={isDark ? styles.darkText : undefined}>{exceptionStart}</Text>
                    <Ionicons name="time" size={20} color={isDark ? "#aaa" : "#666"} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, isDark && styles.darkText]}>End Time</Text>
                  <TouchableOpacity 
                    style={[styles.timeInputModal, isDark && styles.darkInput]}
                    onPress={() => openDatePicker('end')}
                  >
                    <Text style={isDark ? styles.darkText : undefined}>{exceptionEnd}</Text>
                    <Ionicons name="time" size={20} color={isDark ? "#aaa" : "#666"} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark && styles.darkText]}>Reason (optional)</Text>
                <TextInput
                  style={[styles.reasonInput, isDark && styles.darkInput]}
                  value={exceptionReason}
                  onChangeText={setExceptionReason}
                  placeholder="Add a reason for this exception"
                  placeholderTextColor={isDark ? "#aaa" : "#666"}
                  multiline
                />
              </View>
              
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.disabledButton]}
                onPress={addException}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Exception</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {showDatePicker && (
        <DateTimePicker
          value={tempTime}
          mode={currentField === 'date' ? 'date' : 'time'}
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
          minimumDate={currentField === 'date' ? new Date() : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  addExceptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
  },
  darkAddButton: {
    backgroundColor: 'rgba(255, 127, 80, 0.25)',
  },
  addExceptionText: {
    marginLeft: 6,
    color: '#FF7F50',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  daySchedule: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayName: {
    fontSize: 16,
    color: '#333',
  },
  timePickerContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  timePicker: {
    flex: 1,
    marginRight: 16,
  },
  timePickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  darkInput: {
    backgroundColor: '#2c2c2c',
    borderColor: '#444',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    maxHeight: '90%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusOptions: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  darkOption: {
    backgroundColor: '#2c2c2c',
  },
  selectedOption: {
    backgroundColor: '#FF7F50',
  },
  statusOptionText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: 'white',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInputModal: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    height: 100,
    textAlignVertical: 'top',
  },
}); 