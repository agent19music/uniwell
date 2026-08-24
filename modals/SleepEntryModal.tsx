import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Calendar, Moon, Sun, Coffee, Wine, Barbell, DeviceMobile } from 'phosphor-react-native';
import { SleepData } from '../lib/services/sleepService';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';

interface SleepEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: SleepData) => void;
  initialData?: Partial<SleepData>;
}

const SLEEP_FACTORS = [
  { id: 'caffeine_consumed', label: 'Caffeine', Icon: Coffee },
  { id: 'alcohol_consumed', label: 'Alcohol', Icon: Wine },
  { id: 'exercise_before_sleep', label: 'Exercise', Icon: Barbell },
  { id: 'screen_time_before_sleep', label: 'Screen Time', Icon: DeviceMobile },
];

export default function SleepEntryModal({ visible, onClose, onSave, initialData }: SleepEntryModalProps) {
  const [sleepDate, setSleepDate] = useState(new Date());
  const [sleepTime, setSleepTime] = useState(new Date(new Date().setHours(22, 0, 0, 0)));
  const [wakeTime, setWakeTime] = useState(new Date(new Date().setHours(7, 0, 0, 0)));
  const [quality, setQuality] = useState(initialData?.quality_rating || 7);
  const [deepSleep, setDeepSleep] = useState(initialData?.deep_sleep_minutes?.toString() || '');
  const [remSleep, setRemSleep] = useState(initialData?.rem_sleep_minutes?.toString() || '');
  const [lightSleep, setLightSleep] = useState(initialData?.light_sleep_minutes?.toString() || '');
  const [awakeTime, setAwakeTime] = useState(initialData?.awake_minutes?.toString() || '');
  const [heartRate, setHeartRate] = useState(initialData?.heart_rate_avg?.toString() || '');
  const [stressLevel, setStressLevel] = useState(initialData?.stress_level || 3);
  const [environment, setEnvironment] = useState(initialData?.sleep_environment_rating || 7);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [factors, setFactors] = useState({
    caffeine_consumed: initialData?.caffeine_consumed || false,
    alcohol_consumed: initialData?.alcohol_consumed || false,
    exercise_before_sleep: initialData?.exercise_before_sleep || false,
    screen_time_before_sleep: initialData?.screen_time_before_sleep || false,
  });
  
  const [showSleepPicker, setShowSleepPicker] = useState(false);
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const { colors, isDark } = useTheme();

  // Calculate total hours
  const calculateTotalHours = () => {
    const sleepMillis = sleepTime.getTime();
    const wakeMillis = wakeTime.getTime();
    
    // Handle cases where wake time is on the next day
    let diff = wakeMillis - sleepMillis;
    if (diff < 0) {
      diff += 24 * 60 * 60 * 1000; // Add a day in milliseconds
    }
    
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  };

  const toggleFactor = (id: string) => {
    setFactors(prev => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev]
    }));
  };

  const handleSave = () => {
    const totalHours = calculateTotalHours();
    
    const sleepData: SleepData = {
      sleep_date: format(sleepDate, 'yyyy-MM-dd'),
      sleep_time: format(sleepTime, 'HH:mm:ss'),
      wake_time: format(wakeTime, 'HH:mm:ss'),
      total_hours: totalHours,
      quality_rating: quality,
      deep_sleep_minutes: deepSleep ? parseInt(deepSleep) : undefined,
      rem_sleep_minutes: remSleep ? parseInt(remSleep) : undefined,
      light_sleep_minutes: lightSleep ? parseInt(lightSleep) : undefined,
      awake_minutes: awakeTime ? parseInt(awakeTime) : undefined,
      heart_rate_avg: heartRate ? parseInt(heartRate) : undefined,
      sleep_environment_rating: environment,
      stress_level: stressLevel,
      caffeine_consumed: factors.caffeine_consumed,
      alcohol_consumed: factors.alcohol_consumed,
      exercise_before_sleep: factors.exercise_before_sleep,
      screen_time_before_sleep: factors.screen_time_before_sleep,
      notes
    };
    
    onSave(sleepData);
    resetForm();
  };

  const resetForm = () => {
    setSleepDate(new Date());
    setSleepTime(new Date(new Date().setHours(22, 0, 0, 0)));
    setWakeTime(new Date(new Date().setHours(7, 0, 0, 0)));
    setQuality(7);
    setDeepSleep('');
    setRemSleep('');
    setLightSleep('');
    setAwakeTime('');
    setHeartRate('');
    setStressLevel(3);
    setEnvironment(7);
    setNotes('');
    setFactors({
      caffeine_consumed: false,
      alcohol_consumed: false,
      exercise_before_sleep: false,
      screen_time_before_sleep: false,
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSleepDate(selectedDate);
    }
  };

  const handleSleepTimeChange = (event: any, selectedTime?: Date) => {
    setShowSleepPicker(false);
    if (selectedTime) {
      setSleepTime(selectedTime);
    }
  };

  const handleWakeTimeChange = (event: any, selectedTime?: Date) => {
    setShowWakePicker(false);
    if (selectedTime) {
      setWakeTime(selectedTime);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>
              Record Sleep
            </Text>
            <TouchableOpacity accessibilityLabel="Close sleep entry" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} weight="regular" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                Date
              </Text>
              <TouchableOpacity 
                style={[styles.datePickerButton, isDark && styles.darkInput]} 
                onPress={() => setShowDatePicker(true)}
                accessibilityLabel={`Sleep date, ${format(sleepDate, 'EEEE, MMMM d, yyyy')}`}
                accessibilityRole="button"
              >
                <Calendar size={20} color={isDark ? '#ffffff' : '#333333'} weight="regular" />
                <Text style={[styles.dateText, isDark && styles.darkText]}>
                  {format(sleepDate, 'EEEE, MMMM d, yyyy')}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={sleepDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Sleep Schedule */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                Sleep Schedule
              </Text>
              
              <View style={styles.timeRow}>
                <View style={styles.timeColumn}>
                  <Text style={[styles.timeLabel, isDark && styles.darkSubText]}>Bedtime</Text>
                  <TouchableOpacity 
                    style={[styles.timePickerButton, isDark && styles.darkInput]} 
                    onPress={() => setShowSleepPicker(true)}
                    accessibilityLabel={`Bedtime, ${format(sleepTime, 'h:mm a')}`}
                    accessibilityRole="button"
                  >
                    <Moon size={18} color={isDark ? '#ffffff' : '#333333'} weight="regular" />
                    <Text style={[styles.timeText, isDark && styles.darkText]}>
                      {format(sleepTime, 'h:mm a')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeColumn}>
                  <Text style={[styles.timeLabel, isDark && styles.darkSubText]}>Wake time</Text>
                  <TouchableOpacity 
                    style={[styles.timePickerButton, isDark && styles.darkInput]} 
                    onPress={() => setShowWakePicker(true)}
                    accessibilityLabel={`Wake time, ${format(wakeTime, 'h:mm a')}`}
                    accessibilityRole="button"
                  >
                    <Sun size={18} color={isDark ? '#ffffff' : '#333333'} weight="regular" />
                    <Text style={[styles.timeText, isDark && styles.darkText]}>
                      {format(wakeTime, 'h:mm a')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showSleepPicker && (
                <DateTimePicker
                  value={sleepTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleSleepTimeChange}
                />
              )}

              {showWakePicker && (
                <DateTimePicker
                  value={wakeTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleWakeTimeChange}
                />
              )}

              <View style={styles.totalHoursContainer}>
                <Text style={[styles.totalHoursLabel, isDark && styles.darkSubText]}>
                  Total Sleep:
                </Text>
                <Text style={[styles.totalHoursValue, isDark && styles.darkText]}>
                  {calculateTotalHours()} hours
                </Text>
              </View>
            </View>

            {/* Sleep Quality */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                Sleep Quality
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={quality}
                onValueChange={setQuality}
                accessibilityLabel="Sleep quality"
                accessibilityValue={{ min: 1, max: 10, now: quality, text: `${quality} of 10` }}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accent}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, isDark && styles.darkSubText]}>Poor</Text>
                <Text style={[styles.sliderValue, isDark && styles.darkText]}>{quality}</Text>
                <Text style={[styles.sliderLabel, isDark && styles.darkSubText]}>Excellent</Text>
              </View>
            </View>

            {/* Sleep Environment */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                Sleep Environment
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={environment}
                onValueChange={setEnvironment}
                accessibilityLabel="Sleep environment"
                accessibilityValue={{ min: 1, max: 10, now: environment, text: `${environment} of 10` }}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accent}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, isDark && styles.darkSubText]}>Uncomfortable</Text>
                <Text style={[styles.sliderValue, isDark && styles.darkText]}>{environment}</Text>
                <Text style={[styles.sliderLabel, isDark && styles.darkSubText]}>Ideal</Text>
              </View>
            </View>

            {/* Stress Level */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                Stress Level
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={stressLevel}
                onValueChange={setStressLevel}
                accessibilityLabel="Stress level"
                accessibilityValue={{ min: 1, max: 10, now: stressLevel, text: `${stressLevel} of 10` }}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accent}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, isDark && styles.darkSubText]}>Relaxed</Text>
                <Text style={[styles.sliderValue, isDark && styles.darkText]}>{stressLevel}</Text>
                <Text style={[styles.sliderLabel, isDark && styles.darkSubText]}>Very Stressed</Text>
              </View>
            </View>

            {/* Sleep Factors */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                Sleep Factors
              </Text>
              <View style={styles.factorsGrid}>
                {SLEEP_FACTORS.map(factor => (
                  <TouchableOpacity
                    key={factor.id}
                    style={[
                      styles.factorItem,
                      factors[factor.id as keyof typeof factors] && styles.factorItemActive,
                      isDark && styles.darkInput,
                      factors[factor.id as keyof typeof factors] && isDark && styles.darkFactorItemActive
                    ]}
                    onPress={() => toggleFactor(factor.id)}
                    accessibilityLabel={factor.label}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: factors[factor.id as keyof typeof factors] }}
                  >
                    <factor.Icon
                      size={24}
                      color={factors[factor.id as keyof typeof factors]
                        ? (isDark ? '#000000' : '#ffffff')
                        : (isDark ? '#ffffff' : '#333333')
                      }
                      weight="regular"
                    />
                    <Text style={[
                      styles.factorLabel,
                      factors[factor.id as keyof typeof factors] && styles.factorLabelActive,
                      isDark && styles.darkText,
                      factors[factor.id as keyof typeof factors] && isDark && styles.darkFactorLabelActive
                    ]}>
                      {factor.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Advanced Sleep Metrics (Optional) */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                Advanced Metrics (Optional)
              </Text>
              
              <View style={styles.metricsRow}>
                <View style={styles.metricField}>
                  <Text style={[styles.metricLabel, isDark && styles.darkSubText]}>Deep Sleep (min)</Text>
                  <TextInput
                    accessibilityLabel="Deep sleep minutes"
                    style={[styles.metricInput, isDark && styles.darkInput]}
                    value={deepSleep}
                    onChangeText={setDeepSleep}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                  />
                </View>
                
                <View style={styles.metricField}>
                  <Text style={[styles.metricLabel, isDark && styles.darkSubText]}>REM Sleep (min)</Text>
                  <TextInput
                    accessibilityLabel="REM sleep minutes"
                    style={[styles.metricInput, isDark && styles.darkInput]}
                    value={remSleep}
                    onChangeText={setRemSleep}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                  />
                </View>
              </View>
              
              <View style={styles.metricsRow}>
                <View style={styles.metricField}>
                  <Text style={[styles.metricLabel, isDark && styles.darkSubText]}>Light Sleep (min)</Text>
                  <TextInput
                    accessibilityLabel="Light sleep minutes"
                    style={[styles.metricInput, isDark && styles.darkInput]}
                    value={lightSleep}
                    onChangeText={setLightSleep}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                  />
                </View>
                
                <View style={styles.metricField}>
                  <Text style={[styles.metricLabel, isDark && styles.darkSubText]}>Awake (min)</Text>
                  <TextInput
                    accessibilityLabel="Awake minutes"
                    style={[styles.metricInput, isDark && styles.darkInput]}
                    value={awakeTime}
                    onChangeText={setAwakeTime}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                  />
                </View>
              </View>
              
              <View style={styles.metricsRow}>
                <View style={styles.metricField}>
                  <Text style={[styles.metricLabel, isDark && styles.darkSubText]}>Avg Heart Rate (bpm)</Text>
                  <TextInput
                    accessibilityLabel="Average heart rate"
                    style={[styles.metricInput, isDark && styles.darkInput]}
                    value={heartRate}
                    onChangeText={setHeartRate}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                  />
                </View>
                
                <View style={styles.metricField} />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                Notes
              </Text>
              <TextInput
                accessibilityLabel="Sleep notes"
                style={[styles.notesInput, isDark && styles.darkInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional notes about your sleep..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={[styles.actions, { borderTopColor: colors.divider }]}>
            <Button label="Cancel" onPress={onClose} style={styles.action} variant="secondary" />
            <Button label="Save sleep" onPress={handleSave} style={styles.action} />
          </View>
        </View>
      </KeyboardAvoidingView>
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
    borderWidth: 1,
    borderCurve: 'continuous',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  darkModalContent: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  darkHeader: {
    borderBottomColor: '#333',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  darkInput: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  totalHoursContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 16,
  },
  darkTotalHoursContainer: {
    backgroundColor: '#1e3a5f',
  },
  totalHoursLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  totalHoursValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3F70F4',
    marginLeft: 6,
    fontFamily: 'Vercetti-Regular',
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
  factorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  factorItem: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    minHeight: 56,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  factorItemActive: {
    backgroundColor: '#3F70F4',
  },
  darkFactorItemActive: {
    backgroundColor: '#3F70F4',
  },
  factorLabel: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  factorLabelActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  darkFactorLabelActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  metricField: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontFamily: 'Vercetti-Regular',
  },
  metricInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
  },
  notesInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    fontFamily: 'Vercetti-Regular',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  action: {
    flex: 1,
  },
  darkActions: {
    borderTopColor: '#333',
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
    backgroundColor: '#3F70F4',
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