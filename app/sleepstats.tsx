import { View, Text, ScrollView, StyleSheet, useColorScheme, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useMemo, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { healthService } from '../services/healthService';
import { sleepService } from '../services/sleepService';

const MOCK_SLEEP_DATA = [
  { date: '2024-02-08', hours: 7, minutes: 45, quality: 85, deepSleep: 2.5, lightSleep: 4.5, rem: 0.75 },
  { date: '2024-02-09', hours: 6, minutes: 30, quality: 65, deepSleep: 1.8, lightSleep: 4.0, rem: 0.7 },
  { date: '2024-02-10', hours: 8, minutes: 15, quality: 90, deepSleep: 3.0, lightSleep: 4.2, rem: 1.05 },
  { date: '2024-02-11', hours: 7, minutes: 20, quality: 75, deepSleep: 2.2, lightSleep: 4.3, rem: 0.8 },
  { date: '2024-02-12', hours: 8, minutes: 0, quality: 88, deepSleep: 2.8, lightSleep: 4.2, rem: 1.0 },
  { date: '2024-02-13', hours: 7, minutes: 50, quality: 82, deepSleep: 2.6, lightSleep: 4.4, rem: 0.8 },
  { date: '2024-02-14', hours: 7, minutes: 30, quality: 80, deepSleep: 2.4, lightSleep: 4.3, rem: 0.8 },
];

export default function SleepStatsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = Dimensions.get('window');
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  const chartData = useMemo(() => ({
    labels: MOCK_SLEEP_DATA.map(d => d.date.slice(-2)),
    datasets: [{
      data: MOCK_SLEEP_DATA.map(d => d.hours + d.minutes / 60),
      color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})`,
    }]
  }), []);

  const lastNight = MOCK_SLEEP_DATA[MOCK_SLEEP_DATA.length - 1];
  const recommendations = getSleepRecommendations(lastNight);

  useEffect(() => {
    checkPermissionsAndLoadData();
  }, []);

  const checkPermissionsAndLoadData = async () => {
    try {
      setLoading(true);
      const permitted = await healthService.requestPermissions();
      setHasPermission(permitted);

      if (permitted) {
        await loadHealthData();
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const loadHealthData = async () => {
    try {
      // Get last 7 days of sleep data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const sleepData = await healthService.getSleepData(startDate, endDate);
      setHealthData(sleepData);

      // Save to Supabase if you want to keep a record
      for (const record of sleepData) {
        await sleepService.addSleepRecord({
          sleep_start: record.startDate,
          sleep_end: record.endDate,
          quality_rating: calculateSleepQuality(record),
          deep_sleep_hours: record.sleepStages?.deep || 0,
          light_sleep_hours: record.sleepStages?.light || 0,
          rem_sleep_hours: record.sleepStages?.rem || 0,
        });
      }
    } catch (error) {
      console.error('Error loading health data:', error);
      Alert.alert('Error', 'Failed to load health data');
    }
  };

  const calculateSleepQuality = (record) => {
    // Implement your sleep quality calculation logic here
    // This is a simple example
    const duration = record.duration;
    const recommendedSleep = 8; // 8 hours
    const quality = Math.min(100, (duration / recommendedSleep) * 100);
    return Math.round(quality);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Permission Required</Text>
        <Text style={styles.subtitle}>
          Please grant access to health data to track your sleep.
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={checkPermissionsAndLoadData}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.darkText]}>Sleep Stats</Text>
          <Text style={[styles.subtitle, isDark && styles.darkSubText]}>
            Last 7 Days Overview
          </Text>
        </View>

        {/* Sleep Quality Card */}
        <View style={[styles.qualityCard, isDark && styles.darkCard]}>
          <Text style={[styles.qualityTitle, isDark && styles.darkText]}>
            Last Night's Sleep
          </Text>
          <View style={styles.qualityStats}>
            <View style={styles.qualityStat}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>
                {lastNight.hours}h {lastNight.minutes}m
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubText]}>
                Duration
              </Text>
            </View>
            <View style={styles.qualityStat}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>
                {lastNight.quality}%
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubText]}>
                Quality
              </Text>
            </View>
          </View>
        </View>

        {/* Sleep Cycle Breakdown */}
        <View style={[styles.cycleCard, isDark && styles.darkCard]}>
          <Text style={[styles.cycleTitle, isDark && styles.darkText]}>
            Sleep Cycles
          </Text>
          <View style={styles.cycleStats}>
            {[
              { label: 'Deep Sleep', value: lastNight.deepSleep, color: '#9B59B6' },
              { label: 'Light Sleep', value: lastNight.lightSleep, color: '#3498DB' },
              { label: 'REM', value: lastNight.rem, color: '#E74C3C' },
            ].map((cycle, index) => (
              <View key={index} style={styles.cycleStat}>
                <View style={styles.cycleHeader}>
                  <View style={[styles.cycleIndicator, { backgroundColor: cycle.color }]} />
                  <Text style={[styles.cycleLabel, isDark && styles.darkSubText]}>
                    {cycle.label}
                  </Text>
                </View>
                <Text style={[styles.cycleValue, isDark && styles.darkText]}>
                  {cycle.value}h
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sleep Chart */}
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, isDark && styles.darkText]}>
            Sleep Duration Trend
          </Text>
          <LineChart
            data={chartData}
            width={width - 40}
            height={220}
            chartConfig={{
              backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
              backgroundGradientFrom: isDark ? '#1e1e1e' : '#ffffff',
              backgroundGradientTo: isDark ? '#1e1e1e' : '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => isDark ? 
                `rgba(255, 255, 255, ${opacity})` : 
                `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => isDark ? 
                `rgba(255, 255, 255, ${opacity})` : 
                `rgba(0, 0, 0, ${opacity})`,
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#9B59B6"
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Recommendations */}
        <View style={[styles.recommendationsCard, isDark && styles.darkCard]}>
          <Text style={[styles.recommendationsTitle, isDark && styles.darkText]}>
            Sleep Recommendations
          </Text>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendation}>
              <Ionicons name={rec.icon} size={24} color="#9B59B6" />
              <Text style={[styles.recommendationText, isDark && styles.darkText]}>
                {rec.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions
function getQualityColor(quality) {
  if (quality >= 85) return '#27AE60';
  if (quality >= 70) return '#F1C40F';
  return '#E74C3C';
}

function getSleepQualityText(quality) {
  if (quality >= 85) return 'Excellent';
  if (quality >= 70) return 'Good';
  return 'Poor';
}

function getSleepRecommendations(sleepData) {
  const recommendations = [];
  
  if (sleepData.hours < 7) {
    recommendations.push({
      icon: 'time',
      text: 'Try to get to bed 30 minutes earlier tonight'
    });
  }
  
  if (sleepData.deepSleep < 2.5) {
    recommendations.push({
      icon: 'moon',
      text: 'Consider reducing screen time before bed to improve deep sleep'
    });
  }
  
  if (sleepData.quality < 80) {
    recommendations.push({
      icon: 'thermometer',
      text: 'Keep your bedroom temperature between 60-67°F (15-19°C)'
    });
  }
  
  return recommendations;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 20,
  },
  
  sleepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sleepIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sleepStats: {
    gap: 4,
  },
  sleepHours: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  sleepQuality: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  
  // Sleep Stats Screen styles
  qualityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  qualityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  qualityStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  
  cycleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  cycleStats: {
    marginTop: 16,
    gap: 12,
  },
  cycleStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cycleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  
  recommendationsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
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
  recommendationText: {
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  cycleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  qualityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  darkCategoryButton: {
    backgroundColor: '#1e1e1e',
  },
  activeCategoryButton: {
    backgroundColor: '#FF7F50',
  },
  darkActiveCategoryButton: {
    backgroundColor: '#FF7F50',
  },
  categoryText: {
    color: '#666666',
    fontFamily: 'Vercetti-Regular',
  },
  darkCategoryText: {
    color: '#ffffff',
    fontFamily: 'Vercetti-Regular',
  },
  cycleLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  cycleValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  button: {
    backgroundColor: '#FF7F50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Vercetti-Regular',
  },
 

  
  // ... add remaining style properties following the existing pattern ...
});