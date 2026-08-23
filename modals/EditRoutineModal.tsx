import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRoutine } from '@/contexts/RoutineContext';
import { DayOfTheWeek } from '@/types/TimetableTypes';
import { useTheme } from '@/hooks/useTheme';
import { SafeText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FormSection } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { radius, spacing } from '@/constants/theme';

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
  const [error, setError] = useState('');
  const { colors } = useTheme();

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
      setError('A routine title is required.');
      return;
    }

    try {
      setError('');
      const days = frequency === 'weekly' && selectedWeekDay ? [selectedWeekDay] : selectedDays;
      await updateRoutine(routineId, { 
        title, 
        frequency, 
        customDays: days 
      });
      onClose();
    } catch (error) {
      console.error('Error updating routine:', error);
      setError('Unable to save this routine. Please try again.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoutine(routineId);
      onClose();
    } catch (error) {
      console.error('Error deleting routine:', error);
      setError('Unable to delete this routine. Please try again.');
    }
  };

  const renderDaySelector = () => {
    if (frequency === 'daily') return null;
    const days: DayOfTheWeek[] = [
      DayOfTheWeek.MONDAY,
      DayOfTheWeek.TUESDAY,
      DayOfTheWeek.WEDNESDAY,
      DayOfTheWeek.THURSDAY,
      DayOfTheWeek.FRIDAY,
      DayOfTheWeek.SATURDAY,
      DayOfTheWeek.SUNDAY,
    ];
    const selected = frequency === 'weekly' ? selectedWeekDay : null;

    return (
      <View style={styles.daysSection}>
        <SafeText variant="label" color={colors.text}>
          {frequency === 'weekly' ? 'Select a day' : 'Select days'}
        </SafeText>
        <View accessibilityLabel={frequency === 'weekly' ? 'Routine day' : 'Routine days'} accessibilityRole={frequency === 'weekly' ? 'radiogroup' : undefined} style={styles.daysGrid}>
          {days.map((day) => {
            const isSelected = frequency === 'weekly' ? selected === day : selectedDays.includes(day);
            return (
              <Button
                key={day}
                label={day.slice(0, 3).replace(/^./, (letter) => letter.toUpperCase())}
                onPress={() => {
                  if (frequency === 'weekly') {
                    setSelectedWeekDay(day);
                  } else {
                    setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
                  }
                }}
                style={styles.dayButton}
                variant={isSelected ? 'primary' : 'secondary'}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Dialog
      description="Update the routine’s schedule or remove it."
      dismissible
      footer={<View style={styles.actions}><Button label="Delete routine" onPress={handleDelete} style={styles.action} variant="destructive" /><Button label="Save changes" onPress={handleSave} style={styles.action} /></View>}
      onClose={onClose}
      title="Edit routine"
      visible={visible}
    >
      {isLoading ? <View accessibilityLabel="Loading routine" accessibilityRole="progressbar" style={styles.loading}><ActivityIndicator color={colors.accent} /><SafeText variant="body" color={colors.textSecondary}>Loading routine…</SafeText></View> : (
        <FormSection>
          <Input autoFocus error={error || undefined} label="Routine title" onChangeText={(value) => { setTitle(value); setError(''); }} placeholder="e.g. Morning walk" returnKeyType="done" value={title} />
          <SegmentedControl label="Frequency" onChange={setFrequency} options={[{ label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }, { label: 'Custom', value: 'custom' }]} value={frequency} />
          {renderDaySelector()}
        </FormSection>
      )}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  daysSection: {
    gap: spacing.micro,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.micro,
  },
  dayButton: {
    flexGrow: 1,
    width: '22%',
  },
  loading: {
    alignItems: 'center',
    gap: spacing.control,
    justifyContent: 'center',
    minHeight: 160,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.micro,
  },
  action: {
    flex: 1,
  },
});
