import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Animated,
  Easing,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoutine } from '@/contexts/RoutineContext';
import { ArrowLeft, ShareFat, DotsThree, Trophy, Flame, Rocket, Calendar, TrendUp } from 'phosphor-react-native';
import { format, subDays, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Path } from 'react-native-svg';
import StreakTimer from '@/components/StreakTimer';
import StreakShareWidget from '@/components/StreakShareWidget';
import { useTheme } from '@/hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define milestone days
const MILESTONE_DAYS = [7, 21, 30, 50, 100, 150, 200, 365];

export default function StreakDetailsScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const router = useRouter();
  const { getStreak, deleteStreak, updateStreak, breakStreak } = useRoutine();
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors, isDark } = useTheme();
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [shareModalVisible, setShareModalVisible] = useState(false);

  useEffect(() => {
    loadStreakData();

    // Set up periodic refresh every minute
    const refreshInterval = setInterval(() => {
      loadStreakData();
    }, 60000); // Refresh every minute

    return () => {
      clearInterval(refreshInterval);
    };
  }, [id]);

  const loadStreakData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const streakData = await getStreak(id);
      if (streakData) {
        setStreak(streakData);
        Animated.timing(progressAnim, {
          toValue: (streakData.currentStreak || 0) / 100,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
      setError('Could not load streak details');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakStreak = () => {
    Alert.alert(
      'Break Streak',
      'Are you sure you want to break this streak? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Break Streak',
          style: 'destructive',
          onPress: async () => {
            await breakStreak(id);
            await loadStreakData();
          }
        }
      ]
    );
  };

  const handleEditStreak = () => {
    router.push(`/edit-streak/${id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading streak details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity 
          style={{ 
            backgroundColor: colors.card,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
            marginHorizontal: 24,
            marginTop: 16,
          }}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = streak?.currentStreak || 0;
  const target = streak?.targetCount || 30;
  const percentage = Math.min(100, (progress / target) * 100);

  // Check if current streak day is a milestone
  const isMilestone = streak && MILESTONE_DAYS.includes(streak.currentStreak);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.textPrimary} weight="regular" />
        </TouchableOpacity>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShareModalVisible(true)}
          >
            <ShareFat size={24} color={colors.textPrimary} weight="regular" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleEditStreak}
          >
            <DotsThree size={24} color={colors.textPrimary} weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Milestone Badge - show only when streak reaches milestone */}
        {isMilestone && (
          <TouchableOpacity 
            style={styles.milestoneBadge}
            onPress={() => setShareModalVisible(true)}
          >
            <LinearGradient
              colors={[colors.success, colors.warning]}
              style={styles.milestoneBadgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.milestoneContent}>
                <Trophy size={28} color="#FFD700" weight="fill" />
                <View style={styles.milestoneTextContainer}>
                  <Text style={styles.milestoneTitle}>
                    {streak.currentStreak} Day Milestone!
                  </Text>
                  <Text style={styles.milestoneSubtitle}>
                    {getMilestoneText(streak.currentStreak)} Tap to share!
                  </Text>
                </View>
                <ShareFat size={24} color="#fff" weight="fill" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{streak?.title}</Text>
          <View style={[styles.typeBadge, { backgroundColor: streak?.type === 'break' ? colors.error : colors.success }]}>
            {streak?.type === 'break' ? (
              <Flame size={18} color="#fff" weight="fill" />
            ) : (
              <Rocket size={18} color="#fff" weight="fill" />
            )}
            <Text style={styles.typeBadgeText}>
              {streak?.type === 'break' ? 'Breaking Habit' : 'Building Habit'}
            </Text>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <View style={[styles.timerCard, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
            <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Time Elapsed</Text>
            <StreakTimer 
              startDate={streak?.startDate || ''} 
              startTime={streak?.startTime || ''} 
            />
            <Text style={[styles.streakCount, { color: colors.success }]}>
              {progress} days
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Svg width={SCREEN_WIDTH - 48} height={200} viewBox="0 0 300 200">
            <Path
              d="M 50,100 Q 150,0 250,100"
              stroke={colors.border}
              strokeWidth="2"
              fill="none"
            />
            <Path
              d="M 50,100 Q 150,0 250,100"
              stroke={colors.success}
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${percentage * 3} 300`}
            />
            <Circle
              cx={50 + (percentage * 2)}
              cy={100 - (percentage * 0.8)}
              r="8"
              fill={colors.success}
            />
          </Svg>
          
          <View style={styles.statsContainer}>
            <View style={[styles.statItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{progress}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{streak?.longestStreak || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Longest</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{target}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Target</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.sectionTitleRow}>
            <Calendar size={24} color={colors.success} weight="fill" />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About This Streak</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Started</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {format(parseISO(streak?.startDate), 'MMMM d, yyyy')}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: 'transparent' }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.infoValue, { color: colors.success }]}>
                  {streak?.status || 'Active'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {streak?.status === 'active' && (
          <View style={[styles.breakSection, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}>
            <Text style={[styles.breakSectionTitle, { color: colors.error }]}>
              Need to Break Your Streak?
            </Text>
            <Text style={[styles.breakSectionSubtitle, { color: colors.textSecondary }]}>
              This action cannot be undone. Make sure you're certain.
            </Text>
            <TouchableOpacity 
              style={[styles.breakButton, { backgroundColor: colors.error + '20' }]}
              onPress={handleBreakStreak}
            >
              <Text style={[styles.breakButtonText, { color: colors.error }]}>Break Streak</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Share Success Modal */}
      <Modal
        visible={shareModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <StreakShareWidget 
              streak={streak}
              onClose={() => setShareModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Helper function to get milestone text
function getMilestoneText(days: number): string {
  switch(days) {
    case 7: return "First week complete!";
    case 21: return "Habit forming point reached!";
    case 30: return "One month milestone!";
    case 50: return "Halfway to 100 days!";
    case 100: return "Triple digits achieved!";
    case 150: return "150 days of consistency!";
    case 200: return "200 day achievement!";
    case 365: return "One full year! Amazing!";
    default: return "Great achievement!";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  content: {
    padding: 24,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'Vercetti-Regular',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  breakSection: {
    marginTop: 32,
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  breakSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
  },
  breakSectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
  },
  breakButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  breakButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  infoSection: {
    marginBottom: 32,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
    fontFamily: 'Vercetti-Regular',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
    fontFamily: 'Vercetti-Regular',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  timerContainer: {
    marginBottom: 32,
  },
  timerCard: {
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  timerLabel: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
  },
  streakCount: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  milestoneBadge: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  milestoneBadgeGradient: {
    borderRadius: 20,
    padding: 3,
  },
  milestoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 17,
    padding: 16,
    gap: 12,
  },
  milestoneTextContainer: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 4,
  },
  milestoneSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Vercetti-Regular',
  },
});