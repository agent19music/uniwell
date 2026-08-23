import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Modal, Share, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { MoonStars, Star, Target, TrendUp, TrendDown, Minus, CalendarCheck, ClockCountdown, ShieldCheck, ThumbsUp, WarningCircle, Warning, ArrowsClockwise, Info, ChartBar, X, Lightbulb, Export, Calendar, ArrowLeft, Gear } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import FloatingActionButton from '../components/FloatingActionButton';
import SleepEntryModal from '../modals/SleepEntryModal';
import { SleepGoal, SleepData, SleepStats, WeeklySleepData } from '../lib/services/sleepService';
import { 
  addSleepEntry, 
  getWeeklySleepChartData, 
  getMonthSleepData, 
  calculateSleepStats, 
  getActiveSleepGoal,
  getSleepInsights,
  setSleepGoal
} from '../lib/services/sleepService';
import { GlowingSleepChart } from '@/components/charts';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTheme } from '@/hooks/useTheme';

// Bento detail configurations
interface BentoDetail {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  description: string;
  icon: string;
  iconColor: string;
  tip: string;
  shareText: string;
}

// Dummy data for aesthetic testing
const DUMMY_WEEKLY_DATA: WeeklySleepData[] = [
  { day: 'Mon', hours: 7.5, quality: 8, goalAchieved: true },
  { day: 'Tue', hours: 6.2, quality: 6, goalAchieved: false },
  { day: 'Wed', hours: 8.1, quality: 9, goalAchieved: true },
  { day: 'Thu', hours: 5.8, quality: 5, goalAchieved: false },
  { day: 'Fri', hours: 7.0, quality: 7, goalAchieved: false },
  { day: 'Sat', hours: 9.2, quality: 9, goalAchieved: true },
  { day: 'Sun', hours: 8.0, quality: 8, goalAchieved: true },
];

const DUMMY_SLEEP_STATS: SleepStats = {
  averageHours: 7.4,
  averageQuality: 7.4,
  consistencyScore: 72,
  sleepDebt: 2.5,
  trend: 'improving' as const,
  goalAchievement: 57,
};

const DUMMY_INSIGHTS = [
  "Your best sleep was on Saturday with 9.2 hours",
  "You tend to sleep better on weekends",
  "Consider going to bed 30 minutes earlier on weekdays",
];

const USE_DUMMY_DATA = true; // Toggle for aesthetic testing

interface SleepAdvice {
  status: string;
  message: string;
  color: string;
  icon: string;
}

const SLEEP_ADVICE_POOL = [
  {
    condition: (stats: SleepStats) => stats.averageHours >= 8 && stats.consistencyScore >= 80,
    advice: {
      status: "Excellent",
      message: "You're maintaining superb sleep habits, with optimal duration and consistency. This greatly benefits your cognitive function and overall health.",
      color: "#4CAF50",
      icon: "shield-checkmark"
    }
  },
  {
    condition: (stats: SleepStats) => stats.averageHours >= 7 && stats.averageHours < 8 && stats.consistencyScore >= 70,
    advice: {
      status: "Very Good",
      message: "Your sleep pattern is very good. A slight increase in sleep duration could optimize your recovery and enhance your daily energy levels.",
      color: "#8BC34A",
      icon: "thumbs-up"
    }
  },
  {
    condition: (stats: SleepStats) => stats.averageHours >= 6.5 && stats.averageHours < 7 && stats.consistencyScore >= 60,
    advice: {
      status: "Good",
      message: "You're doing well, but could benefit from more sleep. Aim for 7-9 hours per night to improve cognitive performance and mood regulation.",
      color: "#CDDC39",
      icon: "trending-up"
    }
  },
  {
    condition: (stats: SleepStats) => stats.averageHours >= 6 && stats.averageHours < 6.5,
    advice: {
      status: "Fair",
      message: "Your sleep duration is below recommended levels. Adding just 30-60 minutes more sleep could significantly improve your health outcomes.",
      color: "#FFC107",
      icon: "alert-circle"
    }
  },
  {
    condition: (stats: SleepStats) => stats.averageHours < 6 && stats.sleepDebt > 10,
    advice: {
      status: "Concern",
      message: "You have significant sleep debt. Chronic insufficient sleep increases risk for serious health conditions. Prioritize sleep for your wellbeing.",
      color: "#FF5722",
      icon: "warning"
    }
  },
  {
    condition: (stats: SleepStats) => stats.consistencyScore < 50,
    advice: {
      status: "Inconsistent",
      message: "Your sleep schedule is irregular. Even with adequate total sleep, inconsistency disrupts your circadian rhythm. Try maintaining regular sleep times.",
      color: "#FF9800",
      icon: "sync-problem"
    }
  },
  {
    condition: (stats: SleepStats) => stats.trend === 'improving',
    advice: {
      status: "Improving",
      message: "Your sleep pattern is showing positive improvement. Keep up the good work and continue building these healthy sleep habits.",
      color: "#4CAF50",
      icon: "trending-up"
    }
  },
  {
    condition: (stats: SleepStats) => stats.trend === 'declining',
    advice: {
      status: "Declining",
      message: "Your sleep quality has been declining. Consider factors that might be affecting your sleep and make adjustments to your sleep routine.",
      color: "#F44336",
      icon: "trending-down"
    }
  }
];

