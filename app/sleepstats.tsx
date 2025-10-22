import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { LoadingIndicator } from '@rn-nui/loading-indicator';
import { Colors } from '@/constants/Colors';

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

export default function SleepStatsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<WeeklySleepData[]>([]);
  const [sleepStats, setSleepStats] = useState<SleepStats | null>(null);
  const [sleepGoal, setSleepGoalState] = useState<SleepGoal | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  
  // Screen dimensions for responsive design
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error fetching sleep data:', error);
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

  const getChartConfig = (primaryColor: string = '#3F70F4') => {
    return {
      backgroundColor: 'transparent',
      backgroundGradientFrom: isDark ? '#1e1e1e' : '#ffffff',
      backgroundGradientTo: isDark ? '#1e1e1e' : '#ffffff',
      decimalPlaces: 1,
      color: (opacity = 1) => isDark 
        ? `rgba(255, 255, 255, ${opacity})` 
        : `rgba(0, 0, 0, ${opacity})`,
      labelColor: (opacity = 1) => isDark 
        ? `rgba(255, 255, 255, ${opacity})` 
        : `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: primaryColor
      },
      propsForBackgroundLines: {
        strokeDasharray: "", // solid background lines
        stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        strokeWidth: 1
      },
      formatYLabel: (value: string) => Number(value).toFixed(1),
    };
  };

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

    const data = {
      labels: chartData.map(d => d.day),
      datasets: [
        {
          data: chartData.map(d => d.hours),
          color: (opacity = 1) => `rgba(63, 112, 244, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Sleep Hours"]
    };

    const targetLine = sleepGoal?.target_hours || 8;

    return (
      <View style={styles.chartWrapper}>
        <LineChart
          data={data}
          width={chartWidth}
          height={220}
          chartConfig={getChartConfig()}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          withDots={true}
          segments={5}
          fromZero={false}
          renderDotContent={({ x, y, index, indexData }) => (
            <View key={index} style={[
              styles.dataPoint,
              { 
                left: x - 16,
                top: y - 36,
                backgroundColor: chartData[index].goalAchieved ? '#4CAF50' : '#FF5722'
              }
            ]}>
              <Text style={styles.dataPointText}>{indexData.toFixed(1)}</Text>
            </View>
          )}
        />
        <View style={styles.targetLineContainer}>
          <View style={styles.targetLine} />
          <Text style={styles.targetLineText}>Goal: {targetLine} hrs</Text>
        </View>
      </View>
    );
  };

  const renderSleepQualityChart = () => {
    if (!chartData || chartData.length === 0) {
      return null;
    }

    const data = {
      labels: chartData.map(d => d.day),
      datasets: [
        {
          data: chartData.map(d => d.quality),
          color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Sleep Quality"]
    };

    return (
      <View style={styles.chartWrapper}>
        <LineChart
          data={data}
          width={chartWidth}
          height={180}
          chartConfig={getChartConfig('#9C27B0')}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          withDots={true}
          segments={4}
          fromZero={false}
          yAxisSuffix="/10"
        />
      </View>
    );
  };

  const renderSleepAnalytics = () => {
    if (!sleepStats) return null;

    return (
      <View style={styles.analyticsContainer}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Sleep Analytics</Text>
        <View style={styles.analyticsGrid}>
          <View style={[styles.analyticsCard, isDark && styles.darkCard]}>
            <MaterialCommunityIcons name="sleep" size={22} color="#3F70F4" />
            <Text style={[styles.analyticsLabel, isDark && styles.darkSubText]}>Avg Hours</Text>
            <Text style={[styles.analyticsValue, isDark && styles.darkText]}>
              {sleepStats.averageHours.toFixed(1)}
            </Text>
          </View>
          
          <View style={[styles.analyticsCard, isDark && styles.darkCard]}>
            <MaterialCommunityIcons name="star" size={22} color="#9C27B0" />
            <Text style={[styles.analyticsLabel, isDark && styles.darkSubText]}>Avg Quality</Text>
            <Text style={[styles.analyticsValue, isDark && styles.darkText]}>
              {sleepStats.averageQuality.toFixed(1)}/10
            </Text>
          </View>
          
          <View style={[styles.analyticsCard, isDark && styles.darkCard]}>
            <MaterialCommunityIcons 
              name={sleepStats.trend === 'improving' ? "trending-up" : 
                   sleepStats.trend === 'declining' ? "trending-down" : "trending-neutral"} 
              size={22} 
              color={sleepStats.trend === 'improving' ? "#4CAF50" : 
                    sleepStats.trend === 'declining' ? "#F44336" : "#FF9800"} 
            />
            <Text style={[styles.analyticsLabel, isDark && styles.darkSubText]}>Trend</Text>
            <Text style={[styles.analyticsValue, isDark && styles.darkText, {
              color: sleepStats.trend === 'improving' ? "#4CAF50" : 
                    sleepStats.trend === 'declining' ? "#F44336" : "#FF9800"
            }]}>
              {sleepStats.trend.charAt(0).toUpperCase() + sleepStats.trend.slice(1)}
            </Text>
          </View>
          
          <View style={[styles.analyticsCard, isDark && styles.darkCard]}>
            <MaterialCommunityIcons name="check-circle" size={22} color="#FF9800" />
            <Text style={[styles.analyticsLabel, isDark && styles.darkSubText]}>Goal Met</Text>
            <Text style={[styles.analyticsValue, isDark && styles.darkText]}>
              {sleepStats.goalAchievement.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderInsightsCard = () => {
    if (!sleepStats) return null;
    
    return (
      <View style={[styles.insightsCard, isDark && styles.darkCard]}>
        <View style={styles.insightsHeader}>
          <View style={styles.insightIcon}>
            <Ionicons name={sleepAdvice.icon as any} size={24} color={sleepAdvice.color} />
          </View>
          <View>
            <Text style={[styles.insightsTitle, isDark && styles.darkText]}>Sleep Insights</Text>
            <Text style={[styles.insightsStatus, {color: sleepAdvice.color}]}>
              {sleepAdvice.status}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.insightsMessage, isDark && styles.darkSubText]}>
          {sleepAdvice.message}
        </Text>
        
        {sleepStats.sleepDebt > 0 && (
          <View style={styles.sleepDebtContainer}>
            <Text style={[styles.sleepDebtTitle, isDark && styles.darkText]}>Sleep Debt</Text>
            <Text style={[styles.sleepDebtValue, isDark && styles.darkText]}>
              {sleepStats.sleepDebt.toFixed(1)} hours
            </Text>
            <Text style={[styles.sleepDebtMessage, isDark && styles.darkSubText]}>
              You have a sleep deficit. Consider getting extra rest to recover.
            </Text>
          </View>
        )}

        {insights.length > 0 && (
          <View style={styles.weeklyInsightsContainer}>
            <Text style={[styles.weeklyInsightsTitle, isDark && styles.darkText]}>Weekly Insights</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Sleep Health</Text>
        <TouchableOpacity onPress={handleSetSleepGoal} style={styles.actionButton}>
          <Ionicons name="settings-outline" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator containerSize={50} containerColor={Colors.primary} animating={true} color={Colors.background} />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading sleep data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Sleep Insights Card */}
          {renderInsightsCard()}
          
          {/* Sleep Duration Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, isDark && styles.darkText]}>
                Sleep Duration
              </Text>
              <View style={styles.periodSelector}>
                <TouchableOpacity 
                  style={[
                    styles.periodButton,
                    timeRange === 'week' && styles.activePeriodButton,
                    isDark && timeRange === 'week' && styles.darkActivePeriodButton
                  ]}
                  onPress={() => setTimeRange('week')}
                >
                  <Text 
                    style={[
                      styles.periodButtonText,
                      timeRange === 'week' && styles.activePeriodButtonText,
                      isDark && styles.darkText,
                      isDark && timeRange === 'week' && styles.darkActivePeriodButtonText
                    ]}
                  >
                    Week
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.periodButton,
                    timeRange === 'month' && styles.activePeriodButton,
                    isDark && timeRange === 'month' && styles.darkActivePeriodButton
                  ]}
                  onPress={() => setTimeRange('month')}
                >
                  <Text 
                    style={[
                      styles.periodButtonText,
                      timeRange === 'month' && styles.activePeriodButtonText,
                      isDark && styles.darkText,
                      isDark && timeRange === 'month' && styles.darkActivePeriodButtonText
                    ]}
                  >
                    Month
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {renderWeeklyChart()}
          </View>
          
          {/* Sleep Analytics */}
          {renderSleepAnalytics()}
          
          {/* Sleep Quality Chart */}
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, isDark && styles.darkText]}>
              Sleep Quality
            </Text>
            {renderSleepQualityChart()}
          </View>
          
          {/* Consistency Score */}
          {sleepStats && (
            <View style={[styles.consistencyCard, isDark && styles.darkCard]}>
              <View style={styles.consistencyHeader}>
                <MaterialCommunityIcons name="calendar-check" size={24} color="#4CAF50" />
                <Text style={[styles.consistencyTitle, isDark && styles.darkText]}>Sleep Consistency</Text>
              </View>
              
              <View style={styles.consistencyScoreContainer}>
                <View style={styles.consistencyScoreWrapper}>
                  <View style={[styles.consistencyScoreRing, { 
                    borderColor: sleepStats.consistencyScore >= 80 ? '#4CAF50' : 
                                sleepStats.consistencyScore >= 60 ? '#FF9800' : '#F44336' 
                  }]}>
                    <Text style={styles.consistencyScoreText}>
                      {sleepStats.consistencyScore.toFixed(0)}
                    </Text>
                  </View>
                  <Text style={[styles.consistencyScoreLabel, isDark && styles.darkSubText]}>Score</Text>
                </View>
                
                <View style={styles.consistencyDescription}>
                  <Text style={[styles.consistencyDescriptionText, isDark && styles.darkSubText]}>
                    {sleepStats.consistencyScore >= 80 
                      ? "Excellent sleep consistency! Your regular sleep schedule promotes optimal health." 
                      : sleepStats.consistencyScore >= 60
                        ? "Your sleep schedule is somewhat variable. Try to maintain more consistent sleep and wake times."
                        : "Your sleep times are inconsistent. A regular sleep schedule is important for quality rest and health."
                    }
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <FloatingActionButton
        onPress={() => setIsModalVisible(true)}
        color="#3F70F4"
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
  insightsCard: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  insightsStatus: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  insightsMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 16,
  },
  sleepDebtContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  sleepDebtTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  sleepDebtValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F44336',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  sleepDebtMessage: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  weeklyInsightsContainer: {
    marginTop: 8,
  },
  weeklyInsightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  weeklyInsightItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
    fontFamily: 'Vercetti-Regular',
  },
  chartContainer: {
    marginBottom: 20,
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