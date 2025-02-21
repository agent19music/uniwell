import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from './supabase';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

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
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 