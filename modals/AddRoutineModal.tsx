import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, ScrollView } from 'react-native';
import { useRoutine } from '@/contexts/RoutineContext';
import { Ionicons } from '@expo/vector-icons';
import { DayOfTheWeek } from '@/types/TimetableTypes';
import { useTheme } from '@/hooks/useTheme';

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
  const { colors, isDark } = useTheme();

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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Day</Text>
          <View style={styles.daysGrid}>
            {days.map((day) => {
              const isSelected = selectedWeekDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    {
                      backgroundColor: isSelected ? '#FF7F50' : colors.surface,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setSelectedWeekDay(day as DayOfTheWeek)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    if (frequency === 'custom') {
      return (
        <View style={styles.daysSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Days</Text>
          <View style={styles.daysGrid}>
            {days.map((day) => {
              const isSelected = selectedDays.includes(day as DayOfTheWeek);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    {
                      backgroundColor: isSelected ? '#FF7F50' : colors.surface,
                      borderColor: colors.border,
                    }
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
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
      <ScrollView style={[styles.editFormScroll, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FF7F50" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Routine</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Routine Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={colors.textSecondary}
          />

          <View style={styles.frequencySection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Frequency</Text>
            <TouchableOpacity 
              style={[
                styles.frequencyButton,
                { backgroundColor: frequency === 'daily' ? '#FF7F50' : colors.surface, borderColor: colors.border }
              ]}
              onPress={() => setFrequency('daily')}
            >
              <Text style={[styles.frequencyText, { color: frequency === 'daily' ? '#FFFFFF' : colors.textPrimary }]}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.frequencyButton,
                { backgroundColor: frequency === 'weekly' ? '#FF7F50' : colors.surface, borderColor: colors.border }
              ]}
              onPress={() => setFrequency('weekly')}
            >
              <Text style={[styles.frequencyText, { color: frequency === 'weekly' ? '#FFFFFF' : colors.textPrimary }]}>Weekly</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.frequencyButton,
                { backgroundColor: frequency === 'custom' ? '#FF7F50' : colors.surface, borderColor: colors.border }
              ]}
              onPress={() => setFrequency('custom')}
            >
              <Text style={[styles.frequencyText, { color: frequency === 'custom' ? '#FFFFFF' : colors.textPrimary }]}>Custom</Text>
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
    justifyContent: 'flex-start',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%',
  },
  editFormScroll: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
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
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    fontFamily: 'Vercetti-Regular',
  },
  frequencySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Vercetti-Regular',
  },
  frequencyButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  frequencyText: {
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
});
