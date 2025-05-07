// StreakDetailScreen.js
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRoutine } from '../contexts/RoutineContext';
import { StreakCalendar } from '@/components/streakvisual/StreakCalendar';
import { StreakStatistics } from '@/components/streakvisual/StreakStatistics';

// Mock data for UI development
const mockStreak = {
  id: '1',
  title: 'Daily Meditation',
  color: '#007AFF',
  icon: 'leaf',
  currentStreak: 7,
  longestStreak: 14,
  targetCount: 30,
  notes: 'Remember to meditate for at least 10 minutes every morning. Focus on breathing and mindfulness.',
  type: 'build',
  status: 'active',
  startDate: '2024-05-01',
  lastCheckIn: '2024-05-07'
};

type RouteParams = {
  params: {
    streakId: string;
  };
};

const StreakDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const { streakId } = route.params;
  const { getStreak, isTodayCheckedIn, checkInStreak } = useRoutine();
  
  const streak = getStreak(streakId);
  const alreadyCheckedIn = isTodayCheckedIn(streakId);
  
  const handleCheckIn = () => {
    if (!alreadyCheckedIn) {
      checkInStreak(streakId);
    }
  };
  
  if (!streak) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFoundText}>Streak not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          
          <Text style={styles.title}>{mockStreak.title}</Text>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditStreak', { streakId })}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {/* Main Content */}
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={[styles.heroSection, { backgroundColor: mockStreak.color + '15' }]}>
            <View style={[styles.iconContainer, { backgroundColor: mockStreak.color + '30' }]}>
              <Ionicons name={mockStreak.icon} size={32} color={mockStreak.color} />
            </View>
            
            <Text style={styles.streakCount}>{mockStreak.currentStreak}</Text>
            <Text style={styles.streakLabel}>
              {mockStreak.currentStreak === 1 ? 'Day' : 'Days'} Streak
            </Text>
            
            <Text style={styles.targetText}>
              Target: {mockStreak.targetCount} days
            </Text>
            
            <TouchableOpacity
              style={[
                styles.checkInButton,
                alreadyCheckedIn ? styles.checkedInButton : {},
                { backgroundColor: alreadyCheckedIn ? '#DDDDDD' : mockStreak.color }
              ]}
              onPress={handleCheckIn}
              disabled={alreadyCheckedIn}
            >
              <Text style={styles.checkInText}>
                {alreadyCheckedIn ? 'Already Checked In Today' : 'Check In Today'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Calendar Section */}
          <StreakCalendar streakId={streakId} />
          
          {/* Statistics Section */}
          <StreakStatistics streakId={streakId} />
          
          {/* Notes Section (if streak has notes) */}
          {streak.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <View style={styles.notesContent}>
                <Text style={styles.notesText}>{streak.notes}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakCount: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 17,
    color: '#3C3C43',
    marginBottom: 8,
  },
  targetText: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 24,
  },
  checkInButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 16,
  },
  checkedInButton: {
    opacity: 0.7,
  },
  checkInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notesContainer: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  notesContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3C3C43',
  },
  notFoundText: {
    fontSize: 17,
    textAlign: 'center',
    marginTop: 24,
  },
  mockSection: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  mockContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  mockText: {
    color: '#8E8E93',
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
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
});

export default StreakDetailScreen;