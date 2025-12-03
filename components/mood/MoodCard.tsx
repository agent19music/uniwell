import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Platform } from "react-native";
import Slider from "@react-native-community/slider";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Ionicons } from "@expo/vector-icons";

import { MoodShape } from "./MoodShape";
import { AnimatedText } from "./AnimatedText";
import { useTheme } from "../../hooks/useTheme";
import { MoodType } from "../../contexts/MoodContext";
import { Menu } from "../Menu";

// Mood options mapping (aligned with MoodType from MoodContext)
// MoodType = 'happy' | 'calm' | 'stressed' | 'angry' | 'sad'
const MOOD_LABELS = [
  "Sad",         // 0 - Triangle (lowest mood)
  "Angry",       // 1 - Pentagon  
  "Stressed",    // 2 - Hexagon
  "Calm",        // 3 - Flower (5 bumps)
  "Happy",       // 4 - Circle (highest mood)
];

const MOOD_COLORS = [
  "#B8B3C8",  // Sad - Lavender/gray
  "#E89B8E",  // Angry - Coral
  "#F0D5D8",  // Stressed - Pink
  "#A8B896",  // Calm - Sage
  "#F4D03F",  // Happy - Yellow
];

const MOOD_IDS: MoodType[] = [
  "sad",
  "angry",
  "stressed",
  "calm",
  "happy",
];

interface MoodCardProps {
  onMoodSelect: (moodId: MoodType, moodLabel: string) => void;
  menuVisible: boolean;
  onMenuDismiss: () => void;
  onMenuOpen: () => void;
  menuItems: Array<{ label: string; icon: string; onPress: () => void }>;
}

export function MoodCard({
  onMoodSelect,
  menuVisible,
  onMenuDismiss,
  onMenuOpen,
  menuItems,
}: MoodCardProps) {
  const { colors, isDark } = useTheme();
  const value = useSharedValue(3 / (MOOD_LABELS.length - 1)); // Start at "Calm" (index 3 of 5)
  const [currentMoodIndex, setCurrentMoodIndex] = useState(3);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  useAnimatedReaction(
    () => value.value,
    (sliderValue) => {
      const newValue = Math.round(sliderValue * (MOOD_LABELS.length - 1));
      scheduleOnRN(setCurrentMoodIndex, newValue);
    }
  );

  const animatedColor = useAnimatedStyle(() => ({
    backgroundColor: withTiming(MOOD_COLORS[currentMoodIndex]),
  }));

  const handleConfirmMood = () => {
    const moodId = MOOD_IDS[currentMoodIndex];
    const moodLabel = MOOD_LABELS[currentMoodIndex];
    onMoodSelect(moodId, moodLabel);
    setHasConfirmed(true);
    // Reset after a short delay
    setTimeout(() => setHasConfirmed(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Animated.Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Daily Mood Log
        </Animated.Text>
        <Menu
          visible={menuVisible}
          onDismiss={onMenuDismiss}
          items={menuItems}
          trigger={
            <TouchableOpacity onPress={onMenuOpen}>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />
      </View>

      <View style={[styles.cardContainer, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
        {/* Mood Label with animated text */}
        <View style={styles.labelContainer}>
          <AnimatedText
            text={MOOD_LABELS[currentMoodIndex]}
            style={[styles.moodLabel, { color: colors.textPrimary }]}
          />
        </View>

        {/* Animated mood shape */}
        <Animated.View style={[styles.shapeContainer, animatedColor]}>
          <MoodShape
            progress={currentMoodIndex}
            fillColor={isDark ? "#FFFFFF" : "#FFFFFF"}
            faceColor={isDark ? "#1A1A1A" : "#1A1A1A"}
          />
        </Animated.View>

        {/* Slider */}
        <View style={[styles.sliderContainer, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={value.value}
            onValueChange={(sliderValue) => {
              value.value = sliderValue;
            }}
            minimumTrackTintColor={MOOD_COLORS[currentMoodIndex]}
            maximumTrackTintColor={isDark ? "#3A3A3A" : "#E8DDD6"}
            thumbTintColor={Platform.OS === 'android' ? MOOD_COLORS[currentMoodIndex] : undefined}
          />
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            { 
              backgroundColor: hasConfirmed ? colors.success : MOOD_COLORS[currentMoodIndex],
              opacity: hasConfirmed ? 0.7 : 1,
            }
          ]}
          onPress={handleConfirmMood}
          disabled={hasConfirmed}
        >
          <Animated.Text style={[styles.confirmButtonText, { color: "#FFFFFF" }]}>
            {hasConfirmed ? "Recorded!" : "Log Mood"}
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Vercetti-Regular",
  },
  cardContainer: {
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  labelContainer: {
    marginBottom: 20,
    height: 30,
    justifyContent: "center",
  },
  moodLabel: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "Vercetti-Regular",
  },
  shapeContainer: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 70,
    marginBottom: 24,
  },
  sliderContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  confirmButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    minWidth: 140,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Vercetti-Regular",
  },
});
