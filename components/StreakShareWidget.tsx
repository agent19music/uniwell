import React, { useRef, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  useColorScheme, 
  Dimensions,
  Platform,
  PixelRatio
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Svg, { 
  Circle, 
  Path, 
  Defs, 
  LinearGradient as SvgLinearGradient, 
  Stop, 
  G 
} from 'react-native-svg';

const { width } = Dimensions.get('window');

// --- Types ---
interface StreakShareWidgetProps {
  streak: {
    id: string;
    title: string;
    type: 'build' | 'break';
    startDate: string; // ISO string
    currentStreak: number;
    longestStreak: number;
    targetCount?: number;
  };
  onClose?: () => void;
}

// --- Helper Functions (Embedded for portability) ---
const getShareMessage = (streak: number, title: string) => {
  if (streak >= 100) return `Triple digits on ${title}! 💯`;
  if (streak >= 30) return `Month long focus on ${title}! 🌙`;
  if (streak >= 7) return `One week strong on ${title}! 🔥`;
  return `Building momentum on ${title} ✨`;
};

const getTimeElapsed = (startDateStr: string) => {
  const start = new Date(startDateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return { daysTotal: diffDays };
};

// --- Components ---

/**
 * A soft glow background component
 */
const SoftGlow = ({ color, size = 60 }: { color: string; size?: number }) => (
  <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.25,
        transform: [{ scale: 1.5 }],
      }}
    />
    <View
      style={{
        position: 'absolute',
        width: size * 0.7,
        height: size * 0.7,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.4,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
      }}
    />
  </View>
);

/**
 * The Main Widget
 */
