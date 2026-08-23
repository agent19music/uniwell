import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import CustomDialog from '../components/CustomDialog';
import { useTheme } from '../hooks/useTheme';
import { toast } from '@/lib/toast';
import { ArrowLeft, ArrowRight, Check, Camera, GraduationCap, Sparkle } from 'phosphor-react-native';
import InterestSelectionModal from '../components/InterestSelectionModal';
import { Input } from '@/components/ui/Input';

const { width } = Dimensions.get('window');

// Avatar options - mix of styles for variety
const AVATAR_OPTIONS = [
  { id: 'avatar1', url: 'https://www.tapback.co/api/avatar/user55?color=3', gender: 'male' },
  { id: 'avatar2', url: 'https://www.tapback.co/api/avatar/Ccd8b9', gender: 'female' },
  { id: 'avatar3', url: 'https://www.tapback.co/api/avatar/alex123?color=1', gender: 'neutral' },
  { id: 'avatar4', url: 'https://www.tapback.co/api/avatar/jordan?color=2', gender: 'neutral' },
  { id: 'avatar5', url: 'https://www.tapback.co/api/avatar/sam42?color=4', gender: 'male' },
  { id: 'avatar6', url: 'https://www.tapback.co/api/avatar/taylor?color=5', gender: 'female' },
  { id: 'avatar7', url: 'https://www.tapback.co/api/avatar/chris99?color=6', gender: 'neutral' },
  { id: 'avatar8', url: 'https://www.tapback.co/api/avatar/morgan?color=7', gender: 'neutral' },
];

