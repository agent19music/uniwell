import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTherapist } from './context/TherapistContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import CustomDialog from '../../components/CustomDialog';

export default function TherapistSignUpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signUp, loading } = useTherapist();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    gender: '',
    languages: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async () => {
    const { name, email, password, confirmPassword, licenseNumber, gender, languages } = formData;

    if (!name || !email || !password || !licenseNumber || !gender || languages.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    // Only include essential information for initial signup
    const profileData = {
      bio: name, // We'll use name as initial bio until profile is completed
      license_number: licenseNumber,
      // Set minimal defaults for required fields
      specialization: ['General Therapy'],
      qualifications: ['Licensed Therapist'],
      consultation_rates: 0, // Will be updated during profile completion
      availability: {}, // Empty availability until set during profile completion
      gender,
      languages,
    };

    const { error } = await signUp(email, password, profileData);
    setIsLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert(
        'Success',
        'Account created successfully! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/therapist/loginscreen') }]
      );
    }
  };

  const navigateToLogin = () => {
    router.push('/therapist/loginscreen');
  };

  const availableLanguages = [
    { id: 'en', name: 'English' },
    { id: 'sw', name: 'Swahili' },
    { id: 'fr', name: 'French' },
    { id: 'ar', name: 'Arabic' },
    { id: 'hi', name: 'Hindi' },
  ];

  const toggleLanguage = (langId: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(langId)
        ? prev.languages.filter(id => id !== langId)
        : [...prev.languages, langId]
    }));
  };

  return (
    <ImageBackground
      source={isDark ? require('../../assets/mesh-99dark.png') : require('../../assets/mesh-99.png')}
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
                <Text style={[styles.title, isDark && styles.darkText]}>Join as a Therapist</Text>
                <Text style={[styles.subtitle, isDark && styles.darkSubText]}>
                  Create your professional account
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, isDark && styles.darkText]}>Full Name *</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.darkInput]}
                    value={formData.name}
                    onChangeText={(value) => updateField('name', value)}
                    placeholder="Enter your full name"
                    placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, isDark && styles.darkText]}>Email *</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.darkInput]}
                    value={formData.email}
                    onChangeText={(value) => updateField('email', value)}
                    placeholder="Enter your email"
                    placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, isDark && styles.darkText]}>License Number *</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.darkInput]}
                    value={formData.licenseNumber}
                    onChangeText={(value) => updateField('licenseNumber', value)}
                    placeholder="Your professional license number"
                    placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                  />
                  <Text style={[styles.helperText, isDark && styles.darkSubText]}>
                    Your license will be verified before you can accept appointments
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, isDark && styles.darkText]}>Gender *</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.darkInput]}
                    value={formData.gender}
                    onChangeText={(value) => updateField('gender', value)}
                    placeholder="Enter your gender"
                    placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, isDark && styles.darkText]}>Password *</Text>
                  <View style={[styles.passwordContainer, isDark && styles.darkInput]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={formData.password}
                      onChangeText={(value) => updateField('password', value)}
                      placeholder="Enter your password"
                      placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={isDark ? '#aaaaaa' : '#666666'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, isDark && styles.darkText]}>Confirm Password *</Text>
                  <View style={[styles.passwordContainer, isDark && styles.darkInput]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={formData.confirmPassword}
                      onChangeText={(value) => updateField('confirmPassword', value)}
                      placeholder="Confirm your password"
                      placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={isDark ? '#aaaaaa' : '#666666'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.languageContainer}>
                  <Text style={styles.languageLabel}>Select Languages</Text>
                  <View style={styles.languageOptions}>
                    {availableLanguages.map((lang) => (
                      <TouchableOpacity 
                        key={lang.id}
                        style={[
                          styles.languageOption, 
                          formData.languages.includes(lang.id) && styles.selectedLanguage
                        ]}
                        onPress={() => toggleLanguage(lang.id)}
                      >
                        <Text style={[
                          styles.languageText,
                          formData.languages.includes(lang.id) && styles.selectedLanguageText
                        ]}>{lang.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.disclaimer}>
                  <Text style={[styles.disclaimerText, isDark && styles.darkSubText]}>
                    By signing up, you can complete your profile and set your availability after registration. 
                    Students will be able to book sessions with you once your profile is complete and verified.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.signUpButton, isLoading && styles.disabledButton]}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.signUpButtonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.loginPrompt}>
                  <Text style={[styles.loginPromptText, isDark && styles.darkSubText]}>
                    Already have an account?
                  </Text>
                  <TouchableOpacity onPress={navigateToLogin}>
                    <Text style={styles.loginLink}>Log In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
      <CustomDialog
        visible={showVerificationDialog}
        title="Verify Your Email"
        message="We've sent a verification link to your email. Please check your inbox and click the link to activate your account. You'll be able to log in after verification."
        confirmText="Go to Login"
        onConfirm={() => {
          setShowVerificationDialog(false);
          router.push('/therapist/loginscreen');
        }}
      />
    </ImageBackground>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
    textAlign: 'center',
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
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
  },
  darkInput: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
    color: '#ffffff',
  },
  passwordContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
  },
  passwordToggle: {
    padding: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  signUpButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  loginTextBold: {
    color: '#FF7F50',
    fontWeight: '600',
  },
  disclaimer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontFamily: 'Vercetti-Regular',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  languageContainer: {
    marginBottom: 16,
  },
  languageLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontFamily: 'SF-Regular',
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectedLanguage: {
    borderColor: '#FF7F50',
    backgroundColor: 'rgba(255, 127, 80, 0.2)',
  },
  languageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'SF-Regular',
  },
  selectedLanguageText: {
    color: '#FF7F50',
    fontWeight: '600',
  },
});
