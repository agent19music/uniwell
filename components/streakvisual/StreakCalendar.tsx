// StreakCalendar.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { format, eachDayOfInterval, subDays, isEqual } from 'date-fns';
import { useRoutine } from '@/contexts/RoutineContext';
import { mockCheckIns } from '../../mock/streakData';

interface Props {
  streakId: string;
  days?: number;
}

export const StreakCalendar: React.FC<Props> = ({ streakId, days = 30 }) => {
  const { getStreakCheckIns } = useRoutine();
  const [checkInDates, setCheckInDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCheckIns = async () => {
      const checkIns = await getStreakCheckIns(streakId, days);
      setCheckInDates(checkIns.map(checkIn => checkIn.checkDate));
      setLoading(false);
    };
    
    loadCheckIns();
  }, [streakId, days]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  const today = new Date();
  
  // Generate date range
  const dateRange = eachDayOfInterval({
    start: subDays(today, days - 1),
    end: today
  });
  
  // Group dates by week
  const weeks = [];
  let currentWeek = [];
  
  for (const date of dateRange) {
    currentWeek.push(date);
    if (date.getDay() === 0 || date === dateRange[dateRange.length - 1]) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  const isCheckedIn = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return checkInDates.includes(formattedDate);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Last {days} Days</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.calendarContainer}>
          {/* Day labels */}
          <View style={styles.dayLabelsRow}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <Text key={day} style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>
          
          {/* Calendar grid */}
          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.weekRow}>
              {Array(7).fill(0).map((_, dayIndex) => {
                const date = week[dayIndex];
                const isChecked = date && isCheckedIn(date);
                const isToday = date && isEqual(date, today);
                
                return (
                  <View key={`day-${dayIndex}`} style={styles.dayCell}>
                    {date ? (
                      <View
                        style={[
                          styles.dateCircle,
                          isChecked && styles.checkedCircle,
                          isToday && styles.todayCircle
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateText,
                            isChecked && styles.checkedText,
                            isToday && styles.todayText
                          ]}
                        >
                          {format(date, 'd')}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.emptyDay} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 16,
  },
  calendarContainer: {
    paddingHorizontal: 16,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayCell: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  checkedCircle: {
    backgroundColor: '#007AFF',
  },
  todayCircle: {
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3C3C43',
  },
  checkedText: {
    color: '#FFFFFF',
  },
  todayText: {
    color: '#007AFF',
  },
  emptyDay: {
    width: 30,
    height: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});