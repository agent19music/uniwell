import { View, Text, StyleSheet, useColorScheme, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const handleOAuthLogin = async (provider: 'google') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'uniwell://login-callback',
        },
      });

      if (error) throw error;
      console.log('OAuth login successful:', data);
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
          <BlurView intensity={20} style={styles.glassCard}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="infinite-outline" size={60} color="#FF7F50" />
              </View>
              <Text style={styles.title}>UniWell</Text>
              <Text style={styles.subtitle}>
                Your journey to better habits and wellness starts here
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/signupscreen')}
              >
                <LinearGradient
                  colors={['#FF7F50', '#FF6B45']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.buttonText}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/loginscreen')}
              >
                <Text style={styles.secondaryButtonText}>
                  I already have an account
                </Text>
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
                  {/* <Image 
                    source={require('../assets/google-icons/icons8-google-48.png')} 
                    style={{ width: 24, height: 24 }}
                  /> */}
                  <Ionicons name="logo-google" size={24} color="#ffffff" />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
          </BlurView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Join over </Text>
            <Text style={styles.footerHighlight}>2M+</Text>
            <Text style={styles.footerText}> wellness seekers</Text>
          </View>
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
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  buttonContainer: {
    gap: 16,
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
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF7F50',
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
  footerHighlight: {
    color: '#FF7F50',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SF-Regular',
  },
});