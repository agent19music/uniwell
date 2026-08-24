import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { CheckCircle, CalendarBlank } from 'phosphor-react-native';
import { format } from 'date-fns';
import { Semester } from '@/types/TimetableTypes';
import { SafeText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
interface SemesterSelectionModalProps {
  onClose: () => void;
  onNewSemester: () => void;  // Updated type
  onSemesterSelected: (semesterId: string) => Promise<void>;
  semesters: Semester[];
}

const SemesterSelectionModal = ({ onClose, onNewSemester, onSemesterSelected, semesters }: SemesterSelectionModalProps) => {
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const { colors } = useTheme();

  const handleSemesterSelect = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
  };

  const handleConfirmSelection = async () => {
    if (selectedSemesterId) {
      await onSemesterSelected(selectedSemesterId);
      onClose();
    }
  };

  const renderSemesterItem = ({ item }: { item: Semester }) => {
    const isSelected = selectedSemesterId === item.id;

    return (
      <Pressable accessibilityRole="radio" accessibilityState={{ selected: isSelected }} onPress={() => handleSemesterSelect(item.id)}>
        {({ pressed }) => (
          <Card contentStyle={styles.semesterItemContent} style={[styles.semesterItem, isSelected && { backgroundColor: colors.surfacePressed, borderColor: colors.accent }, pressed && { backgroundColor: colors.surfacePressed }]}>
            <View style={styles.copy}><SafeText variant="bodyStrong" color={colors.text}>{item.name}</SafeText><SafeText variant="caption" color={colors.textSecondary}>{format(new Date(item.startDate), 'MMM d, yyyy')} – {format(new Date(item.endDate), 'MMM d, yyyy')}</SafeText></View>
            {isSelected && <CheckCircle color={colors.accent} size={24} weight="fill" />}
          </Card>
        )}
      </Pressable>
    );
  };

  return (
    <Dialog
      description="Choose the semester you want to schedule."
      dismissible
      footer={<View style={styles.actions}><Button label="Create semester" onPress={onNewSemester} style={styles.action} variant="secondary" /><Button disabled={!selectedSemesterId} label="Continue" onPress={handleConfirmSelection} style={styles.action} /></View>}
      onClose={onClose}
      title="Select semester"
      visible
    >
      {semesters.length ? <View accessibilityLabel="Available semesters" accessibilityRole="radiogroup" style={styles.list}><FlatList data={semesters} keyExtractor={(item) => item.id} renderItem={renderSemesterItem} scrollEnabled={false} /></View> : <EmptyState description="Create a semester to start organizing your classes." icon={<CalendarBlank color={colors.textMuted} size={48} />} title="No semesters yet" />}
    </Dialog>
  );
};

const styles = StyleSheet.create({
  semesterItem: {
    marginBottom: spacing.micro,
  },
  semesterItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 0,
  },
  copy: { flex: 1, gap: spacing.optical },
  list: { maxHeight: 340 },
  actions: { flexDirection: 'row', gap: spacing.micro },
  action: { flex: 1 },
});

export default SemesterSelectionModal;

