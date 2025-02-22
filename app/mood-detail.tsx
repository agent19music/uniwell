import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOOD_CONFIG = {
  happy: {
    colors: ['#FFD700', '#FFA500'],
    title: 'Feeling Happy',
    insights: [
      'Embrace this positive energy!',
      'Your happiness is contagious.',
      'Take a moment to appreciate your joy.'
    ],
    suggestions: [
      'Share your happiness with others',
      'Capture this moment in a journal',
      'Do something that amplifies your good mood'
    ]
  },
  calm: {
    colors: ['#87CEEB', '#4682B4'],
    title: 'Feeling Calm',
    insights: [
      'Your inner peace is powerful.',
      'Tranquility brings clarity.',
      'Cherish this serene moment.'
    ],
    suggestions: [
      'Practice mindfulness meditation',
      'Take a peaceful walk',
      'Reflect on what brings you peace'
    ]
  },
  stressed: {
    colors: ['#FF6347', '#DC143C'],
    title: 'Feeling Stressed',
    insights: [
      'It\'s okay to feel overwhelmed.',
      'Stress is temporary.',
      'You have the strength to overcome challenges.'
    ],
    suggestions: [
      'Practice deep breathing exercises',
      'Break tasks into smaller steps',
      'Reach out to a supportive friend'
    ]
  },
  sad: {
    colors: ['#4169E1', '#1E90FF'],
    title: 'Feeling Sad',
    insights: [
      'Your emotions are valid.',
      'Sadness is a natural part of life.',
      'This feeling will not last forever.'
    ],
    suggestions: [
      'Practice self-compassion',
      'Engage in a comforting activity',
      'Consider talking to someone you trust'
    ]
  },
  angry : {
    colors: ['#9370DB', '#8A2BE2'],
    title: 'Feeling Angry',
    insights: [
      'You are stronger than your anger.',
      'Anger doesn\'t define you.',
      'Small steps can lead to big progress.'
    ],
    suggestions: [
      'Use grounding techniques',
      'Practice positive self-talk',
      'Create a calming routine'
    ]
  }
};

export default function MoodDetailPage() {
  const { mood } = useLocalSearchParams<{ mood: keyof typeof MOOD_CONFIG }>();
  const moodData = useMemo(() => MOOD_CONFIG[mood] || MOOD_CONFIG.calm, [mood]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={moodData.colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{moodData.title}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Insights</Text>
            {moodData.insights.map((insight, index) => (
              <Text key={index} style={styles.insightText}>
                • {insight}
              </Text>
            ))}
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Suggestions</Text>
            {moodData.suggestions.map((suggestion, index) => (
              <Text key={index} style={styles.suggestionText}>
                • {suggestion}
              </Text>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  titleContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  insightText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 24,
  },
  suggestionText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 24,
  }
});

