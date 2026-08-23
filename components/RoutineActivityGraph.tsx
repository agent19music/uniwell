import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { endOfMonth, endOfWeek, eachDayOfInterval, format, isSameDay, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { useReducedMotion } from 'react-native-reanimated';

import { SafeText } from '@/components/ThemedText';
import { ChartPresentation } from '@/components/charts/ChartPresentation';
import { IconButton } from '@/components/ui/IconButton';
import { spacing } from '@/constants/theme';
import { useRoutine } from '@/contexts/RoutineContext';
import { useTheme } from '@/hooks/useTheme';

const CELL_SIZE = 24;
const CELL_GAP = 0;
const CELL_INDICATOR_SIZE = 12;
const MONTHS_TO_SHOW = 12;

interface RoutineActivityGraphProps {
  onDayPress?: (date: Date, count: number) => void;
}

export default function RoutineActivityGraph({ onDayPress }: RoutineActivityGraphProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const { getRoutineCompletionsForRange } = useRoutine();
  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const scrollViewRef = useRef<ScrollView>(null);

  const dates = useMemo(() => {
    const end = new Date();
    const start = subMonths(end, MONTHS_TO_SHOW - 1);
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(start)),
      end: endOfWeek(endOfMonth(end)),
    });
  }, []);

  useEffect(() => {
    const fetchActivityData = async () => {
      if (!dates.length) return;
      setStatus('loading');

      try {
        const completions = await getRoutineCompletionsForRange(dates[0], dates[dates.length - 1]);
        const data = Object.fromEntries(dates.map((date) => [format(date, 'yyyy-MM-dd'), 0]));
        completions.forEach((completion) => {
          if (data[completion.completionDate] !== undefined) data[completion.completionDate] += 1;
        });
        setActivityData(data);
        setStatus('ready');
      } catch (error) {
        console.error('Error fetching activity data:', error);
        setStatus('error');
      }
    };

    fetchActivityData();
  }, [dates, getRoutineCompletionsForRange]);

  const weeks = useMemo(() => {
    const grouped: Date[][] = [];
    for (let index = 0; index < dates.length; index += 7) grouped.push(dates.slice(index, index + 7));
    return grouped;
  }, [dates]);

  const monthLabels = useMemo(() => {
    let previousMonth = '';
    return dates.reduce<{ month: string; index: number }[]>((labels, date, index) => {
      const month = format(date, 'MMM');
      if (month !== previousMonth && index % 7 === 0) labels.push({ month, index: Math.floor(index / 7) });
      previousMonth = month;
      return labels;
    }, []);
  }, [dates]);

  useEffect(() => {
    if (!scrollViewRef.current || !weeks.length) return;
    const contentWidth = weeks.length * (CELL_SIZE + CELL_GAP);
    scrollViewRef.current.scrollTo({
      x: Math.max(0, contentWidth - width + spacing.field),
      animated: !reducedMotion,
    });
  }, [reducedMotion, weeks.length, width]);

  const intensityFor = (count: number) => count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
  const colorFor = (intensity: number) => intensity === 0
    ? colors.surfacePressed
    : `${colors.accent}${[0, '48', '80', 'B3', 'E6'][intensity]}`;
  const completedDays = Object.values(activityData).filter((count) => count > 0).length;
  const totalCompletions = Object.values(activityData).reduce((total, count) => total + count, 0);
  const summary = status === 'loading'
    ? 'Loading routine activity.'
    : status === 'error'
      ? 'Routine activity could not be loaded.'
      : `${totalCompletions} routine completions across ${completedDays} active days in the last 12 months.`;

  if (status === 'error') {
    return (
      <ChartPresentation
        accessibilityLabel="Routine activity chart unavailable"
        emptyTitle="Activity unavailable"
        emptyDescription="Your routine activity could not be loaded. Try again later."
        summary={summary}
        style={styles.presentation}
      />
    );
  }

  if (status === 'loading') {
    return (
      <ChartPresentation
        accessibilityLabel="Loading routine activity chart"
        emptyTitle="Loading activity"
        emptyDescription="Preparing your routine history."
        summary={summary}
        style={styles.presentation}
      />
    );
  }

  return (
    <ChartPresentation accessibilityLabel={`Routine activity heatmap. ${summary}`} summary={summary} style={styles.presentation}>
      <View style={styles.header}>
        <View>
          <SafeText variant="heading">Activity overview</SafeText>
          <SafeText variant="caption" color={colors.textSecondary}>Each square is one day; color shows completed routines.</SafeText>
        </View>
        {selectedDate && (
          <View accessibilityLiveRegion="polite" style={styles.selected}>
            <SafeText variant="caption" color={colors.textSecondary}>{format(selectedDate, 'MMM d, yyyy')}</SafeText>
            <SafeText variant="bodyStrong">{selectedCount} {selectedCount === 1 ? 'routine' : 'routines'}</SafeText>
          </View>
        )}
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        accessibilityLabel="Routine activity by day. Swipe horizontally to browse months."
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator
      >
        <View>
          <View style={styles.monthLabels}>
            {monthLabels.map(({ month, index }) => (
              <SafeText key={`${month}-${index}`} variant="caption" color={colors.textMuted} style={[styles.month, { left: index * (CELL_SIZE + CELL_GAP) }]}>
                {month}
              </SafeText>
            ))}
          </View>
          <View style={styles.gridRow}>
            <View style={styles.grid}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.week}>
                  {week.map((date, dayIndex) => {
                    const count = activityData[format(date, 'yyyy-MM-dd')] ?? 0;
                    const isPast = date <= new Date();
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    return (
                      <IconButton
                        key={format(date, 'yyyy-MM-dd')}
                        accessibilityLabel={`${format(date, 'MMMM d, yyyy')}: ${count} ${count === 1 ? 'routine completed' : 'routines completed'}`}
                        accessibilityHint={isPast ? 'Shows this day’s routine completion count.' : 'Future date'}
                        disabled={!isPast}
                        onPress={() => {
                          setSelectedDate(date);
                          setSelectedCount(count);
                          onDayPress?.(date, count);
                        }}
                        style={[
                          styles.day,
                          {
                            backgroundColor: colors.transparent,
                          },
                        ]}
                      >
                        <View
                          pointerEvents="none"
                          style={[
                            styles.dayIndicator,
                            {
                              backgroundColor: colorFor(intensityFor(count)),
                              borderColor: isSelected ? colors.focusRing : isSameDay(date, new Date()) ? colors.borderStrong : colors.transparent,
                            },
                          ]}
                        />
                      </IconButton>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.days}>
              <SafeText variant="caption" color={colors.textMuted}>Mon</SafeText>
              <SafeText variant="caption" color={colors.textMuted}>Wed</SafeText>
              <SafeText variant="caption" color={colors.textMuted}>Fri</SafeText>
            </View>
          </View>
        </View>
      </ScrollView>
      <View accessibilityLabel="Legend: less to more routine completions" style={styles.legend}>
        <SafeText variant="caption" color={colors.textSecondary}>Less</SafeText>
        {[0, 1, 2, 3, 4].map((intensity) => (
          <View key={intensity} style={[styles.legendCell, { backgroundColor: colorFor(intensity) }]} />
        ))}
        <SafeText variant="caption" color={colors.textSecondary}>More</SafeText>
      </View>
    </ChartPresentation>
  );
}

const styles = StyleSheet.create({
  presentation: {
    marginBottom: spacing.field,
    marginHorizontal: spacing.control,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selected: {
    alignItems: 'flex-end',
  },
  scrollContent: {
    paddingBottom: spacing.micro,
  },
  monthLabels: {
    height: 20,
    marginBottom: spacing.optical,
    position: 'relative',
  },
  month: {
    position: 'absolute',
  },
  gridRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  grid: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  week: {
    gap: CELL_GAP,
  },
  day: {
    height: CELL_SIZE,
    minHeight: CELL_SIZE,
    minWidth: CELL_SIZE,
    padding: 0,
    width: CELL_SIZE,
  },
  dayIndicator: {
    borderRadius: 3,
    borderWidth: 1,
    height: CELL_INDICATOR_SIZE,
    width: CELL_INDICATOR_SIZE,
  },
  days: {
    height: (CELL_SIZE + CELL_GAP) * 7 - CELL_GAP,
    justifyContent: 'space-between',
    marginLeft: spacing.micro,
  },
  legend: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.micro,
    justifyContent: 'center',
  },
  legendCell: {
    borderRadius: 3,
    height: CELL_SIZE,
    width: CELL_SIZE,
  },
});
