import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import MobileOnboarding from './MobileOnboarding';
import WebOnboarding from './WebOnboarding';
import { isMobile, isWeb } from './utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OnboardingScreen: React.FC = () => {
  const { isFirstTime, isLoading } = useOnboarding();
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#304FFE" />
      </View>
    );
  }
  
  // If not first time, don't show onboarding
  if (!isFirstTime) {
    return null;
  }
  
  // Render the appropriate onboarding experience based on platform
  if (isWeb()) {
    return <WebOnboarding />;
  } else {
    return <MobileOnboarding />;
  }
};

const OnboardingRoot: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  // Check for an active auth session
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // If there's a stored auth session, mark onboarding as completed
        const storedSession = await AsyncStorage.getItem('supabase.auth.token');
        if (storedSession) {
          await AsyncStorage.setItem('onboarding_completed', 'true');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <OnboardingProvider>
      <OnboardingScreenWithChildren>{children}</OnboardingScreenWithChildren>
    </OnboardingProvider>
  );
};

// A wrapper that conditionally renders children based on onboarding state
const OnboardingScreenWithChildren: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isFirstTime, isLoading } = useOnboarding();
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#304FFE" />
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
    backgroundColor: 'white',
  },
});

export default OnboardingRoot; 