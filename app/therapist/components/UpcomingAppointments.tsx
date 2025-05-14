import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTherapist } from '../context/TherapistContext';
import { Appointment } from '../types';

export default function UpcomingAppointments() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { 
    getAppointments, 
    updateAppointmentStatus, 
    generateMeetingLink,
    subscribeToAppointments 
  } = useTherapist();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingAppointments();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToAppointments((appointment) => {
      setAppointments(prev => {
        const updated = prev.filter(apt => apt.id !== appointment.id);
        return [...updated, appointment].sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
      });
    });

    return unsubscribe;
  }, []);

  const loadUpcomingAppointments = async () => {
    try {
      const data = await getAppointments({ 
        status: ['pending', 'confirmed']
      });
      setAppointments(data.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const day = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return { time, day };
  };

  const getClientName = (appointment: Appointment) => {
    const client = appointment.client as any;
    return client?.full_name || client?.email?.split('@')[0] || 'Patient';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const handleJoinSession = async (appointment: Appointment) => {
    try {
      if (!appointment.meeting_link) {
        const { error } = await generateMeetingLink(appointment.id);
        if (error) {
          Alert.alert('Error', 'Failed to generate meeting link');
          return;
        }
      }
      // Open meeting link or navigate to video call screen
      Alert.alert('Join Session', `Meeting link: ${appointment.meeting_link || 'Generated'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to join session');
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await updateAppointmentStatus(appointmentId, 'confirmed');
      if (error) {
        Alert.alert('Error', 'Failed to confirm appointment');
      } else {
        Alert.alert('Success', 'Appointment confirmed');
        loadUpcomingAppointments();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm appointment');
    }
  };

  const handleViewAll = () => {
    // Navigate to full appointments view
    console.log('View all appointments');
  };

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <Text style={[styles.title, isDark && styles.darkText]}>Upcoming Sessions</Text>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.darkSubText]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>Upcoming Sessions</Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {appointments.length > 0 ? (
        <ScrollView style={styles.appointmentsList} showsVerticalScrollIndicator={false}>
          {appointments.map((appointment) => {
            const { time, day } = formatDateTime(appointment.start_time);
            
            return (
              <View key={appointment.id} style={[styles.appointmentCard, isDark && styles.darkCard]}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.clientInfo}>
                    <View style={styles.clientAvatar}>
                      <Text style={styles.clientInitial}>
                        {getClientName(appointment)[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.clientDetails}>
                      <Text style={[styles.clientName, isDark && styles.darkText]}>
                        {getClientName(appointment)}
                      </Text>
                      <Text style={[styles.appointmentTime, isDark && styles.darkSubText]}>
                        {day} at {time}
                      </Text>
                    </View>
                  </View>
                  <View 
                    style={[
                      styles.statusBadge, 
                      { backgroundColor: `${getStatusColor(appointment.status)}20` }
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {appointment.notes && (
                  <Text style={[styles.notes, isDark && styles.darkSubText]} numberOfLines={2}>
                    {appointment.notes}
                  </Text>
                )}

                <View style={styles.appointmentActions}>
                  <TouchableOpacity 
                    style={styles.joinButton}
                    onPress={() => handleJoinSession(appointment)}
                  >
                    <Ionicons name="videocam-outline" size={16} color="white" />
                    <Text style={styles.joinButtonText}>Join</Text>
                  </TouchableOpacity>
                  
                  {appointment.status === 'pending' && (
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={() => handleConfirmAppointment(appointment.id)}
                    >
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity style={styles.detailsButton}>
                    <Text style={styles.detailsButtonText}>Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.emptyText, isDark && styles.darkSubText]}>
            No upcoming sessions
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  darkContainer: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  viewAllText: {
    color: '#FF7F50',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  appointmentsList: {
    maxHeight: 400,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF7F50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
  },
  clientDetails: {
    gap: 2,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
    fontFamily: 'Vercetti-Regular',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 10,
  },
  joinButton: {
    flexDirection: 'row',
    backgroundColor: '#FF7F50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  detailsButton: {
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  detailsButtonText: {
    color: '#FF7F50',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  confirmButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
}); 