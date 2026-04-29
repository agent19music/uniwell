import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMood, MoodType } from '../contexts/MoodContext';
import { format, startOfWeek, addDays } from 'date-fns';
import { useTheme } from '../hooks/useTheme';
import { GlowingMoodChart } from '../components/charts';

const MOOD_CONFIG: Record<MoodType, {
  colors: string[];
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: number;
  insights: string[];
  suggestions: string[];
}> = {
  happy: {
    colors: ['#FFE259', '#FFA751', '#FFD700'],
    icon: 'happy-outline',
    title: 'Radiating Happy Vibes! ✨',
    value: 5,
    insights: [
      "You're basically a human sunshine factory right now! ☀️",
      "Your dopamine levels are doing the cha-cha. Keep that dance going!",
      "Warning: Your smile might be contagious. Use responsibly. 😊"
    ],
    suggestions: [
      "Spread the joy! High-five a friend (or a willing stranger)",
      "Take a ridiculous selfie to remember this moment",
      "Do that happy dance you've been holding in (no one's watching... probably)"
    ]
  },
  calm: {
    colors: ['#89f7fe', '#66a6ff', '#4682B4'],
    icon: 'water-outline',
    title: 'Zen Mode: Activated 🧘‍♂️',
    value: 4,
    insights: [
      "You're so chill, cucumbers are taking notes 🥒",
      "Your zen level is over 9000! (Yes, that's still a reference)",
      "Inner peace level: Successfully adulting ✌️"
    ],
    suggestions: [
      "Maybe teach a masterclass in chilling out?",
      "Float like a cloud (metaphorically, please stay grounded)",
      "Write a haiku about your tranquility... or just nap"
    ]
  },
  stressed: {
    colors: ['#A8E063', '#56AB2F', '#7FFFD4'],
    icon: 'pulse-outline',
    title: 'Stress Detected: Breathe 🌬️',
    value: 2,
    insights: [
      "Your brain is currently running more tabs than Chrome",
      "Your shoulders are trying to become earrings. Let them down gently.",
      "Remember: This too shall pass (and then something else stressful will happen, but let's focus on now)"
    ],
    suggestions: [
      "Try the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8",
      "Write down what's stressing you, then prioritize what you can control",
      "Go for a 10-minute walk without your phone"
    ]
  },
  angry: {
    colors: ['#FF416C', '#FF4B2B', '#FFA07A'],
    icon: 'flame-outline',
    title: 'Spicy Mood Detected 🌶️',
    value: 1,
    insights: [
      "Your inner volcano is bubbling. Careful where you direct that lava!",
      "Your patience has left the chat. Want to invite it back?",
      "Fun fact: Anger is just passion with bad PR"
    ],
    suggestions: [
      "Count to 10 before responding to anything or anyone",
      "Channel that energy into physical activity (punching pillows is underrated)",
      "Write an angry letter, then delete it without sending"
    ]
  },
  sad: {
    colors: ['#4CA1AF', '#2C3E50', '#98FB98'],
    icon: 'rainy-outline',
    title: 'Blue Skies After Rain 🌧️',
    value: 3,
    insights: [
      "Your heart's having a cloudy day. That's okay, clouds pass.",
      "Sadness is just the body's way of processing life's plot twists",
      "Even the happiest people feel sad sometimes. You're in good company."
    ],
    suggestions: [
      "Be gentle with yourself today. What would you tell a friend feeling this way?",
      "Try the 'opposite action' technique: do something that usually makes you happy",
      "Express your feelings through art, music, or writing"
    ]
  }
};

