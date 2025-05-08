import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  useColorScheme, 
  ActivityIndicator,
  BlurView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';
import { Svg, Circle, Path, G, Defs, Stop, RadialGradient, Text as SvgText, LinearGradient as SvgLinearGradient } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface StreakShareWidgetProps {
  streak: {
    id: string;
    title: string;
    type: 'build' | 'break';
    startDate: string;
    startTime: string;
    currentStreak: number;
    longestStreak: number;
    targetCount: number;
  };
  onClose?: () => void;
}

// Milestone days for special celebration
const MILESTONE_DAYS = [7, 21, 30, 50, 100, 150, 200, 365];

export default function StreakShareWidget({ streak, onClose }: StreakShareWidgetProps) {
  const viewRef = useRef<View>(null);
  const isDark = useColorScheme() === 'dark';
  const [isSharing, setIsSharing] = useState(false);
  
  const {
    title,
    type,
    startDate,
    currentStreak,
    longestStreak,
  } = streak;
  
  // Check if current streak is a milestone
  const isMilestone = MILESTONE_DAYS.includes(currentStreak);
  
  // Get time units
  const timeElapsed = getTimeElapsed(startDate);
  
  // Get special message based on streak day
  const shareMessage = getShareMessage(currentStreak, title);
  
  // Get gradient colors based on milestone status
  const gradientColors = getGradientColors(currentStreak, type, isDark);
  
  // Get progress percentage for circular progress
  const progressPercentage = calculateProgressPercentage(currentStreak, longestStreak);
  
  // Get platform-specific message based on streak
  const twitterText = `🔥 Day ${currentStreak} of my "${title}" streak! ${shareMessage} #uniwell #streaks`;
  const whatsappText = `*${title} - Day ${currentStreak}*\n\n${shareMessage}\n\nTracking with Uniwell 📱`;
  
  const handleShare = async (platform?: string) => {
    if (!viewRef.current) return;
    
    try {
      setIsSharing(true);
      
      // Capture the widget as an image
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });
      
      // Share the image
      if (platform) {
        // Platform-specific sharing logic would go here
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share your ${currentStreak} day streak!`,
        });
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share your ${currentStreak} day streak!`,
        });
      }
      
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>
          Share Your Streak
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Sharable Widget */}
      <View 
        ref={viewRef}
        style={[
          styles.shareWidget, 
          isDark && styles.darkShareWidget,
          isMilestone && styles.milestoneWidget
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.widgetBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Subtle background pattern */}
          <View style={styles.backgroundPattern}>
            <CircularPattern opacity={0.07} />
          </View>
          
          {/* App Logo/Branding */}
          <View style={styles.branding}>
            <BrandLogo isDark={isDark} />
          </View>
          
          {/* Streak Information */}
          <View style={styles.streakInfo}>
            {/* Main counter with circular progress */}
            <View style={styles.mainCounterContainer}>
              <CircularProgress 
                percentage={progressPercentage} 
                currentStreak={currentStreak} 
                size={180} 
                strokeWidth={10}
                colors={gradientColors}
              />
            </View>
            
            {/* Title and badge */}
            <View style={styles.titleContainer}>
              <Text style={styles.streakTitle} numberOfLines={2}>{title}</Text>
              <View style={styles.badgeContainer}>
                <View style={[styles.typeBadge, type === 'break' ? styles.breakBadge : styles.buildBadge]}>
                  <Octicons 
                    name={type === 'break' ? 'flame' : 'rocket'} 
                    size={14} 
                    color="#fff" 
                  />
                  <Text style={styles.typeBadgeText}>
                    {type === 'break' ? 'Breaking Habit' : 'Building Habit'}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Glass effect card for time units */}
            <View style={styles.glassCard}>
              <View style={styles.timeUnits}>
                {timeElapsed.years > 0 && (
                  <TimeUnit value={timeElapsed.years} label="YEARS" />
                )}
                
                {timeElapsed.months > 0 && (
                  <TimeUnit value={timeElapsed.months} label="MONTHS" />
                )}
                
                <TimeUnit value={timeElapsed.days} label="DAYS" />
                
                <TimeUnit value={timeElapsed.hours} label="HOURS" />
              </View>
            </View>
            
            {isMilestone && (
              <View style={styles.milestoneRibbon}>
                <View style={styles.ribbonBackground}>
                  <Svg height="40" width="200">
                    <Defs>
                      <SvgLinearGradient id="ribbonGradient" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFA500" stopOpacity="1" />
                      </SvgLinearGradient>
                    </Defs>
                    <Path 
                      d="M0,0 L180,0 L200,20 L180,40 L0,40 L20,20 Z" 
                      fill="url(#ribbonGradient)" 
                    />
                  </Svg>
                </View>
                <Text style={styles.milestoneText}>
                  {getMilestoneDescription(currentStreak)}
                </Text>
              </View>
            )}
            
            {/* Message card */}
            <View style={styles.messageCard}>
              <Text style={styles.shareMessage}>{shareMessage}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
      
      {/* Share Actions */}
      <View style={styles.shareActions}>
        <Text style={[styles.sharePrompt, isDark && styles.darkText]}>
          Share your progress
        </Text>
        
        <View style={styles.socialButtons}>
          {isSharing ? (
            <ActivityIndicator size="large" color={isDark ? "#FF7F50" : "#FF5500"} />
          ) : (
            <>
              <ShareButton 
                icon="logo-twitter" 
                label="Twitter" 
                color="#1DA1F2" 
                onPress={() => handleShare('twitter')}
              />
              
              <ShareButton 
                icon="logo-whatsapp" 
                label="WhatsApp" 
                color="#25D366" 
                onPress={() => handleShare('whatsapp')}
              />
              
              <ShareButton 
                icon="share-social" 
                label="More" 
                color="#FF7F50" 
                onPress={() => handleShare()}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

// Helper component for time units
const TimeUnit = ({ value, label }) => (
  <View style={styles.timeUnit}>
    <Text style={styles.timeValue}>{value}</Text>
    <Text style={styles.timeLabel}>{label}</Text>
  </View>
);

// Helper component for share buttons
const ShareButton = ({ icon, label, color, onPress }) => (
  <TouchableOpacity 
    style={[styles.shareButton, { backgroundColor: color }]} 
    onPress={onPress}
  >
    <Ionicons name={icon} size={20} color="#fff" />
    <Text style={styles.shareButtonText}>{label}</Text>
  </TouchableOpacity>
);

// Circular progress indicator component
const CircularProgress = ({ percentage, currentStreak, size, strokeWidth, colors }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors[0]} />
            <Stop offset="100%" stopColor={colors[1]} />
          </SvgLinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="rgba(255, 255, 255, 0.2)"
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="url(#progressGradient)"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={styles.progressCounter}>{currentStreak}</Text>
        <Text style={styles.progressLabel}>DAYS</Text>
      </View>
    </View>
  );
};

