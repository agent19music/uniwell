import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import {ClassBlock, ClassInfo} from '@/components/schedule/ClassBlock';
import {CurrentTimeIndicator} from '@/components/schedule/CurrentTimeIndicator';
import {ClassDetailDialog} from '@/components/schedule/ClassDetailDialog';

interface TimeGridProps {
  isDark: boolean;
  currentDate: Date;
  classes: ClassInfo[];
  viewMode: 'day' | 'week';
  onDaySelect?: (date: Date) => void;
  onSwipeChangeWeek?: (direction: number) => void;
  getClassesForDay?: (date: Date) => ClassInfo[];
  calculateAttendance?: (classId: string) => number;
}

export const TimeGrid = ({ isDark, currentDate, classes, viewMode, onDaySelect, onSwipeChangeWeek, getClassesForDay, calculateAttendance }: TimeGridProps) => {
  const styles = useTimeGridStyles(isDark);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  
  // Display hours from 6 AM to 10 PM (common class hours)
  const visibleTimeSlots = Array.from({ length: 17 }, (_, i) => i + 6); // 6-22 hours
  const { width } = Dimensions.get('window');
  
  // Use calculateAttendance if provided, otherwise return 0
  const getAttendanceRate = (classId?: string) => {
    if (!classId || !calculateAttendance) return undefined;
    return calculateAttendance(classId);
  };
  
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
          const attendanceRate = getAttendanceRate(classInfo.classId);
          
          return (
            <ClassBlock 
              key={classInfo.id} 
              classInfo={{
                ...classInfo,
                positionTop: topPosition,
                attendanceRate: attendanceRate
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
  
  // Week view rendering - List style
  const renderWeekView = () => {
    const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return (
      <Animated.View 
        style={[
          styles.weekListContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.weekListContent}
        >
          {weekDays.map((day, index) => {
            const dayClasses = localGetClassesForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const dateNum = day.getDate();
            const monthName = MONTHS_SHORT[day.getMonth()];
            const dayName = DAYS_SHORT[day.getDay()];
            
            return (
              <View key={index} style={[styles.weekListRow, isToday && styles.weekListRowToday]}>
                {/* Date Column */}
                <View style={styles.weekDateColumn}>
                  <Text style={[styles.weekDayName, isDark && styles.darkText, isToday && styles.accentText]}>
                    {dayName}
                  </Text>
                  <Text style={[styles.weekDateNumber, isDark && styles.darkText, isToday && styles.accentText]}>
                    {monthName} {dateNum}
                  </Text>
                </View>

                {/* Classes Column */}
                <View style={styles.weekClassesColumn}>
                  {dayClasses.length > 0 ? (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false} 
                      style={styles.classesScroll}
                      contentContainerStyle={styles.classesScrollContent}
                    >
                      {dayClasses.map((classInfo, idx) => (
                        <TouchableOpacity
                          key={`${classInfo.id}-${idx}`}
                          style={[
                            styles.classPill,
                            { backgroundColor: classInfo.color }
                          ]}
                          onPress={() => {
                            setSelectedClass(classInfo);
                            setDialogVisible(true);
                          }}
                          activeOpacity={0.9}
                        >
                          <View style={styles.pillHeader}>
                            <Text style={styles.pillCode}>{classInfo.id}</Text>
                            {classInfo.attendanceRate !== undefined && (
                              <View style={[
                                styles.pillAttendanceDot,
                                {
                                  backgroundColor: classInfo.attendanceRate >= 80 ? '#4CD964' :
                                                 classInfo.attendanceRate >= 60 ? '#FF9500' :
                                                 '#FF3B30'
                                }
                              ]} />
                            )}
                          </View>
                          <Text style={styles.pillName} numberOfLines={1}>{classInfo.name}</Text>
                          <Text style={styles.pillTime}>
                            {classInfo.startTimeString} - {classInfo.endTimeString}
                          </Text>
                          {classInfo.location && (
                             <Text style={styles.pillLocation} numberOfLines={1}>📍 {classInfo.location}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyDayContainer}>
                      <Text style={[styles.emptyDayText, isDark && styles.darkSubText]}>
                        No classes
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          <View style={{height: 100}} /> 
        </ScrollView>
        
        <ClassDetailDialog
          visible={dialogVisible}
          classInfo={selectedClass}
          isDark={isDark}
          onClose={() => setDialogVisible(false)}
        />
      </Animated.View>
    );
  };
  
  return viewMode === 'day' ? renderDayView() : renderWeekView();
};

const { width: screenWidth } = Dimensions.get('window');

const useTimeGridStyles = (isDark: boolean) => StyleSheet.create({
  timeGrid: {
    flexDirection: 'row',
    flex: 1,
    paddingBottom: 100,
  },
  // New Week View Styles
  weekListContainer: {
    flex: 1,
    paddingTop: 10,
  },
  weekListContent: {
    paddingBottom: 100,
  },
  weekListRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  weekListRowToday: {
    backgroundColor: isDark ? 'rgba(139, 115, 85, 0.1)' : 'rgba(251, 238, 227, 0.4)',
  },
  weekDateColumn: {
    width: 80,
    marginRight: 12,
    justifyContent: 'center',
  },
  weekDayName: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#A0A0A0' : '#666666',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 2,
  },
  weekDateNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#FFFFFF' : '#333333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: 'rgba(255,255,255,0.4)',
  },
  accentText: {
    color: '#FF7F50',
  },
  weekClassesColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  classesScroll: {
    flexGrow: 0,
  },
  classesScrollContent: {
    paddingRight: 16,
  },
  classPill: {
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    minWidth: 160,
    maxWidth: 220,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pillCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Vercetti-Regular',
  },
  pillAttendanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  pillName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
    fontFamily: 'SF-Regular',
  },
  pillTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'SF-Regular',
  },
  pillLocation: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontFamily: 'SF-Regular',
  },
  emptyDayContainer: {
    paddingVertical: 10,
  },
  emptyDayText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
    fontStyle: 'italic',
    fontFamily: 'SF-Regular',
  },
  // Day view styles (unchanged)
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
    fontFamily: 'SF-Regular',
    color: isDark ? 'rgba(251, 238, 227, 0.6)' : 'rgba(139, 115, 85, 0.7)',
    fontWeight: '500',
  },
  darkTimeLabel: {
    color: 'rgba(251, 238, 227, 0.6)',
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
    backgroundColor: isDark ? 'rgba(251, 238, 227, 0.1)' : 'rgba(139, 115, 85, 0.12)',
  },
  darkHourDivider: {
    backgroundColor: 'rgba(251, 238, 227, 0.1)',
  },
  halfHourDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: isDark ? 'rgba(251, 238, 227, 0.05)' : 'rgba(139, 115, 85, 0.06)',
  },
  darkHalfHourDivider: {
    backgroundColor: 'rgba(251, 238, 227, 0.05)',
  },

});