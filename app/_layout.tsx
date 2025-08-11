import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Text, TextInput, Platform } from 'react-native';
import * as Font from 'expo-font';
import { AuthProvider } from '../contexts/AuthContext';
import { Camera } from 'expo-camera';
import { RoutineProvider } from '@/contexts/RoutineContext';
import { MoodProvider } from '@/contexts/MoodContext';
import { CommunityProvider } from '@/contexts/CommunityContext';
import { PostNavigationProvider } from '@/contexts/PostNavigationContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SemesterProvider } from '@/contexts/SemesterContext';
import { BootstrapProvider } from '@/components/BootstrapProvider';
import { ToastProvider } from '@/lib/toast/ToastProvider';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isFontsLoaded, setIsFontsLoaded] = useState(false);

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
    if (!isFontsLoaded) return;

    // Only attempt to set defaultProps on web, where it's supported
    if (Platform.OS === 'web') {
      // @ts-ignore
      Text.defaultProps = Text.defaultProps || {};
      // @ts-ignore
      Text.defaultProps.style = { 
        // @ts-ignore
        ...(Text.defaultProps?.style || {}),
        fontFamily: 'Vercetti-Regular'
      };
      // @ts-ignore
      TextInput.defaultProps = TextInput.defaultProps || {};
      // @ts-ignore
      TextInput.defaultProps.style = { 
        // @ts-ignore
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

  // In web dev, ensure no stale Service Workers interfere with dev server requests
  useEffect(() => {
    if (Platform.OS === 'web') {
      const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'
      if (isDev && 'serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => {
            regs.forEach((reg) => reg.unregister());
          })
          .catch(() => {
            // noop
          });
      }
    }
  }, []);

  // If assets not loaded, show nothing (native splash screen remains visible)
  if (!isFontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider
        toasterOptions={{
          position: 'bottom-center',
          toastOptions: {
            duration: 4000,
            style: {
              background: isDark ? '#333' : '#fff',
              color: isDark ? '#fff' : '#333',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            },
          },
        }}
      >
        <AuthProvider>
          <CommunityProvider>
            <PostNavigationProvider>
              <MoodProvider>
                <RoutineProvider>
                  <SemesterProvider>
                    <BootstrapProvider>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          contentStyle: {
                            backgroundColor: isDark ? '#121212' : '#f5f5f5',
                          },
                        }}
                      >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="loginscreen" />
                        <Stack.Screen name="signupscreen" />
                        <Stack.Screen name="onboarding" />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="therapist/availability" />
                        <Stack.Screen name="therapist/appointments" />
                        <Stack.Screen name="therapist/reviews" />
                        <Stack.Screen name="therapist/profile-completion" />
                        <Stack.Screen name="therapist/profile-editor" />
                        <Stack.Screen name="therapist/quick-actions" />
                      </Stack>
                      <StatusBar style={isDark ? 'light' : 'dark'} />
                    </BootstrapProvider>
                  </SemesterProvider>
                </RoutineProvider>
              </MoodProvider>
            </PostNavigationProvider>
          </CommunityProvider>
        </AuthProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
