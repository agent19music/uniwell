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
import * as burnt from 'burnt';
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

  const toggleInterest = useCallback((interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        if (prev.length < 10) {
          return [...prev, interestId];
        } else {
          burnt.toast({
            title: 'Maximum Reached',
            message: 'You can select up to 10 interests',
            preset: 'error',
          });
          return prev;
        }
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedInterests.length === 0) {
      burnt.toast({
        title: 'Select Interests',
        message: 'Please select at least one interest',
        preset: 'error',
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

      burnt.toast({
        title: 'Interests Updated',
        message: 'Your interests have been saved successfully',
        preset: 'done',
      });
    } catch (error) {
      console.error('Error saving interests:', error);
      burnt.toast({
        title: 'Error',
        message: 'Failed to save interests. Please try again.',
        preset: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedInterests, onInterestsUpdated, onClose]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
      });
    }
  }, [visible, slideAnim]);

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
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={styles.modalContainer}
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
            <TouchableOpacity activeOpacity={1}>
              <LinearGradient
                colors={isDark ? ['#1a1a1a', '#2a2a2a'] : ['#ffffff', '#f8f8f8']}
                style={styles.gradient}
              >
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
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={28}
                      color={isDark ? '#ffffff' : '#000000'}
                    />
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
                        isDark && styles.darkCategoryTab
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.categoryTabText,
                          selectedCategory === category && styles.selectedCategoryTabText,
                          isDark && styles.darkText
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
                >
                  {selectedCategory && groupedInterests[selectedCategory]?.map(interest => (
                    <TouchableOpacity
                      key={interest.id}
                      style={[
                        styles.interestItem,
                        selectedInterests.includes(interest.id) && styles.selectedInterestItem,
                        isDark && styles.darkInterestItem
                      ]}
                      onPress={() => toggleInterest(interest.id)}
                    >
                      <Text
                        style={[
                          styles.interestText,
                          selectedInterests.includes(interest.id) && styles.selectedInterestText,
                          isDark && styles.darkText
                        ]}
                      >
                        {interest.label}
                      </Text>
                      {selectedInterests.includes(interest.id) && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#FF7F50"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.footer}>
                  <Text style={[styles.selectedCount, isDark && styles.darkText]}>
                    {selectedInterests.length} of 10 selected
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      selectedInterests.length === 0 && styles.saveButtonDisabled
                    ]}
                    onPress={handleSave}
                    disabled={loading || selectedInterests.length === 0}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Interests</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  darkModalContent: {
    backgroundColor: '#1a1a1a',
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    padding: 4,
  },
  categoryTabs: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoryTabsContent: {
    paddingHorizontal: 20,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCategoryTab: {
    backgroundColor: '#FF7F50',
  },
  darkCategoryTab: {
    backgroundColor: '#333333',
  },
  categoryTabText: {
    fontWeight: '600',
    fontSize: 15,
  },
  selectedCategoryTabText: {
    color: '#ffffff',
    fontWeight: '700',
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
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedInterestItem: {
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#FF7F50',
  },
  darkInterestItem: {
    backgroundColor: '#333333',
  },
  interestText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  selectedInterestText: {
    color: '#FF7F50',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  selectedCount: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 16,
    borderRadius: 16,
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
}); 