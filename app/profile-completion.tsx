import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import CustomDialog from '../components/CustomDialog';
import * as Burnt from 'burnt';

// Define interest categories
const INTEREST_CATEGORIES = [
  { id: 'fitness', label: 'Fitness', icon: 'fitness' },
  { id: 'meditation', label: 'Meditation', icon: 'leaf' },
  { id: 'nutrition', label: 'Nutrition', icon: 'nutrition' },
  { id: 'sleep', label: 'Sleep', icon: 'moon' },
  { id: 'productivity', label: 'Productivity', icon: 'calendar' },
  { id: 'mental_health', label: 'Mental Health', icon: 'heart' },
  { id: 'social', label: 'Social Wellness', icon: 'people' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'career', label: 'Career Growth', icon: 'briefcase' },
  { id: 'hobbies', label: 'Hobbies', icon: 'color-palette' },
];

// Define primary goals
const PRIMARY_GOALS = [
  { id: 'reduce_stress', label: 'Reduce Stress & Anxiety' },
  { id: 'improve_sleep', label: 'Improve Sleep Quality' },
  { id: 'build_habits', label: 'Build Healthy Habits' },
  { id: 'increase_productivity', label: 'Increase Productivity' },
  { id: 'enhance_focus', label: 'Enhance Focus & Concentration' },
  { id: 'manage_time', label: 'Better Time Management' },
  { id: 'improve_mood', label: 'Improve Mood & Emotional Health' },
  { id: 'track_progress', label: 'Track Personal Progress' },
];

