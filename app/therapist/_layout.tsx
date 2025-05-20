import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { TherapistProvider } from './context/TherapistContext';

export default function TherapistLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';
  
  useEffect(() => {
    // Redirect mobile users to a notice screen
    if (!isWeb) {
      router.replace('/therapist/mobile-notice');
    }
  }, [isWeb, router]);

  return (
    <TherapistProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? '#121212' : '#f5f5f5',
          },
        }}
      >
        <Stack.Screen name="index" options={{ redirect: true }} />
        <Stack.Screen name="loginscreen" options={{ title: "Therapist Login" }} />
        <Stack.Screen name="signupscreen" options={{ title: "Therapist Signup" }} />
        <Stack.Screen name="dashboard" options={{ title: "Therapist Dashboard" }} />
        <Stack.Screen name="mobile-notice" options={{ title: "Web Only Feature", headerShown: false }} />
      </Stack>
    </TherapistProvider>
  );
} 