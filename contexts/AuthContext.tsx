import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  profile: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  setProfile: React.Dispatch<React.SetStateAction<{
    username: string;
    full_name: string;
    avatar_url: string | null;
  }>>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: async () => {},
  profile: {
    username: '',
    full_name: '',
    avatar_url: null,
  },
  setProfile: () => {},
});

import { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const [profile, setProfile] = useState<{
    username: string;
    full_name: string;
    avatar_url: string | null;
  }>({
    username: '',
    full_name: '',
    avatar_url: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        username: data.username || '',
        full_name: user.user_metadata.full_name || '',
        avatar_url: data.avatar_url,
      });
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  }

  useEffect(() => {
    // Check if we're in an auth screen
    const inAuthGroup = segments[0] === '(auth)';
    const isAuthScreen = ['loginscreen', 'signupscreen', 'index'].includes(segments[0] || '');

    if (session && (inAuthGroup || isAuthScreen)) {
      // Redirect to home if signed in and in auth screen
      router.replace('/(tabs)/home');
    } else if (!session && !inAuthGroup && !isAuthScreen) {
      // Only redirect to welcome screen if not signed in and not in auth screens
      router.replace('/');
    }
  }, [session, segments]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/');
      Alert.alert('Success', 'You have been logged out successfully');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <AuthContext.Provider value={{ session, loading, signOut, profile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);