import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, useColorScheme, ScrollView } from 'react-native';
import { useRoutine } from '@/contexts/RoutineContext';
import { Ionicons } from '@expo/vector-icons';
import { DayOfTheWeek } from '@/types/TimetableTypes';

type Frequency = 'daily' | 'weekly' | 'custom';

interface AddRoutineModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddRoutineModal({ visible, onClose }: AddRoutineModalProps) {
  const { createRoutine } = useRoutine();
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [selectedDays, setSelectedDays] = useState<DayOfTheWeek[]>([]);
  const [selectedWeekDay, setSelectedWeekDay] = useState<DayOfTheWeek | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSave = async () => {
    try {
      const days = frequency === 'weekly' && selectedWeekDay ? [selectedWeekDay] : selectedDays;
      await createRoutine(title, frequency, days);
      // Reset form
      setTitle('');
      setFrequency('daily');
      setSelectedDays([]);
      setSelectedWeekDay(null);
      onClose();
    } catch (error) {
      console.error('Error creating routine:', error);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <ScrollView style={[styles.editFormScroll, isDark && styles.darkEditFormScroll]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FF7F50" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>New Routine</Text>
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
            placeholderTextColor="#666"
          />

          <View style={styles.frequencySection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Frequency</Text>
            <TouchableOpacity 
              style={[styles.frequencyButton, frequency === 'daily' && styles.selectedFrequency]}
              onPress={() => setFrequency('daily')}
            >
              <Text style={[styles.frequencyText, frequency === 'daily' && styles.selectedText]}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.frequencyButton, frequency === 'weekly' && styles.selectedFrequency]}
              onPress={() => setFrequency('weekly')}
            >
              <Text style={[styles.frequencyText, frequency === 'weekly' && styles.selectedText]}>Weekly</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.frequencyButton, frequency === 'custom' && styles.selectedFrequency]}
              onPress={() => setFrequency('custom')}
            >
              <Text style={[styles.frequencyText, frequency === 'custom' && styles.selectedText]}>Custom</Text>
            </TouchableOpacity>
          </View>

          {renderDaySelector()}
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    justifyContent: 'flex-start',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%',
  },
  editFormScroll: {
    padding: 16,
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
    borderBottomColor: '#eee',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
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
  },
  darkInput: {
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
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
  },
  selectedFrequency: {
    backgroundColor: '#FF7F50',
  },
  frequencyText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
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
    backgroundColor: '#1e1e1e',
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
});
