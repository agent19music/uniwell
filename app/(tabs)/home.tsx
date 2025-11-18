import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useMood, MoodType } from '../../contexts/MoodContext';
import * as Burnt from 'burnt';
import { useTheme } from '../../hooks/useTheme';
import { useWellnessScore } from '../../hooks/useWellnessScore';
import { LoadingIndicator } from '@rn-nui/loading-indicator';


const MOOD_OPTIONS = [
  { id: 'happy', icon: '😊', label: 'Happy', color: '#F4D03F' },
  { id: 'calm', icon: '😌', label: 'Calm', color: '#A8B896' },
  { id: 'stressed', icon: '😠', label: 'Stressed', color: '#E89B8E' },
  { id: 'confident', icon: '😎', label: 'Confident', color: '#8ABADB' },
  { id: 'anxious', icon: '😟', label: 'Anxious', color: '#F0D5D8' },
  { id: 'tired', icon: '😴', label: 'Tired', color: '#B8B3C8' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [savingReflection, setSavingReflection] = useState(false);
  
  // Get wellness score
  const { score: wellnessScore, loading: wellnessLoading } = useWellnessScore();
  
  // Safely get mood context with null check
  let moodContext;
  try {
    moodContext = useMood();
  } catch (error) {
    console.log('MoodContext not available yet:', error);
    moodContext = {
      currentMood: null,
      todaysMoodRecorded: false,
      shouldPromptForMood: false,
      recordMood: async () => {},
      loading: true
    };
  }
  
  const { 
    recordMood,
    loading: moodLoading 
  } = moodContext;

  const handleMoodSelection = async (mood: typeof MOOD_OPTIONS[0]) => {
    try {
      // Record the mood in our database
      await recordMood(mood.id as MoodType);
      
      // Show success toast
      Burnt.toast({
        title: 'Mood Recorded',
        message: `You're feeling ${mood.label.toLowerCase()} today`,
        preset: 'done',
        duration: 2000,
        from: 'top',
        shouldDismissByDrag: true 
      });
    } catch (error) {
      Burnt.toast({
        title: 'Error',
        message: 'Failed to record your mood',
        preset: 'error',
        duration: 2000,
      });
    }
  };

  const handleReflectionSubmit = async () => {
    if (!reflectionText.trim()) {
      return;
    }

    try {
      setSavingReflection(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Save reflection as journal entry
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          entry_date: new Date().toISOString().split('T')[0],
          content: reflectionText,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Show success toast
      Burnt.toast({
        title: 'Reflection Saved',
        message: 'Your daily reflection has been recorded',
        preset: 'done',
        duration: 2000,
        from: 'top',
        shouldDismissByDrag: true 
      });

      // Clear the input
      setReflectionText('');
    } catch (error) {
      console.error('Error saving reflection:', error);
      Burnt.toast({
        title: 'Error',
        message: 'Failed to save your reflection',
        preset: 'error',
        duration: 2000,
      });
    } finally {
      setSavingReflection(false);
    }
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

  const handleSleepCardPress = () => {
    router.push('/sleepstats');
  };

  const handleStreakCardPress = () => {
    router.push('/streak-visualization');
  };

  const handleChatCardPress = () => {
    router.push('/chatUI');
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

  // Render daily reflection section
  const renderDailyReflection = () => (
    <View style={styles.reflectionSection}>
      <Text style={[styles.greeting, { color: colors.textPrimary }]}>
        Hello, {userName || 'Guest'} 
      </Text>
      <Text style={[styles.reflectionHeading, { color: colors.textPrimary }]}>
        How do you feel{'\n'}about your <Text style={styles.boldText}>current{'\n'}emotions</Text>?
      </Text>
      <View style={[styles.reflectionInputContainer, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
        <TextInput
          style={[styles.reflectionInput, { color: colors.textPrimary }]}
          placeholder="Your reflection.."
          placeholderTextColor={colors.textSecondary}
          value={reflectionText}
          onChangeText={setReflectionText}
          multiline={false}
        />
        <TouchableOpacity 
          onPress={handleReflectionSubmit}
          disabled={savingReflection || !reflectionText.trim()}
        >
          {savingReflection ? (
            <LoadingIndicator size="small" />
          ) : (
            <Ionicons 
              name="arrow-forward" 
              size={24} 
              color={colors.textPrimary} 
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render mood log section
  const renderMoodLog = () => (
    <View style={styles.moodLogSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Daily Mood Log
        </Text>
        <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
      </View>
      <View style={styles.moodOptionsContainer}>
        {MOOD_OPTIONS.map((mood) => (
          <TouchableOpacity 
            key={mood.id} 
            style={[styles.moodCircle, { backgroundColor: mood.color }]} 
            onPress={() => handleMoodSelection(mood)}
          >
            <Text style={styles.moodIcon}>{mood.icon}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render wellness progress section
  const renderWellnessProgress = () => (
    <View style={styles.progressSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Your progress
        </Text>
        <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
      </View>
      <View style={styles.progressContent}>
        {wellnessLoading ? (
          <LoadingIndicator size="large" />
        ) : (
          <>
            <Text style={[styles.progressPercentage, { color: colors.textPrimary }]}>
              {wellnessScore}%
            </Text>
            <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
              Of the weekly{'\n'}plan completed
            </Text>
          </>
        )}
      </View>
    </View>
  );

  // Render home screen cards
  const renderHomeCards = () => (
    <View style={styles.cardsContainer}>
      {/* Sleep Card */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]} 
        onPress={handleSleepCardPress}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="moon-outline" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Sleep</Text>
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Track your sleep patterns
        </Text>
      </TouchableOpacity>

      {/*Library Card */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]} 
        onPress={handleLibraryPress}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="book-outline" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Library</Text>
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Read and listen to articles
        </Text>
      </TouchableOpacity>

      {/* Chat Card */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]} 
        onPress={handleChatCardPress}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Chat</Text>
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Chat with your AI therapist
        </Text>
      </TouchableOpacity>

      {/* Streaks Card */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]} 
        onPress={handleStreakCardPress}
      >
        <View style={styles.cardHeader}>
          <Octicons name="flame" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Streaks</Text>
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Track your progress
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render decorative floating circles
  const renderDecorativeCircles = () => (
    <View style={styles.decorativeCircles}>
      <View style={[styles.circle, { bottom: 32, left: 32, width: 64, height: 64, backgroundColor: 'rgba(168, 184, 150, 0.3)' }]} />
      <View style={[styles.circle, { bottom: 96, left: 80, width: 48, height: 48, backgroundColor: 'rgba(255, 255, 255, 0.4)' }]} />
      <View style={[styles.circle, { bottom: 48, left: 128, width: 56, height: 56, backgroundColor: 'rgba(168, 184, 150, 0.2)' }]} />
      <View style={[styles.circle, { bottom: 80, left: 192, width: 40, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />
      <View style={[styles.circle, { bottom: 32, right: 128, width: 80, height: 80, backgroundColor: 'rgba(255, 255, 255, 0.5)' }]} />
      <View style={[styles.circle, { bottom: 64, right: 64, width: 56, height: 56, backgroundColor: 'rgba(168, 184, 150, 0.25)' }]} />
      <View style={[styles.circle, { bottom: 16, right: 32, width: 48, height: 48, backgroundColor: 'rgba(255, 255, 255, 0.4)' }]} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with profile and notifications */}
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
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Reflection Section */}
        {renderDailyReflection()}
        
        {/* Daily Mood Log */}
        {renderMoodLog()}
        
        {/* Wellness Progress */}
        {renderWellnessProgress()}
        
        {/* Cards Section */}
        {renderHomeCards()}
        
        {/* Decorative Circles */}
        {renderDecorativeCircles()}
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
    flexGrow: 1,
    paddingBottom: 200,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  // Daily Reflection Section
  reflectionSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 32,
  },
  greeting: {
    fontSize: 38,
    fontWeight: '400',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  reflectionHeading: {
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 24,
    fontFamily: 'Vercetti-Regular',
  },
  boldText: {
    fontWeight: 'bold',
  },
  reflectionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  reflectionInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
  },
  // Mood Log Section
  moodLogSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  moodOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodIcon: {
    fontSize: 32,
  },
  // Wellness Progress Section
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressPercentage: {
    fontSize: 72,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
  },
  progressSubtitle: {
    fontSize: 14,
    textAlign: 'right',
    marginTop: 16,
    fontFamily: 'Vercetti-Regular',
  },
  // Cards Section
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 100,
  },
  card: {
    width: '48%',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Vercetti-Regular',
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Vercetti-Regular',
  },
  // Decorative Circles
  decorativeCircles: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 192,
    pointerEvents: 'none',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
});


