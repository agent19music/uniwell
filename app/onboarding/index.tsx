import React from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import MobileOnboarding from './MobileOnboarding';

/**
 * Onboarding Screen - Mobile Only
 * 
 * Shows the onboarding flow when navigated to directly.
 * After completion, redirects to signup/home.
 */
const OnboardingScreen: React.FC = () => {
  const { isLoading } = useOnboarding();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1A1A1A' : '#F5EDE8' }]}>
        <ActivityIndicator size="large" color={isDark ? '#9E9289' : '#9E9289'} />
      </View>
    );
  }

  // Always show onboarding when this route is navigated to directly
  return <MobileOnboarding />;
};

/**
 * Onboarding Root - Wraps the screen with the provider
 * Always shows onboarding when explicitly navigated to via Sign Up
 */
const OnboardingRoot: React.FC = () => {
  return (
    <OnboardingProvider>
      <OnboardingScreen />
    </OnboardingProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OnboardingRoot; 