import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CalendarDotsIcon, ClockIcon, BookOpenIcon } from 'phosphor-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useRouter } from 'expo-router';

interface StudySession {
  id: string;
  title: string;
  description: string;
  scheduledTime: Date;
  duration: number; // in minutes
  type: 'study' | 'meditation' | 'exercise' | 'journaling';
  completed: boolean;
}

export default function SessionsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Sample data for now
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    // TODO: Load from database
    const sampleSessions: StudySession[] = [
      {
        id: '1',
        title: 'Morning Meditation',
        description: 'Start your day with 10 minutes of mindfulness',
        scheduledTime: new Date(),
        duration: 10,
        type: 'meditation',
        completed: false,
      },
      {
        id: '2',
        title: 'Study Session',
        description: 'Focus time for coursework',
        scheduledTime: new Date(Date.now() + 3600000),
        duration: 45,
        type: 'study',
        completed: false,
      },
      {
        id: '3',
        title: 'Evening Journal',
        description: 'Reflect on your day',
        scheduledTime: new Date(Date.now() + 7200000),
        duration: 15,
        type: 'journaling',
        completed: false,
      },
    ];
    setSessions(sampleSessions);
    setRefreshing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTypeIcon = (type: StudySession['type']) => {
    switch (type) {
      case 'meditation':
        return 'leaf-outline';
      case 'study':
        return 'book-outline';
      case 'exercise':
        return 'fitness-outline';
      case 'journaling':
        return 'journal-outline';
      default:
        return 'time-outline';
    }
  };

  const getTypeColor = (type: StudySession['type']) => {
    switch (type) {
      case 'meditation':
        return '#A8B896';
      case 'study':
        return '#8ABADB';
      case 'exercise':
        return '#E89B8E';
      case 'journaling':
        return '#B8B3C8';
      default:
        return colors.primary;
    }
  };

  const handleStartSession = (session: StudySession) => {
    // Navigate to appropriate screen based on type
    switch (session.type) {
      case 'meditation':
        router.push('/BreathingExercise');
        break;
      case 'journaling':
        router.push('/journals');
        break;
      default:
        // Start a focus timer or show session details
        console.log('Starting session:', session.title);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>My Sessions</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.surface }]}
            onPress={() => console.log('Add session')}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today</Text>

          {sessions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <CalendarDotsIcon size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No sessions scheduled
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                Plan your day with study and wellness sessions
              </Text>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionCard, { backgroundColor: colors.card }]}
                  onPress={() => handleStartSession(session)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sessionIcon, { backgroundColor: `${getTypeColor(session.type)}20` }]}>
                    <Ionicons
                      name={getTypeIcon(session.type)}
                      size={24}
                      color={getTypeColor(session.type)}
                    />
                  </View>

                  <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionTitle, { color: colors.textPrimary }]}>
                      {session.title}
                    </Text>
                    <Text style={[styles.sessionDescription, { color: colors.textSecondary }]}>
                      {session.description}
                    </Text>
                    <View style={styles.sessionMeta}>
                      <View style={styles.metaItem}>
                        <ClockIcon size={14} color={colors.textTertiary} />
                        <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                          {formatTime(session.scheduledTime)}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <BookOpenIcon size={14} color={colors.textTertiary} />
                        <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                          {session.duration} min
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.startButton, { backgroundColor: getTypeColor(session.type) }]}
                    onPress={() => handleStartSession(session)}
                  >
                    <Text style={styles.startButtonText}>Start</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Start</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/BreathingExercise')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#A8B89620' }]}>
                <Ionicons name="leaf-outline" size={24} color="#A8B896" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>
                Breathe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/journals')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#B8B3C820' }]}>
                <Ionicons name="journal-outline" size={24} color="#B8B3C8" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>
                Journal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/library')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#8ABADB20' }]}>
                <Ionicons name="book-outline" size={24} color="#8ABADB" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>
                Library
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Vercetti-Regular',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'SF-Regular',
    textAlign: 'center',
    marginTop: 8,
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  sessionDescription: {
    fontSize: 14,
    fontFamily: 'SF-Regular',
    marginTop: 2,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'SF-Regular',
  },
  startButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
});