// Brand logo component
const BrandLogo = ({ isDark }) => (
  <View style={styles.logoContainer}>
    <Text style={styles.brandText}>uniwell</Text>
  </View>
);

// Circular pattern for background
const CircularPattern = ({ opacity }) => (
  <Svg height="100%" width="100%" viewBox="0 0 400 400">
    {Array.from({ length: 10 }).map((_, i) => (
      <Circle
        key={`circle-${i}`}
        cx={200}
        cy={200}
        r={20 + i * 20}
        stroke="white"
        strokeWidth="1"
        fill="none"
        opacity={opacity}
      />
    ))}
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * 45) * Math.PI / 180;
      const x1 = 200;
      const y1 = 200;
      const x2 = 200 + Math.cos(angle) * 400;
      const y2 = 200 + Math.sin(angle) * 400;
      return (
        <Path
          key={`line-${i}`}
          d={`M ${x1},${y1} L ${x2},${y2}`}
          stroke="white"
          strokeWidth="1"
          opacity={opacity}
        />
      );
    })}
  </Svg>
);

// Helper functions
function getTimeElapsed(startDate: string) {
  try {
    const start = new Date(startDate);
    const now = new Date();
    
    return {
      years: differenceInYears(now, start),
      months: differenceInMonths(now, start) % 12,
      days: differenceInDays(now, start) % 30,
      hours: new Date().getHours() % 24
    };
  } catch (error) {
    console.error('Error calculating time elapsed:', error);
    return { years: 0, months: 0, days: 0, hours: 0 };
  }
}

