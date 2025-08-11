import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTherapist } from '../../contexts/TherapistContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ProfileCompletion from './components/ProfileCompletion';
import { Appointment } from '../../types/therapist';
import QuickActions from './components/QuickActions';

// Only render the dashboard on web - mobile will redirect
const isWeb = Platform.OS === 'web';

export default function TherapistDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { profile, isProfileComplete, signOut, user, loading, getStats, getAppointments, therapistName } = useTherapist();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalPatients: 0,
    averageRating: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get the display name for the therapist
  const displayName = therapistName || (profile?.bio?.split(' ')[0] || 'Therapist');
  
  // Redirect non-web users to the login screen
  useEffect(() => {
    if (!isWeb) {
      router.replace('/therapist/mobile-notice');
    }
  }, [isWeb]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        // Load stats
        const dashboardStats = await getStats();
        setStats(dashboardStats);
        
        // Load upcoming appointments
        const appointments = await getAppointments({ 
          status: ['pending', 'confirmed'],
          date: new Date()
        });
        setUpcomingAppointments(appointments);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (!isWeb) {
    return null; // Will be redirected by useEffect
  }

  if (loading || isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7F50" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !profile) {
    router.replace('/therapist/loginscreen');
    return null;
  }
  
  // Show profile completion if profile is not complete
  if (!isProfileComplete()) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>Uniwell Therapist Portal</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
            <Ionicons name="log-out-outline" size={20} color="#FF7F50" />
          </TouchableOpacity>
        </View>
        
        <ProfileCompletion 
          onComplete={() => {
            router.replace('/therapist/dashboard');
          }} 
        />
      </SafeAreaView>
    );
  }
  
  // This main dashboard is shown when profile is complete
  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Therapist Dashboard</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => router.push('/therapist/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={isDark ? "#fff" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
            <Ionicons name="log-out-outline" size={20} color="#FF7F50" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={[styles.welcomeCard, isDark && styles.darkCard]}>
          <Text style={[styles.welcomeText, isDark && styles.darkText]}>
            Welcome back, {displayName.split(' ')[0]}
          </Text>
          <Text style={[styles.welcomeSubtext, isDark && styles.darkSubText]}>
            You have {stats.todayAppointments} {stats.todayAppointments === 1 ? 'appointment' : 'appointments'} today
          </Text>
        </View>
        
        <View style={styles.gridContainer}>
          <TouchableOpacity style={[styles.dashboardCard, isDark && styles.darkCard]}>
            <Ionicons name="calendar-outline" size={24} color="#FF7F50" />
            <Text style={[styles.cardTitle, isDark && styles.darkText]}>Appointments</Text>
            <Text style={[styles.cardValue, isDark && styles.darkText]}>{stats.todayAppointments}</Text>
            <Text style={[styles.cardSubtext, isDark && styles.darkSubText]}>Today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.dashboardCard, isDark && styles.darkCard]}>
            <Ionicons name="cash-outline" size={24} color="#FF7F50" />
            <Text style={[styles.cardTitle, isDark && styles.darkText]}>Revenue</Text>
            <Text style={[styles.cardValue, isDark && styles.darkText]}>KES {stats.monthRevenue.toLocaleString()}</Text>
            <Text style={[styles.cardSubtext, isDark && styles.darkSubText]}>This month</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.dashboardCard, isDark && styles.darkCard]}>
            <Ionicons name="people-outline" size={24} color="#FF7F50" />
            <Text style={[styles.cardTitle, isDark && styles.darkText]}>Clients</Text>
            <Text style={[styles.cardValue, isDark && styles.darkText]}>{stats.totalPatients}</Text>
            <Text style={[styles.cardSubtext, isDark && styles.darkSubText]}>Total</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.dashboardCard, isDark && styles.darkCard]}>
            <Ionicons name="star-outline" size={24} color="#FF7F50" />
            <Text style={[styles.cardTitle, isDark && styles.darkText]}>Rating</Text>
            <Text style={[styles.cardValue, isDark && styles.darkText]}>{stats.averageRating}</Text>
            <Text style={[styles.cardSubtext, isDark && styles.darkSubText]}>Average</Text>
          </TouchableOpacity>
        </View>
        
        {/* Quick Actions Section */}
        <View style={styles.section}>
          <QuickActions />
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Upcoming Appointments</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingAppointments.length === 0 ? (
          <View style={[styles.emptyState, isDark && styles.darkCard]}>
            <Text style={[styles.emptyStateText, isDark && styles.darkText]}>No upcoming appointments</Text>
          </View>
        ) : (
          upcomingAppointments.map((appointment) => {
            // Handle the client data format change
            const client = appointment.client || {};
            const clientName = (client as any).full_name || (client as any).email?.split('@')[0] || 'Patient';
            const initials = clientName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
            const startTime = new Date(appointment.start_time);
            const endTime = new Date(appointment.end_time);
            const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
            
            // Format time in East African format (12-hour with AM/PM)
            const timeString = startTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true,
              timeZone: 'Africa/Nairobi'
            });
            
            // Status badge colors
            const statusColors = {
              pending: { bg: '#FFF3CD', text: '#856404' },
              confirmed: { bg: '#E6F7ED', text: '#0E9F6E' },
              cancelled: { bg: '#FEE2E2', text: '#DC2626' },
              completed: { bg: '#E0E7FF', text: '#4F46E5' }
            };
            
            const status = appointment.status || 'pending';
            const statusColor = statusColors[status as keyof typeof statusColors] || 
                              statusColors.pending;
            
            return (
              <View key={appointment.id} style={[styles.appointmentCard, isDark && styles.darkCard]}>
                <View style={styles.appointmentHeader}>
                  <Text style={[styles.appointmentDate, isDark && styles.darkText]}>
                    {timeString}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.text }]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.clientInfo}>
                  <View style={styles.clientInitials}>
                    <Text style={styles.initialsText}>{initials}</Text>
                  </View>
                  <View style={styles.clientDetails}>
                    <Text style={[styles.clientName, isDark && styles.darkText]}>{clientName}</Text>
                    <Text style={[styles.sessionType, isDark && styles.darkSubText]}>
                      {status === 'pending' ? 'New Session' : 'Follow Up'} • {duration} min
                    </Text>
                  </View>
                </View>
                
                <View style={styles.appointmentActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="videocam-outline" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Start Session</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
                    <Ionicons name="chatbubble-outline" size={16} color="#FF7F50" />
                    <Text style={styles.secondaryButtonText}>Message</Text>
                  </TouchableOpacity>
                </View>
                
                {appointment.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={[styles.notesLabel, isDark && styles.darkText]}>Notes:</Text>
                    <Text style={[styles.notesText, isDark && styles.darkSubText]}>{appointment.notes}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
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
  darkSubText: {
    color: '#aaaaaa',
  },
  mobileNotice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mobileNoticeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  mobileNoticeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Vercetti-Regular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    marginRight: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    color: '#FF7F50',
    marginRight: 8,
    fontFamily: 'Vercetti-Regular',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 20,
  },
  dashboardCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 16,
    width: Dimensions.get('window').width > 768 
      ? (Dimensions.get('window').width - 80) / 4 - 16 
      : (Dimensions.get('window').width - 56) / 2 - 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontFamily: 'Vercetti-Regular',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    fontFamily: 'Vercetti-Regular',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF7F50',
    fontFamily: 'Vercetti-Regular',
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  statusBadge: {
    backgroundColor: '#E6F7ED',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusText: {
    color: '#0E9F6E',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF7F50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initialsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  sessionType: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
  },
  secondaryButtonText: {
    color: '#FF7F50',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  notesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'Vercetti-Regular',
  },
});