import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

interface TimePickerInteractionProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
}

export const TimePickerInteraction: React.FC<TimePickerInteractionProps> = ({
  value,
  onChange,
  label = 'Time',
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedTime) {
      onChange(selectedTime);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.timeButton, isDark && styles.darkTimeButton]}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="time-outline" size={24} color={isDark ? '#fff' : '#666'} />
        <Text style={[styles.timeText, isDark && styles.darkTimeText]}>
          {value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          is24Hour={false}
          textColor={isDark ? '#fff' : '#000'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  darkTimeButton: {
    backgroundColor: '#1e1e1e',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkTimeText: {
    color: '#fff',
  },
}); 