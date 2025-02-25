import { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ImageBackground, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '../lib/supabase';
import * as burnt from 'burnt';
import * as Notifications from 'expo-notifications';
import CustomDialog from '../components/CustomDialog';

export default function SignUpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const router = useRouter();

  // Request notification permissions
  async function requestNotificationPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        // Get the push token with the project ID from environment
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID || '577b2274-9c11-4801-af8d-a12055a11673',
        });
        
        console.log('Push token:', token);
        
        // You can store this token in your database if needed
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Error requesting notification permissions:', error);
      return false;
    }
  }

  async function handleSignUp() {
    if (!name || !email || !password || !gender) {
      burnt.toast({
        title: 'Missing Information',
        message: 'Please fill in all fields including gender',
        preset: 'error',
      });
      return;
    }
  
    setLoading(true);
    try {
      await requestNotificationPermissions();
  
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, gender } // Add gender to user metadata
        }
      });
  
      if (error) throw error;
  
      // Profile creation should happen even if email confirmation is required
      if (data.user) {
        const avatarUrl = gender === 'male' 
          ? 'https://www.tapback.co/api/avatar/user55?color=3'
          : 'https://www.tapback.co/api/avatar/Ccd8b9';
  
        // Use maybeSingle() to handle missing profiles gracefully
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle(); // Critical fix here
  
        if (profileError) throw profileError;
  
        // Upsert profile data
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            avatar_url: avatarUrl,
            gender,
            profile_completion_percentage: 40,
            full_name: name,
            updated_at: new Date()
          });
  
        if (upsertError) throw upsertError;
  
        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: data.user.id,
            title: 'Complete Your Profile',
            description: 'Tell us more about yourself...',
            category: 'profile',
            is_read: false
          });
  
        // Check if email confirmation is required
        if (data.session) {
          // User is automatically signed in, proceed to profile completion
          router.push('/profile-completion');
        } else {
          // Show custom verification dialog
          setShowVerificationDialog(true);
        }
      }
    } catch (error) {
      burnt.toast({
        title: 'Error',
        message: (error as Error).message,
        preset: 'error',
      });
    } finally {
      setLoading(false);
    }
  }


  const handleOAuthLogin = async (provider: 'google') => {
    try {
      await requestNotificationPermissions();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'uniwell://login-callback',
          scopes: 'email profile',
        },
      });
  
      if (error) throw error;
      console.log('Redirecting to consent screen');
    } catch (error: unknown) {
      console.error('OAuth login error:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <ImageBackground
      source={isDark ? require('../assets/mesh-99dark.png') : require('../assets/mesh-99.png')}
      style={styles.container}
    >
      <LinearGradient
        colors={['rgba(255, 127, 80, 0.2)', 'rgba(255, 127, 80, 0.05)']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.content}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <BlurView intensity={20} style={styles.glassCard}>
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                  Start your wellness journey today
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={24} color="rgba(255, 255, 255, 0.6)" />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={24} color="rgba(255, 255, 255, 0.6)" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={24} color="rgba(255, 255, 255, 0.6)" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color="rgba(255, 255, 255, 0.6)" 
                  />
                </TouchableOpacity>
              </View>

              {/* Gender Selection */}
              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>Select Gender</Text>
                <View style={styles.genderOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.genderOption, 
                      gender === 'male' && styles.selectedGender
                    ]}
                    onPress={() => setGender('male')}
                  >
                    <Ionicons 
                      name="male" 
                      size={24} 
                      color={gender === 'male' ? "#FF7F50" : "rgba(255, 255, 255, 0.6)"} 
                    />
                    <Text style={[
                      styles.genderText,
                      gender === 'male' && styles.selectedGenderText
                    ]}>Male</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.genderOption, 
                      gender === 'female' && styles.selectedGender
                    ]}
                    onPress={() => setGender('female')}
                  >
                    <Ionicons 
                      name="female" 
                      size={24} 
                      color={gender === 'female' ? "#FF7F50" : "rgba(255, 255, 255, 0.6)"} 
                    />
                    <Text style={[
                      styles.genderText,
                      gender === 'female' && styles.selectedGenderText
                    ]}>Female</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.genderOption, 
                      gender === 'other' && styles.selectedGender
                    ]}
                    onPress={() => setGender('other')}
                  >
                    <Ionicons 
                      name="person" 
                      size={24} 
                      color={gender === 'other' ? "#FF7F50" : "rgba(255, 255, 255, 0.6)"} 
                    />
                    <Text style={[
                      styles.genderText,
                      gender === 'other' && styles.selectedGenderText
                    ]}>Other</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleSignUp}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#FF7F50', '#FF6B45']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={() => handleOAuthLogin('google')}
              >
                <BlurView intensity={30} style={styles.googleButtonContent}>
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                  <Text style={styles.googleButtonText}>Sign up with Google</Text>
                </BlurView>
              </TouchableOpacity>
            </BlurView>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/loginscreen')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
      <CustomDialog
        visible={showVerificationDialog}
        title="Verify Your Email"
        message="We've sent a verification link to your email. Please check your inbox and click the link to activate your account."
        confirmText="Go to Login"
        onConfirm={() => {
          setShowVerificationDialog(false);
          router.push('/loginscreen');
        }}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'SF-Regular',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'SF-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    height: '100%',
    paddingVertical: 8,
    marginLeft: 12,
    fontFamily: 'SF-Regular',
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontFamily: 'SF-Regular',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    height: 48,
    marginHorizontal: 4,
    paddingHorizontal: 8,
  },
  selectedGender: {
    borderColor: '#FF7F50',
    backgroundColor: 'rgba(255, 127, 80, 0.2)',
  },
  genderText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
    fontFamily: 'SF-Regular',
  },
  selectedGenderText: {
    color: '#FF7F50',
    fontWeight: '600',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'SF-Regular',
  },
  googleButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  googleButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'SF-Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: 'SF-Regular',
  },
  footerLink: {
    color: '#FF7F50',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SF-Regular',
  },
});