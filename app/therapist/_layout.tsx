import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { TherapistProvider } from './context/TherapistContext';

export default function TherapistLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      <Stack.Screen name="loginscreen" />
      <Stack.Screen name="signupscreen" />
      <Stack.Screen name="dashboard" />
    </Stack>
    </TherapistProvider>
  );
} 