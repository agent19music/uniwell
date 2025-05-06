import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {ClassBlock, ClassInfo} from '@/components/schedule/ClassBlock'; // Assuming you have a ClassBlock component
import {CurrentTimeIndicator} from '@/components/schedule/CurrentTimeIndicator'; // Assuming you have a CurrentTimeIndicator component

interface TimeGridProps {
    isDark: boolean;
    currentDate: Date;
    classes: ClassInfo[];
  }
  
  export const TimeGrid = ({ isDark, currentDate, classes }: TimeGridProps) => {
    const styles = useTimeGridStyles(isDark);
    const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours
    const visibleTimeSlots = TIME_SLOTS.filter(hour => hour >= 6 && hour <= 22);
    
    return (
      <View style={styles.timeGrid}>
        {/* Time labels */}
        <View style={styles.timeLabels}>
          {visibleTimeSlots.map(hour => (
            <View key={hour} style={styles.timeSlot}>
              <Text style={[styles.timeLabel, isDark && styles.darkTimeLabel]}>
                {hour === 0 ? '12 AM' : 
                 hour < 12 ? `${hour} AM` : 
                 hour === 12 ? '12 PM' : 
                 `${hour - 12} PM`}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Time grid with events */}
        <View style={styles.eventsContainer}>
          {/* Horizontal hour lines */}
          {visibleTimeSlots.map(hour => (
            <View key={hour} style={[styles.hourDivider, isDark && styles.darkHourDivider]} />
          ))}
          
          {/* Half-hour lines (more subtle) */}
          {visibleTimeSlots.map(hour => (
            <View 
              key={`half-${hour}`} 
              style={[
                styles.halfHourDivider, 
                isDark && styles.darkHalfHourDivider
              ]} 
            />
          ))}
          
          <CurrentTimeIndicator currentDate={currentDate} isDark={isDark} />
          
          {/* Classes/Events */}
          {classes.map(classInfo => (
            <ClassBlock 
              key={classInfo.id} 
              classInfo={classInfo} 
              isDark={isDark}
              onEdit={() => { /* Handle edit */ }}
              onDelete={() => { /* Handle delete */ }}
            />
          ))}
        </View>
      </View>
    );
  };
  
  const useTimeGridStyles = (isDark: boolean) => StyleSheet.create({
    timeGrid: {
      flexDirection: 'row',
      flex: 1,
      paddingBottom: 100, // Space at bottom for scrolling past last hour
    },
    timeLabels: {
      width: 60,
      paddingRight: 10,
      alignItems: 'flex-end',
    },
    timeSlot: {
      height: 60,
      justifyContent: 'flex-start',
      paddingTop: 5,
    },
    timeLabel: {
      fontSize: 12,
      color: '#8E8E93',
      fontWeight: '500',
    },
    darkTimeLabel: {
      color: '#8E8E93',
    },
    eventsContainer: {
      flex: 1,
      position: 'relative',
    },
    hourDivider: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: '#E0E0E0',
    },
    darkHourDivider: {
      backgroundColor: '#2C2C2E',
    },
    halfHourDivider: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 30,
      height: 1,
      backgroundColor: '#F0F0F0',
    },
    darkHalfHourDivider: {
      backgroundColor: '#242426',
    },
  });