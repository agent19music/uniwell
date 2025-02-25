import { View, Text, TextInput, StyleSheet, useColorScheme, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/contexts/AuthContext';
import * as burnt from 'burnt';

export default function EditProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { profile, setProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    username: profile.username || '',
    bio: profile.bio || '',
    occupation: profile.occupation || '',
    university: profile.university || '',
    gender: profile.gender || '',
  });

  async function uploadAvatar() {
    try {
      setUploadingImage(true);
      
      // No permissions request is necessary for launching the image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64FileData = result.assets[0].base64;
        const contentType = 'image/png';
        const fileName = `avatar-${Date.now()}.png`;

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found');

        // Upload image to Supabase Storage
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(base64FileData), {
            contentType,
            upsert: true,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // Update local state
        setProfile({
          ...profile,
          avatar_url: publicUrl,
        });

        burnt.toast({
          title: 'Success',
          message: 'Profile picture updated',
          preset: 'done',
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.full_name,
          bio: formData.bio,
          occupation: formData.occupation,
          university: formData.university,
          gender: formData.gender,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
        }
      });

      // Update local state
      setProfile({
        ...profile,
        username: formData.username,
        full_name: formData.full_name,
        bio: formData.bio,
        occupation: formData.occupation,
        university: formData.university,
        gender: formData.gender,
      });

      burnt.toast({
        title: 'Success',
        message: 'Profile updated successfully',
        preset: 'done',
      });
      
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: profile.avatar_url || 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png' }}
            style={styles.avatar}
          />
          <TouchableOpacity 
            style={styles.changeAvatarButton} 
            onPress={uploadAvatar}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.changeAvatarText}>Change Photo</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>Full Name</Text>
            <View style={[styles.inputContainer, isDark && styles.darkInputContainer]}>
              <Ionicons name="person-outline" size={20} color={isDark ? '#aaaaaa' : '#666666'} />
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                placeholder="Your full name"
                placeholderTextColor={isDark ? '#777777' : '#999999'}
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>Username</Text>
            <View style={[styles.inputContainer, isDark && styles.darkInputContainer]}>
              <Ionicons name="at" size={20} color={isDark ? '#aaaaaa' : '#666666'} />
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                placeholder="Your username"
                placeholderTextColor={isDark ? '#777777' : '#999999'}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>Bio</Text>
            <View style={[styles.textAreaContainer, isDark && styles.darkInputContainer]}>
              <TextInput
                style={[styles.textArea, isDark && styles.darkInput]}
                placeholder="Tell us about yourself"
                placeholderTextColor={isDark ? '#777777' : '#999999'}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>Occupation</Text>
            <View style={[styles.inputContainer, isDark && styles.darkInputContainer]}>
              <Ionicons name="briefcase-outline" size={20} color={isDark ? '#aaaaaa' : '#666666'} />
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                placeholder="Your occupation"
                placeholderTextColor={isDark ? '#777777' : '#999999'}
                value={formData.occupation}
                onChangeText={(text) => setFormData({ ...formData, occupation: text })}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>University/School</Text>
            <View style={[styles.inputContainer, isDark && styles.darkInputContainer]}>
              <Ionicons name="school-outline" size={20} color={isDark ? '#aaaaaa' : '#666666'} />
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                placeholder="Your university or school"
                placeholderTextColor={isDark ? '#777777' : '#999999'}
                value={formData.university}
                onChangeText={(text) => setFormData({ ...formData, university: text })}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>Gender</Text>
            <View style={styles.genderOptions}>
              <TouchableOpacity 
                style={[
                  styles.genderOption, 
                  formData.gender === 'male' && styles.selectedGender,
                  isDark && styles.darkInputContainer
                ]}
                onPress={() => setFormData({ ...formData, gender: 'male' })}
              >
                <Ionicons 
                  name="male" 
                  size={20} 
                  color={formData.gender === 'male' ? "#FF7F50" : isDark ? '#aaaaaa' : '#666666'} 
                />
                <Text style={[
                  styles.genderText,
                  formData.gender === 'male' && styles.selectedGenderText,
                  isDark && styles.darkText
                ]}>Male</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.genderOption, 
                  formData.gender === 'female' && styles.selectedGender,
                  isDark && styles.darkInputContainer
                ]}
                onPress={() => setFormData({ ...formData, gender: 'female' })}
              >
                <Ionicons 
                  name="female" 
                  size={20} 
                  color={formData.gender === 'female' ? "#FF7F50" : isDark ? '#aaaaaa' : '#666666'} 
                />
                <Text style={[
                  styles.genderText,
                  formData.gender === 'female' && styles.selectedGenderText,
                  isDark && styles.darkText
                ]}>Female</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.genderOption, 
                  formData.gender === 'other' && styles.selectedGender,
                  isDark && styles.darkInputContainer
                ]}
                onPress={() => setFormData({ ...formData, gender: 'other' })}
              >
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={formData.gender === 'other' ? "#FF7F50" : isDark ? '#aaaaaa' : '#666666'} 
                />
                <Text style={[
                  styles.genderText,
                  formData.gender === 'other' && styles.selectedGenderText,
                  isDark && styles.darkText
                ]}>Other</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.cancelButton, isDark && styles.darkButton]} 
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={[styles.cancelButtonText, isDark && styles.darkButtonText]}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={updateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  darkText: {
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  changeAvatarButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  changeAvatarText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 16,
    height: 50,
  },
  darkInputContainer: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333333',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  darkInput: {
    color: '#ffffff',
  },
  textAreaContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 16,
  },
  textArea: {
    fontSize: 16,
    color: '#333333',
    height: 100,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: 50,
    marginHorizontal: 4,
  },
  selectedGender: {
    borderColor: '#FF7F50',
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
  },
  genderText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
  },
  selectedGenderText: {
    color: '#FF7F50',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  darkButton: {
    backgroundColor: '#333333',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  darkButtonText: {
    color: '#aaaaaa',
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FF7F50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});