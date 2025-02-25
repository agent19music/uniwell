import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import FloatingActionButton from '../components/FloatingActionButton';
import ScheduleEditorModal from '../modals/ScheduleEditorModal';

// Add these type definitions at the top of the file after imports
interface ClassInfo {
  id: string;
  startTime: number;
  duration: number;
}

interface ClassDetails {
  name: string;
  color: string;
}

interface ScheduleData {
  [key: string]: ClassInfo[];
}

interface SampleClasses {
  [key: string]: ClassDetails;
}

// Update the constants with type annotations
const SAMPLE_CLASSES: SampleClasses = {
  "CSE101": { name: "Intro to Programming", color: "#FF7F50" },
  "MATH201": { name: "Calculus II", color: "#8A8AFF" },
  "PHY301": { name: "Physics Lab", color: "#FF69B4" },
  "ENG102": { name: "Technical Writing", color: "#50C878" }
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

// Update the schedule data with type annotation
const schedule: ScheduleData = {
  "Monday": [
    { id: "CSE101", startTime: 9, duration: 2 },
    { id: "MATH201", startTime: 13, duration: 1 }
  ],
  "Wednesday": [
    { id: "PHY301", startTime: 10, duration: 3 },
    { id: "ENG102", startTime: 15, duration: 1 }
  ],
  "Friday": [
    { id: "CSE101", startTime: 14, duration: 2 }
  ]
};

export default function ClassScheduleScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentWeek, setCurrentWeek] = useState(1);
  const { width } = Dimensions.get('window');
  const [isEditorVisible, setIsEditorVisible] = useState(false);

  const getClassForTimeSlot = (day: string, time: number): ClassInfo | undefined => {
    return schedule[day]?.find(cls => 
      time >= cls.startTime && time < (cls.startTime + cls.duration)
    );
  };

  const navigateWeek = (direction: number): void => {
    setCurrentWeek(prev => prev + direction);
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>Class Schedule</Text>
        <Text style={[styles.subtitle, isDark && styles.darkSubText]}>Week {currentWeek}</Text>
      </View>

      <View style={styles.weekNavigation}>
        <TouchableOpacity onPress={() => navigateWeek(-1)} style={styles.navButton}>
          <Ionicons 
            name="chevron-back" 
            size={22}
            color={ '#FF7F50'}
          />
        </TouchableOpacity>
        <Text style={[styles.weekText, isDark && styles.darkText]}>Week {currentWeek}</Text>
        <TouchableOpacity onPress={() => navigateWeek(1)} style={styles.navButton}>
          <Ionicons 
            name="chevron-forward" 
            size={22}
            color={ '#FF7F50'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal={false}
        showsVerticalScrollIndicator={false}
        style={styles.scheduleContainer}
      >
        <View style={styles.timelineHeader}>
          <View style={styles.dayLabelContainer}>
            <Text style={[styles.timeLabel, isDark && styles.darkText]}>Time</Text>
            {DAYS.map(day => (
              <Text key={day} style={[styles.dayLabel, isDark && styles.darkText]}>
                {day.slice(0, 3)}
              </Text>
            ))}
          </View>
        </View>

        <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
          {TIME_SLOTS.map(time => (
            <View key={time} style={styles.timeSlotRow}>
              <Text style={[
                styles.timeLabel, 
                isDark && styles.darkTimeLabel
              ]}>
                {`${time}:00`}
              </Text>
              {DAYS.map(day => {
                const classInfo = getClassForTimeSlot(day, time);
                if (classInfo && time === classInfo.startTime) {
                  const classDetails = SAMPLE_CLASSES[classInfo.id];
                  return (
                    <View 
                      key={day} 
                      style={[
                        styles.classBlock,
                        isDark && styles.darkClassBlock,
                        { 
                          height: classInfo.duration * 50,
                          backgroundColor: isDark 
                            ? `${classDetails.color}30` // Slightly more opacity in dark mode
                            : `${classDetails.color}15`
                        }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.className, 
                          { color: isDark ? classDetails.color : classDetails.color }
                        ]}
                      >
                        {classDetails.name}
                      </Text>
                      <Text style={[
                        styles.classTime,
                        isDark && styles.darkClassTime
                      ]}>
                        {`${classInfo.startTime}:00 - ${classInfo.startTime + classInfo.duration}:00`}
                      </Text>
                    </View>
                  );
                }
                return classInfo ? null : (
                  <View 
                    key={day} 
                    style={[
                      styles.emptySlot, 
                      isDark && styles.darkEmptySlot
                    ]} 
                  />
                );
              })}
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      <FloatingActionButton
        onPress={() => setIsEditorVisible(true)}
        color="#FF7F50"
      />
      
      <ScheduleEditorModal
        visible={isEditorVisible}
        onClose={() => setIsEditorVisible(false)}
        onSave={(data) => {
          // Handle save
          setIsEditorVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS system background gray
  },
  darkContainer: {
    backgroundColor: '#1C1C1E', // Slightly softer than pure black for better contrast
  },
  header: {
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8', // iOS light separator color
  },
  title: {
    fontSize: 34, // iOS large title size
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
    letterSpacing: 0.41, // iOS spec
  },
  subtitle: {
    fontSize: 15,
    color: '#6C6C70', // iOS secondary label color
    fontFamily: 'Vercetti-Regular',
    letterSpacing: -0.24,
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: '#98989F', // iOS dark mode secondary label
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
    color: '#FF7F50'
  },
  navButton: {
    padding: 12,
    borderRadius: 8,
    color: '#FF7F50'
  },
  weekText: {
    fontSize: 17, // iOS body text
    fontWeight: '600',
    marginHorizontal: 16,
    fontFamily: 'Vercetti-Regular',
    letterSpacing: -0.41,
    color: '#FF7F50'
  },
  scheduleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  timelineHeader: {
    marginBottom: 12,
    paddingTop: 8,
  },
  dayLabelContainer: {
    flexDirection: 'row',
    paddingRight: 16,
    paddingBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
    letterSpacing: -0.24,
  },
  timeSlotRow: {
    flexDirection: 'row',
    height: 50, // Slightly smaller for better density
    alignItems: 'flex-start',
  },
  emptySlot: {
    flex: 1,
    height: 50,
    borderWidth: 0.5,
    borderColor: '#C6C6C8', // iOS light separator
  },
  darkEmptySlot: {
    borderColor: '#38383A', // Subtle dark mode border
  },
  classBlock: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    margin: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkClassBlock: {
    shadowColor: '#FFF',
    shadowOpacity: 0.05,
  },
  className: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  timeLabel: {
    width: 60,
    fontSize: 14,
    textAlign: 'center',
    color: '#6C6C70',
    fontFamily: 'Vercetti-Regular',
  },
  darkTimeLabel: {
    color: '#98989F',
  },
  classTime: {
    fontSize: 12,
    color: '#6C6C70',
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  darkClassTime: {
    color: '#98989F',
  }
});