import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useRoutine } from '@/contexts/RoutineContext';
import { X } from 'phosphor-react-native';
import { TimePickerInteraction } from '@/components/TimePickerInteraction';
import { useTheme } from '../hooks/useTheme';

type Frequency = 'daily' | 'weekly' | 'custom';
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export default function AddRoutineModal() {
  const router = useRouter();
  const { createRoutine } = useRoutine();
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [routineTime, setRoutineTime] = useState(new Date());
  const { colors, isDark } = useTheme();

  const handleSave = async () => {
    try {
      await createRoutine(title, frequency, frequency === 'custom' ? selectedDays : [], routineTime.toISOString());
      router.back();
    } catch (error) {
      console.error('Error creating routine:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#FF7F50" weight="regular" />
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

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Routine Time</Text>
        <TimePickerInteraction
          value={routineTime}
          onChange={setRoutineTime}
        />

        {frequency === 'custom' && (
          <View style={styles.daysSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Days</Text>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
              <View key={day} style={styles.dayRow}>
                <Text style={[styles.dayText, { color: colors.textPrimary }]}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                <Switch
                  value={selectedDays.includes(day as DayOfWeek)}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedDays([...selectedDays, day as DayOfWeek]);
                    } else {
                      setSelectedDays(selectedDays.filter(d => d !== day));
                    }
                  }}
                  trackColor={{ false: colors.border, true: '#FF7F50' }}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 12,
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
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dayText: {
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
  },
});