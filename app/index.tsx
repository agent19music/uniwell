import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Session } from '@supabase/supabase-js';

/**
 * Index screen - handles initial routing based on auth state
 * 
 * Flow:
 * - If authenticated → /(tabs)/home
 * - If has stored users → /user-selection
 * - Otherwise → /StartScreen
 */
export default function Index() {
  const router = useRouter();
  const { storedUsers } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check for active session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // User is authenticated, go to home
          router.replace('/(tabs)/home');
          return;
        }

        // Check for stored users (for quick switch)
        if (storedUsers.length > 0) {
          router.replace('/user-selection');
          return;
        }

        // No session, no stored users - show start screen
        router.replace('/StartScreen');
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, default to start screen
        router.replace('/StartScreen');
      }
    };

    checkAuthAndRedirect();
  }, [storedUsers]);

  // Show loading indicator while checking auth
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});