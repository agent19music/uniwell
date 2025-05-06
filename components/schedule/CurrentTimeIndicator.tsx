import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface CurrentTimeIndicatorProps {
    currentDate: Date;
    isDark: boolean;
  }
  
 export const CurrentTimeIndicator = ({ currentDate, isDark }: CurrentTimeIndicatorProps) => {
    const styles = useCurrentTimeIndicatorStyles(isDark);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();
    
    // Only show on current day
    if (currentDay !== currentDate.getDay()) {
      return null;
    }
    
    // Calculate position (hours since 6am + minutes)
    const position = (currentHour * 60) + currentMinute;
    
    return (
      <View style={[styles.currentTimeIndicator, { top: position }]}>
        <View style={styles.currentTimeDot} />
        <View style={styles.currentTimeLine} />
      </View>
    );
  };
  
  const useCurrentTimeIndicatorStyles = (isDark: boolean) => StyleSheet.create({
    currentTimeIndicator: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 10,
    },
    currentTimeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF3B30',
      marginRight: -4,
      marginLeft: -4,
    },
    currentTimeLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#FF3B30',
    },
  });