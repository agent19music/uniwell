import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MOOD_CONFIG = {
  happy: {
    colors: ['#FFE259', '#FFA751', '#FFD700'],
    icon: 'emoticon-excited-outline',
    title: 'Radiating Happy Vibes! ✨',
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
    icon: 'weather-cloudy',
    title: 'Zen Mode: Activated 🧘‍♂️',
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
    colors: ['#ff6b6b', '#ff8e8e', '#ff4757'],
    icon: 'lightning-bolt',
    title: 'Code Red: Stress Alert ⚡',
    insights: [
      "Your stress level isn't just high, it's having coffee ☕",
      "Remember: Even rubber bands need to relax sometimes",
      "You're handling this better than a cat handles a cucumber 🐱"
    ],
    suggestions: [
      "Breathe like Darth Vader (minus the dark side parts)",
      "Stress-ball wrestling championship: You vs. Anxiety",
      "List three things you can control (your hair doesn't count today)"
    ]
  },
  sad: {
    colors: ['#4b6cb7', '#182848', '#1e3c72'],
    icon: 'cloud-rain',
    title: 'Feeling Blue (But That is Okay) 💙',
    insights: [
      "Even the Pixar movie 'Inside Out' showed sadness has value 💙",
      "You're not alone - even rainbow clouds rain sometimes",
      "This too shall pass (it's not just a coffee mug quote)"
    ],
    suggestions: [
      "Wrap yourself in a blanket burrito of comfort",
      "Watch cute animal videos (doctor's orders)",
      "Text a friend - even if it's just to share sad face emojis"
    ]
  },
  angry: {
    colors: ['#833ab4', '#fd1d1d', '#7303c0'],
    icon: 'fire',
    title: 'Spicy Mood Activated 🌶️',
    insights: [
      "Your inner volcano is having a moment. Respect. 🌋",
      "Plot twist: Your anger is actually your boundaries speaking up",
      "Channel this energy - you could probably power a small city"
    ],
    suggestions: [
      "Punch a pillow (pillows can take it, they're tough)",
      "Write an angry letter, then make it into a paper airplane",
      "Do some rage cleaning (your room could use it anyway)"
    ]
  }
};

const AnimatedGradientBackground = ({ colors }: { colors: string[] }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: false,
        })
      ]).start(() => animate());
    };
    animate();
  }, []);

  const interpolatedColors = colors.map((color: string, index: number) => {
    return animatedValue.interpolate({
      inputRange: [0, 0.5, 1], 
      outputRange: [
        colors[index],
        colors[(index + 1) % colors.length],
        colors[index]
      ],
    });
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill]}>
      <LinearGradient
        colors={interpolatedColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

export default function MoodDetailPage() {
  const { mood } = useLocalSearchParams<{ mood: keyof typeof MOOD_CONFIG }>();
  const moodData = useMemo(() => MOOD_CONFIG[mood] || MOOD_CONFIG.calm, [mood]);

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedGradientBackground colors={moodData.colors} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons 
            name={moodData.icon} 
            size={40} 
            color="white" 
            style={styles.icon}
          />
          <Text style={styles.title}>{moodData.title}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Real Talk Insights</Text>
          {moodData.insights.map((insight, index) => (
            <Text key={index} style={styles.contentText}>
              • {insight}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What Now?</Text>
          {moodData.suggestions.map((suggestion, index) => (
            <Text key={index} style={styles.contentText}>
              • {suggestion}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  contentText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 24,
  }
});