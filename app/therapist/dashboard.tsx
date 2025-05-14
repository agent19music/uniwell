import React from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTherapist } from './context/TherapistContext';
import { router } from 'expo-router';

// Import dashboard components
import DashboardHeader from './components/DashboardHeader';
import StatsOverview from './components/StatsOverview';
import UpcomingAppointments from './components/UpcomingAppointments';
import QuickActions from './components/QuickActions';
import RecentReviews from './components/RecentReviews';

export default function TherapistDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, profile, loading } = useTherapist();

  if (loading) {
      return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading...</Text>
                    </View>
      </SafeAreaView>
    );
  }

  if (!user || !profile) {
    router.replace('/therapist/loginscreen');
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <DashboardHeader />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <StatsOverview />
        <UpcomingAppointments />
        <QuickActions />
        <RecentReviews />
          </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
});