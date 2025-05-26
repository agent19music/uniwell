import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  useColorScheme,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTherapist } from '../context/TherapistContext';
import { TherapistProfile } from '../types';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../lib/supabase';

export default function ProfileEditor() {
  const { profile, updateProfile, user } = useTherapist();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    specialization: profile?.specialization?.join(', ') || '',
    qualifications: profile?.qualifications?.join(', ') || '',
    consultationRates: profile?.consultation_rates?.toString() || '',
    experienceYears: profile?.experience_years?.toString() || '',
    education: profile?.education?.join(', ') || '',
    languages: profile?.languages?.join(', ') || '',
    profilePicture: profile?.profile_picture || null,
  });
  
  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        specialization: profile.specialization?.join(', ') || '',
        qualifications: profile.qualifications?.join(', ') || '',
        consultationRates: profile.consultation_rates?.toString() || '',
        experienceYears: profile.experience_years?.toString() || '',
        education: profile.education?.join(', ') || '',
        languages: profile.languages?.join(', ') || '',
        profilePicture: profile.profile_picture || null,
      });
    }
  }, [profile]);
  
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const { bio, specialization, qualifications, consultationRates, experienceYears, education, languages } = formData;
      
      if (!bio || !specialization || !qualifications || !consultationRates) {
        Alert.alert('Missing Information', 'Please fill out all required fields.');
        setIsSaving(false);
        return;
      }
      
      const profileData: Partial<TherapistProfile> = {
        bio,
        specialization: specialization.split(',').map(s => s.trim()),
        qualifications: qualifications.split(',').map(q => q.trim()),
        consultation_rates: parseInt(consultationRates),
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
      
      const { error } = await updateProfile(profileData);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to update profile');
      } else {
        // Also update the user's name in the users table
        if (user && bio) {
          try {
            const { error: userUpdateError } = await supabase
              .from('users')
              .update({ full_name: bio })
              .eq('id', user.id);
              
            if (userUpdateError) {
              console.error('Error updating user name:', userUpdateError);
            }
          } catch (userUpdateError) {
            console.error('Error updating user name:', userUpdateError);
          }
        }
        
        Alert.alert('Success', 'Your profile has been updated successfully.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  const pickImage = async () => {
    try {
      // Request permission
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
          return;
        }
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  const uploadImage = async (uri: string) => {
    try {
      setImageUploading(true);
      
      // For web, we need to convert the uri to a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `therapist-profiles/${profile?.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
      
      if (data) {
        const { error } = await updateProfile({ profile_picture: data.publicUrl });
        
        if (!error) {
          setFormData(prev => ({ ...prev, profilePicture: data.publicUrl }));
        }
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };
  
  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>Edit Profile</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={[styles.card, isDark && styles.darkCard]}>
          {/* Profile Picture */}
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePictureWrapper}>
              {imageUploading ? (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color="#FF7F50" />
                </View>
              ) : formData.profilePicture ? (
                <Image 
                  source={{ uri: formData.profilePicture }} 
                  style={styles.profilePicture} 
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={40} color={isDark ? "#444" : "#ddd"} />
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.editPictureButton}
                onPress={pickImage}
                disabled={imageUploading}
              >
                <Ionicons name="camera" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
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
            <View style={[styles.inputContainer, styles.flex1, { marginRight: 8 }]}>
              <Text style={[styles.label, isDark && styles.darkText]}>Session Rate (KES) *</Text>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                value={formData.consultationRates}
                onChangeText={(value) => updateField('consultationRates', value)}
                placeholder="e.g., 2000"
                placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.flex1]}>
              <Text style={[styles.label, isDark && styles.darkText]}>Years of Experience</Text>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                value={formData.experienceYears}
                onChangeText={(value) => updateField('experienceYears', value)}
                placeholder="e.g., 5"
                placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, isDark && styles.darkText]}>Languages</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={formData.languages}
              onChangeText={(value) => updateField('languages', value)}
              placeholder="e.g., English, Swahili, French"
              placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
            />
            <Text style={[styles.helperText, isDark && styles.darkSubText]}>
              Separate multiple languages with commas
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePictureWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPictureButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF7F50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  darkInput: {
    backgroundColor: '#2c2c2c',
    borderColor: '#444',
    color: '#fff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  darkText: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
}); 