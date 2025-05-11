import { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as burnt from 'burnt';

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      burnt.toast({
        title: 'Error',
        message: 'Please enter your email address',
        preset: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'uniwell://reset-password-callback',
      });

      if (error) throw error;

      burnt.toast({
        title: 'Success',
        message: 'Password reset instructions sent to your email',
        preset: 'done',
      });
      
      router.back();
    } catch (error) {
      console.error('Error resetting password:', (error as Error).message);
      burnt.toast({
        title: 'Error',
        message: (error as Error).message,
        preset: 'error',
      });
    } finally {
      setLoading(false);
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
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                  Enter your email to receive reset instructions
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

                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#FF7F50', '#FF6B45']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
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
}); 