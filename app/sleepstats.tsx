import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import FloatingActionButton from '../components/FloatingActionButton';
import SleepEntryModal from '../modals/SleepEntryModal';
import { format, subDays } from 'date-fns';

interface SleepEntry {
  date: string;
  hours: number;
  quality: number;
}

export default function SleepStatsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sleepData, setSleepData] = useState<SleepEntry[]>([]);
  const screenWidth = Dimensions.get('window').width;

  const getSleepAdvice = (averageHours: number) => {
    if (averageHours >= 8) {
      return {
        status: "Excellent",
        message: "You're maintaining healthy sleep habits! Keep up the great work.",
        color: "#98FB98"
      };
    } else if (averageHours >= 7) {
      return {
        status: "Good",
        message: "You're doing well, but try to get a bit more sleep for optimal health.",
        color: "#FFD700"
      };
    } else {
      return {
        status: "Needs Improvement",
        message: "Try to get more sleep. Aim for 7-9 hours per night for better health and productivity.",
        color: "#FF7F50"
      };
    }
  };

  const getChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'MM/dd');
    }).reverse();

    return {
      labels: last7Days,
      datasets: [{
        data: last7Days.map(date => {
          const entry = sleepData.find(d => d.date === date);
          return entry?.hours || 0;
        }),
        color: (opacity = 1) => `rgba(255, 127, 80, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  const averageSleepHours = sleepData.length > 0
    ? sleepData.reduce((acc, curr) => acc + curr.hours, 0) / sleepData.length
    : 0;

  const sleepAdvice = getSleepAdvice(averageSleepHours);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Sleep Stats</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.statsCard, isDark && styles.darkCard]}>
          <Text style={[styles.statsTitle, isDark && styles.darkText]}>
            Weekly Average
          </Text>
          <Text style={[styles.statsValue, { color: sleepAdvice.color }]}>
            {averageSleepHours.toFixed(1)} hours
          </Text>
          <Text style={[styles.statsStatus, { color: sleepAdvice.color }]}>
            {sleepAdvice.status}
          </Text>
        </View>

        <View style={[styles.chartCard, isDark && styles.darkCard]}>
          <Text style={[styles.chartTitle, isDark && styles.darkText]}>
            Sleep Duration Trend
          </Text>
          <LineChart
            data={getChartData()}
            width={screenWidth - 48}
            height={220}
            chartConfig={{
              backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
              backgroundGradientFrom: isDark ? '#1e1e1e' : '#ffffff',
              backgroundGradientTo: isDark ? '#1e1e1e' : '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#FF7F50"
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={[styles.adviceCard, isDark && styles.darkCard]}>
          <View style={styles.adviceHeader}>
            <Ionicons name="bulb-outline" size={24} color="#FF7F50" />
            <Text style={[styles.adviceTitle, isDark && styles.darkText]}>Sleep Insights</Text>
          </View>
          <Text style={[styles.adviceText, isDark && styles.darkSubText]}>
            {sleepAdvice.message}
          </Text>
        </View>
      </ScrollView>

      <FloatingActionButton
        onPress={() => setIsModalVisible(true)}
        color="#FF7F50"
        icon="plus"
      />

      <SleepEntryModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={(entry) => {
          setSleepData([...sleepData, entry]);
          setIsModalVisible(false);
        }}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 18,
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
  },
  statsCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  statsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  statsStatus: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  chartCard: {
    margin: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  adviceCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    fontFamily: 'Vercetti-Regular',
  },
  adviceText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    fontFamily: 'Vercetti-Regular',
  },
}); 