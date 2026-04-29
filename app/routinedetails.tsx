import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoutine } from '../contexts/RoutineContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export default function RoutineDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { habits, deleteRoutine } = useRoutine();
  const { colors } = useTheme();
  
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
      await deleteRoutine(habit.id);
      router.back();
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FF7F50" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{habit.title}</Text>
        <TouchableOpacity onPress={() => router.push('/modals/edit-routine')}>
          <Ionicons name="create-outline" size={24} color="#FF7F50" />
        </TouchableOpacity>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
        <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Frequency</Text>
        <Text style={[styles.infoText, { color: colors.textPrimary }]}>{habit.frequency}</Text>
      </View>

      <View style={styles.streakInfo}>
        <Text style={[styles.streakTitle, { color: colors.textSecondary }]}>Current Streak</Text>
        <Text style={[styles.streakCount, { color: '#FF7F50' }]}>{habit.streak.currentStreak} days</Text>
      </View>

      <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.error }]} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Routine</Text>
      </TouchableOpacity>
    </ScrollView>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  infoText: {
    fontSize: 18,
    fontFamily: 'Vercetti-Regular',
  },
  streakInfo: {
    alignItems: 'center',
    padding: 24,
  },
  streakTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  streakCount: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
  },
  deleteButton: {
    margin: 16,
    padding: 16,
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