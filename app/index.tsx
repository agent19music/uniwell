import { View, Text, StyleSheet, useColorScheme, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const handleOAuthLogin = async (provider: 'google' ) => {
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
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="infinite-outline" size={80} color="#FF7F50" />
          <Text style={[styles.title, isDark && styles.darkText]}>Welcome to UniWell</Text>
          <Text style={[styles.subtitle, isDark && styles.darkSubText]}>
            Your journey to better habits and wellness starts here
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={() => router.push('/signupscreen')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, isDark && styles.darkCard]} 
            onPress={() => router.push('/loginscreen')}
          >
            <Text style={[styles.secondaryButtonText, { color: '#FF7F50' }]}>
              I already have an account
            </Text>
          </TouchableOpacity>

          <View style={styles.oauthContainer}>
            <Text style={[styles.oauthText, isDark && styles.darkSubText]}>
              Or continue with
            </Text>
            <View style={styles.oauthButtons}>
              <TouchableOpacity 
                style={[styles.oauthButton, isDark && styles.darkCard]}
                onPress={() => handleOAuthLogin('google')}
              >
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              
             
            </View>
          </View>
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
    content: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
      width: '100%',
      maxWidth: 400,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
      textAlign: 'center',
      fontFamily: 'Vercetti-Regular',
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      paddingHorizontal: 40,
      fontFamily: 'Vercetti-Regular',
    },
    buttonContainer: {
      gap: 16,
      width: '100%',
      maxWidth: 400,
    },
    button: {
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: '#FF7F50',
    },
    secondaryButton: {
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#FF7F50',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Vercetti-Regular',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Vercetti-Regular',
    },
    darkCard: {
      backgroundColor: '#1e1e1e',
    },
    darkText: {
      color: '#ffffff',
    },
    darkSubText: {
      color: '#aaaaaa',
    },
    form: {
      gap: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: '#333',
    },
    darkInput: {
      color: '#fff',
      backgroundColor: '#1e1e1e',
    },
    forgotPassword: {
      alignSelf: 'flex-end',
    },
    forgotPasswordText: {
      fontSize: 14,
      fontWeight: '600',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#eee',
    },
    darkDivider: {
      backgroundColor: '#333',
    },
    dividerText: {
      color: '#666',
      fontSize: 14,
    },
    oauthButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      height: 56,
      borderRadius: 16,
      borderWidth: 1,
      gap: 12,
    },
    oauthButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
      fontSize: 16,
    },
    footerLink: {
      fontSize: 16,
      fontWeight: '600',
    },
    backButton: {
      position: 'absolute',
      top: 0,
      left: 0,
      padding: 16,
    },
    oauthContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    oauthText: {
      fontSize: 16,
      fontWeight: '600',
    },
    oauthButtons: {
      flexDirection: 'row',
      gap: 12,
    },
});