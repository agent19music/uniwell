import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {CalendarDayHeader} from '@/components/schedule/CalendarDayHeader'; 


interface ScheduleHeaderProps {
    activeSemester: string | null;
    isDark: boolean;
    viewMode: 'day' | 'week';
    setViewMode: (mode: 'day' | 'week') => void;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    formatHeaderDate: () => string;
    navigateDay: (direction: number) => void;
    onSemesterPress: () => void;
    onTodayPress: () => void;
  }
  
  export const ScheduleHeader = ({
    activeSemester,
    isDark,
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    formatHeaderDate,
    navigateDay,
    onSemesterPress,
    onTodayPress,
  }: ScheduleHeaderProps) => {
    const styles = useScheduleHeaderStyles(isDark);
    
    // Check if currently viewing today
    const isToday = (): boolean => {
      const today = new Date();
      return (
        today.getDate() === currentDate.getDate() &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear()
      );
    };
    
    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.semesterButton}
            onPress={onSemesterPress}
          >
            <MaterialIcons name="edit-calendar" size={22} color={isDark ? '#FFFFFF' : '#FF7F50'} />
            <Text style={[styles.semesterText, isDark && styles.darkText]}>
              {activeSemester || 'Select Semester'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              style={[
                styles.viewToggleButton, 
                viewMode === 'day' && { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF',}
              ]}
              onPress={() => setViewMode('day')}
            >
              <Text style={[
                styles.viewToggleText,
                viewMode === 'day' ? styles.viewToggleTextActive : (isDark && styles.darkText)
              ]}>
                Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.viewToggleButton, 
                viewMode === 'week' && { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF',}
              ]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[
                styles.viewToggleText,
                viewMode === 'week' ? styles.viewToggleTextActive : (isDark && styles.darkText)
              ]}>
                Week
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Navigation Header */}
        <View style={styles.dateNavigation}>
          <TouchableOpacity 
            style={styles.dateNavButton}
            onPress={() => navigateDay(-1)}
          >
            <Ionicons 
              name="chevron-back" 
              size={22}
              color={isDark ? '#FFFFFF' : '#FF7F50'} 
            />
          </TouchableOpacity>
          
          <Text style={[styles.currentDateText, isDark && styles.darkText]}>
            {formatHeaderDate()}
          </Text>
          
          <TouchableOpacity 
            style={styles.dateNavButton}
            onPress={() => navigateDay(1)}
          >
            <Ionicons 
              name="chevron-forward" 
              size={22}
              color={isDark ? '#FFFFFF' : '#FF7F50'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Today button */}
        {!isToday() && (
          <TouchableOpacity 
            style={[styles.todayButton, isDark && styles.darkTodayButton]} 
            onPress={onTodayPress}
          >
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        )}
        
        {/* Calendar Day Header - Only shown in day view */}
        {viewMode === 'day' && (
          <CalendarDayHeader 
            currentDate={currentDate} 
            setCurrentDate={(date) => setCurrentDate(date)} 
            isDark={isDark} 
          />
        )}
      </View>
    );
  };
  
  const useScheduleHeaderStyles = (isDark: boolean) => StyleSheet.create({
    header: {
      borderBottomWidth: 0.5,
      borderBottomColor: '#C6C6C8',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    semesterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    semesterText: {
      fontSize: 15,
      fontWeight: '500',
      marginLeft: 6,
      color: '#000000',
    },
    viewToggle: {
      flexDirection: 'row',
      borderRadius: 8,
      padding: 2,
    },
    viewToggleButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    viewToggleText: {
      fontSize: 13,
      fontWeight: '500',
      color: '#000000',
    },
    viewToggleTextActive: {
      color: '#FF7F50',
    },
    dateNavigation: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
    },
    dateNavButton: {
      padding: 8,
    },
    currentDateText: {
      fontSize: 17,
      fontWeight: '600',
      color: '#000000',
      paddingHorizontal: 20,
    },
    darkText: {
      color: '#FFFFFF',
    },
    todayButton: {
      position: 'absolute',
      right: 16,
      top: 16,
      backgroundColor: '#FF7F50',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    darkTodayButton: {
      backgroundColor: '#FF9500',
    },
    todayButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
  });