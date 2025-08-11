import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  useColorScheme, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTherapist } from '../../contexts/TherapistContext';
import { Appointment } from '../../types/therapist';
import { supabase } from '../../lib/supabase';

export default function SessionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { session } = useAuth();
  const { 
    getAppointments, 
    cancelAppointment, 
    rescheduleAppointment,
    addReview,
    loadTherapists,
    getAvailableTimeSlots,
    bookAppointment
  } = useTherapist();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (session) {
      loadAppointments();
    }
  }, [session]);

  const loadAppointments = async () => {
    try {
      if (!session?.user) return;

      // For regular users, we need to get appointments where they are the client
      // This requires a different approach since getAppointments in context is for therapists
      // We'll create a client-specific query here
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          therapist_id!inner (
            id,
            bio,
            qualifications,
            profile_picture,
            specialization
          )
        `)
        .eq('client_id', session.user.id)
        .in('status', ['pending', 'confirmed'])
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading appointments:', error);
        Alert.alert('Error', 'Failed to load appointments');
      } else {
        setAppointments(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-GB', { 
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getSessionDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return `${diffMinutes} min`;
  };

  const handleJoinSession = (appointment: Appointment) => {
    if (appointment.meeting_link) {
      Alert.alert(
        'Join Session', 
        `Would you like to join the Google Meet session with ${getTherapistName(appointment)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Join', 
            onPress: () => {
              // Open Google Meet link in browser
              Linking.openURL(appointment.meeting_link!);
            }
          }
        ]
      );
    } else {
      Alert.alert('No Meeting Link', 'Meeting link is not available yet.');
    }
  };

  const handleReschedule = async (appointmentId: string) => {
    Alert.alert('Reschedule', 'This will navigate to the reschedule screen', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Reschedule', 
        onPress: () => {
          // Navigate to reschedule screen
          console.log('Navigate to reschedule for:', appointmentId);
        }
      }
    ]);
  };

  const handleCancel = async (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await cancelAppointment(appointmentId, 'Cancelled by client');
              if (error) {
                Alert.alert('Error', 'Failed to cancel appointment');
              } else {
                Alert.alert('Success', 'Appointment cancelled successfully');
                loadAppointments();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment');
            }
          }
        }
      ]
    );
  };

  const handleAddReview = async (appointment: Appointment) => {
    // This would normally open a review modal/screen
    Alert.prompt(
      'Add Review',
      'Rate your session (1-5) and leave a review:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: async (input) => {
            const rating = parseInt(input?.split('\n')[0] || '5');
            const reviewText = input?.split('\n').slice(1).join('\n');
            
            try {
              const { error } = await addReview(appointment.id, rating, reviewText);
              if (error) {
                Alert.alert('Error', 'Failed to submit review');
              } else {
                Alert.alert('Success', 'Review submitted successfully');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to submit review');
            }
          }
        }
      ],
      'plain-text',
      '5\nGreat session!'
    );
  };

  const handleViewProfile = (therapistId: string) => {
    // Navigate to therapist profile
    console.log('Navigate to therapist profile:', therapistId);
  };

  const handleBookSession = async () => {
    try {
      // Load available therapists
      const therapists = await loadTherapists();
      
      if (therapists.length === 0) {
        Alert.alert('No Therapists', 'No therapists are currently available');
        return;
      }

      // For demo, let's book with the first available therapist
      const therapist = therapists[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get available slots
      const slots = await getAvailableTimeSlots(therapist.id, tomorrow);
      const availableSlot = slots.find(slot => slot.available);
      
      if (!availableSlot) {
        Alert.alert('No Slots', 'No available time slots found');
        return;
      }

      // Book the appointment
      const { data, error } = await bookAppointment({
        therapistId: therapist.id,
        startTime: availableSlot.start,
        endTime: availableSlot.end,
        notes: 'Booked via mobile app'
      });

      if (error) {
        Alert.alert('Booking Failed', error.message || 'Failed to book appointment');
      } else {
        Alert.alert('Success', 'Appointment booked successfully!');
        loadAppointments();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to book session');
    }
  };

  const isSessionLive = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
  };

  const isSessionCompleted = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    return now > end;
  };

  const getTherapistName = (appointment: Appointment) => {
    const therapist = appointment.therapist_id as any;
    return therapist?.bio?.split(' ').slice(0, 2).join(' ') || 'Therapist';
  };

  const getTherapistCredentials = (appointment: Appointment) => {
    const therapist = appointment.therapist_id as any;
    return therapist?.qualifications?.[0] || 'Licensed Therapist';
  };

  const getTherapistImage = (appointment: Appointment) => {
    const therapist = appointment.therapist_id as any;
    return therapist?.profile_picture || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7F50" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF7F50']}
            tintColor="#FF7F50"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.darkText]}>My Sessions</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={20} color={isDark ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
        </View>

        {/* Sessions List */}
        <View style={styles.sessionsList}>
          {appointments.map((appointment) => {
            const { date, time } = formatDateTime(appointment.start_time);
            const endTime = formatDateTime(appointment.end_time).time;
            const duration = getSessionDuration(appointment.start_time, appointment.end_time);
            const isLive = isSessionLive(appointment.start_time, appointment.end_time);
            const isCompleted = isSessionCompleted(appointment.end_time);

            return (
              <View key={appointment.id} style={[styles.sessionCard, isDark && styles.darkCard]}>
                {/* Status Indicator */}
                {isLive && (
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}

                <View style={styles.therapistInfo}>
                  <Image 
                    source={{ uri: getTherapistImage(appointment) }} 
                    style={styles.therapistImage} 
                  />
                  <View style={styles.sessionInfo}>
                    <Text style={[styles.therapistName, isDark && styles.darkText]}>
                      {getTherapistName(appointment)}
                    </Text>
                    <Text style={[styles.therapistTitle, isDark && styles.darkSubText]}>
                      {getTherapistCredentials(appointment)}
                    </Text>
                    <View style={styles.timeInfo}>
                      <View style={styles.timeRow}>
                        <Ionicons name="calendar-outline" size={16} color={isDark ? '#aaaaaa' : '#666666'} />
                        <Text style={[styles.timeText, isDark && styles.darkSubText]}>{date}</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={16} color={isDark ? '#aaaaaa' : '#666666'} />
                        <Text style={[styles.timeText, isDark && styles.darkSubText]}>
                          {time} - {endTime}
                        </Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Ionicons name="hourglass-outline" size={16} color={isDark ? '#aaaaaa' : '#666666'} />
                        <Text style={[styles.timeText, isDark && styles.darkSubText]}>{duration}</Text>
                      </View>
                    </View>
                    {appointment.status === 'pending' && (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Pending Confirmation</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  {isLive ? (
                    <TouchableOpacity 
                      style={[styles.joinButton, styles.liveButton]}
                      onPress={() => handleJoinSession(appointment)}
                    >
                      <Ionicons name="videocam" size={16} color="white" style={styles.buttonIcon} />
                      <Text style={styles.joinButtonText}>Join Live Session</Text>
                    </TouchableOpacity>
                  ) : isCompleted ? (
                    <TouchableOpacity 
                      style={styles.reviewButton}
                      onPress={() => handleAddReview(appointment)}
                    >
                      <Ionicons name="star-outline" size={16} color="white" style={styles.buttonIcon} />
                      <Text style={styles.reviewButtonText}>Add Review</Text>
                    </TouchableOpacity>
                  ) : appointment.status === 'confirmed' ? (
                    <>
                      <TouchableOpacity 
                        style={styles.joinButton}
                        onPress={() => handleJoinSession(appointment)}
                      >
                        <Ionicons name="videocam-outline" size={16} color="white" style={styles.buttonIcon} />
                        <Text style={styles.joinButtonText}>Join Session</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.rescheduleButton}
                        onPress={() => handleReschedule(appointment.id)}
                      >
                        <Ionicons name="refresh-outline" size={16} color="white" style={styles.buttonIcon} />
                        <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => handleCancel(appointment.id)}
                    >
                      <Ionicons name="close-outline" size={16} color="white" style={styles.buttonIcon} />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.viewProfileButton, isDark && styles.darkViewProfileButton]}
                    onPress={() => handleViewProfile(appointment.therapist_id)}
                  >
                    <Ionicons name="person-outline" size={16} color="#FF7F50" style={styles.buttonIcon} />
                    <Text style={[styles.viewProfileText, isDark && styles.darkViewProfileText]}>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                </View>

                {appointment.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={[styles.notesLabel, isDark && styles.darkText]}>Session Notes:</Text>
                    <Text style={[styles.notesText, isDark && styles.darkSubText]}>{appointment.notes}</Text>
                  </View>
                )}
              </View>
            );
          })}
          
          {appointments.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={isDark ? '#666' : '#ccc'} />
              <Text style={[styles.emptyStateText, isDark && styles.darkSubText]}>
                No upcoming sessions
              </Text>
              <Text style={[styles.emptyStateSubText, isDark && styles.darkSubText]}>
                Book a session to see it here
              </Text>
              <TouchableOpacity style={styles.bookButton} onPress={handleBookSession}>
                <Text style={styles.bookButtonText}>Book a Session</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Available Time Slots Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Available Time Slots</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlots}>
            {[1, 2, 3, 4, 5].map((slot) => (
              <TouchableOpacity key={slot} style={[styles.timeSlot, isDark && styles.darkTimeSlot]}>
                <Text style={[styles.timeSlotDay, isDark && styles.darkText]}>Mon</Text>
                <Text style={[styles.timeSlotDate, isDark && styles.darkSubText]}>Mar {slot}</Text>
                <View style={[styles.timeSlotTime, isDark && styles.darkTimeSlotTime]}>
                  <Text style={styles.timeSlotTimeText}>10:00 AM</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionsList: {
    padding: 20,
    gap: 16,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  liveIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
  },
  therapistInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  therapistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  sessionInfo: {
    flex: 1,
  },
  therapistName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  therapistTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Vercetti-Regular',
  },
  timeInfo: {
    gap: 8,
    marginTop: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3CD',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  statusText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  liveButton: {
    backgroundColor: '#FF4444',
  },
  buttonIcon: {
    marginRight: 4,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  rescheduleButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rescheduleButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  viewProfileButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  darkViewProfileButton: {
    backgroundColor: 'rgba(255, 127, 80, 0.2)',
  },
  viewProfileText: {
    color: '#FF7F50',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  darkViewProfileText: {
    color: '#FF7F50',
  },
  notesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
  },
  bookButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  timeSlots: {
    flexDirection: 'row',
  },
  timeSlot: {
    width: 100,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkTimeSlot: {
    backgroundColor: '#1e1e1e',
  },
  timeSlotDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  timeSlotDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  timeSlotTime: {
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  darkTimeSlotTime: {
    backgroundColor: 'rgba(255, 127, 80, 0.2)',
  },
  timeSlotTimeText: {
    fontSize: 12,
    color: '#FF7F50',
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  reviewButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reviewButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
});