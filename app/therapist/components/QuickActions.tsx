import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function QuickActions() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const actions = [
    {
      icon: 'calendar',
      title: 'Manage Availability',
      description: 'Set your working hours and exceptions',
      action: () => router.push('/therapist/settings?tab=availability'),
      color: '#4CAF50',
    },
    {
      icon: 'person',
      title: 'Edit Profile',
      description: 'Update your professional information',
      action: () => router.push('/therapist/settings?tab=profile'),
      color: '#2196F3',
    },
    {
      icon: 'chatbubble-ellipses',
      title: 'Messages',
      description: 'Check your client messages',
      action: () => router.push('/therapist/messages'),
      color: '#9C27B0',
    },
    {
      icon: 'stats-chart',
      title: 'Analytics',
      description: 'View your performance metrics',
      action: () => router.push('/therapist/analytics'),
      color: '#FF9800',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionCard, isDark && styles.darkCard]}
            onPress={action.action}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={[styles.actionTitle, isDark && styles.darkText]}>{action.title}</Text>
            <Text style={[styles.actionDescription, isDark && styles.darkSubText]} numberOfLines={2}>
              {action.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  darkSubText: {
    color: '#aaa',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
}); 