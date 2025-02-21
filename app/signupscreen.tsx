import { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SignUpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSignUp = () => {
    // Implement sign up logic
    console.log('Signing up...');
  };

  const OAuthButton = ({ icon, provider, color }: { icon: string; provider: string; color: string }) => (
    <TouchableOpacity 
      style={[styles.oauthButton, isDark && styles.darkCard, { borderColor: color }]}
      onPress={() => console.log(`${provider} signup`)}
    >
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.oauthButtonText, isDark && styles.darkText]}>
        Continue with {provider}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#333'} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>Create Account</Text>
          <Text style={[styles.subtitle, isDark && styles.darkSubText]}>
            Start your wellness journey today
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={24} color={isDark ? '#aaa' : '#666'} />
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder="Full Name"
              placeholderTextColor={isDark ? '#aaa' : '#666'}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={24} color={isDark ? '#aaa' : '#666'} />
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder="Email"
              placeholderTextColor={isDark ? '#aaa' : '#666'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color={isDark ? '#aaa' : '#666'} />
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder="Password"
              placeholderTextColor={isDark ? '#aaa' : '#666'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color={isDark ? '#aaa' : '#666'} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={handleSignUp}
          >
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, isDark && styles.darkDivider]} />
            <Text style={[styles.dividerText, isDark && styles.darkSubText]}>or</Text>
            <View style={[styles.dividerLine, isDark && styles.darkDivider]} />
          </View>

          <OAuthButton 
            icon="logo-google" 
            provider="Google" 
            color="#DB4437"
          />
         
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, isDark && styles.darkSubText]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/loginscreen')}>
            <Text style={[styles.footerLink, { color: '#FF7F50' }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    buttonContainer: {
      gap: 16,
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
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
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
    form: {
        gap: 24,
        marginBottom: 32,
      },
      fieldContainer: {
        gap: 8,
      },
      fieldLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginLeft: 4,
      },
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 52,
        paddingHorizontal: 16,
      },
      darkInputContainer: {
        backgroundColor: '#1e1e1e',
        borderColor: '#333',
      },
      fieldIcon: {
        marginRight: 12,
      },
      input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%',
        paddingVertical: 8,
      },
      darkInput: {
        color: '#fff',
      },
      eyeIcon: {
        padding: 4,
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

});