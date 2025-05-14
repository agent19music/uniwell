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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTherapist } from './context/TherapistContext';
import { router } from 'expo-router';

export default function TherapistSignUpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signUp, loading } = useTherapist();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    specialization: '',
    qualifications: '',
    consultationRates: '',
    experienceYears: '',
    licenseNumber: '',
    languages: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async () => {
    const { email, password, confirmPassword, bio, specialization, qualifications, consultationRates } = formData;

    if (!email || !password || !bio || !specialization || !qualifications || !consultationRates) {
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

    const profileData = {
      bio,
      specialization: specialization.split(',').map(s => s.trim()),
      qualifications: qualifications.split(',').map(q => q.trim()),
      consultation_rates: parseInt(consultationRates),
      experience_years: formData.experienceYears ? parseInt(formData.experienceYears) : 0,
      license_number: formData.licenseNumber || undefined,
      languages: formData.languages ? formData.languages.split(',').map(l => l.trim()) : [],
      availability: {},
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

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, isDark && styles.darkText]}>Join as a Therapist</Text>
            <Text style={[styles.subtitle, isDark && styles.darkSubText]}>
              Create your professional account
            </Text>
          </View>

          <View style={styles.form}>
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

            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && styles.darkText]}>Bio *</Text>
              <TextInput
                style={[styles.input, styles.textArea, isDark && styles.darkInput]}
                value={formData.bio}
                onChangeText={(value) => updateField('bio', value)}
                placeholder="Tell us about yourself and your practice"
                placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && styles.darkText]}>Specializations *</Text>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                value={formData.specialization}
                onChangeText={(value) => updateField('specialization', value)}
                placeholder="e.g., Anxiety, Depression, Couples Therapy"
                placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
              />
              <Text style={[styles.helperText, isDark && styles.darkSubText]}>
                Separate multiple specializations with commas
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && styles.darkText]}>Qualifications *</Text>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                value={formData.qualifications}
                onChangeText={(value) => updateField('qualifications', value)}
                placeholder="e.g., PhD in Psychology, Licensed Clinical Social Worker"
                placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
              />
              <Text style={[styles.helperText, isDark && styles.darkSubText]}>
                Separate multiple qualifications with commas
              </Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={[styles.label, isDark && styles.darkText]}>Consultation Rate *</Text>
                <TextInput
                  style={[styles.input, isDark && styles.darkInput]}
                  value={formData.consultationRates}
                  onChangeText={(value) => updateField('consultationRates', value)}
                  placeholder="Per session in ₹"
                  placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={[styles.label, isDark && styles.darkText]}>Experience (Years)</Text>
                <TextInput
                  style={[styles.input, isDark && styles.darkInput]}
                  value={formData.experienceYears}
                  onChangeText={(value) => updateField('experienceYears', value)}
                  placeholder="Years of experience"
                  placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && styles.darkText]}>License Number</Text>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                value={formData.licenseNumber}
                onChangeText={(value) => updateField('licenseNumber', value)}
                placeholder="Professional license number"
                placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && styles.darkText]}>Languages</Text>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                value={formData.languages}
                onChangeText={(value) => updateField('languages', value)}
                placeholder="e.g., English, Hindi, Tamil"
                placeholderTextColor={isDark ? '#aaaaaa' : '#666666'}
              />
              <Text style={[styles.helperText, isDark && styles.darkSubText]}>
                Separate multiple languages with commas
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={isLoading || loading}
            >
              <Text style={styles.signUpButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={navigateToLogin} style={styles.loginLink}>
              <Text style={[styles.loginText, isDark && styles.darkSubText]}>
                Already have an account?{' '}
                <Text style={styles.loginTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
});
