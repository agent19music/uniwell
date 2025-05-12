import { useEffect, useState } from 'react';
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
const AppContainer = ({ children }: { children: React.ReactNode }) => {
  const { session, storedUsers } = useAuth();
  const [hasShownOnboarding, setHasShownOnboarding] = useState<boolean | null>(null);

  // Check if onboarding has been shown
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      setHasShownOnboarding(onboardingCompleted === 'true');
    };
    
    checkOnboardingStatus();
  }, []);

  // Skip onboarding if we have stored users or an active session
  useEffect(() => {
    const markOnboardingCompleted = async () => {
      if ((storedUsers && storedUsers.length > 0) || session) {
        await AsyncStorage.setItem('onboarding_completed', 'true');
        setHasShownOnboarding(true);
      }
    };
    
    markOnboardingCompleted();
  }, [storedUsers, session]);

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

  const [fontsLoaded] = Font.useFonts({
    'Vercetti-Regular': require('../assets/fonts/SFUIText-Regular.ttf'),
    'SF-Regular': require('../assets/fonts/SFUIText-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
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
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Camera.requestCameraPermissionsAsync();
    }
  }, []);

  const handleSplashFinish = async () => {
    setShowSplash(false);
    await SplashScreen.hideAsync();
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {showSplash ? (
        <MaskedSplashScreen onAnimationFinish={handleSplashFinish} />
      ) : (
        <AuthProvider>  
          <CommunityProvider>
            <PostNavigationProvider>
              <MoodProvider>
                <RoutineProvider>
                  <SemesterProvider>
                    <AppContainer>
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
                      </Stack>
                      <StatusBar style={isDark ? 'light' : 'dark'} />
                    </AppContainer>
                  </SemesterProvider>
                </RoutineProvider>
              </MoodProvider>
            </PostNavigationProvider>
          </CommunityProvider>
        </AuthProvider>
      )}
    </GestureHandlerRootView>
  );
}