function calculateProgressPercentage(currentStreak: number, longestStreak: number): number {
  // If this is their longest streak, show 100%
  if (currentStreak >= longestStreak) {
    return 100;
  }
  
  // Otherwise calculate percentage
  return Math.min(100, Math.round((currentStreak / longestStreak) * 100));
}

function getShareMessage(days: number, title: string): string {
  // Special messages for milestones
  if (days === 7) return "First week complete! Building momentum.";
  if (days === 21) return "21 days to form a habit - milestone reached!";
  if (days === 30) return "1 month strong! This is becoming part of my life.";
  if (days === 50) return "50 days in! Halfway to the big 100.";
  if (days === 100) return "Triple digits! 100 days of consistent effort.";
  if (days === 365) return "A FULL YEAR! What an incredible journey.";
  
  // Regular messages
  const messages = [
    `Staying consistent with my ${title} streak!`,
    `Every day counts in building better habits.`,
    `Small steps, big impact. Day ${days} and counting!`,
    `Commitment pays off. Still going strong!`
  ];
  
  return messages[days % messages.length];
}

function getMilestoneDescription(days: number): string {
  if (days === 7) return "FIRST WEEK COMPLETE";
  if (days === 21) return "HABIT FORMING POINT";
  if (days === 30) return "ONE MONTH MILESTONE";
  if (days === 50) return "HALFWAY TO 100";
  if (days === 100) return "TRIPLE DIGITS ACHIEVED";
  if (days === 150) return "150 DAYS OF CONSISTENCY";
  if (days === 200) return "200 DAYS STRONG";
  if (days === 365) return "ONE YEAR ANNIVERSARY";
  return "KEEP IT UP";
}

function getGradientColors(days: number, type: 'build' | 'break', isDark: boolean): string[] {
  // Special gradients for milestones
  if (days === 7) return ['#5856D6', '#C969E0'];
  if (days === 21) return ['#5AC8FA', '#007AFF'];
  if (days === 30) return ['#34C759', '#30B0C7'];
  if (days === 50) return ['#FF9500', '#FF2D55'];
  if (days === 100) return ['#AF52DE', '#FF2D55'];
  if (days === 365) return ['#FFD700', '#FF9500'];
  
  // Default gradients with Apple-like colors
  if (type === 'break') {
    return isDark ? ['#FF3B30', '#8E8E93'] : ['#FF3B30', '#FF9500'];
  } else {
    return isDark ? ['#30B0C7', '#5856D6'] : ['#5AC8FA', '#007AFF'];
  }
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'SF-Pro-Text-Semibold',
  },
  darkText: {
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  shareWidget: {
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  darkShareWidget: {
    borderColor: '#333',
    borderWidth: 0.5,
  },
  milestoneWidget: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  widgetBackground: {
    padding: 20,
    minHeight: 450,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  branding: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  logoContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  brandText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.9,
    fontFamily: 'SF-Pro-Text-Bold',
    letterSpacing: 0.5,
  },
  streakInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 2,
    gap: 20,
  },
  mainCounterContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  progressCounter: {
    fontSize: 70,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'SF-Pro-Display-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressLabel: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 2,
    opacity: 0.9,
    fontFamily: 'SF-Pro-Text-Semibold',
    marginTop: -5,
  },
  titleContainer: {
    width: '100%',
    alignItems: 'center',
  },
  streakTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'SF-Pro-Display-Bold',
    marginBottom: 10,
  },
  badgeContainer: {
    marginBottom: 5,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  buildBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.7)',
  },
  breakBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.7)',
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF-Pro-Text-Semibold',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeUnits: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  timeUnit: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'SF-Pro-Text-Bold',
  },
  timeLabel: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
    letterSpacing: 1,
    fontFamily: 'SF-Pro-Text-Medium',
    marginTop: 2,
  },
  milestoneRibbon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 40,
    marginVertical: 5,
  },
  ribbonBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  milestoneText: {
    color: '#443100',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'SF-Pro-Text-Heavy',
    letterSpacing: 1,
  },
  messageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    backdropFilter: 'blur(5px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shareMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'SF-Pro-Text-Medium',
  },
  shareActions: {
    marginTop: 24,
    alignItems: 'center',
  },
  sharePrompt: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    fontFamily: 'SF-Pro-Text-Semibold',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    minWidth: 100,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'SF-Pro-Text-Semibold',
  },
});