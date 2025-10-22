import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import * as Burnt from 'burnt';

export default function LoginCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleOAuthCallback() {
      try {
        // Request notification permissions
        await Notifications.requestPermissionsAsync();
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('No user found after OAuth login');
        }
        
        // Check if this is a new user (no profile data yet)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        // If this is a new user or profile is incomplete
        if (!profile || !profile.gender) {
          // Try to get gender from Google profile if available
          // Note: This is a simplification - Google OAuth doesn't directly provide gender
          // You would need to use Google People API for this
          const defaultGender = 'other';
          
          // Set default avatar based on gender
          const avatarUrl = defaultGender === 'male' 
            ? 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/male-memoji.png'
            : 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/female-memoji.png';
          
          // Update profile with avatar and initial data
          await supabase
            .from('profiles')
            .update({ 
              avatar_url: avatarUrl,
              gender: defaultGender,
              profile_completion_percentage: 40
            })
            .eq('id', user.id);
          
          // Create welcome notification
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              title: 'Complete Your Profile',
              description: 'Tell us more about yourself so we can personalize your experience!',
              category: 'profile',
              is_read: false
            });
            
          // Navigate to profile completion
          router.replace('/profile-completion');
        } else {
          // Existing user, go to home
          router.replace('/(tabs)/home');
        }
      } catch (error) {
        console.error('Error in OAuth callback:', error);
        Burnt.toast({
          title: 'Error',
          message: 'There was a problem with your login. Please try again.',
          preset: 'error',
          duration: 2,
          from: 'top',
          shouldDismissByDrag: true
        });
        router.replace('/');
      }
    }
    
    handleOAuthCallback();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF7F50" />
      <Text style={styles.text}>Completing your sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
}); 