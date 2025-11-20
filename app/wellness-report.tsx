import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../hooks/useTheme';
import { useWellnessScore } from '../hooks/useWellnessScore';

export default function WellnessReportScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { score } = useWellnessScore();

  const chartConfig = {
    backgroundGradientFrom: isDark ? '#1a1a1a' : '#ffffff',
    backgroundGradientTo: isDark ? '#1a1a1a' : '#ffffff',
    color: (opacity = 1) => `rgba(168, 184, 150, ${opacity})`, // Using the 'calm' color from home
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
  };

  // Dummy data for monthly progress
  const data = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        data: [65, 78, 72, score || 85],
        color: (opacity = 1) => `rgba(168, 184, 150, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Wellness Score"]
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Monthly Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.scoreCard, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
          <Text style={[styles.scoreTitle, { color: colors.textSecondary }]}>Current Score</Text>
          <Text style={[styles.scoreValue, { color: colors.primary }]}>{score}%</Text>
          <Text style={[styles.scoreSubtitle, { color: colors.textSecondary }]}>You're doing great!</Text>
        </View>

        <View style={styles.chartContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Monthly Overview</Text>
          <LineChart
            data={data}
            width={Dimensions.get("window").width - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </View>

        <View style={styles.insightsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Insights</Text>
          <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
            <Ionicons name="trending-up" size={24} color={colors.primary} style={styles.insightIcon} />
            <View style={styles.insightTextContainer}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Consistent Growth</Text>
              <Text style={[styles.insightDescription, { color: colors.textSecondary }]}>
                Your wellness score has improved by 12% compared to last month.
              </Text>
            </View>
          </View>
          
          <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
            <Ionicons name="ribbon-outline" size={24} color="#F4D03F" style={styles.insightIcon} />
            <View style={styles.insightTextContainer}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Top Performer</Text>
              <Text style={[styles.insightDescription, { color: colors.textSecondary }]}>
                You've maintained a streak of 5 days! Keep it up.
              </Text>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scoreCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  scoreSubtitle: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  chartContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  insightsContainer: {
    marginBottom: 32,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  insightIcon: {
    marginRight: 16,
  },
  insightTextContainer: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Vercetti-Regular',
  },
});