const getSleepIcon = (icon: string, size: number, color: string) => {
  switch (icon) {
    case 'sleep': return <MoonStars size={size} color={color} weight="regular" />;
    case 'star': return <Star size={size} color={color} weight="regular" />;
    case 'target': return <Target size={size} color={color} weight="regular" />;
    case 'trending-up': return <TrendUp size={size} color={color} weight="regular" />;
    case 'trending-down': return <TrendDown size={size} color={color} weight="regular" />;
    case 'minus': return <Minus size={size} color={color} weight="regular" />;
    case 'calendar-check': return <CalendarCheck size={size} color={color} weight="regular" />;
    case 'clock-alert-outline': return <ClockCountdown size={size} color={color} weight="regular" />;
    case 'shield-checkmark': return <ShieldCheck size={size} color={color} weight="regular" />;
    case 'thumbs-up': return <ThumbsUp size={size} color={color} weight="regular" />;
    case 'alert-circle': return <WarningCircle size={size} color={color} weight="regular" />;
    case 'warning': return <Warning size={size} color={color} weight="regular" />;
    case 'sync-problem': return <ArrowsClockwise size={size} color={color} weight="regular" />;
    case 'information-circle': return <Info size={size} color={color} weight="regular" />;
    case 'analytics': return <ChartBar size={size} color={color} weight="regular" />;
    default: return <MoonStars size={size} color={color} weight="regular" />;
  }
};

