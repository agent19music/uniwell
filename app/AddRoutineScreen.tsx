import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useRoutine } from '@/contexts/RoutineContext';
import { Ionicons } from '@expo/vector-icons';

type Frequency = 'daily' | 'weekly' | 'custom';
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export default function AddRoutineModal() {
  const router = useRouter();
  const { createRoutine } = useRoutine();
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSave = async () => {
    try {
      await createRoutine(title, frequency, frequency === 'custom' ? selectedDays : []);
      router.back();
    } catch (error) {
      console.error('Error creating routine:', error);
    }
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
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

        {frequency === 'custom' && (
          <View style={styles.daysSection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Select Days</Text>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
              <View key={day} style={styles.dayRow}>
                <Text style={[styles.dayText, isDark && styles.darkText]}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                <Switch
                  value={selectedDays.includes(day as DayOfWeek)}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedDays([...selectedDays, day as DayOfWeek]);
                    } else {
                      setSelectedDays(selectedDays.filter(d => d !== day));
                    }
                  }}
                  trackColor={{ false: '#767577', true: '#FF7F50' }}
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
    backgroundColor: '#f8f8f8',
    marginTop: 12,
  },
  darkContainer: {
    backgroundColor: '#121212',
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
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
});