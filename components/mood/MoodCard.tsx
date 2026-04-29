import React, { useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Platform } from "react-native";
import Slider from "@react-native-community/slider";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  useAnimatedRef,
  runOnUI,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Ionicons } from "@expo/vector-icons";
import { format, formatDistanceToNow } from "date-fns";

import { MoodShape } from "./MoodShape";
import { AnimatedText } from "./AnimatedText";
import { useTheme } from "../../hooks/useTheme";
import { MoodType, MoodEntry } from "../../contexts/MoodContext";
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
  onViewWeeklyReport: () => void;
  currentMood: MoodEntry | null;
  todaysMoodRecorded: boolean;
}

// Map MoodType to index for display
const MOOD_TYPE_TO_INDEX: Record<MoodType, number> = {
  sad: 0,
  angry: 1,
  stressed: 2,
  calm: 3,
  happy: 4,
};

export function MoodCard({
  onMoodSelect,
  onViewWeeklyReport,
  currentMood,
  todaysMoodRecorded,
}: MoodCardProps) {
  const { colors, isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(!todaysMoodRecorded);
  const [menuVisible, setMenuVisible] = useState(false);
  const value = useSharedValue(3 / (MOOD_LABELS.length - 1)); // Start at "Calm" (index 3 of 5)
  const [currentMoodIndex, setCurrentMoodIndex] = useState(3);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  // Update expansion state when todaysMoodRecorded changes
  useEffect(() => {
    if (todaysMoodRecorded && !hasConfirmed) {
      setIsExpanded(false);
    }
  }, [todaysMoodRecorded]);

  // Set initial mood index based on current mood
  useEffect(() => {
    if (currentMood) {
      const index = MOOD_TYPE_TO_INDEX[currentMood.moodType];
      setCurrentMoodIndex(index);
      value.value = index / (MOOD_LABELS.length - 1);
    }
  }, [currentMood]);

  // Menu items for the collapsed state
  const menuItems = [
    { 
      label: 'Update Mood', 
      icon: 'create-outline', 
      onPress: () => {
        setIsExpanded(true);
        setMenuVisible(false);
      }
    },
    { 
      label: 'View Weekly Summary', 
      icon: 'stats-chart-outline', 
      onPress: () => {
        onViewWeeklyReport();
        setMenuVisible(false);
      }
    },
  ];

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
    // Collapse after a short delay
    setTimeout(() => {
      setHasConfirmed(false);
      setIsExpanded(false);
    }, 1500);
  };

  // Format last logged time
  const getLastLoggedText = () => {
    if (!currentMood?.createdAt) return null;
    const date = new Date(currentMood.createdAt);
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    return timeAgo;
  };

  // Get current mood display info
  const getCurrentMoodDisplay = () => {
    if (!currentMood) return null;
    const index = MOOD_TYPE_TO_INDEX[currentMood.moodType];
    return {
      label: MOOD_LABELS[index],
      color: MOOD_COLORS[index],
      index,
    };
  };

  const moodDisplay = getCurrentMoodDisplay();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Animated.Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Daily Mood Log
        </Animated.Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          items={menuItems}
          trigger={
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />
      </View>

      {/* Collapsed State - Show mood summary */}
      {!isExpanded && todaysMoodRecorded && moodDisplay && (
        <TouchableOpacity 
          style={[styles.collapsedCard, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}
          onPress={() => setIsExpanded(true)}
          activeOpacity={0.8}
        >
          <View style={styles.collapsedContent}>
            <View style={[styles.collapsedShapeContainer, { backgroundColor: moodDisplay.color }]}>
              <MoodShape
                progress={moodDisplay.index}
                fillColor="#FFFFFF"
                faceColor="#1A1A1A"
              />
            </View>
            <View style={styles.collapsedTextContainer}>
              <Animated.Text style={[styles.collapsedMoodLabel, { color: colors.textPrimary }]}>
                Feeling {moodDisplay.label}
              </Animated.Text>
              <Animated.Text style={[styles.collapsedTimeLabel, { color: colors.textSecondary }]}>
                Logged {getLastLoggedText()}
              </Animated.Text>
            </View>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Expanded State - Full mood picker */}
      {(isExpanded || !todaysMoodRecorded) && (
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
            {hasConfirmed ? "Recorded!" : todaysMoodRecorded ? "Update Mood" : "Log Mood"}
          </Animated.Text>
        </TouchableOpacity>
      </View>
      )}
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
  // Collapsed state styles
  collapsedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 24,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  collapsedContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  collapsedShapeContainer: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    marginRight: 16,
  },
  collapsedTextContainer: {
    flex: 1,
  },
  collapsedMoodLabel: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Vercetti-Regular",
    marginBottom: 4,
  },
  collapsedTimeLabel: {
    fontSize: 14,
    fontFamily: "Vercetti-Regular",
  },
  // Expanded state styles
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