export default function ProfileCompletionScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { profile, setProfile, fetchProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  
  // Form state - simplified to: avatar, course, interests
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [course, setCourse] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
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
        
      if (error && error.code !== 'PGRST116') throw error;
      
      // Pre-fill form with existing data if available
      if (profileData) {
        if (profileData.avatar_url) setSelectedAvatar(profileData.avatar_url);
        if (profileData.course) setCourse(profileData.course);
        if (profileData.interests) setSelectedInterests(profileData.interests);
        
        // Check if profile is already complete (100%)
        if (profileData.profile_completion_percentage === 100) {
          setShowCompletedDialog(true);
        }
      }
    } catch (error) {
      console.error('Error checking profile status:', error);
      toast.error('Failed to load profile data');
    } finally {
      setInitialLoading(false);
    }
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (step === 1 && !selectedAvatar) {
      toast.error('Please select an avatar');
      return;
    }
    
    if (step === 2 && !course.trim()) {
      toast.error('Please enter your course/program');
      return;
    }
    
    if (step === 3) {
      // Open interests modal instead of going to next step
      setShowInterestModal(true);
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

  // Handle interests update from modal
  const handleInterestsUpdated = useCallback((interests: string[]) => {
    setSelectedInterests(interests);
    setShowInterestModal(false);
    // After interests are selected, complete the profile
    handleCompleteProfile(interests);
  }, [selectedAvatar, course]);
  
  // Complete profile setup
  const handleCompleteProfile = async (interests?: string[]) => {
    const finalInterests = interests || selectedInterests;
    
    if (finalInterests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      
      // Update profile in database with all collected data
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: selectedAvatar,
          course: course.trim(),
          interests: finalInterests,
          profile_completion_percentage: 100,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Sync interests to user_interests table (for recommendations)
      // First delete existing interests
      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id);
      
      // Insert new interests
      if (finalInterests.length > 0) {
        const interestRecords = finalInterests.map(interest => ({
          user_id: user.id,
          interest: interest
        }));
        
        await supabase
          .from('user_interests')
          .insert(interestRecords);
      }
      
      // Delete the "Complete Your Profile" notification if exists
      await supabase
        .from('notifications')
        .delete()
        .match({ 
          user_id: user.id,
          category: 'profile'
        });
      
      // Refresh the profile in context
      await fetchProfile();
      
      toast.success('Profile completed successfully!');
      
      // Navigate to home
      router.replace('/(tabs)/home');
      
    } catch (error) {
      console.error('Error completing profile:', error);
      toast.error('Failed to complete profile. Please try again.');
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
            <View style={styles.stepHeader}>
              <Camera size={32} color={colors.primary} weight="duotone" />
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                Choose Your Avatar
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Pick an avatar that represents you
              </Text>
            </View>
            
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map(avatar => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarItem,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: selectedAvatar === avatar.url ? colors.primary : colors.border 
                    },
                    selectedAvatar === avatar.url && styles.selectedAvatar
                  ]}
                  onPress={() => setSelectedAvatar(avatar.url)}
                >
                  <Image 
                    source={{ uri: avatar.url }} 
                    style={styles.avatarImage}
                  />
                  {selectedAvatar === avatar.url && (
                    <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                      <Check size={12} color="#FFFFFF" weight="bold" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
        
      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <GraduationCap size={32} color={colors.primary} weight="duotone" />
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                What's Your Course?
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Tell us what you're studying
              </Text>
            </View>
            
            <Input
              autoFocus
              helper="This helps us personalize your experience with relevant resources."
              label="Course or program"
              onChangeText={setCourse}
              placeholder="e.g., Computer Science, Business, Medicine"
              placeholderTextColor={colors.textTertiary}
              value={course}
            />
          </View>
        );
        
      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Sparkle size={32} color={colors.primary} weight="duotone" />
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                What Interests You?
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Select topics you'd like to explore
              </Text>
            </View>
            
            {selectedInterests.length > 0 ? (
              <View style={styles.selectedInterestsPreview}>
                <Text style={[styles.interestsCount, { color: colors.textSecondary }]}>
                  {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
                </Text>
                <View style={styles.interestTags}>
                  {selectedInterests.slice(0, 5).map((interest) => (
                    <View 
                      key={interest} 
                      style={[styles.interestTag, { backgroundColor: colors.primary + '20' }]}
                    >
                      <Text style={[styles.interestTagText, { color: colors.primary }]}>
                        {interest.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  ))}
                  {selectedInterests.length > 5 && (
                    <View style={[styles.interestTag, { backgroundColor: colors.textTertiary + '20' }]}>
                      <Text style={[styles.interestTagText, { color: colors.textSecondary }]}>
                        +{selectedInterests.length - 5} more
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View style={[styles.emptyInterests, { backgroundColor: colors.surface }]}>
                <Text style={[styles.emptyInterestsText, { color: colors.textSecondary }]}>
                  Tap "Select Interests" to choose topics that interest you
                </Text>
              </View>
            )}
          </View>
        );
        
      default:
        return null;
    }
  };
  
  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboard}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => step > 1 ? handlePrevStep() : router.back()} 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Complete Profile
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(step / 3) * 100}%`,
                backgroundColor: colors.primary 
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step {step} of 3
        </Text>
      </View>
      
      {/* Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>
      
      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.nextButton, { backgroundColor: colors.primary }]} 
          onPress={handleNextStep}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.buttonText}>
                {step === 3 
                  ? (selectedInterests.length > 0 ? 'Complete Profile' : 'Select Interests')
                  : 'Continue'
                }
              </Text>
              {step < 3 ? (
                <ArrowRight size={20} color="#FFFFFF" weight="bold" />
              ) : (
                <Check size={20} color="#FFFFFF" weight="bold" />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
      
      {/* Interest Selection Modal */}
      <InterestSelectionModal
        visible={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        onInterestsUpdated={handleInterestsUpdated}
        initialInterests={selectedInterests}
      />
      
      {/* Already Completed Dialog */}
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
  },
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  // Avatar Grid
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  avatarItem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedAvatar: {
    borderWidth: 3,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  // Form
  formGroup: {
    marginBottom: 16,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  // Interest Preview
  selectedInterestsPreview: {
    alignItems: 'center',
  },
  interestsCount: {
    fontSize: 14,
    marginBottom: 16,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestTagText: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyInterests: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyInterestsText: {
    fontSize: 15,
    textAlign: 'center',
  },
  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  nextButton: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
}); 