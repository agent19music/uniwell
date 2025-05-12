import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Image, useWindowDimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Entypo, Octicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useMood, MoodType } from '../../contexts/MoodContext';
import * as burnt from 'burnt';

const MOOD_OPTIONS = [
  { id: 'happy', icon: '😊', label: 'Happy', color: '#FF69B4' },
  { id: 'calm', icon: '😌', label: 'Calm', color: '#8A8AFF' },
  { id: 'stressed', icon: '😵‍💫', label: 'Stressed', color: '#7FFFD4' },
  { id: 'angry', icon: '😠', label: 'Angry', color: '#FFA07A' },
  { id: 'sad', icon: '😢', label: 'Sad', color: '#98FB98' },
];

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { height } = useWindowDimensions();
  const [userName, setUserName] = useState('');
  const [scaleValue] = useState(new Animated.Value(1));
  const [colorValue] = useState(new Animated.Value(0));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const { 
    currentMood, 
    todaysMoodRecorded, 
    shouldPromptForMood, 
    recordMood 
  } = useMood();

  const handleMoodSelection = async (mood: typeof MOOD_OPTIONS[0]) => {
    // Animated selection logic
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1.1,
        friction: 3,
        useNativeDriver: true
      }),
      Animated.timing(colorValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false
      })
    ]).start(async () => {
      try {
        // Record the mood in our database
        await recordMood(mood.id as MoodType);
        
        // Show success toast
        burnt.toast({
          title: 'Mood Recorded',
          message: `You're feeling ${mood.label.toLowerCase()} today`,
          preset: 'done',
          duration: 2,
        });
        
        // Navigate to mood visualization
        router.push(`/mood-detail?mood=${mood.id}`);
      } catch (error) {
        burnt.toast({
          title: 'Error',
          message: 'Failed to record your mood',
          preset: 'error',
          duration: 2,
        });
      }
    });
  };

  const handleJournalPress = () => {
    router.push('/journals');
  };
  
  const handlePreferencesPress = () => {
    router.push('/preferences');
  };
  
  const handleNotificationsPress = () => {
    router.push('/notifications');
  };

  const handleLibraryPress = () => {
    router.push('/library');
  };
  
  const handleViewMoodHistory = () => {
    router.push('/mood-detail?view=history');
  };

  const handleSleepCardPress = () => {
    router.push('/sleepstats');
  };

  const handleTimetableCardPress = () => {
    router.push('/schedule');
  };

  const handleAddRoutine = () => {
    router.push('/AddRoutineScreen');
  };

  const handleAddStreak = () => {
    router.push('/AddStreakScreen');
  };
  const handleStreakCardPress = () => {
    router.push('/streak-visualization');
  };

  const handleChatCardPress = () => {
    router.push('/chatUI');
  };

  const handleTherapistDashboardPress = () => {
    router.push('/therapistdashboard');
  };

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get first name
        if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name.split(' ')[0]);
        }
        
        // Get profile data including avatar
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
          
        if (!error && profileData) {
          setAvatarUrl(profileData.avatar_url);
        }
      }
    }
    getUserData();
  }, []);

  const renderMoodPrompt = () => (
    <>
      <Text style={[styles.question, isDark && styles.darkSubText]}>
        How are you feeling today?
      </Text>
      <View style={styles.moodContainer}>
        {MOOD_OPTIONS.map((mood) => (
          <TouchableOpacity 
            key={mood.id} 
            style={[styles.moodOption, { backgroundColor: mood.color + '20' }]} 
            onPress={() => handleMoodSelection(mood)}
          >
            <Text style={styles.moodEmoji}>{mood.icon}</Text>
            <Text style={[styles.moodLabel, isDark && styles.darkText]}>{mood.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderCurrentMood = () => {
    if (!currentMood) return null;
    
    const selectedMood = MOOD_OPTIONS.find(m => m.id === currentMood.moodType);
    if (!selectedMood) return null;
    
    return (
      <View style={styles.currentMoodContainer}>
        <View style={styles.currentMoodHeader}>
          <Text style={[styles.currentMoodTitle, isDark && styles.darkText]}>
            Today's Mood
          </Text>
          <TouchableOpacity onPress={handleViewMoodHistory}>
            <Text style={styles.viewHistoryText}>View History</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[
          styles.currentMoodCard, 
          { backgroundColor: selectedMood.color + '30' }
        ]}>
          <Text style={styles.currentMoodEmoji}>{selectedMood.icon}</Text>
          <View style={styles.currentMoodContent}>
            <Text style={[styles.currentMoodLabel, isDark && styles.darkText]}>
              {selectedMood.label}
            </Text>
            <Text style={[styles.currentMoodTime, isDark && styles.darkSubText]}>
              Recorded at {new Date(currentMood.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
        </View>
        
        {renderMoodMessage(currentMood.moodType)}
      </View>
    );
  };
  
  const renderMoodMessage = (moodType: MoodType) => {
    let message = '';
    
    switch(moodType) {
      case 'happy':
        message = "That's wonderful! Your positive energy can brighten everyone's day. What made you happy today?";
        break;
      case 'calm':
        message = "It's great that you're feeling balanced. This is a perfect state for reflection and mindfulness.";
        break;
      case 'stressed':
        message = "I notice you're feeling stressed. Remember to take deep breaths and consider what you can control right now.";
        break;
      case 'angry':
        message = "It's okay to feel angry sometimes. Consider journaling about what triggered this feeling.";
        break;
      case 'sad':
        message = "I'm sorry you're feeling down today. Remember that all emotions are temporary and it's okay to not be okay.";
        break;
    }
    
    return (
      <View style={[styles.moodMessageCard, isDark && styles.darkMoodMessageCard]}>
        <Text style={[styles.moodMessage, isDark && styles.darkText]}>{message}</Text>
        <TouchableOpacity 
          style={styles.journalButton}
          onPress={handleJournalPress}
        >
          <Text style={styles.journalButtonText}>Write in Journal</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render home screen cards
  const renderHomeCards = () => (
    <View style={styles.cardsContainer}>
      {/* Sleep Card */}
      <TouchableOpacity 
        style={[styles.card, isDark && styles.darkCard]} 
        onPress={handleSleepCardPress}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="moon-outline" size={24} color="#FF7F50" />
          <Text style={[styles.cardTitle, isDark && styles.darkText]}>Sleep</Text>
        </View>
        <Text style={[styles.cardSubtitle, isDark && styles.darkSubText]}>
          Track your sleep patterns
        </Text>
      </TouchableOpacity>

      {/*Library Card */}
      <TouchableOpacity 
        style={[styles.card, isDark && styles.darkCard]} 
        onPress={handleLibraryPress}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="book-outline" size={24} color="#FF7F50" />
          <Text style={[styles.cardTitle, isDark && styles.darkText]}>Library</Text>
        </View>
        <Text style={[styles.cardSubtitle, isDark && styles.darkSubText]}>
          Read and listen to articles
        </Text>
      </TouchableOpacity>

      {/* Chat Card */}
      <TouchableOpacity 
        style={[styles.card, isDark && styles.darkCard]} 
        onPress={handleChatCardPress}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="chatbubble-outline" size={24} color="#FF7F50" />
          <Text style={[styles.cardTitle, isDark && styles.darkText]}>Chat</Text>
        </View>
        <Text style={[styles.cardSubtitle, isDark && styles.darkSubText]}>
          Chat with your AI therapist
        </Text>
      </TouchableOpacity>

      {/* Therapist Dashboard Card */}
      <TouchableOpacity 
        style={[styles.card, isDark && styles.darkCard]} 
        onPress={handleTherapistDashboardPress}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={24} color="#FF7F50" />
          <Text style={[styles.cardTitle, isDark && styles.darkText]}>Therapist</Text>
        </View>
        <Text style={[styles.cardSubtitle, isDark && styles.darkSubText]}>
          Open therapist dashboard
        </Text>
      </TouchableOpacity>

      {/* Streaks Card */}
      <TouchableOpacity 
        style={[styles.card, isDark && styles.darkCard]} 
        onPress={handleStreakCardPress}
      >
        <View style={styles.cardHeader}>
          <Octicons name="flame" size={24} color="#FF7F50" />
          <Text style={[styles.cardTitle, isDark && styles.darkText]}>Streaks</Text>
        </View>
        <Text style={[styles.cardSubtitle, isDark && styles.darkSubText]}>
          Track your progress
        </Text>
      </TouchableOpacity>
    </View>
  );

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: height - 60 } // Subtract tab bar height
        ]}>
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <TouchableOpacity onPress={handlePreferencesPress}>
              <Image
                source={{ 
                  uri: avatarUrl || 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png' 
                }}
                style={styles.avatar}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNotificationsPress}>
              <View style={styles.notificationIcon}>
                <Ionicons name="notifications-outline" size={24} color={isDark ? '#ffffff' : '#000000'} />
                <View style={styles.notificationBadge} />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={[styles.greeting, isDark && styles.darkText]}>
            Good {getTimeOfDay()},{'\n'}{userName || 'Guest'}
          </Text>
          
          {shouldPromptForMood ? renderMoodPrompt() : renderCurrentMood()}
          
          {renderHomeCards()}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    padding: 20,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF7F50',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 16,
    fontFamily: 'Vercetti-Regular',
  },
  question: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  moodOption: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 63,
    height: 63,
    borderRadius: 16,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  currentMoodContainer: {
    marginBottom: 24,
  },
  currentMoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentMoodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  viewHistoryText: {
    fontSize: 14,
    color: '#FF7F50',
    fontFamily: 'Vercetti-Regular',
  },
  currentMoodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  currentMoodEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  currentMoodContent: {
    flex: 1,
  },
  currentMoodLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  currentMoodTime: {
    fontSize: 14,
    color: '#666',
  },
  moodMessageCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkMoodMessageCard: {
    backgroundColor: '#1e1e1e',
  },
  moodMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 16,
  },
  journalButton: {
    backgroundColor: '#FF7F50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  journalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    fontFamily: 'Vercetti-Regular',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  }
});

