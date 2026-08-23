import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Pencil, Trash, Clock, Plus, CheckCircle, List } from 'phosphor-react-native';
import { format, addDays, subDays, isToday, isFuture } from 'date-fns';
import { useRoutine } from '../contexts/RoutineContext';
import ProgressArchive from '../components/ProgressArchive';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../hooks/useTheme';

export default function RoutinesScreen() {
  const {
    routines,
    routineCompletions,
    completeRoutine,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    getRoutineStatus,
    canCompleteRoutine,
  } = useRoutine();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineFrequency, setNewRoutineFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [newRoutineCustomDays, setNewRoutineCustomDays] = useState<string[]>([]);
  const [newRoutineNotificationTime, setNewRoutineNotificationTime] = useState('');
  const [editingRoutine, setEditingRoutine] = useState<any>(null);
  const { colors, isDark } = useTheme();

  const handleAddRoutine = async () => {
    if (!newRoutineTitle.trim()) {
      Alert.alert('Error', 'Please enter a routine title');
      return;
    }

    try {
      await createRoutine(
        newRoutineTitle,
        newRoutineFrequency,
        newRoutineCustomDays,
        newRoutineNotificationTime
      );
      setShowAddModal(false);
      setNewRoutineTitle('');
      setNewRoutineFrequency('daily');
      setNewRoutineCustomDays([]);
      setNewRoutineNotificationTime('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create routine');
    }
  };

  const handleCompleteRoutine = async (routineId: string) => {
    try {
      await completeRoutine(routineId, selectedDate);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete routine');
    }
  };

  const handleEditRoutine = async (routine: any) => {
    setEditingRoutine(routine);
    setNewRoutineTitle(routine.title);
    setNewRoutineFrequency(routine.frequency);
    setNewRoutineCustomDays(routine.customDays);
    setNewRoutineNotificationTime(routine.notificationTime || '');
    setShowAddModal(true);
  };

  const handleUpdateRoutine = async () => {
    if (!editingRoutine) return;

    try {
      await updateRoutine(editingRoutine.id, {
        title: newRoutineTitle,
        frequency: newRoutineFrequency,
        customDays: newRoutineCustomDays,
        notificationTime: newRoutineNotificationTime,
      });
      setShowAddModal(false);
      setEditingRoutine(null);
      setNewRoutineTitle('');
      setNewRoutineFrequency('daily');
      setNewRoutineCustomDays([]);
      setNewRoutineNotificationTime('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update routine');
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoutine(routineId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete routine');
            }
          },
        },
      ]
    );
  };

  const renderDateSelector = () => {
    const dates = [];
    for (let i = -7; i <= 7; i++) {
      dates.push(addDays(new Date(), i));
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateSelector}
      >
        {dates.map((date) => {
          const isSelected = selectedDate.toDateString() === date.toDateString();
          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.dateButton,
                {
                  backgroundColor: isSelected ? '#FF7F50' : colors.card,
                }
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text
                style={[
                  styles.dateButtonText,
                  { color: isSelected ? '#FFFFFF' : colors.textSecondary }
                ]}
              >
                {format(date, 'EEE')}
              </Text>
              <Text
                style={[
                  styles.dateButtonDay,
                  { color: isSelected ? '#FFFFFF' : colors.textPrimary }
                ]}
              >
                {format(date, 'd')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderRoutineItem = (routine: any) => {
    const status = getRoutineStatus(routine.id, selectedDate);
    const canComplete = canCompleteRoutine(routine.id, selectedDate);

    return (
      <View key={routine.id} style={[styles.routineItem, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
        <View style={styles.routineHeader}>
          <View style={styles.routineInfo}>
            <List size={24} color={routine.color || '#FF7F50'} weight="regular" />
            <Text style={[styles.routineTitle, { color: colors.textPrimary }]}>{routine.title}</Text>
          </View>
          <View style={styles.routineActions}>
            {!isFuture(selectedDate) && canComplete && (
              <TouchableOpacity
                onPress={() => handleCompleteRoutine(routine.id)}
                style={[
                  styles.completeButton,
                  status === 'completed' && styles.completedButton,
                ]}
              >
                {status === 'completed'
                  ? <CheckCircle size={24} color={colors.success} weight="fill" />
                  : <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#FF7F50' }} />}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleEditRoutine(routine)}
              style={styles.editButton}
            >
              <Pencil size={20} color={colors.info} weight="fill" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteRoutine(routine.id)}
              style={styles.deleteButton}
            >
              <Trash size={20} color={colors.error} weight="fill" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.routineDetails}>
          <Text style={[styles.routineFrequency, { color: colors.textSecondary }]}>
            {routine.frequency === 'daily'
              ? 'Daily'
              : routine.frequency === 'weekly'
              ? 'Weekly'
              : `Custom (${routine.customDays.length} days)`}
          </Text>
          {routine.notificationTime && (
            <Text style={[styles.routineNotification, { color: colors.textSecondary }]}>
              Reminder: {routine.notificationTime}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Routines</Text>
        <TouchableOpacity
          style={styles.archiveButton}
          onPress={() => setShowArchiveModal(true)}
        >
          <Clock size={24} color={colors.textPrimary} weight="fill" />
        </TouchableOpacity>
      </View>

      {renderDateSelector()}

      <ScrollView style={styles.routineList}>
        {routines.map(renderRoutineItem)}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingRoutine(null);
          setNewRoutineTitle('');
          setNewRoutineFrequency('daily');
          setNewRoutineCustomDays([]);
          setNewRoutineNotificationTime('');
          setShowAddModal(true);
        }}
      >
        <Plus size={24} color="#FFFFFF" weight="regular" />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingRoutine ? 'Edit Routine' : 'Add New Routine'}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Routine Title"
              placeholderTextColor={colors.textSecondary}
              value={newRoutineTitle}
              onChangeText={setNewRoutineTitle}
            />

            <View style={styles.pickerContainer}>
              <Text style={[styles.pickerLabel, { color: colors.textPrimary }]}>Frequency</Text>
              <Picker
                selectedValue={newRoutineFrequency}
                onValueChange={(value) => setNewRoutineFrequency(value)}
                style={[styles.picker, { backgroundColor: colors.surface, color: colors.textPrimary }]}
              >
                <Picker.Item label="Daily" value="daily" color={colors.textPrimary} />
                <Picker.Item label="Weekly" value="weekly" color={colors.textPrimary} />
                <Picker.Item label="Custom" value="custom" color={colors.textPrimary} />
              </Picker>
            </View>

            {newRoutineFrequency === 'custom' && (
              <View style={styles.customDaysContainer}>
                <Text style={[styles.pickerLabel, { color: colors.textPrimary }]}>Custom Days</Text>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                  (day) => {
                    const isSelected = newRoutineCustomDays.includes(day.toLowerCase());
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          {
                            backgroundColor: isSelected ? '#FF7F50' : colors.border,
                          }
                        ]}
                        onPress={() => {
                          const dayLower = day.toLowerCase();
                          setNewRoutineCustomDays((prev) =>
                            prev.includes(dayLower)
                              ? prev.filter((d) => d !== dayLower)
                              : [...prev, dayLower]
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            { color: isSelected ? '#FFFFFF' : colors.textPrimary }
                          ]}
                        >
                          {day.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            )}

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Notification Time (HH:MM)"
              placeholderTextColor={colors.textSecondary}
              value={newRoutineNotificationTime}
              onChangeText={setNewRoutineNotificationTime}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={editingRoutine ? handleUpdateRoutine : handleAddRoutine}
              >
                <Text style={styles.saveButtonText}>
                  {editingRoutine ? 'Update' : 'Add'} Routine
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ProgressArchive
        visible={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
  },
  archiveButton: {
    padding: 8,
  },
  dateSelector: {
    padding: 16,
  },
  dateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateButtonText: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  dateButtonDay: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
  },
  routineList: {
    flex: 1,
    padding: 16,
  },
  routineItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: 'Vercetti-Regular',
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButton: {
    padding: 8,
  },
  completedButton: {
    opacity: 0.7,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  routineDetails: {
    marginTop: 8,
  },
  routineFrequency: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  routineNotification: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF7F50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  picker: {
    borderRadius: 8,
  },
  customDaysContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  dayButtonText: {
    fontFamily: 'Vercetti-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
  },
  saveButton: {
    backgroundColor: '#FF7F50',
  },
  cancelButtonText: {
    fontFamily: 'Vercetti-Regular',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Vercetti-Regular',
  },
}); 