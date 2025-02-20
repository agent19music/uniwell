import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Text, TextInput } from 'react-native';
import * as Font from 'expo-font';
import { AuthProvider } from '../lib/AuthContext';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [fontsLoaded] = Font.useFonts({
    'Vercetti-Regular': require('../assets/fonts/Vercetti-Regular.ttf'),
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#121212' : '#f5f5f5',
        },
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="loginscreen" />
        <Stack.Screen name="signupscreen" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </AuthProvider>
  );
}
