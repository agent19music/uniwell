import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface CalendarDayHeaderProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    isDark: boolean;
  }
  
 export const CalendarDayHeader = ({ currentDate, setCurrentDate, isDark }: CalendarDayHeaderProps) => {
    const styles = useCalendarDayHeaderStyles(isDark);
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    
    const now = new Date();
    const today = now.getDate();
    const todayMonth = now.getMonth();
    const todayYear = now.getFullYear();
  
    // Calculate the start of the week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    return (
      <View style={styles.calendarHeader}>
        {DAYS.map((day, index) => {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + index);
          
          const dayNum = date.getDate();
          const month = date.getMonth();
          const year = date.getFullYear();
          
          const isToday = dayNum === today && month === todayMonth && year === todayYear;
          const isSelected = date.getDay() === currentDate.getDay() && 
                            date.getMonth() === currentDate.getMonth() && 
                            date.getFullYear() === currentDate.getFullYear();
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayHeaderItem,
                isSelected && { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',}
              ]}
              onPress={() => {
                setCurrentDate(date);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[
                styles.dayHeaderDay,
                isDark && styles.darkText,
                isSelected && styles.selectedDayText, 
                { color: isDark ? '#FBEEE3' : '#8B7355',}
              ]}>
                {day.substring(0, 3)}
              </Text>
              <View style={[
                styles.dayNumberContainer,
                isToday && styles.todayCircle,
                isSelected && [styles.selectedCircle, { backgroundColor: isDark ? 'rgba(139, 115, 85, 0.25)' : 'rgba(251, 238, 227, 0.7)' }]
              ]}>
                <Text style={[
                  styles.dayHeaderDate,
                  isDark && styles.darkText,
                  isToday && styles.todayText,
                  isSelected && styles.selectedDayText, 
                  { color: isToday ? '#FFFFFF' : (isDark ? '#FBEEE3' : '#8B7355')}
                ]}>
                  {dayNum}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };
  
  const useCalendarDayHeaderStyles = (isDark: boolean) => StyleSheet.create({
    calendarHeader: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(251, 238, 227, 0.15)' : 'rgba(139, 115, 85, 0.15)',
    },
    dayHeaderItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
      borderRadius: 10,
    },
    dayHeaderDay: {
      fontSize: 13,
      fontWeight: '500',
      fontFamily: 'Vercetti-Regular',
      color: '#8B7355',
      marginBottom: 6,
    },
    dayNumberContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    todayCircle: {
      backgroundColor: '#8B7355',
    },
    selectedCircle: {
      backgroundColor: isDark ? 'rgba(139, 115, 85, 0.25)' : 'rgba(251, 238, 227, 0.7)',
    },
    dayHeaderDate: {
      fontSize: 15,
      fontWeight: '500',
      fontFamily: 'Vercetti-Regular',
      color: isDark ? '#FBEEE3' : '#8B7355',
    },
    todayText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    selectedDayText: {
      fontWeight: '600',
    },
    darkText: {
      color: '#FBEEE3',
    },
  });