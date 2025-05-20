import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { OnboardingContextType } from './types';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';
const STORED_USERS_KEY = 'uniwell_stored_users';

const defaultContextValue: OnboardingContextType = {
  isFirstTime: true,
  setIsFirstTime: () => {},
  skipOnboarding: () => {},
  isLoading: true,
};

const OnboardingContext = createContext<OnboardingContextType>(defaultContextValue);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirstTime, setIsFirstTime] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Check if onboarding was explicitly completed
        const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        
        // Check if there are stored users
        const storedUsersJson = await AsyncStorage.getItem(STORED_USERS_KEY);
        const hasStoredUsers = storedUsersJson && JSON.parse(storedUsersJson).length > 0;
        
        // Skip onboarding if it was completed or if there are stored users
        const shouldSkipOnboarding = onboardingCompleted === 'true' || hasStoredUsers;
        
        setIsFirstTime(!shouldSkipOnboarding);
        
        // If we're skipping onboarding due to stored users, make sure to mark it as completed
        if (hasStoredUsers && onboardingCompleted !== 'true') {
          await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
        }
        
        // Set loading to false only after all checks are complete
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Even on error, we need to set loading to false
        setIsLoading(false);
      }
    };

    // Run the check
    checkOnboardingStatus();
  }, []);

  const skipOnboarding = async (redirectPath?: string) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setIsFirstTime(false);
      if (redirectPath) {
        router.replace(redirectPath);
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const value = {
    isFirstTime,
    setIsFirstTime,
    skipOnboarding,
    isLoading,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => useContext(OnboardingContext);

export default OnboardingContext; 