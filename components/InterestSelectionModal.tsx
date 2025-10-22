import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import * as Burnt from 'burnt';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface InterestSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onInterestsUpdated: (interests: string[]) => void;
  initialInterests?: string[];
}

export default function InterestSelectionModal({
  visible,
  onClose,
  onInterestsUpdated,
  initialInterests = [],
}: InterestSelectionModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const toggleInterest = useCallback((interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        if (prev.length < 10) {
          return [...prev, interestId];
        } else {
          Burnt.toast({
            title: 'Error',
            message: 'You can select up to 10 interests',
            preset: 'error',
            duration: 2,
            from: 'top',
            shouldDismissByDrag: true
          });
          return prev;
        }
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedInterests.length === 0) {
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

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({ interests: selectedInterests })
        .eq('id', user.id);

      if (error) throw error;

      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id);

      const interestRecords = selectedInterests.map(interest => ({
        user_id: user.id,
        interest: interest
      }));

      await supabase
        .from('user_interests')
        .insert(interestRecords);

      onInterestsUpdated(selectedInterests);
      onClose();

      Burnt.toast({
        title: 'Success',
        message: 'Your interests have been saved successfully',
        preset: 'done',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
      });
    } catch (error) {
      console.error('Error saving interests:', error);
      Burnt.toast({
        title: 'Error',
        message: 'Failed to save interests. Please try again.',
        preset: 'error',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
      });
    } finally {
      setLoading(false);
    }
  }, [selectedInterests, onInterestsUpdated, onClose]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Fade in background
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
      // Slide up modal
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      }).start();
    } else {
      // Fade out background
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      // Slide down modal
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
      });
    }
  }, [visible, slideAnim, fadeAnim]);

  if (!mounted && !visible) return null;

  const INTEREST_CATEGORIES = [
    // Academic Success
    { id: 'study_skills', label: 'Study Skills & Techniques', category: 'academic' },
    { id: 'time_management', label: 'Time Management', category: 'academic' },
    { id: 'exam_prep', label: 'Exam Preparation', category: 'academic' },
    { id: 'research_skills', label: 'Research Skills', category: 'academic' },
    { id: 'writing_skills', label: 'Academic Writing', category: 'academic' },
    
    // Career Development
    { id: 'internships', label: 'Internships & Work Experience', category: 'career' },
    { id: 'resume_building', label: 'Resume & Cover Letters', category: 'career' },
    { id: 'interview_prep', label: 'Interview Preparation', category: 'career' },
    { id: 'networking', label: 'Professional Networking', category: 'career' },
    { id: 'career_planning', label: 'Career Planning', category: 'career' },
    
    // Financial Literacy
    { id: 'budgeting', label: 'Student Budgeting', category: 'finance' },
    { id: 'student_loans', label: 'Student Loans & Debt', category: 'finance' },
    { id: 'investing', label: 'Personal Investing', category: 'finance' },
    { id: 'financial_planning', label: 'Financial Planning', category: 'finance' },
    
    // Student Wellness
    { id: 'mental_health', label: 'Mental Health', category: 'wellness' },
    { id: 'physical_health', label: 'Physical Health', category: 'wellness' },
    { id: 'stress_management', label: 'Stress Management', category: 'wellness' },
    { id: 'sleep_hygiene', label: 'Sleep Hygiene', category: 'wellness' },
    { id: 'nutrition', label: 'Student Nutrition', category: 'wellness' },
    
    // Personal Development
    { id: 'leadership', label: 'Leadership Skills', category: 'personal' },
    { id: 'communication', label: 'Communication Skills', category: 'personal' },
    { id: 'creativity', label: 'Creative Expression', category: 'personal' },
    { id: 'critical_thinking', label: 'Critical Thinking', category: 'personal' },
    { id: 'emotional_intelligence', label: 'Emotional Intelligence', category: 'personal' },
    
    // Technology & Digital Skills
    { id: 'coding', label: 'Programming & Coding', category: 'tech' },
    { id: 'digital_tools', label: 'Digital Tools & Software', category: 'tech' },
    { id: 'data_analysis', label: 'Data Analysis', category: 'tech' },
    { id: 'ai_ml', label: 'AI & Machine Learning', category: 'tech' },
    
    // Social & Community
    { id: 'campus_life', label: 'Campus Life', category: 'social' },
    { id: 'diversity', label: 'Diversity & Inclusion', category: 'social' },
    { id: 'sustainability', label: 'Sustainability', category: 'social' },
    { id: 'community_service', label: 'Community Service', category: 'social' },
  ];
  

  // Group interests by category
  const groupedInterests = INTEREST_CATEGORIES.reduce((acc, interest) => {
    if (!acc[interest.category]) {
      acc[interest.category] = [];
    }
    acc[interest.category].push(interest);
    return acc;
  }, {} as Record<string, typeof INTEREST_CATEGORIES>);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.modalContainer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.modalContent,
              isDark && styles.darkModalContent,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={
                isDark 
                  ? ['#1c1c1e', '#2c2c2e'] 
                  : ['#ffffff', '#f8f8f8']
              }
              style={styles.gradient}
            >
              <View style={styles.dragIndicator} />
              
              <View style={styles.header}>
                <Text style={[styles.title, isDark && styles.darkText]}>
                  Select Your Interests
                </Text>
                <Text style={[styles.subtitle, isDark && styles.darkSubText]}>
                  Choose up to 10 topics that interest you
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <View style={[styles.iconBackground, isDark && styles.darkIconBackground]}>
                    <Ionicons
                      name="close"
                      size={20}
                      color={isDark ? '#ffffff' : '#000000'}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryTabs}
                contentContainerStyle={styles.categoryTabsContent}
              >
                {Object.keys(groupedInterests).map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryTab,
                      selectedCategory === category && styles.selectedCategoryTab,
                      isDark && styles.darkCategoryTab,
                      isDark && selectedCategory === category && styles.darkSelectedCategoryTab
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryTabText,
                        selectedCategory === category && styles.selectedCategoryTabText,
                        isDark && styles.darkText,
                        isDark && selectedCategory === category && styles.darkSelectedCategoryTabText
                      ]}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView
                style={styles.interestsList}
                contentContainerStyle={styles.interestsListContent}
                showsVerticalScrollIndicator={false}
              >
                {selectedCategory && groupedInterests[selectedCategory]?.map(interest => (
                  <TouchableOpacity
                    key={interest.id}
                    style={[
                      styles.interestItem,
                      selectedInterests.includes(interest.id) && styles.selectedInterestItem,
                      isDark && styles.darkInterestItem,
                      isDark && selectedInterests.includes(interest.id) && styles.darkSelectedInterestItem
                    ]}
                    onPress={() => toggleInterest(interest.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.interestText,
                        selectedInterests.includes(interest.id) && styles.selectedInterestText,
                        isDark && styles.darkText,
                        isDark && selectedInterests.includes(interest.id) && styles.darkSelectedInterestText
                      ]}
                    >
                      {interest.label}
                    </Text>
                    {selectedInterests.includes(interest.id) && (
                      <Ionicons
                        name="checkmark"
                        size={22}
                        color="#FF7F50"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={[styles.footer, isDark && styles.darkFooter]}>
                <Text style={[styles.selectedCount, isDark && styles.darkText]}>
                  {selectedInterests.length} of 10 selected
                </Text>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    selectedInterests.length === 0 && styles.saveButtonDisabled,
                    isDark && styles.darkSaveButton,
                    isDark && selectedInterests.length === 0 && styles.darkSaveButtonDisabled
                  ]}
                  onPress={handleSave}
                  disabled={loading || selectedInterests.length === 0}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Interests</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  darkModalContent: {
    backgroundColor: '#1c1c1e',
  },
  gradient: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 24,
    zIndex: 10,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkIconBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryTabs: {
    maxHeight: 52,
    marginBottom: 20,
  },
  categoryTabsContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectedCategoryTab: {
    backgroundColor: '#FF7F50',
  },
  darkCategoryTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  darkSelectedCategoryTab: {
    backgroundColor: '#FF7F50',
  },
  categoryTabText: {
    fontWeight: '600',
    fontSize: 15,
    color: '#444444',
    letterSpacing: -0.2,
  },
  selectedCategoryTabText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  darkSelectedCategoryTabText: {
    color: '#ffffff',
  },
  interestsList: {
    flex: 1,
  },
  interestsListContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  selectedInterestItem: {
    backgroundColor: 'rgba(255, 127, 80, 0.15)',
  },
  darkInterestItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  darkSelectedInterestItem: {
    backgroundColor: 'rgba(255, 127, 80, 0.25)',
  },
  interestText: {
    fontSize: 17,
    color: '#333333',
    fontWeight: '500',
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 12,
  },
  selectedInterestText: {
    color: '#FF7F50',
    fontWeight: '600',
  },
  darkSelectedInterestText: {
    color: '#FF7F50',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  darkFooter: {
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  selectedCount: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FF7F50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  darkSaveButton: {
    backgroundColor: '#FF7F50',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  darkSaveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
}); 