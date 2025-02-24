import { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      router.push('/routines');
    } catch (error) {
      console.error('Error signing in:', (error as Error).message);
    }
  };

  const handleOAuthLogin = async (provider: 'google') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'uniwell://login-callback',
          scopes: 'email profile',
        },
      });

      if (error) throw error;

      if (data.url) {
        console.log('Redirecting to consent screen:', data.url);
      } else {
        console.log('OAuth login error: No redirect URL received');
      }
    } catch (error: unknown) {
      console.error('OAuth login error:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  interface OAuthButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    provider: string;
    color: string;
  }

  const OAuthButton: React.FC<OAuthButtonProps> = ({ icon, provider, color }) => (
    <TouchableOpacity 
      style={[styles.oauthButton, isDark && styles.darkCard, { borderColor: color }]}
      onPress={() => handleOAuthLogin(provider as 'google')}
    >
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.oauthButtonText, isDark && styles.darkText]}>
        Continue with {provider}
      </Text>
    </TouchableOpacity>
  );

  async function signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Handle successful sign up
      console.log('Signed up:', data);
    } catch (error) {
      console.error('Error signing up:', (error as Error).message);
    }
  }

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
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                  Sign in to continue your journey
                </Text>
              </View>

              <View style={styles.form}>
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

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleLogin}
                >
                  <LinearGradient
                    colors={['#FF7F50', '#FF6B45']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>Sign In</Text>
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
                    <Text style={styles.googleButtonText}>Sign in with Google</Text>
                  </BlurView>
                </TouchableOpacity>
              </View>
            </BlurView>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signupscreen')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
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
    marginBottom: 32,
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
  form: {
    gap: 16,
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
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#FF7F50',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
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
  darkCard: {
    backgroundColor: '#121212',
  },
  darkText: {
    color: '#ffffff',
  },
  oauthButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  oauthButtonText: {  
    fontFamily: 'SF-Regular',
    fontSize: 16,
    color: '#ffffff',
  },

});