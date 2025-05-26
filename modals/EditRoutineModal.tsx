import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, useColorScheme, ScrollView } from 'react-native';
import { useRoutine } from '@/contexts/RoutineContext';
import { Ionicons } from '@expo/vector-icons';
import { DayOfTheWeek } from '@/types/TimetableTypes';

type Frequency = 'daily' | 'weekly' | 'custom';

interface EditRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  routineId: string;
}

export default function EditRoutineModal({ visible, onClose, routineId }: EditRoutineModalProps) {
  const { getRoutine, updateRoutine, deleteRoutine } = useRoutine();
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [selectedDays, setSelectedDays] = useState<DayOfTheWeek[]>([]);
  const [selectedWeekDay, setSelectedWeekDay] = useState<DayOfTheWeek | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const fetchRoutine = async () => {
      if (!routineId) return;
      
      setIsLoading(true);
      try {
        const routine = await getRoutine(routineId);
        if (routine) {
          setTitle(routine.title || '');
          setFrequency((routine.frequency as Frequency) || 'daily');
          if (routine.frequency === 'weekly' && routine.customDays?.[0]) {
            setSelectedWeekDay(routine.customDays[0] as DayOfTheWeek);
          } else {
            setSelectedDays((routine.customDays as DayOfTheWeek[]) || []);
          }
        }
      } catch (error) {
        console.error('Error fetching routine:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (visible) {
      fetchRoutine();
    }
  }, [routineId, visible, getRoutine]);

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      const days = frequency === 'weekly' && selectedWeekDay ? [selectedWeekDay] : selectedDays;
      await updateRoutine(routineId, { 
        title, 
        frequency, 
        customDays: days 
      });
      onClose();
    } catch (error) {
      console.error('Error updating routine:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoutine(routineId);
      onClose();
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  const renderDaySelector = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    if (frequency === 'weekly') {
      return (
        <View style={styles.daysSection}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Select Day</Text>
          <View style={styles.daysGrid}>
            {days.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  isDark && styles.darkDayButton,
                  selectedWeekDay === day && styles.selectedDayButton,
                ]}
                onPress={() => setSelectedWeekDay(day as DayOfTheWeek)}
              >
                <Text style={[
                  styles.dayButtonText,
                  isDark && styles.darkDayButtonText,
                  selectedWeekDay === day && styles.selectedDayButtonText
                ]}>
                  {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (frequency === 'custom') {
      return (
        <View style={styles.daysSection}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Select Days</Text>
          <View style={styles.daysGrid}>
            {days.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  isDark && styles.darkDayButton,
                  selectedDays.includes(day as DayOfTheWeek) && styles.selectedDayButton,
                ]}
                onPress={() => {
                  if (selectedDays.includes(day as DayOfTheWeek)) {
                    setSelectedDays(selectedDays.filter(d => d !== day));
                  } else {
                    setSelectedDays([...selectedDays, day as DayOfTheWeek]);
                  }
                }}
              >
                <Text style={[
                  styles.dayButtonText,
                  isDark && styles.darkDayButtonText,
                  selectedDays.includes(day as DayOfTheWeek) && styles.selectedDayButtonText
                ]}>
                  {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={[styles.modalOverlay, styles.loadingContainer]}>
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <ScrollView style={[styles.editFormScroll, isDark && styles.darkEditFormScroll]}>
        <View style={[styles.header, isDark && styles.darkHeader]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FF7F50" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>Edit Routine</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.form}>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            placeholder="Routine Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={isDark ? '#8E8E93' : '#666'}
          />

          <View style={styles.frequencySection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Frequency</Text>
            <TouchableOpacity 
              style={[
                styles.frequencyButton, 
                isDark && styles.darkFrequencyButton,
                frequency === 'daily' && styles.selectedFrequency
              ]}
              onPress={() => setFrequency('daily')}
            >
              <Text style={[
                styles.frequencyText, 
                isDark && styles.darkFrequencyText,
                frequency === 'daily' && styles.selectedText
              ]}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.frequencyButton, 
                isDark && styles.darkFrequencyButton,
                frequency === 'weekly' && styles.selectedFrequency
              ]}
              onPress={() => setFrequency('weekly')}
            >
              <Text style={[
                styles.frequencyText, 
                isDark && styles.darkFrequencyText,
                frequency === 'weekly' && styles.selectedText
              ]}>Weekly</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.frequencyButton, 
                isDark && styles.darkFrequencyButton,
                frequency === 'custom' && styles.selectedFrequency
              ]}
              onPress={() => setFrequency('custom')}
            >
              <Text style={[
                styles.frequencyText, 
                isDark && styles.darkFrequencyText,
                frequency === 'custom' && styles.selectedText
              ]}>Custom</Text>
            </TouchableOpacity>
          </View>

          {renderDaySelector()}

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Routine</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  editFormScroll: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  darkEditFormScroll: {
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  darkHeader: {
    borderBottomColor: '#3A3A3C',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#FFFFFF',
  },
  saveButton: {
    color: '#FF7F50',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
    fontFamily: 'Vercetti-Regular',
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  darkInput: {
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
    borderColor: '#3A3A3C',
  },
  frequencySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  frequencyButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  darkFrequencyButton: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  selectedFrequency: {
    backgroundColor: '#FF7F50',
    borderColor: '#FF7F50',
  },
  frequencyText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkFrequencyText: {
    color: '#FFFFFF',
  },
  selectedText: {
    color: 'white',
  },
  daysSection: {
    marginTop: 20,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dayButton: {
    width: '30%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  darkDayButton: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  selectedDayButton: {
    backgroundColor: '#FF7F50',
    borderColor: '#FF7F50',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkDayButtonText: {
    color: '#FFFFFF',
  },
  selectedDayButtonText: {
    color: '#FFFFFF',
  },
  deleteButton: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
});