export default function ProfileCompletionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { profile, setProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  
  // Form state
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [bio, setBio] = useState('');
  const [occupation, setOccupation] = useState('');
  const [university, setUniversity] = useState('');
  
  useEffect(() => {
    checkProfileStatus();
  }, []);
  
  const checkProfileStatus = async () => {
    try {
      setInitialLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }
      
      // Get profile data
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      // Pre-fill form with existing data if available
      if (profileData) {
        if (profileData.interests) setSelectedInterests(profileData.interests);
        if (profileData.primary_goal) setPrimaryGoal(profileData.primary_goal);
        if (profileData.university) setUniversity(profileData.university);
        if (profileData.occupation) setOccupation(profileData.occupation);
        
        // Check if profile is already complete
        if (profileData.profile_completion_percentage === 100) {
          setIsProfileComplete(true);
          setShowCompletedDialog(true);
        }
      }
    } catch (error) {
      console.error('Error checking profile status:', error);
    } finally {
      setInitialLoading(false);
    }
  };
  
  // Toggle interest selection
  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, interestId]);
      } else {
        Burnt.toast({
          title: 'Error',
          message: 'You can select up to 5 interests',
          preset: 'error',
          duration: 2,
          from: 'top',
          shouldDismissByDrag: true
        });
      }
    }
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (step === 1 && selectedInterests.length === 0) {
      Burnt.toast({
        title: 'Error',
        message: 'Please select at least one interest',
        preset: 'error',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
      });
      return;
    }
    
    if (step === 2 && !primaryGoal) {
      Burnt.toast({
        title: 'Error',
        message: 'Please select your primary goal',
        preset: 'error',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
      });
      return;
    }
    
    setStep(step + 1);
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Complete profile setup
  const handleCompleteProfile = async () => {
    try {
      setLoading(true);
      
      // Validate final step
      if (!university || !occupation) {
        Burnt.toast({
          title: 'Error',
          message: 'Please fill in all fields',
          preset: 'error',
          duration: 2,
          from: 'top',
          shouldDismissByDrag: true
        });
        setLoading(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          interests: selectedInterests,
          primary_goal: primaryGoal,
          bio: bio,
          occupation: occupation,
          university: university,
          profile_completion_percentage: 100,
          updated_at: new Date()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Save interests to user_interests table
      for (const interest of selectedInterests) {
        await supabase
          .from('user_interests')
          .insert({
            user_id: user.id,
            interest: interest
          });
      }
      
      // Save primary goal to user_goals table
      await supabase
        .from('user_goals')
        .insert({
          user_id: user.id,
          goal: primaryGoal,
          priority: 1
        });
      
      // Update local profile state
      setProfile({
        ...profile,
        interests: selectedInterests,
        primary_goal: primaryGoal,
        bio: bio,
        occupation: occupation,
        university: university,
        profile_completion_percentage: 100
      });
      
      // Delete the "Complete Your Profile" notification
      await supabase
        .from('notifications')
        .delete()
        .match({ 
          user_id: user.id,
          category: 'profile'
        });
      
      // Show success message
      Burnt.toast({
        title: 'Success',
        message: 'Your profile has been successfully updated!',
        preset: 'done',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
      });

      // Navigate to home
      router.replace('/(tabs)/home');
      
    } catch (error) {
      console.error('Error completing profile:', error);
      Burnt.toast({
        title: 'Error',
        message: 'Failed to complete profile. Please try again.',
        preset: 'error',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDark && styles.darkText]}>
              What are you interested in?
            </Text>
            <Text style={[styles.stepDescription, isDark && styles.darkSubText]}>
              Select up to 5 topics that interest you the most
            </Text>
            
            <View style={styles.interestsGrid}>
              {INTEREST_CATEGORIES.map(interest => (
                <TouchableOpacity
                  key={interest.id}
                  style={[
                    styles.interestItem,
                    selectedInterests.includes(interest.id) && styles.selectedInterest,
                    isDark && styles.darkCard
                  ]}
                  onPress={() => toggleInterest(interest.id)}
                >
                  <Ionicons 
                    name={interest.icon as any} 
                    size={24} 
                    color={selectedInterests.includes(interest.id) ? '#FF7F50' : isDark ? '#ffffff' : '#333333'} 
                  />
                  <Text style={[
                    styles.interestLabel,
                    selectedInterests.includes(interest.id) && styles.selectedInterestText,
                    isDark && styles.darkText
                  ]}>
                    {interest.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
        
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDark && styles.darkText]}>
              What's your primary goal?
            </Text>
            <Text style={[styles.stepDescription, isDark && styles.darkSubText]}>
              Select the main reason you're using UniWell
            </Text>
            
            <View style={styles.goalsList}>
              {PRIMARY_GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalItem,
                    primaryGoal === goal.id && styles.selectedGoal,
                    isDark && styles.darkCard
                  ]}
                  onPress={() => setPrimaryGoal(goal.id)}
                >
                  <View style={styles.goalRadio}>
                    {primaryGoal === goal.id && <View style={styles.goalRadioSelected} />}
                  </View>
                  <Text style={[
                    styles.goalLabel,
                    primaryGoal === goal.id && styles.selectedGoalText,
                    isDark && styles.darkText
                  ]}>
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
        
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDark && styles.darkText]}>
              Tell us about yourself
            </Text>
            <Text style={[styles.stepDescription, isDark && styles.darkSubText]}>
              This helps us personalize your experience
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isDark && styles.darkText]}>Bio</Text>
              <TextInput
                style={[styles.textArea, isDark && styles.darkInput]}
                placeholder="Share a little about yourself..."
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                multiline
                numberOfLines={4}
                value={bio}
                onChangeText={setBio}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isDark && styles.darkText]}>Occupation</Text>
              <TextInput
                style={[styles.textInput, isDark && styles.darkInput]}
                placeholder="What do you do?"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                value={occupation}
                onChangeText={setOccupation}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isDark && styles.darkText]}>University/School</Text>
              <TextInput
                style={[styles.textInput, isDark && styles.darkInput]}
                placeholder="Where do you study?"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                value={university}
                onChangeText={setUniversity}
              />
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7F50" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Complete Your Profile</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <Text style={[styles.progressText, isDark && styles.darkSubText]}>Step {step} of 3</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderStepContent()}
      </ScrollView>
      
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity 
            style={[styles.backButton, isDark && styles.darkButton]} 
            onPress={handlePrevStep}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#333333'} />
          </TouchableOpacity>
        )}
        
        {step < 3 ? (
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleNextStep}
          >
            <LinearGradient
              colors={['#FF7F50', '#FF6B45']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={24} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleCompleteProfile}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF7F50', '#FF6B45']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Complete Profile</Text>
                  <Ionicons name="checkmark" size={24} color="#ffffff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
      
      <CustomDialog
        visible={showCompletedDialog}
        title="Profile Already Complete"
        message="You've already completed your profile. Would you like to make changes or return to the home screen?"
        confirmText="Make Changes"
        cancelText="Go to Home"
        onConfirm={() => setShowCompletedDialog(false)}
        onCancel={() => router.replace('/(tabs)/home')}
        icon="checkmark-circle"
        iconColor="#4CAF50"
      />
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF7F50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  interestItem: {
    width: '48%',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedInterest: {
    borderWidth: 2,
    borderColor: '#FF7F50',
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
  },
  interestLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedInterestText: {
    color: '#FF7F50',
    fontWeight: 'bold',
  },
  goalsList: {
    marginTop: 8,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedGoal: {
    borderWidth: 2,
    borderColor: '#FF7F50',
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
  },
  goalRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF7F50',
  },
  goalLabel: {
    fontSize: 16,
    color: '#333',
  },
  selectedGoalText: {
    color: '#FF7F50',
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: 120,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginLeft: 16,
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333333',
  },
  darkInput: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333333',
    color: '#ffffff',
  },
  darkButton: {
    backgroundColor: '#333333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  placeholder: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
}); 