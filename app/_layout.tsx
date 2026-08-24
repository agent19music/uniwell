import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Platform, ActivityIndicator, View } from 'react-native';
import * as Font from 'expo-font';
import { AuthProvider } from '../contexts/AuthContext';
import { QueryProvider } from '@/lib/query';
import { Camera } from 'expo-camera';
import { RoutineProvider } from '@/contexts/RoutineContext';
import { MoodProvider } from '@/contexts/MoodContext';
import { CommunityProvider } from '@/contexts/CommunityContext';
import { PostNavigationProvider } from '@/contexts/PostNavigationContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SemesterProvider } from '@/contexts/SemesterContext';
import { cacheManager } from '@/lib/cache';
import { colorThemes } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = colorThemes[isDark ? 'dark' : 'light'];
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

  // Initialize cache system on app startup
  useEffect(() => {
    cacheManager.initialize().catch(err => {
      console.error('Failed to initialize cache system:', err);
    });

    // Cleanup on unmount
    return () => {
      cacheManager.shutdown();
    };
  }, []);



  useEffect(() => {
    if (Platform.OS === 'android') {
      Camera.requestCameraPermissionsAsync();
    }
  }, []);



  // If assets not loaded, show nothing (native splash screen remains visible)
  if (!isFontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.canvas }}>
      <QueryProvider>
      <AuthProvider>
        <CommunityProvider>
          <PostNavigationProvider>
            <MoodProvider>
              <RoutineProvider>
                <SemesterProvider>
                  <AuthStartupGate themeCanvas={theme.canvas} />
                  <StatusBar backgroundColor={theme.canvas} style={isDark ? 'light' : 'dark'} />
                </SemesterProvider>
              </RoutineProvider>
            </MoodProvider>
          </PostNavigationProvider>
        </CommunityProvider>
      </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

function AuthStartupGate({ themeCanvas }: { themeCanvas: string }) {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: themeCanvas,
        }}
        accessibilityLabel="Restoring your session"
      >
        <ActivityIndicator />
      </View>
    );
  }

  // Remount when authentication changes. This removes stale guest screens from
  // navigation without racing route-level redirects.
  return (
    <Stack
      key={session?.user.id ?? 'guest'}
      initialRouteName={session ? '(tabs)' : 'index'}
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: themeCanvas,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="StartScreen" />
      <Stack.Screen name="loginscreen" />
      <Stack.Screen name="signupscreen" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
