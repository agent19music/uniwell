import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Text, TextInput, Platform } from 'react-native';
import * as Font from 'expo-font';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Camera } from 'expo-camera';
import { RoutineProvider } from '@/contexts/RoutineContext';
import { MoodProvider } from '@/contexts/MoodContext';
import { CommunityProvider } from '@/contexts/CommunityContext';
import { PostNavigationProvider } from '@/contexts/PostNavigationContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SemesterProvider } from '@/contexts/SemesterContext';
import { MaskedSplashScreen } from '../components/MaskedSplashScreen';
import * as SplashScreen from 'expo-splash-screen';
import OnboardingRoot from './onboarding/index';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

// Container component that handles the auth/onboarding flow
const AppContainer = ({ children, onInitializationComplete }: { children: React.ReactNode, onInitializationComplete: () => void }) => {
  const { session, storedUsers } = useAuth();
  const [hasShownOnboarding, setHasShownOnboarding] = useState<boolean | null>(null);

  // Check if onboarding has been shown
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      setHasShownOnboarding(onboardingCompleted === 'true');
      
      // Mark onboarding as completed if we have stored users or an active session
      if ((storedUsers && storedUsers.length > 0) || session) {
        await AsyncStorage.setItem('onboarding_completed', 'true');
        setHasShownOnboarding(true);
      }
      
      // Notify parent that initialization is complete
      onInitializationComplete();
    };
    
    checkOnboardingStatus();
  }, [storedUsers, session, onInitializationComplete]);

  // Don't render anything until we've checked if onboarding should be shown
  if (hasShownOnboarding === null) {
    return null;
  }

  return (
    <OnboardingRoot>
      {children}
    </OnboardingRoot>
  );
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isFontsLoaded, setIsFontsLoaded] = useState(false);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);

  // Load fonts
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Vercetti-Regular': require('../assets/fonts/SFUIText-Regular.ttf'),
          'SF-Regular': require('../assets/fonts/SFUIText-Regular.ttf'),
        });
        setIsFontsLoaded(true);
      } catch (e) {
        console.warn('Error loading fonts:', e);
        // Continue anyway
        setIsFontsLoaded(true);
      }
    }
    
    loadFonts();
  }, []);

  useEffect(() => {
    if (isFontsLoaded) {
      Text.defaultProps = Text.defaultProps || {};
      Text.defaultProps.style = { 
        ...(Text.defaultProps?.style || {}),
        fontFamily: 'Vercetti-Regular'
      };
      
      TextInput.defaultProps = TextInput.defaultProps || {};
      TextInput.defaultProps.style = { 
        ...(TextInput.defaultProps?.style || {}),
        fontFamily: 'Vercetti-Regular'
      };
    }
  }, [isFontsLoaded]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Camera.requestCameraPermissionsAsync();
    }
  }, []);

  // Handle initialization complete callback
  const handleInitializationComplete = useCallback(() => {
    setIsAuthCheckComplete(true);
  }, []);

  // Determine if we're ready to show the app
  useEffect(() => {
    if (isFontsLoaded && isAuthCheckComplete) {
      setIsAppReady(true);
    }
  }, [isFontsLoaded, isAuthCheckComplete]);

  const handleSplashFinish = async () => {
    // Only hide splash screen when everything is ready
    if (isAppReady) {
      setShowSplash(false);
      await SplashScreen.hideAsync();
    }
  };

  // If assets not loaded, show nothing (native splash screen remains visible)
  if (!isFontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>  
        <CommunityProvider>
          <PostNavigationProvider>
            <MoodProvider>
              <RoutineProvider>
                <SemesterProvider>
                  <AppContainer onInitializationComplete={handleInitializationComplete}>
                    {showSplash && (
                      <MaskedSplashScreen onAnimationFinish={handleSplashFinish} />
                    )}
                    {(!showSplash || isAppReady) && (
                      <>
                        <Stack screenOptions={{
                          headerShown: false,
                          contentStyle: {
                            backgroundColor: isDark ? '#121212' : '#f5f5f5',
                          },
                        }}>
                          <Stack.Screen name="index" />
                          <Stack.Screen name="loginscreen" />
                          <Stack.Screen name="signupscreen" />
                          <Stack.Screen name="onboarding" />
                          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                          <Stack.Screen name="therapistdashboard" />
                          <Stack.Screen name="booktherapist" />
                        </Stack>
                        <StatusBar style={isDark ? 'light' : 'dark'} />
                      </>
                    )}
                  </AppContainer>
                </SemesterProvider>
              </RoutineProvider>
            </MoodProvider>
          </PostNavigationProvider>
        </CommunityProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
