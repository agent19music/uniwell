import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const UPCOMING_SESSIONS = [
  {
    id: 1,
    therapist: {
      name: 'Sahana V',
      title: 'MSc in Clinical Psychology',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop',
    },
    date: '31st March 22',
    time: '7:30 PM - 8:30 PM',
    status: 'upcoming',
  },
  {
    id: 2,
    therapist: {
      name: 'Dr. Michael Chen',
      title: 'PhD in Psychology',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop',
    },
    date: '2nd April 22',
    time: '3:00 PM - 4:00 PM',
    status: 'scheduled',
  },
];

export default function SessionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.darkText]}>Upcoming Session</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={20} color={isDark ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
        </View>

        <View style={styles.sessionsList}>
          {UPCOMING_SESSIONS.map((session) => (
            <View key={session.id} style={[styles.sessionCard, isDark && styles.darkCard]}>
              <View style={styles.therapistInfo}>
                <Image source={{ uri: session.therapist.image }} style={styles.therapistImage} />
                <View style={styles.sessionInfo}>
                  <Text style={[styles.therapistName, isDark && styles.darkText]}>{session.therapist.name}</Text>
                  <Text style={[styles.therapistTitle, isDark && styles.darkSubText]}>{session.therapist.title}</Text>
                  <View style={styles.timeInfo}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Ionicons name="calendar-outline" size={16} color={isDark ? '#aaaaaa' : '#666666'} />
                    <Text style={[styles.timeText, isDark && styles.darkSubText]}>{session.date}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Ionicons name="time-outline" size={16} color={isDark ? '#aaaaaa' : '#666666'} />
                    <Text style={[styles.timeText, isDark && styles.darkSubText]}>{session.time}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.actionButtons}>
                {session.status === 'upcoming' ? (
                  <TouchableOpacity style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>Join Now</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.rescheduleButton}>
                    <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.viewProfileButton, isDark && styles.darkViewProfileButton]}>
                  <Text style={[styles.viewProfileText, isDark && styles.darkViewProfileText]}>View Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

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
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  therapistInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  therapistImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sessionInfo: {
    flex: 1,
  },
  therapistName: {
    fontSize: 16,
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
  flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rescheduleButtonText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  viewProfileButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  darkViewProfileButton: {
    backgroundColor: 'rgba(255, 127, 80, 0.2)',
  },
  viewProfileText: {
    color: '#FF7F50',
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  darkViewProfileText: {
    color: '#FF7F50',
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
});