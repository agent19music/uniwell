import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

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
  const { session, storedUsers, loading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (loading) return;

    if (session) {
      router.replace('/(tabs)/home');
    } else if (storedUsers.length > 0) {
      router.replace('/user-selection');
    } else {
      router.replace('/StartScreen');
    }
  }, [loading, router, session, storedUsers.length]);

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