export default function MoodDetailScreen() {
  const { mood, view } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width } = Dimensions.get('window');
  const { weeklyMoods, weeklySummary, fetchWeeklyMoods } = useMood();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchWeeklyMoods();
      setLoading(false);
    };
    loadData();
  }, []);

  const selectedMood = mood ? MOOD_CONFIG[mood as MoodType] : null;
  const isHistoryView = view === 'history';

  // Generate days of the week for chart labels
  const getDaysOfWeek = () => {
    const today = new Date();
    const startDay = startOfWeek(today);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(startDay, i);
      days.push(format(day, 'EEE'));
    }
    
    return days;
  };

  // Map mood types to numerical values for the chart
  const getMoodValue = (moodType: MoodType) => {
    return MOOD_CONFIG[moodType].value;
  };

  // Prepare data for the new glowing chart
  const prepareGlowingChartData = () => {
    const daysOfWeek = getDaysOfWeek();
    
    // Create data points for each day
    return daysOfWeek.map((label, index) => {
      const moodEntry = weeklyMoods.find(m => m.dayOfWeek === index);
      
      if (moodEntry) {
        const moodValue = getMoodValue(moodEntry.moodType);
        const moodColor = MOOD_CONFIG[moodEntry.moodType].colors[1];
        return {
          label,
          value: moodValue,
          color: moodColor,
        };
      }
      
      return {
        label,
        value: null,
      };
    });
  };

  const renderMoodDetail = () => {
    if (!selectedMood) return null;
    
    return (
      <View style={styles.moodDetailContainer}>
        <Text style={[styles.moodTitle, isDark && styles.darkText]}>
          {selectedMood.title}
        </Text>
        
        <View style={[styles.insightsContainer, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Insights</Text>
          {selectedMood.insights.map((insight, index) => (
            <View key={`insight-${index}`} style={styles.insightItem}>
              <Ionicons name="bulb-outline" size={20} color="#FF7F50" />
              <Text style={[styles.insightText, isDark && styles.darkText]}>
                {insight}
              </Text>
            </View>
          ))}
        </View>
        
        <View style={[styles.suggestionsContainer, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Try This</Text>
          {selectedMood.suggestions.map((suggestion, index) => (
            <View key={`suggestion-${index}`} style={styles.suggestionItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FF7F50" />
              <Text style={[styles.suggestionText, isDark && styles.darkText]}>
                {suggestion}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderWeeklySummary = () => {
    if (!weeklySummary) return null;
    
    const dominantMoodConfig = MOOD_CONFIG[weeklySummary.dominantMood];
    
    return (
      <View style={styles.weeklySummaryContainer}>
        <Text style={[styles.summaryTitle, isDark && styles.darkText]}>
          Weekly Mood Summary
        </Text>
        
        <View style={[styles.dominantMoodCard, { backgroundColor: dominantMoodConfig.colors[2] + '30' }]}>
          <Ionicons name={dominantMoodConfig.icon} size={32} color={dominantMoodConfig.colors[1]} />
          <View style={styles.dominantMoodContent}>
            <Text style={[styles.dominantMoodLabel, isDark && styles.darkText]}>
              Dominant Mood: {weeklySummary.dominantMood.charAt(0).toUpperCase() + weeklySummary.dominantMood.slice(1)}
            </Text>
            <Text style={[styles.dominantMoodDesc, isDark && styles.darkSubText]}>
              Your emotions have been {weeklySummary.moodFluctuation > 3 ? 'quite variable' : 'relatively stable'} this week.
            </Text>
          </View>
        </View>
        
        <View style={[styles.insightsContainer, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Insights</Text>
          {weeklySummary.insights.map((insight, index) => (
            <View key={`weekly-insight-${index}`} style={styles.insightItem}>
              <Ionicons name="analytics-outline" size={20} color="#FF7F50" />
              <Text style={[styles.insightText, isDark && styles.darkText]}>
                {insight}
              </Text>
            </View>
          ))}
        </View>
        
        <View style={[styles.suggestionsContainer, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Recommendations</Text>
          {weeklySummary.recommendations.map((recommendation, index) => (
            <View key={`weekly-recommendation-${index}`} style={styles.suggestionItem}>
              <Ionicons name="compass-outline" size={20} color="#FF7F50" />
              <Text style={[styles.suggestionText, isDark && styles.darkText]}>
                {recommendation}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF7F50" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>
          {isHistoryView ? 'Mood History' : 'Mood Details'}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.chartContainer, { backgroundColor: colors.card }, isDark && styles.darkCard]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
                Your Week in Moods
              </Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                Higher = More Positive
              </Text>
            </View>
            {weeklyMoods.length > 0 && (
              <View style={[styles.chartBadge, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.chartBadgeText, { color: colors.success }]}>
                  {weeklyMoods.length} logged
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.chartWrapper}>
            <GlowingMoodChart
              data={prepareGlowingChartData()}
              width={width - 80}
              height={220}
              accentColor={colors.success}
              showDots={true}
              showArea={true}
              showGrid={true}
            />
          </View>

          {weeklyMoods.length === 0 && (
            <View style={styles.noDataOverlay}>
              <Ionicons name="analytics-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                No mood data recorded this week.
              </Text>
              <Text style={[styles.noDataSubtext, { color: colors.textTertiary }]}>
                Start tracking your moods to see trends!
              </Text>
            </View>
          )}
        </View>
        
        {isHistoryView ? renderWeeklySummary() : renderMoodDetail()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  chartContainer: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
    shadowColor: '#000',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  moodDetailContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  moodTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  insightsContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  weeklySummaryContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dominantMoodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  dominantMoodContent: {
    marginLeft: 16,
    flex: 1,
  },
  dominantMoodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dominantMoodDesc: {
    fontSize: 14,
    color: '#666',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(176, 197, 164, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  chartBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b8e5e',
  },
  chartWrapper: {
    position: 'relative',
  },
  noDataOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});