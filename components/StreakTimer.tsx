import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, differenceInMonths, differenceInYears, parseISO } from 'date-fns';

interface StreakTimerProps {
  startDate: string;
  startTime: string;
  className?: string;
}

export default function StreakTimer({ startDate, startTime, className }: StreakTimerProps) {
  const [timeUnits, setTimeUnits] = useState<{
    primary: { value: number; label: string };
    secondary: { value: number; label: string };
    tertiary: { value: number; label: string };
  }>({
    primary: { value: 0, label: 'seconds' },
    secondary: { value: 0, label: 'minutes' },
    tertiary: { value: 0, label: 'hours' }
  });

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const updateTimer = () => {
      try {
        const start = new Date(startDate);
        const now = new Date();
        
        const seconds = differenceInSeconds(now, start);
        const minutes = differenceInMinutes(now, start);
        const hours = differenceInHours(now, start);
        const days = differenceInDays(now, start);
        const months = differenceInMonths(now, start);
        const years = differenceInYears(now, start);

        if (years > 0) {
          setTimeUnits({
            primary: { value: years, label: 'years' },
            secondary: { value: months % 12, label: 'months' },
            tertiary: { value: days % 30, label: 'days' }
          });
        } else if (months > 0) {
          setTimeUnits({
            primary: { value: months, label: 'months' },
            secondary: { value: days % 30, label: 'days' },
            tertiary: { value: hours % 24, label: 'hours' }
          });
        } else if (days > 0) {
          setTimeUnits({
            primary: { value: days, label: 'days' },
            secondary: { value: hours % 24, label: 'hours' },
            tertiary: { value: minutes % 60, label: 'minutes' }
          });
        } else if (hours > 0) {
          setTimeUnits({
            primary: { value: hours, label: 'hours' },
            secondary: { value: minutes % 60, label: 'minutes' },
            tertiary: { value: seconds % 60, label: 'seconds' }
          });
        } else {
          setTimeUnits({
            primary: { value: minutes, label: 'minutes' },
            secondary: { value: seconds % 60, label: 'seconds' },
            tertiary: { value: 0, label: 'milliseconds' }
          });
        }
      } catch (error) {
        console.error('Error updating timer:', error);
        setTimeUnits({
          primary: { value: 0, label: 'error' },
          secondary: { value: 0, label: 'error' },
          tertiary: { value: 0, label: 'error' }
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  return (
    <View style={styles.container}>
      <View style={styles.timeUnit}>
        <Text style={[styles.value, isDark && styles.darkValue]}>
          {timeUnits.primary.value}
        </Text>
        <Text style={[styles.label, isDark && styles.darkLabel]}>
          {timeUnits.primary.label}
        </Text>
      </View>
      <View style={[styles.separator, isDark && styles.darkSeparator]} />
      <View style={styles.timeUnit}>
        <Text style={[styles.value, isDark && styles.darkValue]}>
          {timeUnits.secondary.value}
        </Text>
        <Text style={[styles.label, isDark && styles.darkLabel]}>
          {timeUnits.secondary.label}
        </Text>
      </View>
      <View style={[styles.separator, isDark && styles.darkSeparator]} />
      <View style={styles.timeUnit}>
        <Text style={[styles.value, isDark && styles.darkValue]}>
          {timeUnits.tertiary.value}
        </Text>
        <Text style={[styles.label, isDark && styles.darkLabel]}>
          {timeUnits.tertiary.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 80,
  },
  value: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FF7F50',
    fontFamily: 'Vercetti-Regular',
  },
  darkValue: {
    color: '#FF7F50',
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Vercetti-Regular',
  },
  darkLabel: {
    color: '#999',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 127, 80, 0.2)',
    marginHorizontal: 16,
  },
  darkSeparator: {
    backgroundColor: 'rgba(255, 127, 80, 0.3)',
  },
}); 