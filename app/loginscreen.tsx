import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ImageBackground, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { LockSimple, GoogleLogo, Envelope, ArrowLeft, Eye, EyeSlash } from 'phosphor-react-native';
import { useTheme } from '../hooks/useTheme';
import { toast } from '@/lib/toast';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Welcome back!');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error signing in:', (error as Error).message);
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      console.error('Google login error:', error instanceof Error ? error.message : 'Unknown error');
      // Toast is handled in AuthContext for specific errors
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
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to continue your wellness journey
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[
            styles.form,
            { opacity: fadeAnim }
          ]}>
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
                  placeholder="Enter your password"
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

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => router.push('/reset-password')}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: isDark ? colors.background : '#FFFFFF' }]}>
                {loading ? 'Signing in...' : 'Sign In'}
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
                Continue with Google
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[
            styles.footer,
            { opacity: fadeAnim }
          ]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/signupscreen')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
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