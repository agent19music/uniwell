import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity } from 'react-native';
import {ClassBlock, ClassInfo} from '@/components/schedule/ClassBlock';
import {CurrentTimeIndicator} from '@/components/schedule/CurrentTimeIndicator';

interface TimeGridProps {
  isDark: boolean;
  currentDate: Date;
  classes: ClassInfo[];
  viewMode: 'day' | 'week';
  onDaySelect?: (date: Date) => void;
  onSwipeChangeWeek?: (direction: number) => void;
  getClassesForDay?: (date: Date) => ClassInfo[];
}

export const TimeGrid = ({ isDark, currentDate, classes, viewMode, onDaySelect, onSwipeChangeWeek, getClassesForDay }: TimeGridProps) => {
  const styles = useTimeGridStyles(isDark);
  // Display hours from 6 AM to 10 PM (common class hours)
  const visibleTimeSlots = Array.from({ length: 17 }, (_, i) => i + 6); // 6-22 hours
  const { width } = Dimensions.get('window');
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  
  // For week view
  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get the days for the current week
  const getDaysOfWeek = () => {
    const days = [];
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr);
      day.setDate(first + i);
      days.push(day);
    }
    
    return days;
  };
  
  const weekDays = getDaysOfWeek();
  
  // Handle swipe gestures for week view
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 100 && onSwipeChangeWeek) {
          // Swiped right - previous week
          Animated.timing(slideAnim, {
            toValue: width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            slideAnim.setValue(-width);
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
            onSwipeChangeWeek(-1);
          });
        } else if (gestureState.dx < -100 && onSwipeChangeWeek) {
          // Swiped left - next week
          Animated.timing(slideAnim, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            slideAnim.setValue(width);
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
            onSwipeChangeWeek(1);
          });
        } else {
          // Return to center if swipe wasn't far enough
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderMove: (_, gestureState) => {
        slideAnim.setValue(gestureState.dx);
      },
    })
  ).current;
  
  // Animate view changes
  useEffect(() => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: viewMode === 'day' ? 0.9 : 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [viewMode, currentDate]);
  
  // Calculate the offset for rendering (hours are now starting from 6 AM (0px) instead of 0 AM)
  const timeToPosition = (hour: number, minute: number = 0) => {
    // Convert to minutes since 6 AM
    return ((hour - 6) * 60) + minute;
  };
  
  // Filter classes for a specific day (use provided callback when available)
  const localGetClassesForDay = (date: Date) => {
    if (getClassesForDay) return getClassesForDay(date);
    const dayIndex = date.getDay();
    // Fallback: show all provided classes (already filtered upstream)
    return classes;
  };
  
  // Day view rendering
  const renderDayView = () => (
    <Animated.View 
      style={[
        styles.timeGrid, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
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
        {visibleTimeSlots.map((hour, index) => (
          <View 
            key={hour} 
            style={[
              styles.hourDivider, 
              isDark && styles.darkHourDivider,
              { top: index * 60 } 
            ]} 
          />
        ))}
        
        {/* Half-hour lines (more subtle) */}
        {visibleTimeSlots.map((hour, index) => (
          <View 
            key={`half-${hour}`} 
            style={[
              styles.halfHourDivider, 
              isDark && styles.darkHalfHourDivider,
              { top: (index * 60) + 30 } 
            ]} 
          />
        ))}
        
        <CurrentTimeIndicator currentDate={currentDate} isDark={isDark} />
        
        {/* Classes/Events with adjusted positioning */}
        {classes.map(classInfo => {
          const topPosition = timeToPosition(classInfo.startTime);
          
          return (
            <ClassBlock 
              key={classInfo.id} 
              classInfo={{
                ...classInfo,
                positionTop: topPosition
              }}
              isDark={isDark}
              onEdit={() => { /* Handle edit */ }}
              onDelete={() => { /* Handle delete */ }}
            />
          );
        })}
      </View>
    </Animated.View>
  );
  
  // Week view rendering
  const renderWeekView = () => (
    <Animated.View 
      style={[
        styles.weekContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateX: slideAnim }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* Day headers */}
      <View style={styles.weekHeader}>
        <View style={styles.timeHeaderSpacer} />
        {weekDays.map((day, index) => {
          const isToday = day.toDateString() === new Date().toDateString();
          const isSelected = day.toDateString() === currentDate.toDateString();
          
          return (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.dayHeader,
                isToday && styles.todayHeader,
                isSelected && styles.selectedDayHeader
              ]}
              onPress={() => onDaySelect && onDaySelect(day)}
            >
              <Text style={[
                styles.dayName, 
                isDark && styles.darkDayName,
                isToday && styles.todayText,
                isSelected && styles.selectedDayText
              ]}>
                {DAYS_OF_WEEK[day.getDay()]}
              </Text>
              <Text style={[
                styles.dayDate, 
                isDark && styles.darkDayDate,
                isToday && styles.todayText,
                isSelected && styles.selectedDayText
              ]}>
                {day.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Time grid */}
      <View style={styles.weekGrid}>
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
        
        {/* Days columns with grid lines */}
        <View style={styles.daysContainer}>
          {/* Horizontal hour lines */}
          {visibleTimeSlots.map((hour, index) => (
            <View 
              key={hour} 
              style={[
                styles.hourDivider, 
                isDark && styles.darkHourDivider,
                { top: index * 60 } 
              ]} 
            />
          ))}
          
          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const dayClasses = localGetClassesForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <View 
                key={dayIndex} 
                style={[
                  styles.dayColumn,
                  isToday && styles.todayColumn
                ]}
              >
                {/* Classes for this day */}
                {dayClasses.map(classInfo => {
                  const topPosition = timeToPosition(classInfo.startTime);
                  
                  return (
                    <ClassBlock 
                      key={classInfo.id} 
                      classInfo={{
                        ...classInfo,
                        positionTop: topPosition
                      }}
                      isDark={isDark}
                      isWeekView
                      onEdit={() => { /* Handle edit */ }}
                      onDelete={() => { /* Handle delete */ }}
                    />
                  );
                })}
                
                {/* Current time indicator */}
                {isToday && (
                  <CurrentTimeIndicator currentDate={day} isDark={isDark} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
  
  return viewMode === 'day' ? renderDayView() : renderWeekView();
};

const useTimeGridStyles = (isDark: boolean) => StyleSheet.create({
  timeGrid: {
    flexDirection: 'row',
    flex: 1,
    paddingBottom: 100, // Space at bottom for scrolling past last hour
  },
  weekContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  weekHeader: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#2C2C2E' : '#E0E0E0',
  },
  timeHeaderSpacer: {
    width: 60,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  todayHeader: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
  },
  selectedDayHeader: {
    backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  darkDayName: {
    color: '#0A84FF',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '500',
    color: isDark ? '#FFFFFF' : '#000000',
  },
  darkDayDate: {
    color: '#FFFFFF',
  },
  todayText: {
    color: '#FF3B30',
  },
  selectedDayText: {
    fontWeight: '600',
  },
  weekGrid: {
    flexDirection: 'row',
    flex: 1,
  },
  daysContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  dayColumn: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: 1,
    borderLeftColor: isDark ? '#2C2C2E' : '#E9E9E9',
  },
  todayColumn: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
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
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  darkHalfHourDivider: {
    backgroundColor: '#242426',
  },
});