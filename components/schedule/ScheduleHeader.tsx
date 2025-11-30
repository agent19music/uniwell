import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarDots, CaretLeft, CaretRight } from 'phosphor-react-native';
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
            <CalendarDots size={22} color={isDark ? '#FBEEE3' : '#8B7355'} weight="fill" />
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
            <CaretLeft 
              size={24}
              color={isDark ? '#FBEEE3' : '#8B7355'} 
              weight="bold"
            />
          </TouchableOpacity>
          
          <Text style={[styles.currentDateText, isDark && styles.darkText]}>
            {formatHeaderDate()}
          </Text>
          
          <TouchableOpacity 
            style={styles.dateNavButton}
            onPress={() => navigateDay(1)}
          >
            <CaretRight 
              size={24}
              color={isDark ? '#FBEEE3' : '#8B7355'} 
              weight="bold"
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
      borderBottomColor: isDark ? 'rgba(251, 238, 227, 0.15)' : 'rgba(139, 115, 85, 0.15)',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    semesterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: isDark ? 'rgba(139, 115, 85, 0.15)' : 'rgba(251, 238, 227, 0.6)',
      borderRadius: 14,
    },
    semesterText: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: 'Vercetti-Regular',
      color: '#8B7355',
    },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(139, 115, 85, 0.1)' : 'rgba(251, 238, 227, 0.5)',
      borderRadius: 10,
      padding: 3,
    },
    viewToggleButton: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 8,
    },
    viewToggleText: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Vercetti-Regular',
      color: isDark ? 'rgba(251, 238, 227, 0.6)' : 'rgba(139, 115, 85, 0.6)',
    },
    viewToggleTextActive: {
      color: isDark ? '#FBEEE3' : '#8B7355',
      fontWeight: '700',
    },
    dateNavigation: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      position: 'relative',
    },
    dateNavButton: {
      padding: 8,
      borderRadius: 8,
    },
    currentDateText: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: 'Vercetti-Regular',
      color: '#8B7355',
      paddingHorizontal: 20,
    },
    darkText: {
      color: '#FBEEE3',
    },
    todayButton: {
      position: 'absolute',
      right: 16,
      top: 16,
      backgroundColor: '#8B7355',
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
      backgroundColor: 'rgba(139, 115, 85, 0.3)',
    },
    todayButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
      fontFamily: 'Vercetti-Regular',
    },
  });