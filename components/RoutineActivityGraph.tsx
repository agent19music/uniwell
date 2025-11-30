import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useRoutine } from '../contexts/RoutineContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subMonths, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';

const { width } = Dimensions.get('window');
const CELL_SIZE = 10;
const CELL_GAP = 3;
const MONTHS_TO_SHOW = 12;

interface ActivityData {
  date: string;
  count: number;
}

interface RoutineActivityGraphProps {
  onDayPress?: (date: Date, count: number) => void;
}

export default function RoutineActivityGraph({ onDayPress }: RoutineActivityGraphProps) {
  const { colors } = useTheme();
  const { routineCompletions, getRoutineCompletions, getRoutineCompletionsForRange } = useRoutine();
  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Generate dates for the last 12 months
  const dates = useMemo(() => {
    const end = new Date();
    const start = subMonths(end, MONTHS_TO_SHOW - 1);
    const startOfFirstWeek = startOfWeek(startOfMonth(start));
    const endOfLastWeek = endOfWeek(endOfMonth(end));
    return eachDayOfInterval({ start: startOfFirstWeek, end: endOfLastWeek });
  }, []);

  // Fetch completion data
  useEffect(() => {
    const fetchActivityData = async () => {
      if (dates.length === 0) return;
      
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      
      try {
        const completions = await getRoutineCompletionsForRange(startDate, endDate);
        
        const data: Record<string, number> = {};
        
        // Initialize all dates with 0
        dates.forEach(date => {
          data[format(date, 'yyyy-MM-dd')] = 0;
        });
        
        // Count completions per day
        completions.forEach(completion => {
          const dateKey = completion.completionDate;
          if (data[dateKey] !== undefined) {
            data[dateKey]++;
          }
        });
        
        setActivityData(data);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      }
    };

    fetchActivityData();
  }, [dates, getRoutineCompletionsForRange]);

  // Group dates by week
  const weeks = useMemo(() => {
    const grouped: Date[][] = [];
    let currentWeek: Date[] = [];
    
    dates.forEach((date, index) => {
      if (index % 7 === 0 && currentWeek.length > 0) {
        grouped.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(date);
    });
    
    if (currentWeek.length > 0) {
      grouped.push(currentWeek);
    }
    
    return grouped;
  }, [dates]);

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; index: number }[] = [];
    let lastMonth = '';
    
    dates.forEach((date, index) => {
      const month = format(date, 'MMM');
      if (month !== lastMonth && index % 7 === 0) {
        labels.push({ month, index: Math.floor(index / 7) });
        lastMonth = month;
      }
    });
    
    return labels;
  }, [dates]);

  // Auto-scroll to current month on mount
  useEffect(() => {
    if (scrollViewRef.current && weeks.length > 0) {
      // Calculate the scroll position to show the last few months
      // Scroll to show approximately the last 3-4 months
      const totalWidth = weeks.length * (CELL_SIZE + CELL_GAP);
      const scrollToX = Math.max(0, totalWidth - width + 100);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: scrollToX, animated: true });
      }, 100);
    }
  }, [weeks.length]);

  // Get intensity level based on count
  const getIntensity = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  // Get color for intensity
  const getColor = (intensity: number): string => {
    const baseColor = '#FF7F50';
    const opacity = intensity === 0 ? 0.1 : 0.2 + (intensity * 0.2);
    return baseColor + Math.round(opacity * 255).toString(16).padStart(2, '0');
  };

  const handleDayPress = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const count = activityData[dateKey] || 0;
    setSelectedDate(date);
    setSelectedCount(count);
    onDayPress?.(date, count);
  };

  const renderDayCell = (date: Date, weekIndex: number, dayIndex: number) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const count = activityData[dateKey] || 0;
    const intensity = getIntensity(count);
    const isToday = isSameDay(date, new Date());
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isPast = date < new Date();
    
    return (
      <TouchableOpacity
        key={`${weekIndex}-${dayIndex}`}
        style={[
          styles.dayCell,
          {
            backgroundColor: getColor(intensity),
            borderColor: isSelected ? colors.primary : 'transparent',
            borderWidth: isSelected ? 2 : 0,
            opacity: isPast ? 1 : 0.5,
          },
          isToday && styles.todayCell,
        ]}
        onPress={() => handleDayPress(date)}
        disabled={!isPast}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Activity Overview</Text>
        {selectedDate && (
          <View style={styles.selectedInfo}>
            <Text style={[styles.selectedDateText, { color: colors.textSecondary }]}>
              {format(selectedDate, 'MMM d, yyyy')}
            </Text>
            <Text style={[styles.selectedCountText, { color: colors.textPrimary }]}>
              {selectedCount} {selectedCount === 1 ? 'routine' : 'routines'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.graphContainer}>
          {/* Month labels */}
          <View style={styles.monthLabels}>
            {monthLabels.map(({ month, index }) => (
              <View key={index} style={[styles.monthLabel, { left: index * (CELL_SIZE + CELL_GAP) }]}>
                <Text style={[styles.monthLabelText, { color: colors.textSecondary }]}>{month}</Text>
              </View>
            ))}
          </View>

          {/* Activity grid */}
          <View style={styles.gridWrapper}>
            <View style={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekColumn}>
                {week.map((date, dayIndex) => renderDayCell(date, weekIndex, dayIndex))}
              </View>
            ))}
            </View>

            {/* Day of week labels - on the right */}
            <View style={styles.dayLabels}>
              <Text style={[styles.dayLabelText, { color: colors.textSecondary }]}>Mon</Text>
              <Text style={[styles.dayLabelText, { color: colors.textSecondary }]}>Wed</Text>
              <Text style={[styles.dayLabelText, { color: colors.textSecondary }]}>Fri</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Less</Text>
        <View style={styles.legendCells}>
          {[0, 1, 2, 3, 4].map(intensity => (
            <View
              key={intensity}
              style={[
                styles.legendCell,
                { backgroundColor: getColor(intensity) }
              ]}
            />
          ))}
        </View>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  selectedInfo: {
    alignItems: 'flex-end',
  },
  selectedDateText: {
    fontSize: 12,
    fontFamily: 'Vercetti-Regular',
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  graphContainer: {
    paddingLeft: 0,
  },
  gridWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthLabels: {
    height: 20,
    position: 'relative',
    marginBottom: 4,
  },
  monthLabel: {
    position: 'absolute',
  },
  monthLabelText: {
    fontSize: 11,
    fontFamily: 'Vercetti-Regular',
  },
  dayLabels: {
    width: 24,
    justifyContent: 'space-between',
    height: (CELL_SIZE + CELL_GAP) * 7 - CELL_GAP,
    paddingTop: CELL_SIZE / 2,
    marginLeft: 8,
  },
  dayLabelText: {
    fontSize: 10,
    fontFamily: 'Vercetti-Regular',
  },
  grid: {
    flexDirection: 'row',
  },
  weekColumn: {
    marginRight: CELL_GAP,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    marginBottom: CELL_GAP,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: '#FF7F50',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Vercetti-Regular',
  },
  legendCells: {
    flexDirection: 'row',
    gap: 3,
  },
  legendCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
});



