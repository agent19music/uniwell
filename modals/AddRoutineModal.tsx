import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRoutine } from '@/contexts/RoutineContext';
import { DayOfTheWeek } from '@/types/TimetableTypes';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SafeText } from '@/components/ThemedText';
import { radius, spacing } from '@/constants/theme';

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
  const { colors } = useTheme();

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
          <SafeText variant="label">Select day</SafeText>
          <View style={styles.daysGrid}>
            {days.map((day) => {
              const isSelected = selectedWeekDay === day;
              return (
                <Pressable
                  key={day}
                  style={[
                    styles.dayButton,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setSelectedWeekDay(day as DayOfTheWeek)}
                >
                  <SafeText variant="bodyStrong" color={isSelected ? colors.textOnAccent : colors.text}>
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  </SafeText>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }

    if (frequency === 'custom') {
      return (
        <View style={styles.daysSection}>
          <SafeText variant="label">Select days</SafeText>
          <View style={styles.daysGrid}>
            {days.map((day) => {
              const isSelected = selectedDays.includes(day as DayOfTheWeek);
              return (
                <Pressable
                  key={day}
                  style={[
                    styles.dayButton,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
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
                  <SafeText variant="bodyStrong" color={isSelected ? colors.textOnAccent : colors.text}>
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  </SafeText>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      dismissible
      title="New routine"
      description="Choose a schedule you can keep."
      footer={<View style={styles.actions}>
        <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.action} />
        <Button label="Save routine" disabled={!title.trim()} onPress={handleSave} style={styles.action} />
      </View>}
    >
      <Input label="Routine title" value={title} onChangeText={setTitle} placeholder="e.g. Morning walk" autoFocus />
      <SegmentedControl
        label="Frequency"
        value={frequency}
        onChange={setFrequency}
        options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'custom', label: 'Custom' }]}
      />
      {renderDaySelector()}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.micro,
  },
  action: {
    flex: 1,
  },
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
    gap: spacing.micro,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.micro,
  },
  dayButton: {
    width: '30%',
    minHeight: 48,
    padding: spacing.micro,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
});
