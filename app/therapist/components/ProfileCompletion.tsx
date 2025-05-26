import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTherapist } from '../context/TherapistContext';
import { TherapistProfile } from '../types';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';

interface DayAvailability {
  active: boolean;
  start: string;
  end: string;
}

interface ProfileCompletionProps {
  onComplete?: () => void;
}

export default function ProfileCompletion({ onComplete }: ProfileCompletionProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { profile, completeProfile } = useTherapist();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    specialization: profile?.specialization?.join(', ') || '',
    qualifications: profile?.qualifications?.join(', ') || '',
    consultationRates: profile?.consultation_rates?.toString() || '',
    experienceYears: profile?.experience_years?.toString() || '',
    education: profile?.education?.join(', ') || '',
    languages: profile?.languages?.join(', ') || '',
  });
  
  // Initialize schedule with empty values
  const [schedule, setSchedule] = useState<Record<string, DayAvailability>>({
    monday: { active: false, start: "09:00", end: "17:00" },
    tuesday: { active: false, start: "09:00", end: "17:00" },
    wednesday: { active: false, start: "09:00", end: "17:00" },
    thursday: { active: false, start: "09:00", end: "17:00" },
    friday: { active: false, start: "09:00", end: "17:00" },
    saturday: { active: false, start: "09:00", end: "17:00" },
    sunday: { active: false, start: "09:00", end: "17:00" },
  });

  // If profile already has availability, use it
  React.useEffect(() => {
    if (profile?.availability) {
      const currentAvailability = profile.availability as Record<string, any>;
      const updatedSchedule = { ...schedule };
      
      Object.entries(currentAvailability).forEach(([day, data]) => {
        if (data && data.start && data.end) {
          updatedSchedule[day] = {
            active: true,
            start: data.start,
            end: data.end
          };
        }
      });
      
      setSchedule(updatedSchedule);
    }
  }, [profile]);
  
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const toggleDayAvailability = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        active: !prev[day].active,
      }
    }));
  };
  
  const updateDaySchedule = (day: string, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }));
  };
  
  const convertToAvailabilityFormat = () => {
    const formattedAvailability: Record<string, any> = {};
    
    Object.entries(schedule).forEach(([day, data]) => {
      if (data.active) {
        formattedAvailability[day] = {
          start: data.start,
          end: data.end,
        };
      }
    });
    
    return formattedAvailability;
  };
  
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      const availability = convertToAvailabilityFormat();
      
      if (Object.keys(availability).length === 0) {
        Alert.alert('Availability Required', 'Please set your availability for at least one day of the week.');
        setIsLoading(false);
        return;
      }
      
      const { bio, specialization, qualifications, consultationRates, experienceYears, education, languages } = formData;
      
      if (!bio || !specialization || !qualifications || !consultationRates) {
        Alert.alert('Missing Information', 'Please fill out all required fields.');
        setIsLoading(false);
        return;
      }
      
      const profileData: Partial<TherapistProfile> = {
        bio,
        specialization: specialization.split(',').map(s => s.trim()),
        qualifications: qualifications.split(',').map(q => q.trim()),
        consultation_rates: parseInt(consultationRates),
        availability,
      };
      
      if (experienceYears) {
        profileData.experience_years = parseInt(experienceYears);
      }
      
      if (education) {
        profileData.education = education.split(',').map(e => e.trim());
      }
      
      if (languages) {
        profileData.languages = languages.split(',').map(l => l.trim());
      }
      
      const { error } = await completeProfile(profileData);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to update profile');
      } else {
        // Also update the user's name in the users table
        try {
          const { error: userUpdateError } = await supabase
            .from('users')
            .update({ full_name: bio })
            .eq('id', profile.id);
            
          if (userUpdateError) {
            console.error('Error updating user name:', userUpdateError);
          }
        } catch (userUpdateError) {
          console.error('Error updating user name:', userUpdateError);
        }
        
        Alert.alert(
          'Profile Completed', 
          'Your profile has been updated successfully. You can now receive appointments.', 
          [{ text: 'OK', onPress: onComplete }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const goToNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const renderStepOne = () => {
    return (
      <View style={styles.formSection}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Professional Information</Text>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, isDark && styles.darkText]}>Bio *</Text>
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.darkInput]}
            value={formData.bio}
            onChangeText={(value) => updateField('bio', value)}
            placeholder="Tell clients about yourself and your practice"
            placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, isDark && styles.darkText]}>Specializations *</Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={formData.specialization}
            onChangeText={(value) => updateField('specialization', value)}
            placeholder="e.g., Anxiety, Depression, Stress Management"
            placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
          />
          <Text style={[styles.helperText, isDark && styles.darkSubText]}>
            Separate multiple specializations with commas
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, isDark && styles.darkText]}>Qualifications *</Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={formData.qualifications}
            onChangeText={(value) => updateField('qualifications', value)}
            placeholder="e.g., PhD in Psychology, Licensed Therapist"
            placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
          />
          <Text style={[styles.helperText, isDark && styles.darkSubText]}>
            Separate multiple qualifications with commas
          </Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, isDark && styles.darkText]}>Education</Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={formData.education}
            onChangeText={(value) => updateField('education', value)}
            placeholder="e.g., Harvard University, University of Delhi"
            placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
          />
          <Text style={[styles.helperText, isDark && styles.darkSubText]}>
            Separate multiple institutions with commas
          </Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.flex1]}>
            <Text style={[styles.label, isDark && styles.darkText]}>Consultation Rate (₹) *</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={formData.consultationRates}
              onChangeText={(value) => updateField('consultationRates', value)}
              placeholder="Per session"
              placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputContainer, styles.flex1]}>
            <Text style={[styles.label, isDark && styles.darkText]}>Experience (Years)</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={formData.experienceYears}
              onChangeText={(value) => updateField('experienceYears', value)}
              placeholder="Years"
              placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, isDark && styles.darkText]}>Languages</Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={formData.languages}
            onChangeText={(value) => updateField('languages', value)}
            placeholder="e.g., English, Hindi, Tamil"
            placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
          />
          <Text style={[styles.helperText, isDark && styles.darkSubText]}>
            Separate multiple languages with commas
          </Text>
        </View>
      </View>
    );
  };
  
  const renderStepTwo = () => {
    return (
      <View style={styles.formSection}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Availability</Text>
        <Text style={[styles.sectionSubtitle, isDark && styles.darkSubText]}>
          Set your weekly availability. Students will be able to book sessions during these hours.
        </Text>
        
        {Object.entries(schedule).map(([day, data]) => (
          <View key={day} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayName, isDark && styles.darkText]}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Text>
              <Switch
                value={data.active}
                onValueChange={() => toggleDayAvailability(day)}
                trackColor={{ false: '#D1D1D6', true: '#FF7F50' }}
                thumbColor={data.active ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="#D1D1D6"
              />
            </View>
            
            {data.active && (
              <View style={styles.timeContainer}>
                <View style={styles.timeInput}>
                  <Text style={[styles.timeLabel, isDark && styles.darkSubText]}>Start Time</Text>
                  <TextInput
                    style={[styles.timeField, isDark && styles.darkInput]}
                    value={data.start}
                    onChangeText={(value) => updateDaySchedule(day, 'start', value)}
                    placeholder="09:00"
                    placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                  />
                </View>
                
                <Text style={[styles.timeSeparator, isDark && styles.darkText]}>to</Text>
                
                <View style={styles.timeInput}>
                  <Text style={[styles.timeLabel, isDark && styles.darkSubText]}>End Time</Text>
                  <TextInput
                    style={[styles.timeField, isDark && styles.darkInput]}
                    value={data.end}
                    onChangeText={(value) => updateDaySchedule(day, 'end', value)}
                    placeholder="17:00"
                    placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                  />
                </View>
              </View>
            )}
          </View>
        ))}
        
        <Text style={[styles.helperText, isDark && styles.darkSubText, styles.availabilityHelper]}>
          Time should be in 24-hour format (HH:MM). You can further customize your availability with exceptions from the dashboard later.
        </Text>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>Complete Your Profile</Text>
        <Text style={[styles.subtitle, isDark && styles.darkSubText]}>
          Step {currentStep} of 2
        </Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(currentStep / 2) * 100}%` }]} />
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStepOne()}
        {currentStep === 2 && renderStepTwo()}
      </ScrollView>
      
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.backButton, isDark && styles.darkBackButton]}
            onPress={goToPreviousStep}
          >
            <Text style={[styles.backButtonText, isDark && styles.darkButtonText]}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.nextButton, isLoading && styles.disabledButton]}
          onPress={goToNextStep}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep < 2 ? 'Next' : 'Complete Profile'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontFamily: 'Vercetti-Regular',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF7F50',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontFamily: 'Vercetti-Regular',
  },
  darkInput: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
    color: '#ffffff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  availabilityHelper: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  dayContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Vercetti-Regular',
  },
  timeField: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontFamily: 'Vercetti-Regular',
  },
  timeSeparator: {
    marginHorizontal: 10,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  darkBackButton: {
    backgroundColor: '#2a2a2a',
  },
  nextButton: {
    backgroundColor: '#FF7F50',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  darkButtonText: {
    color: '#ffffff',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
}); 