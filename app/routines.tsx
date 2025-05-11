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
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays, isToday, isFuture } from 'date-fns';
import { useRoutine } from '../contexts/RoutineContext';
import ProgressArchive from '../components/ProgressArchive';
import { Picker } from '@react-native-picker/picker';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
        {dates.map((date) => (
          <TouchableOpacity
            key={date.toISOString()}
            style={[
              styles.dateButton,
              selectedDate.toDateString() === date.toDateString() && styles.selectedDateButton,
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text
              style={[
                styles.dateButtonText,
                selectedDate.toDateString() === date.toDateString() && styles.selectedDateButtonText,
              ]}
            >
              {format(date, 'EEE')}
            </Text>
            <Text
              style={[
                styles.dateButtonDay,
                selectedDate.toDateString() === date.toDateString() && styles.selectedDateButtonText,
              ]}
            >
              {format(date, 'd')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderRoutineItem = (routine: any) => {
    const status = getRoutineStatus(routine.id, selectedDate);
    const canComplete = canCompleteRoutine(routine.id, selectedDate);

    return (
      <View key={routine.id} style={styles.routineItem}>
        <View style={styles.routineHeader}>
          <View style={styles.routineInfo}>
            <Ionicons name={routine.icon || 'list'} size={24} color={routine.color || '#FF7F50'} />
            <Text style={[styles.routineTitle, isDark && styles.darkText]}>{routine.title}</Text>
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
                <Ionicons
                  name={status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={status === 'completed' ? '#34C759' : '#FF7F50'}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleEditRoutine(routine)}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteRoutine(routine.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.routineDetails}>
          <Text style={[styles.routineFrequency, isDark && styles.darkText]}>
            {routine.frequency === 'daily'
              ? 'Daily'
              : routine.frequency === 'weekly'
              ? 'Weekly'
              : `Custom (${routine.customDays.length} days)`}
          </Text>
          {routine.notificationTime && (
            <Text style={[styles.routineNotification, isDark && styles.darkText]}>
              Reminder: {routine.notificationTime}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Routines</Text>
        <TouchableOpacity
          style={styles.archiveButton}
          onPress={() => setShowArchiveModal(true)}
        >
          <Ionicons name="time" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
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
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>
              {editingRoutine ? 'Edit Routine' : 'Add New Routine'}
            </Text>

            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder="Routine Title"
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              value={newRoutineTitle}
              onChangeText={setNewRoutineTitle}
            />

            <View style={styles.pickerContainer}>
              <Text style={[styles.pickerLabel, isDark && styles.darkText]}>Frequency</Text>
              <Picker
                selectedValue={newRoutineFrequency}
                onValueChange={(value) => setNewRoutineFrequency(value)}
                style={[styles.picker, isDark && styles.darkPicker]}
              >
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Custom" value="custom" />
              </Picker>
            </View>

            {newRoutineFrequency === 'custom' && (
              <View style={styles.customDaysContainer}>
                <Text style={[styles.pickerLabel, isDark && styles.darkText]}>Custom Days</Text>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                  (day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        newRoutineCustomDays.includes(day.toLowerCase()) && styles.selectedDayButton,
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
                          newRoutineCustomDays.includes(day.toLowerCase()) && styles.selectedDayButtonText,
                        ]}
                      >
                        {day.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}

            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder="Notification Time (HH:MM)"
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              value={newRoutineNotificationTime}
              onChangeText={setNewRoutineNotificationTime}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
    backgroundColor: '#F2F2F7',
  },
  darkContainer: {
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
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
    backgroundColor: '#FFFFFF',
  },
  selectedDateButton: {
    backgroundColor: '#FF7F50',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  dateButtonDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  selectedDateButtonText: {
    color: '#FFFFFF',
  },
  routineList: {
    flex: 1,
    padding: 16,
  },
  routineItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    color: '#000000',
    marginLeft: 12,
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
    color: '#666666',
  },
  routineNotification: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  darkModalContent: {
    backgroundColor: '#1C1C1E',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#000000',
  },
  darkInput: {
    borderColor: '#333333',
    color: '#FFFFFF',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  darkPicker: {
    backgroundColor: '#1C1C1E',
    color: '#FFFFFF',
  },
  customDaysContainer: {
    marginBottom: 16,
  },
  dayButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedDayButton: {
    backgroundColor: '#FF7F50',
  },
  dayButtonText: {
    color: '#000000',
  },
  selectedDayButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#F2F2F7',
  },
  saveButton: {
    backgroundColor: '#FF7F50',
  },
  cancelButtonText: {
    color: '#000000',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  darkText: {
    color: '#FFFFFF',
  },
}); 