import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useRoutine } from '../../contexts/RoutineContext';
import { Ionicons, Octicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

type StreakType = 'build' | 'break';

export default function AddStreakModal() {
  const router = useRouter();
  const { createStreak } = useRoutine();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<StreakType>('build');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSave = async () => {
    try {
      await createStreak(
        title,
        type,
        startDate,
      );
      router.back();
    } catch (error) {
      console.error('Error creating streak:', error);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      if (Platform.OS === 'android') {
        setShowTimePicker(true);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const newDateTime = new Date(startDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setStartDate(newDateTime);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#FF7F50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Streak</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Streak Title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#666"
        />

        <Text style={styles.sectionTitle}>Streak Type</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity 
            style={[styles.typeButton, type === 'build' && styles.selectedType]}
            onPress={() => setType('build')}
          >
            <Octicons 
              name="rocket" 
              size={24} 
              color={type === 'build' ? 'white' : '#8A8AFF'} 
            />
            <Text style={[styles.typeText, type === 'build' && styles.selectedText]}>
              Build Habit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.typeButton, type === 'break' && styles.selectedType]}
            onPress={() => setType('break')}
          >
            <Octicons 
              name="flame" 
              size={24} 
              color={type === 'break' ? 'white' : '#FF69B4'} 
            />
            <Text style={[styles.typeText, type === 'break' && styles.selectedText]}>
              Break Habit
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Start Date & Time</Text>
        <View style={styles.dateTimeContainer}>
          <TouchableOpacity 
            style={[styles.dateTimeButton, styles.dateButton]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={24} color="#666" />
            <Text style={styles.dateTimeText}>
              {startDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.dateTimeButton, styles.timeButton]}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={24} color="#666" />
            <Text style={styles.dateTimeText}>
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={startDate}
            mode="time"
            display="default"
            onChange={onTimeChange}
            is24Hour={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 24,
    fontFamily: 'Vercetti-Regular',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  selectedType: {
    backgroundColor: '#FF7F50',
  },
  typeText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  selectedText: {
    color: 'white',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
}); 