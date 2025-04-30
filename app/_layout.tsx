import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Text, TextInput, Platform } from 'react-native';
import * as Font from 'expo-font';
import { AuthProvider } from '../contexts/AuthContext';
import { Camera } from 'expo-camera';
import { RoutineProvider } from '@/contexts/RoutineContext';
import { MoodProvider } from '@/contexts/MoodContext';
import { CommunityProvider } from '@/contexts/CommunityContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SemesterProvider } from '@/contexts/SemesterContext';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>  
        <CommunityProvider>
          <MoodProvider>
            <RoutineProvider>
              <SemesterProvider>
                <Stack screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor: isDark ? '#121212' : '#f5f5f5',
                  },
                }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="loginscreen" />
                <Stack.Screen name="signupscreen" />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
              </SemesterProvider>
              <StatusBar style={isDark ? 'light' : 'dark'} />
            </RoutineProvider>
          </MoodProvider>
        </CommunityProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
