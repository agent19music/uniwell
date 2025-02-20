import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Text, TextInput } from 'react-native';
import * as Font from 'expo-font';
import { useState } from 'react';
import React from 'react';
import { AuthProvider } from '../lib/AuthContext';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [fontsLoaded] = useFonts({
    'Vercetti-Regular': require('../assets/fonts/Vercetti-Regular.ttf'),
  });

  useEffect(() => {
    console.log('Fonts loaded:', fontsLoaded); // Debug log
    if (fontsLoaded) {
      console.log('Applying font styles'); // Debug log
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
    window.frameworkReady?.();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    console.log('Waiting for fonts to load...'); // Debug log
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
        <Stack.Screen name="welcomescreen" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </AuthProvider>
  );
}
function useFonts(fontMap: { [key: string]: any }): [boolean] {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync(fontMap);
      setLoaded(true);
    }

    loadFonts();
  }, []);

  return [loaded];
}