export default function SleepStatsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<WeeklySleepData[]>([]);
  const [sleepStats, setSleepStats] = useState<SleepStats | null>(null);
  const [sleepGoal, setSleepGoalState] = useState<SleepGoal | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedBento, setSelectedBento] = useState<BentoDetail | null>(null);
  const [bentoModalVisible, setBentoModalVisible] = useState(false);
  
  // Screen dimensions for responsive design
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (USE_DUMMY_DATA) {
        // Use dummy data for aesthetic testing
        setChartData(DUMMY_WEEKLY_DATA);
        setSleepStats(DUMMY_SLEEP_STATS);
        setSleepGoalState({ target_hours: 8, is_active: true } as SleepGoal);
        setInsights(DUMMY_INSIGHTS);
      } else {
        // Get sleep chart data
        const { data: weekData, error: weekError } = await getWeeklySleepChartData();
        if (weekError) throw weekError;
        if (weekData) setChartData(weekData);
        
        // Get sleep statistics
        const { data: statsData, error: statsError } = await calculateSleepStats();
        if (statsError) throw statsError;
        if (statsData) setSleepStats(statsData);
        
        // Get sleep goal
        const { data: goalData, error: goalError } = await getActiveSleepGoal();
        if (goalError) throw goalError;
        setSleepGoalState(goalData);
        
        // Get insights
        const { data: insightsData, error: insightsError } = await getSleepInsights('weekly');
        if (insightsError) throw insightsError;
        if (insightsData) {
          setInsights(insightsData.map(insight => insight.insight_text));
        }
      }
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      setLoadError('We could not refresh your sleep data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchData();
      
      return () => {
        // Cleanup if needed
      };
    }, [fetchData])
  );

  const getSleepAdvice = (stats: SleepStats): SleepAdvice => {
    // If we don't have enough data, show basic advice
    if (!stats || stats.averageHours === 0) {
      return {
        status: "No Data",
        message: "Start tracking your sleep to get personalized insights and recommendations.",
        color: "#9E9E9E",
        icon: "information-circle"
      };
    }
    
    // Find the first matching advice from the pool
    const adviceMatch = SLEEP_ADVICE_POOL.find(item => item.condition(stats));
    
    // Default advice if no conditions match
    if (!adviceMatch) {
      return {
        status: "Analyzing",
        message: "Continue tracking your sleep for more personalized insights and recommendations.",
        color: "#2196F3",
        icon: "analytics"
      };
    }
    
    return adviceMatch.advice;
  };

  const handleAddSleepEntry = async (sleepData: SleepData) => {
    try {
      const { error } = await addSleepEntry(sleepData);
      if (error) throw error;
      
      setIsModalVisible(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error adding sleep entry:', error);
    }
  };

  // Set a sleep goal (for demo purposes)
  const handleSetSleepGoal = async () => {
    try {
      const goal: SleepGoal = {
        target_hours: 8,
        target_bedtime: '22:30:00',
        target_wake_time: '06:30:00',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        is_active: true
      };
      
      const { error } = await setSleepGoal(goal);
      if (error) throw error;
      
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error setting sleep goal:', error);
    }
  };

  const sleepAdvice = useMemo(() => {
    return getSleepAdvice(sleepStats as SleepStats);
  }, [sleepStats]);

  // Prepare chart data for GlowingSleepChart
  const prepareGlowingChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    return chartData.map(d => ({
      label: d.day,
      hours: d.hours,
      quality: d.quality,
      goalAchieved: d.goalAchieved,
    }));
  }, [chartData]);

  const renderWeeklyChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <Text style={[styles.emptyChartText, isDark && styles.darkText]}>
            No sleep data available for this week.
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.glowingChartContainer, isDark && styles.darkCard]}>
        <GlowingSleepChart
          data={prepareGlowingChartData}
          chartType="duration"
          targetHours={sleepGoal?.target_hours || 8}
          height={220}
          showTargetLine={true}
          showArea={true}
          showGrid={true}
          showDots={true}
        />
      </View>
    );
  };

  const renderSleepQualityChart = () => {
    if (!chartData || chartData.length === 0) {
      return null;
    }

    return (
      <View style={[styles.glowingChartContainer, isDark && styles.darkCard]}>
        <GlowingSleepChart
          data={prepareGlowingChartData}
          chartType="quality"
          height={180}
          showTargetLine={false}
          showArea={true}
          showGrid={true}
          showDots={true}
        />
      </View>
    );
  };

  // Generate bento details based on current stats
  const getBentoDetails = useCallback((): Record<string, BentoDetail> => {
    if (!sleepStats) return {};
    
    return {
      avgSleep: {
        id: 'avgSleep',
        title: 'Average Sleep',
        value: `${sleepStats.averageHours.toFixed(1)}h`,
        subtitle: 'per night this week',
        description: `You've been averaging ${sleepStats.averageHours.toFixed(1)} hours of sleep per night. ${sleepStats.averageHours >= 7 ? 'This is within the recommended 7-9 hours for adults.' : 'Adults typically need 7-9 hours for optimal health.'}`,
        icon: 'sleep',
        iconColor: '#A8B896',
        tip: sleepStats.averageHours < 7 ? 'Try going to bed 30 minutes earlier tonight.' : 'Keep up the great sleep schedule!',
        shareText: `🌙 My weekly sleep average: ${sleepStats.averageHours.toFixed(1)} hours/night #UniWell #SleepHealth`,
      },
      quality: {
        id: 'quality',
        title: 'Sleep Quality',
        value: `${sleepStats.averageQuality.toFixed(1)}/10`,
        subtitle: 'average quality score',
        description: `Your sleep quality score is ${sleepStats.averageQuality.toFixed(1)} out of 10. ${sleepStats.averageQuality >= 7 ? 'Excellent! You\'re getting restorative sleep.' : 'There\'s room for improvement in your sleep quality.'}`,
        icon: 'star',
        iconColor: '#B8A3C8',
        tip: 'Avoid screens 1 hour before bed to improve sleep quality.',
        shareText: `⭐ My sleep quality score: ${sleepStats.averageQuality.toFixed(1)}/10 #UniWell #SleepHealth`,
      },
      goalMet: {
        id: 'goalMet',
        title: 'Goal Achievement',
        value: `${sleepStats.goalAchievement.toFixed(0)}%`,
        subtitle: 'of nights hit target',
        description: `You met your sleep goal on ${sleepStats.goalAchievement.toFixed(0)}% of nights this week. ${sleepStats.goalAchievement >= 70 ? 'Great consistency!' : 'Let\'s work on hitting that target more often.'}`,
        icon: 'target',
        iconColor: '#6b8e5e',
        tip: 'Set a bedtime alarm to remind you when it\'s time to wind down.',
        shareText: `🎯 Hit my sleep goal ${sleepStats.goalAchievement.toFixed(0)}% of the week! #UniWell #SleepGoals`,
      },
      trend: {
        id: 'trend',
        title: 'Sleep Trend',
        value: sleepStats.trend.charAt(0).toUpperCase() + sleepStats.trend.slice(1),
        subtitle: 'compared to last week',
        description: `Your sleep pattern is ${sleepStats.trend}. ${sleepStats.trend === 'improving' ? 'Your healthy habits are paying off!' : sleepStats.trend === 'declining' ? 'Consider what might be affecting your sleep recently.' : 'Your sleep has been steady.'}`,
        icon: sleepStats.trend === 'improving' ? 'trending-up' : sleepStats.trend === 'declining' ? 'trending-down' : 'minus',
        iconColor: sleepStats.trend === 'improving' ? '#6b8e5e' : sleepStats.trend === 'declining' ? '#E89B8E' : '#9E9289',
        tip: 'Consistency is key - try to sleep and wake at the same time daily.',
        shareText: `📈 My sleep trend is ${sleepStats.trend}! #UniWell #SleepHealth`,
      },
      consistency: {
        id: 'consistency',
        title: 'Consistency Score',
        value: `${sleepStats.consistencyScore.toFixed(0)}`,
        subtitle: 'out of 100',
        description: `Your sleep consistency score is ${sleepStats.consistencyScore.toFixed(0)}/100. ${sleepStats.consistencyScore >= 80 ? 'Your circadian rhythm loves you!' : 'A more regular schedule would benefit your body clock.'}`,
        icon: 'calendar-check',
        iconColor: '#A8B896',
        tip: 'Even on weekends, try to stay within 1 hour of your weekday schedule.',
        shareText: `📅 Sleep consistency: ${sleepStats.consistencyScore.toFixed(0)}/100 #UniWell #SleepHealth`,
      },
      debt: {
        id: 'debt',
        title: 'Sleep Debt',
        value: `${sleepStats.sleepDebt.toFixed(1)}h`,
        subtitle: 'accumulated this week',
        description: `You have ${sleepStats.sleepDebt.toFixed(1)} hours of sleep debt. ${sleepStats.sleepDebt <= 2 ? 'This is manageable!' : 'Consider catching up with an earlier bedtime rather than sleeping in.'}`,
        icon: 'clock-alert-outline',
        iconColor: sleepStats.sleepDebt > 5 ? '#E89B8E' : '#9E9289',
        tip: 'Repay sleep debt gradually - add 15-30 minutes per night.',
        shareText: `😴 Working on reducing my ${sleepStats.sleepDebt.toFixed(1)}h sleep debt #UniWell #SleepHealth`,
      },
    };
  }, [sleepStats]);

  const handleBentoPress = (bentoId: string) => {
    const details = getBentoDetails();
    if (details[bentoId]) {
      setSelectedBento(details[bentoId]);
      setBentoModalVisible(true);
    }
  };

  const handleShare = async () => {
    if (!selectedBento) return;
    try {
      await Share.share({
        message: selectedBento.shareText,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShareWeekly = async () => {
    if (!sleepStats) return;
    try {
      const weeklyMessage = `🌙 My UniWell Sleep Report\n\n` +
        `⏰ Average: ${sleepStats.averageHours.toFixed(1)}h/night\n` +
        `⭐ Quality: ${sleepStats.averageQuality.toFixed(1)}/10\n` +
        `🎯 Goal Met: ${sleepStats.goalAchievement.toFixed(0)}%\n` +
        `📈 Trend: ${sleepStats.trend}\n` +
        `📅 Consistency: ${sleepStats.consistencyScore.toFixed(0)}/100\n\n` +
        `#UniWell #SleepHealth #Wellness`;
      
      await Share.share({ message: weeklyMessage });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderBentoModal = () => (
    <Modal
      visible={bentoModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setBentoModalVisible(false)}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setBentoModalVisible(false)}
      >
        <Pressable style={[styles.modalContent, isDark && styles.darkCard]}>
          {selectedBento && (
            <>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={[styles.modalIconContainer, { backgroundColor: `${selectedBento.iconColor}20` }]}>
                  {getSleepIcon(selectedBento.icon, 28, selectedBento.iconColor)}
                </View>
                <TouchableOpacity 
                  onPress={() => setBentoModalVisible(false)}
                  style={styles.modalClose}
                >
                  <X size={24} color={isDark ? '#aaa' : '#666'} weight="regular" />
                </TouchableOpacity>
              </View>

              {/* Value */}
              <Text style={[styles.modalTitle, isDark && styles.darkText]}>
                {selectedBento.title}
              </Text>
              <Text style={[styles.modalValue, { color: selectedBento.iconColor }]}>
                {selectedBento.value}
              </Text>
              <Text style={[styles.modalSubtitle, isDark && styles.darkSubText]}>
                {selectedBento.subtitle}
              </Text>

              {/* Description */}
              <Text style={[styles.modalDescription, isDark && styles.darkSubText]}>
                {selectedBento.description}
              </Text>

              {/* Tip */}
              <View style={[styles.tipContainer, { backgroundColor: `${selectedBento.iconColor}15` }]}>
                <Lightbulb size={18} color={selectedBento.iconColor} weight="regular" />
                <Text style={[styles.tipText, { color: selectedBento.iconColor }]}>
                  {selectedBento.tip}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.shareButton, { backgroundColor: selectedBento.iconColor }]}
                  onPress={handleShare}
                >
                  <Export size={18} color="#fff" weight="regular" />
                  <Text style={styles.shareButtonText}>Share Stat</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.shareWeeklyButton}
                  onPress={handleShareWeekly}
                >
                  <Calendar size={18} color={isDark ? '#fff' : '#333'} weight="regular" />
                  <Text style={[styles.shareWeeklyText, isDark && styles.darkText]}>Weekly Report</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderQuickStats = () => {
    if (!sleepStats) return null;

    return (
      <View style={styles.bentoGrid}>
        {/* Hero bento - Average Sleep */}
        <TouchableOpacity 
          style={[
            styles.bentoHero, 
            isDark && styles.darkCard,
            { borderWidth: 1, borderColor: 'rgba(168, 184, 150, 0.2)' }
          ]}
          onPress={() => handleBentoPress('avgSleep')}
          activeOpacity={0.8}
        >
          {/* Static glow accent */}
          <View style={[styles.glowAccent, { backgroundColor: 'rgba(168, 184, 150, 0.06)' }]} />
          <View style={styles.bentoHeroContent}>
            <View style={styles.bentoHeroHeader}>
              <MoonStars size={22} color="#A8B896" weight="regular" />
              <Text style={[styles.bentoHeroLabel, isDark && styles.darkSubText]}>AVG SLEEP</Text>
            </View>
            <Text style={[styles.bentoHeroValue, isDark && styles.darkText]}>
              {sleepStats.averageHours.toFixed(1)}
            </Text>
            <Text style={[styles.bentoHeroUnit, isDark && styles.darkSubText]}>hours/night</Text>
          </View>
        </TouchableOpacity>

        {/* Quality bento */}
        <TouchableOpacity 
          style={[
            styles.bentoMedium, 
            isDark && styles.darkCard,
            { borderWidth: 1, borderColor: 'rgba(184, 163, 200, 0.2)' }
          ]}
          onPress={() => handleBentoPress('quality')}
          activeOpacity={0.8}
        >
          {/* Static glow accent */}
          <View style={[styles.glowAccent, { backgroundColor: 'rgba(184, 163, 200, 0.06)' }]} />
          <Star size={20} color="#B8A3C8" weight="regular" />
          <Text style={[styles.bentoMediumValue, isDark && styles.darkText]}>
            {sleepStats.averageQuality.toFixed(1)}
          </Text>
          <Text style={[styles.bentoMediumLabel, isDark && styles.darkSubText]}>QUALITY</Text>
        </TouchableOpacity>

        {/* Goal bento */}
        <TouchableOpacity 
          style={[
            styles.bentoMedium, 
            isDark && styles.darkCard,
            { borderWidth: 1, borderColor: 'rgba(107, 142, 94, 0.2)' }
          ]}
          onPress={() => handleBentoPress('goalMet')}
          activeOpacity={0.8}
        >
          {/* Static glow accent */}
          <View style={[styles.glowAccent, { backgroundColor: 'rgba(107, 142, 94, 0.06)' }]} />
          <Target size={20} color="#6b8e5e" weight="regular" />
          <Text style={[styles.bentoMediumValue, isDark && styles.darkText]}>
            {sleepStats.goalAchievement.toFixed(0)}%
          </Text>
          <Text style={[styles.bentoMediumLabel, isDark && styles.darkSubText]}>GOAL MET</Text>
        </TouchableOpacity>

        {/* Trend bento */}
        <TouchableOpacity 
          style={[styles.bentoSmall, isDark && styles.darkCard]}
          onPress={() => handleBentoPress('trend')}
          activeOpacity={0.8}
        >
          {getSleepIcon(
            sleepStats.trend === 'improving' ? 'trending-up' : sleepStats.trend === 'declining' ? 'trending-down' : 'minus',
            20,
            sleepStats.trend === 'improving' ? "#6b8e5e" : sleepStats.trend === 'declining' ? "#E89B8E" : "#9E9289"
          )}
          <Text style={[styles.bentoSmallValue, isDark && styles.darkText, {
            color: sleepStats.trend === 'improving' ? "#6b8e5e" : 
                  sleepStats.trend === 'declining' ? "#E89B8E" : isDark ? '#fff' : '#333'
          }]}>
            {sleepStats.trend.charAt(0).toUpperCase() + sleepStats.trend.slice(1)}
          </Text>
          <Text style={[styles.bentoSmallLabel, isDark && styles.darkSubText]}>TREND</Text>
        </TouchableOpacity>

        {/* Consistency bento */}
        <TouchableOpacity 
          style={[styles.bentoSmall, isDark && styles.darkCard]}
          onPress={() => handleBentoPress('consistency')}
          activeOpacity={0.8}
        >
          <CalendarCheck size={20} color="#A8B896" weight="regular" />
          <Text style={[styles.bentoSmallValue, isDark && styles.darkText]}>
            {sleepStats.consistencyScore.toFixed(0)}
          </Text>
          <Text style={[styles.bentoSmallLabel, isDark && styles.darkSubText]}>CONSISTENCY</Text>
        </TouchableOpacity>

        {/* Debt bento */}
        <TouchableOpacity 
          style={[styles.bentoSmall, isDark && styles.darkCard]}
          onPress={() => handleBentoPress('debt')}
          activeOpacity={0.8}
        >
          <ClockCountdown size={20} color={sleepStats.sleepDebt > 5 ? "#E89B8E" : "#9E9289"} weight="regular" />
          <Text style={[styles.bentoSmallValue, isDark && styles.darkText, sleepStats.sleepDebt > 5 && { color: "#E89B8E" }]}>
            {sleepStats.sleepDebt.toFixed(1)}h
          </Text>
          <Text style={[styles.bentoSmallLabel, isDark && styles.darkSubText]}>DEBT</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderInsightsCard = () => {
    if (!sleepStats) return null;
    
    return (
      <View style={[styles.insightsCard, isDark && styles.darkCard]}>
        <View style={styles.insightsHeader}>
          {getSleepIcon(sleepAdvice.icon, 20, sleepAdvice.color)}
          <Text style={[styles.insightsStatus, {color: sleepAdvice.color}]}>
            {sleepAdvice.status}
          </Text>
        </View>
        
        <Text style={[styles.insightsMessage, isDark && styles.darkSubText]}>
          {sleepAdvice.message}
        </Text>

        {insights.length > 0 && (
          <View style={styles.weeklyInsightsContainer}>
            {insights.map((insight, index) => (
              <Text key={index} style={[styles.weeklyInsightItem, isDark && styles.darkSubText]}>
                • {insight}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      {renderBentoModal()}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDark ? '#ffffff' : '#000000'} weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Sleep Health</Text>
        <TouchableOpacity onPress={handleSetSleepGoal} style={styles.actionButton}>
          <Gear size={24} color={isDark ? '#ffffff' : '#000000'} weight="regular" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingState label="Loading sleep data…" style={styles.loadingContainer} />
      ) : loadError ? (
        <ErrorState
          title="Sleep data is unavailable"
          description={loadError}
          action={<Button label="Try again" onPress={fetchData} />}
          style={styles.loadingContainer}
        />
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Quick Stats Bento Grid */}
          {renderQuickStats()}
          
          {/* Sleep Duration Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, isDark && styles.darkText]}>
                Sleep Duration
              </Text>
              <SegmentedControl
                label="Sleep range"
                value={timeRange}
                onChange={setTimeRange}
                options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]}
                style={styles.periodSelector}
              />
            </View>
            
            {renderWeeklyChart()}
          </View>
          
          {/* Sleep Quality Chart */}
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, isDark && styles.darkText]}>
              Sleep Quality
            </Text>
            {renderSleepQualityChart()}
          </View>

          {/* Insights & Long Text - Bottom */}
          {renderInsightsCard()}
        </ScrollView>
      )}

      <FloatingActionButton
        onPress={() => setIsModalVisible(true)}
        color={colors.accent as string}
        icon="plus"
      />

      <SleepEntryModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleAddSleepEntry}
      />
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
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  actionButton: {
    padding: 4,
  },
  headerTitle: {
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
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Bento Grid Styles
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  // Hero bento - large featured card
  bentoHero: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  // Static glow accent - muted background fill
  glowAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
  },
  bentoHeroContent: {
    zIndex: 1,
  },
  bentoHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bentoHeroLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9E9289',
    fontFamily: 'Vercetti-Regular',
  },
  bentoHeroValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
    marginVertical: 4,
  },
  bentoHeroUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9E9289',
    fontFamily: 'Vercetti-Regular',
  },
  // Medium bento
  bentoMedium: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 18,
    alignItems: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  bentoMediumValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
    marginTop: 12,
  },
  bentoMediumLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#9E9289',
    fontFamily: 'Vercetti-Regular',
    marginTop: 4,
  },
  // Small bento
  bentoSmall: {
    width: '31%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bentoSmallValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
    marginTop: 8,
  },
  bentoSmallLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#9E9289',
    fontFamily: 'Vercetti-Regular',
    marginTop: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9289',
    fontFamily: 'Vercetti-Regular',
    letterSpacing: 0.5,
  },
  modalValue: {
    fontSize: 48,
    fontWeight: '800',
    fontFamily: 'Vercetti-Regular',
    marginVertical: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9E9289',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    gap: 10,
    marginBottom: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    fontFamily: 'Vercetti-Regular',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Vercetti-Regular',
  },
  shareWeeklyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  shareWeeklyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  // Insights card - now simplified for bottom section
  insightsCard: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  insightsStatus: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  insightsMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  weeklyInsightsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  weeklyInsightItem: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  chartContainer: {
    marginBottom: 20,
  },
  glowingChartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  activePeriodButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  darkActivePeriodButton: {
    backgroundColor: '#333333',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  activePeriodButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  darkActivePeriodButtonText: {
    color: '#ffffff',
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  targetLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  targetLine: {
    width: 16,
    height: 2,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  targetLineText: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'Vercetti-Regular',
  },
  emptyChartContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Vercetti-Regular',
  },
  dataPoint: {
    position: 'absolute',
    padding: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  dataPointText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  analyticsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Vercetti-Regular',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  consistencyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  consistencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  consistencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    fontFamily: 'Vercetti-Regular',
  },
  consistencyScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consistencyScoreWrapper: {
    alignItems: 'center',
    marginRight: 20,
  },
  consistencyScoreRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  consistencyScoreText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  consistencyScoreLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  consistencyDescription: {
    flex: 1,
  },
  consistencyDescriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
}); 