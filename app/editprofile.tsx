import { View, Text, TextInput, StyleSheet, useColorScheme, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import * as burnt from 'burnt';
import { useAuth } from '@/lib/AuthContext';


export default function EditProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  

  async function uploadAvatar() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access media library was denied');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const filePath = `${user.id}/${Date.now()}.jpg`;

        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(filePath, decode(result.assets[0].base64), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      }
    } catch (error) {
      burnt.toast({
        title: 'Error',
        message: error.message,
        preset: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: { full_name: profile.full_name }
      });

      if (updateAuthError) throw updateAuthError;

      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (updateProfileError) throw updateProfileError;

      burnt.toast({
        title: 'Success',
        message: 'Profile updated successfully',
        preset: 'done',
      });
      router.back();
    } catch (error) {
      burnt.toast({
        title: 'Error',
        message: error.message,
        preset: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Edit Profile</Text>
        <TouchableOpacity onPress={updateProfile} disabled={loading}>
          <Text style={styles.saveButton}>{loading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Image
            source={profile.avatar_url ? { uri: profile.avatar_url } : require('../assets/default-avatar.png')}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.changeAvatarButton} onPress={uploadAvatar}>
            <Text style={styles.changeAvatarText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputContainer, isDark && styles.darkCard]}>
          <Text style={[styles.label, isDark && styles.darkText]}>Full Name</Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={profile.full_name}
            onChangeText={(text) => setProfile(prev => ({ ...prev, full_name: text }))}
            placeholder="Enter your full name"
            placeholderTextColor={isDark ? '#666' : '#999'}
          />
        </View>

        <View style={[styles.inputContainer, isDark && styles.darkCard]}>
          <Text style={[styles.label, isDark && styles.darkText]}>Username</Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={profile.username}
            onChangeText={(text) => setProfile(prev => ({ ...prev, username: text }))}
            placeholder="Enter your username"
            placeholderTextColor={isDark ? '#666' : '#999'}
          />
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  darkText: {
    color: '#fff',
  },
  saveButton: {
    color: '#FF7F50',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  changeAvatarButton: {
    padding: 8,
  },
  changeAvatarText: {
    color: '#FF7F50',
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: '#333',
  },
  darkInput: {
    color: '#fff',
  },
}); 