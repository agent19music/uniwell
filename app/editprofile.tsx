import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, At, Briefcase, GraduationCap, GenderMale, GenderFemale } from 'phosphor-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/contexts/AuthContext';
import * as Burnt from 'burnt';
import { Button } from '@/components/ui/Button';
import { FormSection } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTheme } from '@/hooks/useTheme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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

        Burnt.toast({
          title: 'Success',
          message: 'Profile picture updated',
          duration: 2,
          from: 'top',
          shouldDismissByDrag: true
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

      Burnt.toast({
        title: 'Success',
        message: 'Profile updated successfully',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
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

        <FormSection>
          <Input
            label="Full name"
            leading={<User size={20} color={colors.textSecondary} weight="regular" />}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            placeholder="Your full name"
            value={formData.full_name}
          />
          <Input
            autoCapitalize="none"
            label="Username"
            leading={<At size={20} color={colors.textSecondary} weight="regular" />}
            onChangeText={(text) => setFormData({ ...formData, username: text })}
            placeholder="Your username"
            value={formData.username}
          />
          <Input
            label="Bio"
            multiline
            numberOfLines={4}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder="Tell us about yourself"
            value={formData.bio}
          />
          <Input
            label="Occupation"
            leading={<Briefcase size={20} color={colors.textSecondary} weight="regular" />}
            onChangeText={(text) => setFormData({ ...formData, occupation: text })}
            placeholder="Your occupation"
            value={formData.occupation}
          />
          <Input
            label="University or school"
            leading={<GraduationCap size={20} color={colors.textSecondary} weight="regular" />}
            onChangeText={(text) => setFormData({ ...formData, university: text })}
            placeholder="Your university or school"
            value={formData.university}
          />
          <SegmentedControl
            label="Gender"
            onChange={(gender) => setFormData({ ...formData, gender })}
            options={[
              { label: 'Male', value: 'male', icon: <GenderMale size={18} color={colors.textSecondary} weight="regular" /> },
              { label: 'Female', value: 'female', icon: <GenderFemale size={18} color={colors.textSecondary} weight="regular" /> },
              { label: 'Other', value: 'other', icon: <User size={18} color={colors.textSecondary} weight="regular" /> },
            ]}
            value={formData.gender as 'male' | 'female' | 'other' | ''}
          />
        </FormSection>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.canvas }]}>
        <Button label="Cancel" variant="secondary" onPress={() => router.back()} disabled={loading} style={styles.footerButton} />
        <Button label="Save changes" loading={loading} onPress={updateProfile} style={styles.footerButton} />
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
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerButton: {
    flex: 1,
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