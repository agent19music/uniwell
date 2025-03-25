import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, useColorScheme } from 'react-native';
import Slider from '@react-native-community/slider';
import { format } from 'date-fns';

interface SleepEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: { date: string; hours: number; quality: number }) => void;
}

export default function SleepEntryModal({ visible, onClose, onSave }: SleepEntryModalProps) {
  const [hours, setHours] = useState('8');
  const [quality, setQuality] = useState(5);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSave = () => {
    onSave({
      date: format(new Date(), 'MM/dd'),
      hours: parseFloat(hours),
      quality: quality
    });
    setHours('8');
    setQuality(5);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
          <Text style={[styles.modalTitle, isDark && styles.darkText]}>
            Log Sleep
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDark && styles.darkText]}>
              Hours of Sleep
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={hours}
              onChangeText={setHours}
              keyboardType="decimal-pad"
              placeholder="Enter hours"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDark && styles.darkText]}>
              Sleep Quality
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={quality}
              onValueChange={setQuality}
              minimumTrackTintColor="#FF7F50"
              maximumTrackTintColor={isDark ? '#666' : '#ddd'}
              thumbTintColor="#FF7F50"
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, isDark && styles.darkSubText]}>Poor</Text>
              <Text style={[styles.sliderValue, isDark && styles.darkText]}>{quality}</Text>
              <Text style={[styles.sliderLabel, isDark && styles.darkSubText]}>Excellent</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  darkModalContent: {
    backgroundColor: '#1e1e1e',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkInput: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
  },
  slider: {
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#FF7F50',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
}); 