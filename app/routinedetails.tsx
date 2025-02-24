import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoutine } from '../contexts/RoutineContext';
import { Ionicons } from '@expo/vector-icons';

export default function RoutineDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { habits, deleteHabit, updateHabitStatus } = useRoutine();
  
  const habit = habits.find(h => h.id === id);

  if (!habit) {
    return (
      <View style={styles.container}>
        <Text>Routine not found</Text>
      </View>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteHabit(habit.id);
      router.back();
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FF7F50" />
        </TouchableOpacity>
        <Text style={styles.title}>{habit.title}</Text>
        <TouchableOpacity onPress={() => router.push('/modals/edit-routine')}>
          <Ionicons name="create-outline" size={24} color="#FF7F50" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Frequency</Text>
        <Text style={styles.infoText}>{habit.frequency}</Text>
      </View>

      <View style={styles.streakInfo}>
        <Text style={styles.streakTitle}>Current Streak</Text>
        <Text style={styles.streakCount}>{habit.streak.current_streak} days</Text>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Routine</Text>
      </TouchableOpacity>
    </ScrollView>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  infoText: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  streakInfo: {
    alignItems: 'center',
    padding: 24,
  },
  streakTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  streakCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF7F50',
    fontFamily: 'Vercetti-Regular',
  },
  deleteButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
}); 