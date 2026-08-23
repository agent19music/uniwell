import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { Calendar, MapPin } from 'phosphor-react-native';
import { format, isToday, differenceInMinutes } from 'date-fns';
import { useSemester } from '@/contexts/SemesterContext';
import { useRouter } from 'expo-router';
import { DayOfTheWeek } from '@/types/TimetableTypes';

interface NextActivity {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  location?: string;
  color: string;
}

export default function NextActivityWidget() {
  const { classSchedules } = useSemester();
  const [nextActivity, setNextActivity] = useState<NextActivity | null>(null);
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();

  useEffect(() => {
    const findNextActivity = () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.getHours() * 60 + now.getMinutes();


      // Get today's classes
      const todayClasses = classSchedules.filter(schedule => {
        try {
          const daysOfWeek = Array.isArray(schedule.daysOfWeek) 
            ? schedule.daysOfWeek 
            : JSON.parse(typeof schedule.daysOfWeek === 'string' ? schedule.daysOfWeek : '[]');
          
          // Convert day names to numbers (0-6)
          const dayMap: Record<string, number> = {
            'sunday': 0,
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6
          };
          
          // Check if any of the days match the current day
          return daysOfWeek.some(day => dayMap[day.toLowerCase()] === currentDay);
        } catch (error) {
          console.error('Error parsing daysOfWeek:', error);
          return false;
        }
      });


      // Find the next class
      const nextClass = todayClasses.find(schedule => {
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        const startTimeInMinutes = startHour * 60 + startMinute;
        return startTimeInMinutes > currentTime;
      });

      if (nextClass) {
        setNextActivity({
          id: nextClass.id,
          name: nextClass.courseName,
          startTime: nextClass.startTime,
          endTime: nextClass.endTime,
          location: nextClass.room,
          color: '#FF7F50'
        });
      } else {
        setNextActivity(null);
      }
    };

    findNextActivity();
    const interval = setInterval(findNextActivity, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [classSchedules]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${formattedHour}:${minutes.padStart(2, '0')} ${period}`;
  };

  const getTimeLabel = () => {
    if (!nextActivity) return '';
    
    const now = new Date();
    const [startHour, startMinute] = nextActivity.startTime.split(':').map(Number);
    const startTime = new Date(now);
    startTime.setHours(startHour, startMinute, 0);

    const minutesUntil = differenceInMinutes(startTime, now);
    
    if (minutesUntil < 0) return 'In progress';
    if (minutesUntil < 60) return `In ${minutesUntil} min`;
    if (minutesUntil < 120) return 'In 1 hour';
    return formatTime(nextActivity.startTime);
  };
  
  const handleOpenCalendar = () => {
    router.push('/schedule');
  };

  return (
    <TouchableOpacity 
      style={[styles.container, isDark && styles.darkContainer]}
      onPress={handleOpenCalendar}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Calendar size={18} color="#FF7F50" weight="fill" />
          <Text style={[styles.headerText, isDark && styles.darkText]}>Schedule</Text>
        </View>
        <TouchableOpacity onPress={handleOpenCalendar} style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {nextActivity ? (
        <>
          <View style={styles.timeContainer}>
            <Text style={[styles.timeLabel, isDark && styles.darkText]}>
              {getTimeLabel()}
            </Text>
            <Text style={[styles.timeRange, isDark && styles.darkSubText]}>
              {formatTime(nextActivity.startTime)} - {formatTime(nextActivity.endTime)}
            </Text>
          </View>
          
          <Text style={[styles.activityName, isDark && styles.darkText]} numberOfLines={1}>
            {nextActivity.name}
          </Text>
          
          {nextActivity.location && (
            <View style={styles.locationContainer}>
              <MapPin size={14} color={isDark ? "#8E8E93" : "#8E8E93"} weight="regular" />
              <Text style={[styles.locationText, isDark && styles.darkSubText]}>
                {nextActivity.location}
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isDark && styles.darkSubText]}>
            No more classes today
          </Text>
          <Text style={[styles.emptySubText, isDark && styles.darkSubText]}>
            Tap to view full schedule
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  darkContainer: {
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6,
    fontFamily: 'Vercetti-Regular',
  },
  viewButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
  },
  viewButtonText: {
    fontSize: 12,
    color: '#FF7F50',
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF7F50',
    fontFamily: 'Vercetti-Regular',
  },
  timeRange: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Vercetti-Regular',
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Vercetti-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontFamily: 'Vercetti-Regular',
    opacity: 0.8,
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: '#8E8E93',
  },
}); 
 