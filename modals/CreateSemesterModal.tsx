import React, { useContext, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Picker } from '@react-native-picker/picker';
import { SemesterType, NewSemester } from '../types/TimetableTypes';
import { AuthContext } from '@/contexts/AuthContext';
import { useTimetableManagement } from '@/lib/useTimeTableManagement';
import { SafeText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FormSection } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type CreateSemesterModalProps = {
  onClose: () => void;
};

const CreateSemesterModal: React.FC<CreateSemesterModalProps> = ({
  onClose,
}) => {
  const { currentUser: user } = useContext(AuthContext);
  const { colors } = useTheme();
  const nameInput = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<SemesterType>(SemesterType.FALL);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isActive, setIsActive] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [error, setError] = useState('');
  const { createSemester, setActiveSemesterById } = useTimetableManagement();

  const handleSave = async () => {
    setError('');

    if (!name.trim()) {
      setError('Semester name is required');
      nameInput.current?.focus();
      return;
    }

    if (endDate < startDate) {
      setError('End date must be after start date');
      return;
    }

    try {
      const newSemester: NewSemester = {
        name,
        type,
        startDate,
        endDate,
        status: isActive ? 'active' : 'inactive',
        userId: user?.id || '',
      };

      const createdSemester = await createSemester(newSemester);
      
      if (createdSemester && createdSemester.id && isActive) {
        await setActiveSemesterById(createdSemester.id);
      }

      onClose();
    } catch (err) {
      setError('Failed to create semester');
      console.error('Error creating semester:', err);
    }
  };

  return (
    <Dialog
      dismissible
      footer={<View style={styles.actions}><Button label="Cancel" onPress={onClose} style={styles.action} variant="secondary" /><Button label="Create semester" onPress={handleSave} style={styles.action} /></View>}
      onClose={onClose}
      title="Add semester"
      visible
    >
      <FormSection>
        <Input ref={nameInput} autoFocus error={error || undefined} label="Semester name" onChangeText={(value) => { setName(value); setError(''); }} placeholder="e.g. Fall 2026" returnKeyType="done" value={name} />
        <View style={styles.field}>
          <SafeText variant="label" color={colors.text}>Semester type</SafeText>
          <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Picker accessibilityLabel="Semester type" dropdownIconColor={colors.text} onValueChange={(value) => setType(value as SemesterType)} selectedValue={type} style={{ color: colors.text }}>
              <Picker.Item label="Fall" value={SemesterType.FALL} /><Picker.Item label="Spring" value={SemesterType.SPRING} /><Picker.Item label="Summer" value={SemesterType.SUMMER} /><Picker.Item label="Winter" value={SemesterType.WINTER} /><Picker.Item label="Custom" value={SemesterType.CUSTOM} />
            </Picker>
          </View>
        </View>
        <View style={styles.dates}><View style={styles.dateField}><SafeText variant="label" color={colors.text}>Start date</SafeText><Button label={format(startDate, 'MMM d, yyyy')} onPress={() => setShowStartDatePicker(true)} variant="secondary" /></View><View style={styles.dateField}><SafeText variant="label" color={colors.text}>End date</SafeText><Button label={format(endDate, 'MMM d, yyyy')} onPress={() => setShowEndDatePicker(true)} variant="secondary" /></View></View>
        {showStartDatePicker && <DateTimePicker display={Platform.OS === 'ios' ? 'spinner' : 'default'} mode="date" onChange={(_, date) => { setShowStartDatePicker(false); if (date) setStartDate(date); }} value={startDate} />}
        {showEndDatePicker && <DateTimePicker display={Platform.OS === 'ios' ? 'spinner' : 'default'} mode="date" onChange={(_, date) => { setShowEndDatePicker(false); if (date) setEndDate(date); }} value={endDate} />}
        <SwitchRow description="Only one semester can be active at a time." label="Set as active semester" onValueChange={setIsActive} value={isActive} />
      </FormSection>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  picker: {
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 56,
    overflow: 'hidden',
  },
  field: { gap: spacing.micro },
  dates: { flexDirection: 'row', gap: spacing.micro },
  dateField: { flex: 1, gap: spacing.micro },
  actions: { flexDirection: 'row', gap: spacing.micro },
  action: { flex: 1 },
});


export default CreateSemesterModal;

