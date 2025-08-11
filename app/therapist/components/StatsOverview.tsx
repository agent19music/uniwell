import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTherapist } from '../../../contexts/TherapistContext';

export default function StatsOverview() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { getStats } = useTherapist();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalPatients: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const statsData = [
    {
      icon: 'calendar-outline',
      label: 'Today\'s Sessions',
      value: stats.todayAppointments.toString(),
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      icon: 'trending-up-outline',
      label: 'Week Revenue',
      value: formatCurrency(stats.weekRevenue),
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      icon: 'cash-outline',
      label: 'Month Revenue',
      value: formatCurrency(stats.monthRevenue),
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      icon: 'people-outline',
      label: 'Total Patients',
      value: stats.totalPatients.toString(),
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
    {
      icon: 'star-outline',
      label: 'Average Rating',
      value: `${stats.averageRating.toFixed(1)}/5`,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isDark && styles.darkText]}>Overview</Text>
      <View style={styles.statsGrid}>
        {statsData.map((stat, index) => (
          <View key={index} style={[styles.statCard, isDark && styles.darkCard]}>
            <View style={[styles.iconContainer, { backgroundColor: stat.bgColor }]}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>
                {loading ? '...' : stat.value}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubText]}>
                {stat.label}
              </Text>
            </View>
          </View>
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
  darkSubText: {
    color: '#aaaaaa',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statContent: {
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
}); 