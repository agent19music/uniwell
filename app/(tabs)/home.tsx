import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DotsThree, ArrowRight, Moon, Book, ChatCircle, Fire, Bell } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useMood, MoodType } from '../../contexts/MoodContext';
import { toast } from '../../lib/toast/toast';
import { useTheme } from '../../hooks/useTheme';
import { useWellnessScore } from '../../hooks/useWellnessScore';
import { LoadingIndicator } from '@rn-nui/loading-indicator';
import { Menu } from '../../components/Menu';
import { MoodCard } from '../../components/mood';
import { HeaderAction } from '@/components/ui/Navigation';
import { SafeText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';
import { spacing } from '@/constants/theme';


export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [savingReflection, setSavingReflection] = useState(false);

  // Menu states
  const [progressMenuVisible, setProgressMenuVisible] = useState(false);
  const [journalMenuVisible, setJournalMenuVisible] = useState(false);

  // Menu items
  const progressMenuItems = [
    { label: 'View Monthly Progress', icon: 'calendar-outline', onPress: () => router.push('/wellness-report') },
  ];

  const journalMenuItems = [
    { label: 'Record Voice Journal', icon: 'mic-outline', onPress: () => router.push('/journals') },
    { label: 'View All Journals', icon: 'book-outline', onPress: () => router.push('/journals') },
  ];

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
      recordMood: async () => { },
      loading: true
    };
  }

  const {
    recordMood,
    currentMood,
    todaysMoodRecorded,
    loading: moodLoading
  } = moodContext;

  const handleMoodSelection = async (moodId: MoodType, moodLabel: string) => {
    try {
      // Record the mood in our database
      await recordMood(moodId);

      // Show success toast
      toast.success('Mood Recorded', {
        message: `You're feeling ${moodLabel.toLowerCase()} today`,
        duration: 2000,
      });
    } catch (error) {
      toast.error('Error', {
        message: 'Failed to record your mood',
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
      toast.success('Reflection Saved', {
        message: 'Your daily reflection has been recorded',
        duration: 2000,
      });

      // Clear the input
      setReflectionText('');
    } catch (error) {
      console.error('Error saving reflection:', error);
      toast.error('Error', {
        message: 'Failed to save your reflection',
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
    router.push('/library?tab=saved');
  };

  const handleSleepCardPress = () => {
    router.push('/sleepstats');
  };

  const handleStreakCardPress = () => {
    router.push('/streak-visualization');
  };

  const handleChatCardPress = () => {
    router.push('/ChatUI');
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
      <View style={styles.sectionHeader}>
        <SafeText variant="title" style={styles.greeting}>
          Hello, {userName || 'Guest'}
        </SafeText>
        <Menu
          visible={journalMenuVisible}
          onDismiss={() => setJournalMenuVisible(false)}
          items={journalMenuItems}
          trigger={
            <IconButton accessibilityLabel="Journal options" onPress={() => setJournalMenuVisible(true)}>
              <DotsThree size={20} color={colors.text} weight="regular" />
            </IconButton>
          }
        />
      </View>
      <SafeText variant="heading" style={styles.reflectionHeading}>
        How do you feel about your current emotions?
      </SafeText>
      <Input
          label="Today’s reflection"
          placeholder="Your reflection.."
          value={reflectionText}
          onChangeText={setReflectionText}
          trailing={
            <IconButton
              accessibilityLabel="Save reflection"
              disabled={savingReflection || !reflectionText.trim()}
              onPress={handleReflectionSubmit}
              variant="ghost"
            >
              {savingReflection ? <LoadingIndicator size="small" /> : <ArrowRight size={20} color={colors.accent} weight="regular" />}
            </IconButton>
          }
        />
    </View>
  );

  // Render mood log section - now using MoodCard
  const renderMoodLog = () => (
    <MoodCard
      onMoodSelect={handleMoodSelection}
      onViewWeeklyReport={() => router.push('/mood-detail')}
      currentMood={currentMood}
      todaysMoodRecorded={todaysMoodRecorded}
    />
  );

  // Render wellness progress section
  const renderWellnessProgress = () => (
    <View style={styles.progressSection}>
      <View style={styles.sectionHeader}>
        <SafeText variant="heading">Your progress</SafeText>
        <Menu
          visible={progressMenuVisible}
          onDismiss={() => setProgressMenuVisible(false)}
          items={progressMenuItems}
          trigger={
            <IconButton accessibilityLabel="Progress options" onPress={() => setProgressMenuVisible(true)}>
              <DotsThree size={20} color={colors.text} weight="regular" />
            </IconButton>
          }
        />
      </View>
      <View style={styles.progressContent}>
        {wellnessLoading ? (
          <LoadingIndicator size="large" />
        ) : (
          <>
            <SafeText variant="display" style={styles.progressPercentage}>
              {wellnessScore}%
            </SafeText>
            <SafeText variant="caption" color={colors.textSecondary} style={styles.progressSubtitle}>
              Of the weekly plan completed
            </SafeText>
          </>
        )}
      </View>
    </View>
  );

  // Render home screen cards
  const renderHomeCards = () => (
    <View style={styles.cardsContainer}>
      {/* Sleep Card */}
      <Card
        style={styles.card}
        onPress={handleSleepCardPress}
        accessibilityLabel="Open sleep tracking"
      >
        <View style={styles.cardHeader}>
          <Moon size={24} color={colors.primary} weight="regular" />
          <SafeText variant="bodyStrong">Sleep</SafeText>
        </View>
        <SafeText variant="caption" color={colors.textSecondary}>Track your sleep patterns</SafeText>
      </Card>

      {/*Library Card */}
      <Card
        style={styles.card}
        onPress={handleLibraryPress}
        accessibilityLabel="Open library"
      >
        <View style={styles.cardHeader}>
          <Book size={24} color={colors.primary} weight="regular" />
          <SafeText variant="bodyStrong">Library</SafeText>
        </View>
        <SafeText variant="caption" color={colors.textSecondary}>Read and listen to articles</SafeText>
      </Card>

      {/* Chat Card */}
      <Card
        style={styles.card}
        onPress={handleChatCardPress}
        accessibilityLabel="Open chat"
      >
        <View style={styles.cardHeader}>
          <ChatCircle size={24} color={colors.primary} weight="regular" />
          <SafeText variant="bodyStrong">Chat</SafeText>
        </View>
        <SafeText variant="caption" color={colors.textSecondary}>Chat with your wellness companion</SafeText>
      </Card>

      {/* Streaks Card */}
      <Card
        style={styles.card}
        onPress={handleStreakCardPress}
        accessibilityLabel="Open streaks"
      >
        <View style={styles.cardHeader}>
          <Fire size={24} color={colors.primary} weight="regular" />
          <SafeText variant="bodyStrong">Streaks</SafeText>
        </View>
        <SafeText variant="caption" color={colors.textSecondary}>Track your progress</SafeText>
      </Card>
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
            <HeaderAction accessibilityLabel="Open preferences" onPress={handlePreferencesPress}>
              <Image
                source={{
                  uri: avatarUrl || 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png'
                }}
                style={styles.avatar}
              />
            </HeaderAction>
            <HeaderAction accessibilityLabel="Open notifications" onPress={handleNotificationsPress}>
              <Bell size={24} color={colors.textPrimary} weight="regular" />
            </HeaderAction>
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
  // Section styles (shared)
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
  // Wellness Progress Section
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.macro,
  },
  progressPercentage: {
    fontSize: 72,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
    flexShrink: 0,
  },
  progressSubtitle: {
    flexBasis: 128,
    flexGrow: 1,
    flexShrink: 1,
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
    marginBottom: 16,
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
});


