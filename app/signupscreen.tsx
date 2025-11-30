import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ImageBackground, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import CustomDialog from '../components/CustomDialog';
import { ArrowLeft, Envelope, LockSimple, User, GoogleLogo, Eye, EyeSlash, GenderMale, GenderFemale, GenderNeuter } from 'phosphor-react-native';
import { useTheme } from '../hooks/useTheme';
import { toast } from '@/lib/toast';
import { useAuth } from '../contexts/AuthContext';

export default function SignUpScreen() {
  const { colors, isDark } = useTheme();
  const { signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const router = useRouter();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
      toast.error('Please fill in all fields including gender');
      return;
    }
  
    setLoading(true);
    try {
      await requestNotificationPermissions();
  
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, gender }
        }
      });
  
      if (error) throw error;
  
      if (data.user) {
        const avatarUrl = gender === 'male' 
          ? 'https://www.tapback.co/api/avatar/user55?color=3'
          : 'https://www.tapback.co/api/avatar/Ccd8b9';
  
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();
  
        if (profileError) throw profileError;
  
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
  
        await supabase
          .from('notifications')
          .insert({
            user_id: data.user.id,
            title: 'Complete Your Profile',
            description: 'Tell us more about yourself...',
            category: 'profile',
            is_read: false
          });
  
        if (data.session) {
          router.push('/profile-completion');
        } else {
          setShowVerificationDialog(true);
        }
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }


  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await requestNotificationPermissions();
      await signInWithGoogle();
    } catch (error: unknown) {
      console.error('Google login error:', error instanceof Error ? error.message : 'Unknown error');
      // Toast is handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ImageBackground
        source={isDark ? require('../assets/mesh-99dark.png') : require('../assets/mesh-99.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[styles.overlay, { 
          backgroundColor: isDark ? 'rgba(28, 24, 21, 0.85)' : 'rgba(254, 253, 251, 0.85)' 
        }]} />
      </ImageBackground>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Animated.View style={[
            styles.backButtonContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.surface }]} 
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Header */}
          <Animated.View style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Start your wellness journey today
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[
            styles.form,
            { opacity: fadeAnim }
          ]}>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
              <View style={[styles.inputContainer, { 
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }]}>
                <User size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
              <View style={[styles.inputContainer, { 
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }]}>
                <Envelope size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
              <View style={[styles.inputContainer, { 
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }]}>
                <LockSimple size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeSlash size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Gender</Text>
              <View style={styles.genderOptions}>
                <TouchableOpacity 
                  style={[
                    styles.genderOption,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: gender === 'male' ? colors.primary : colors.border
                    },
                    gender === 'male' && styles.selectedGender
                  ]}
                  onPress={() => setGender('male')}
                  disabled={loading}
                >
                  <GenderMale 
                    size={24} 
                    color={gender === 'male' ? colors.primary : colors.textSecondary} 
                    weight={gender === 'male' ? 'fill' : 'regular'}
                  />
                  <Text style={[
                    styles.genderText,
                    { color: gender === 'male' ? colors.primary : colors.textSecondary },
                    gender === 'male' && styles.selectedGenderText
                  ]}>Male</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.genderOption,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: gender === 'female' ? colors.primary : colors.border
                    },
                    gender === 'female' && styles.selectedGender
                  ]}
                  onPress={() => setGender('female')}
                  disabled={loading}
                >
                  <GenderFemale 
                    size={24} 
                    color={gender === 'female' ? colors.primary : colors.textSecondary} 
                    weight={gender === 'female' ? 'fill' : 'regular'}
                  />
                  <Text style={[
                    styles.genderText,
                    { color: gender === 'female' ? colors.primary : colors.textSecondary },
                    gender === 'female' && styles.selectedGenderText
                  ]}>Female</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.genderOption,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: gender === 'other' ? colors.primary : colors.border
                    },
                    gender === 'other' && styles.selectedGender
                  ]}
                  onPress={() => setGender('other')}
                  disabled={loading}
                >
                  <GenderNeuter 
                    size={24} 
                    color={gender === 'other' ? colors.primary : colors.textSecondary} 
                    weight={gender === 'other' ? 'fill' : 'regular'}
                  />
                  <Text style={[
                    styles.genderText,
                    { color: gender === 'other' ? colors.primary : colors.textSecondary },
                    gender === 'other' && styles.selectedGenderText
                  ]}>Other</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: isDark ? colors.background : '#FFFFFF' }]}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={[styles.googleButton, { 
                backgroundColor: colors.surface,
                borderColor: colors.border
              }]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <GoogleLogo size={20} color={colors.textPrimary} />
              <Text style={[styles.googleButtonText, { color: colors.textPrimary }]}>
                Sign up with Google
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[
            styles.footer,
            { opacity: fadeAnim }
          ]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/loginscreen')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backButtonContainer: {
    marginBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5,
    fontFamily: 'Vercetti-Regular',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: 'SF-Regular',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SF-Regular',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    height: 56,
    gap: 8,
  },
  selectedGender: {
    borderWidth: 2,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
  selectedGenderText: {
    fontWeight: '600',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'SF-Regular',
  },
  googleButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    fontFamily: 'SF-Regular',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
});