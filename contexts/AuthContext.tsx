import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { registerForPushNotificationsAsync } from '../lib/NotificationHandler';

interface ProfileType {
  username: string;
  full_name: string;
  avatar_url: string | null;
  gender?: string;
  interests?: string[];
  primary_goal?: string;
  bio?: string;
  occupation?: string;
  university?: string;
  profile_completion_percentage?: number;
}

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  profile: ProfileType;
  setProfile: React.Dispatch<React.SetStateAction<ProfileType>>;
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

// This hook can be used to access the user info.
export function useAuth() {
  return useContext(AuthContext);
}

// This hook will protect the route access based on user authentication.
function useProtectedRoute(session: Session | null) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !session &&
      !inAuthGroup &&
      segments[0] !== '' &&
      segments[0] !== 'loginscreen' &&
      segments[0] !== 'signupscreen' &&
      segments[0] !== 'login-callback' &&
      segments[0] !== 'profile-completion'
    ) {
      // Redirect to the sign-in page.
      router.replace('/');
    } else if (session && (segments[0] === 'loginscreen' || segments[0] === 'signupscreen' || segments[0] === '')) {
      // Redirect away from the sign-in page.
      router.replace('/(tabs)/home');
    }
  }, [session, segments]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileType>({
    username: '',
    full_name: '',
    avatar_url: null,
  });

  useProtectedRoute(session);

  useEffect(() => {
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`Supabase auth event: ${event}`);
      setSession(newSession);
      setLoading(false);

      if (newSession) {
        // Register for push notifications
        await registerForPushNotificationsAsync();
        
        // Fetch user profile
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();

          if (error) throw error;

          setProfile({
            username: data.username || newSession.user.user_metadata?.full_name || 'User',
            full_name: newSession.user.user_metadata?.full_name || 'User',
            avatar_url: data.avatar_url,
            gender: data.gender,
            interests: data.interests,
            primary_goal: data.primary_goal,
            bio: data.bio,
            occupation: data.occupation,
            university: data.university,
            profile_completion_percentage: data.profile_completion_percentage,
          });
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile({
        username: '',
        full_name: '',
        avatar_url: null,
      });
    } catch (error) {
      Alert.alert('Error signing out', (error as Error).message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signOut,
        profile,
        setProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}