export default function StreakShareWidget({ streak, onClose }: StreakShareWidgetProps) {
  const viewRef = useRef<View>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isSharing, setIsSharing] = useState(false);
  
  const {
    title,
    type,
    startDate,
    currentStreak,
    longestStreak,
  } = streak;

  const isFire = type === 'build';
  // Theme Colors extracted from inspo
  const theme = {
    bg: isDark ? '#121212' : '#F5F7FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textMain: isDark ? '#FFFFFF' : '#1A1C20',
    textSub: isDark ? '#A0A0A0' : '#8E94A5',
    accent: isFire ? '#FF5252' : '#4CAF50', // Red/Pink for build, Green for break (or vice versa based on preference)
    accentGradient: isFire ? ['#FF8A80', '#FF5252'] : ['#66BB6A', '#43A047'],
    glow: isFire ? '#FF5252' : '#4CAF50',
    divider: isDark ? '#333' : '#F0F0F0',
  };

  const handleShare = async () => {
    if (!viewRef.current) return;
    try {
      setIsSharing(true);
      // Wait a tick for UI to settle if needed
      setTimeout(async () => {
        const uri = await captureRef(viewRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile'
        });
        
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share your ${currentStreak} day streak!`,
        });
        setIsSharing(false);
      }, 100);
    } catch (error) {
      console.error('Error sharing:', error);
      setIsSharing(false);
    }
  };

  // Calculate progress for the ring (max 100 for visual effect or relative to longest)
  const progress = Math.min((currentStreak / (longestStreak || currentStreak * 1.2)) * 100, 100);
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#EEF1F5' }]}>
      {/* Header Controls */}
      <View style={styles.controlsHeader}>
        <TouchableOpacity onPress={onClose} style={styles.iconButton}>
          <Ionicons name="close" size={24} color={theme.textMain} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleShare} 
          style={[styles.shareButton, { backgroundColor: theme.textMain }]}
          disabled={isSharing}
        >
          {isSharing ? (
            <Ionicons name="hourglass-outline" size={16} color={theme.card} />
          ) : (
            <>
              <Ionicons name="share-outline" size={16} color={theme.card} style={{ marginRight: 6 }} />
              <Text style={[styles.shareText, { color: theme.card }]}>Share</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* --- CAPTURE AREA START --- 
        This View is what gets turned into an image.
        We add generous padding and shadows to make it look like a premium sticker.
      */}
      <View 
        ref={viewRef}
        collapsable={false}
        style={[
          styles.cardContainer, 
          { 
            backgroundColor: theme.card,
            shadowColor: isDark ? '#000' : '#8890A0',
          }
        ]}
      >
        {/* Top Row: Icon & Branding */}
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <SoftGlow color={theme.glow} size={45} />
            <MaterialCommunityIcons 
              name={type === 'break' ? 'leaf' : 'fire'} 
              size={28} 
              color={theme.accent} 
              style={{ zIndex: 2 }}
            />
          </View>
          
          {/* Right: App Branding */}
          <View style={styles.brandingContainer}>
            <View style={[styles.logoIcon, { backgroundColor: theme.textMain }]}>
               {/* Simple Abstract 'U' Logo representation */}
               <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                 <Path d="M4 4V11C4 15.4183 7.58172 19 12 19V19C16.4183 19 20 15.4183 20 11V4" stroke={theme.card} strokeWidth="4" strokeLinecap="round"/>
               </Svg>
            </View>
            <Text style={[styles.appName, { color: theme.textSub }]}>UNIWELL</Text>
          </View>
        </View>

        {/* Main Center: Big Numbers */}
        <View style={styles.mainContent}>
          <View style={styles.textColumn}>
            <Text style={[styles.streakLabel, { color: theme.textSub }]}>CURRENT STREAK</Text>
            <View style={styles.numberRow}>
              <Text style={[styles.bigNumber, { color: theme.textMain }]}>
                {currentStreak}
              </Text>
              <Text style={[styles.daysLabel, { color: theme.textSub }]}>Days</Text>
            </View>
            <Text style={[styles.habitTitle, { color: theme.textMain }]} numberOfLines={1}>
              {title}
            </Text>
          </View>

          {/* Visual Ring Chart */}
          <View style={styles.ringContainer}>
            <Svg width="120" height="120" viewBox="0 0 120 120">
              <Defs>
                <SvgLinearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={theme.accentGradient[0]} stopOpacity="1" />
                  <Stop offset="1" stopColor={theme.accentGradient[1]} stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              {/* Background Circle */}
              <Circle
                cx="60"
                cy="60"
                r={radius}
                stroke={isDark ? "#333" : "#F0F0F0"}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress Circle */}
              <Circle
                cx="60"
                cy="60"
                r={radius}
                stroke="url(#progressGrad)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              {/* Inner Percent Text */}
              <G x="60" y="60">
                 {/* Simple icon inside ring */}
                 <Circle cx="0" cy="0" r="35" fill={isDark ? "#252525" : "#F8F9FB"} />
              </G>
            </Svg>
             <View style={styles.ringIconAbsolute}>
                <MaterialCommunityIcons name="trophy-variant-outline" size={24} color={theme.textSub} />
             </View>
          </View>
        </View>

        {/* Bottom Divider & Stats */}
        <View style={styles.footer}>
          <View style={[styles.statBox, { backgroundColor: isDark ? '#252525' : '#F8F9FB' }]}>
             <Text style={[styles.statLabel, { color: theme.textSub }]}>LONGEST</Text>
             <View style={styles.statValueRow}>
                <Ionicons name="trending-up" size={14} color={theme.accent} style={{ marginRight: 4 }} />
                <Text style={[styles.statValue, { color: theme.textMain }]}>{longestStreak} Days</Text>
             </View>
          </View>

          <View style={[styles.statBox, { backgroundColor: isDark ? '#252525' : '#F8F9FB' }]}>
             <Text style={[styles.statLabel, { color: theme.textSub }]}>STARTED</Text>
             <View style={styles.statValueRow}>
                <Ionicons name="calendar-outline" size={14} color={theme.textSub} style={{ marginRight: 4 }} />
                <Text style={[styles.statValue, { color: theme.textMain }]}>
                  {new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
             </View>
          </View>
        </View>

        {/* Decorative Noise/Texture (Optional visual flair) */}
        <View style={styles.textureOverlay} pointerEvents="none" />
      </View>
      {/* --- CAPTURE AREA END --- */}

      <Text style={[styles.instructionText, { color: theme.textSub }]}>
        Preview of your shareable card
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  controlsHeader: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(150,150,150,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  shareText: {
    fontWeight: '600',
    fontSize: 14,
  },
  instructionText: {
    marginTop: 30,
    fontSize: 13,
    opacity: 0.6,
  },
  
  // --- CARD STYLES ---
  cardContainer: {
    width: width * 0.88,
    maxWidth: 380,
    borderRadius: 32,
    padding: 24,
    // The Inspiration Shadow Logic
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08, // Very subtle
    shadowRadius: 24,
    elevation: 12, // Android
    alignItems: 'center',
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(120,120,120,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  logoIcon: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  appName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  mainContent: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  textColumn: {
    flex: 1,
    paddingRight: 10,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bigNumber: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 60,
  },
  daysLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 6,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.9,
  },
  
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringIconAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  footer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.6,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    backgroundColor: 'transparent', // In a real app, you might use an image pattern here
    zIndex: -1,
  }
});