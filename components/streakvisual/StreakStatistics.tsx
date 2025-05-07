// StreakStatistics.js
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { mockStreak, mockStats } from '../../mock/streakData';

interface Props {
  streakId: string;
}

export const StreakStatistics: React.FC<Props> = ({ streakId }) => {
  // Using mock data instead of context
  const streak = mockStreak;
  const stats = mockStats;
  const completionRate = Math.round((stats.completedDays / stats.totalDays) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak.currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak.longestStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completedDays}</Text>
          <Text style={styles.statLabel}>Total Check-ins</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completionRate}%</Text>
          <Text style={styles.statLabel}>Completion Rate</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  streakInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  streakInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  streakInfoLabel: {
    fontSize: 15,
    color: '#000000',
  },
  streakInfoValue: {
    fontSize: 15,
    color: '#8E8E93',
  },
});