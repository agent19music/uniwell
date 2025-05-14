import React from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTherapist } from '../context/TherapistContext';

export default function QuickActions() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { updateAvailability, getAppointments } = useTherapist();

  const handleUpdateAvailability = () => {
    // Navigate to availability update screen
    // For now, show a sample availability update
    Alert.alert('Update Availability', 'Feature coming soon - Navigate to availability settings');
  };

  const handleViewPatients = async () => {
    try {
      const appointments = await getAppointments();
      const uniquePatients = new Set(appointments.map(apt => apt.client_id));
      Alert.alert('Patients', `You have ${uniquePatients.size} unique patients`);
    } catch (error) {
      Alert.alert('Error', 'Failed to load patients');
    }
  };

  const handleReports = async () => {
    // Generate and show reports
    Alert.alert('Reports', 'Generate reports based on your practice data');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Navigate to therapist settings');
  };

  const actions = [
    {
      icon: 'calendar-outline',
      label: 'Update Availability',
      onPress: handleUpdateAvailability,
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      icon: 'people-outline',
      label: 'View Patients',
      onPress: handleViewPatients,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      icon: 'analytics-outline',
      label: 'Reports',
      onPress: handleReports,
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
    {
      icon: 'settings-outline',
      label: 'Settings',
      onPress: handleSettings,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isDark && styles.darkText]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionCard, isDark && styles.darkCard]}
            onPress={action.onPress}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.bgColor }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={[styles.actionLabel, isDark && styles.darkText]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
  },
}); 