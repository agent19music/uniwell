import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, useColorScheme } from 'react-native';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import MobileOnboarding from './MobileOnboarding';
import WebOnboarding from './WebOnboarding';
import { isWeb } from '../../onboarding/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OnboardingScreen: React.FC = () => {
  const { isFirstTime, isLoading } = useOnboarding();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: isDark ? '#121212' : '#f5f5f5'}]}>
        <ActivityIndicator size="large" color={isDark ? '#888888' : '#999999'} />
      </View>
    );
  }
  
  // If not first time, don't show onboarding
  // if (!isFirstTime) {
  //   return null;
  // }
  
  // Log platform for debugging
  console.log('Platform:', Platform.OS);
  console.log('isWeb():', isWeb());
  
  // Render the appropriate onboarding experience based on platform
  if (isWeb()) {
    return <WebOnboarding />;
  } else {
    return <MobileOnboarding />;
  }
};

const OnboardingRoot: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <OnboardingProvider>
      <OnboardingScreenWithChildren>{children}</OnboardingScreenWithChildren>
    </OnboardingProvider>
  );
};

// A wrapper that conditionally renders children based on onboarding state
const OnboardingScreenWithChildren: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isFirstTime, isLoading } = useOnboarding();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: isDark ? '#121212' : '#f5f5f5'}]}>
        <ActivityIndicator size="large" color={isDark ? '#888888' : '#999999'} />
      </View>
    );
  }
  
  // Show children if not first time, otherwise show onboarding
  if (!isFirstTime) {
    return <>{children}</>;
  }
  
  // Render the appropriate onboarding experience based on platform
  if (isWeb()) {
    return <WebOnboarding />;
  } else {
    return <MobileOnboarding />;
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OnboardingRoot; 