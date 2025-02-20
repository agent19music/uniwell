import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const SleepCard = ({ onPress, isDark, lastNightSleep }) => (
  <TouchableOpacity 
    style={[styles.sleepCard, isDark && styles.darkCard]} 
    onPress={onPress}
  >
    <View style={styles.sleepIconContainer}>
      <Ionicons 
        name="moon" 
        size={32} 
        color="#9B59B6" 
      />
      <View style={styles.sleepStats}>
        <Text style={[styles.sleepHours, isDark && styles.darkText]}>
          {lastNightSleep.hours}h {lastNightSleep.minutes}m
        </Text>
        <Text style={[styles.sleepQuality, { color: getQualityColor(lastNightSleep.quality) }]}>
          {getSleepQualityText(lastNightSleep.quality)}
        </Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={24} color={isDark ? '#aaaaaa' : '#666'} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
    // ... existing container and dark mode styles ...
    
    sleepCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'white',
      padding: 16,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 12,
      marginTop: 24,
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
    },
    sleepQuality: {
      fontSize: 14,
      fontWeight: '500',
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
    },
    statLabel: {
      fontSize: 14,
      color: '#666',
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
    
    // ... add remaining style properties following the existing pattern ...
  });

function getQualityColor(quality: number): string {
  if (quality >= 80) {
    return '#2ecc71'; // Green for good quality
  } else if (quality >= 50) {
    return '#f1c40f'; // Yellow for average quality
  } else {
    return '#e74c3c'; // Red for poor quality
  }
}
function getSleepQualityText(quality: number): string {
    if (quality >= 80) {
        return 'Good';
    } else if (quality >= 50) {
        return 'Average';
    } else {
        return 'Poor';
    }
}

