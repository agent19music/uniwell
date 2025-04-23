import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { registerForPushNotificationsAsync } from '../lib/NotificationHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define a type for stored users
interface StoredUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  last_login: string;
}

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

interface User {
  id: string;
  email?: string; // Make email optional to match Supabase's User type
  user_metadata: {
    full_name: string;
    avatar_url: string;
    gender: string;
    interests: string[];
    primary_goal: string;
    bio: string;
    occupation: string;
    university: string;
    profile_completion_percentage: number;
  };
}

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  profile: ProfileType;
  setProfile: React.Dispatch<React.SetStateAction<ProfileType>>;
  storedUsers: StoredUser[];
  addStoredUser: (user: StoredUser) => Promise<void>;
  removeStoredUser: (userId: string) => Promise<void>;
  clearStoredUsers: () => Promise<void>;
  currentUser: User | null;
}

const STORED_USERS_KEY = 'uniwell_stored_users';

export const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: async () => {},
  profile: {
    username: '',
    full_name: '',
    avatar_url: null,
  },
  setProfile: () => {},
  storedUsers: [],
  addStoredUser: async () => {},
  removeStoredUser: async () => {},
  clearStoredUsers: async () => {},
  currentUser: null,
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
      segments[0] !== 'profile-completion' &&
      segments[0] !== 'user-selection' // Add the new user selection screen
    ) {
      // Redirect to the user selection screen if we have stored users
      router.replace('/user-selection');
    } else if (session && (segments[0] === 'loginscreen' || segments[0] === 'signupscreen' || segments[0] === '' || segments[0] === 'user-selection')) {
      // Redirect away from the sign-in page.
      router.replace('/(tabs)/home');
    }
  }, [session, segments]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileType>({
    username: '',
    full_name: '',
    avatar_url: null,
  });

  useProtectedRoute(session);

  // Load stored users from AsyncStorage
  useEffect(() => {
    const loadStoredUsers = async () => {
      try {
        const storedUsersJson = await AsyncStorage.getItem(STORED_USERS_KEY);
        if (storedUsersJson) {
          const parsedUsers = JSON.parse(storedUsersJson);
          setStoredUsers(parsedUsers);
        }
      } catch (error) {
        console.error('Error loading stored users:', error);
      }
    };

    loadStoredUsers();
  }, []);

  // Add a user to stored users
  const addStoredUser = async (user: StoredUser) => {
    try {
      // Check if user already exists
      const updatedUsers = storedUsers.filter(u => u.id !== user.id);
      // Add the user to the beginning of the array (most recent first)
      const newStoredUsers = [user, ...updatedUsers];
      setStoredUsers(newStoredUsers);
      await AsyncStorage.setItem(STORED_USERS_KEY, JSON.stringify(newStoredUsers));
    } catch (error) {
      console.error('Error adding stored user:', error);
    }
  };

  // Remove a user from stored users
  const removeStoredUser = async (userId: string) => {
    try {
      const updatedUsers = storedUsers.filter(user => user.id !== userId);
      setStoredUsers(updatedUsers);
      await AsyncStorage.setItem(STORED_USERS_KEY, JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error removing stored user:', error);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setCurrentUser({
          id: data.user.id,
          email: data.user.email,
          user_metadata: {
            full_name: data.user.user_metadata?.full_name || '',
            avatar_url: data.user.user_metadata?.avatar_url || '',
            gender: data.user.user_metadata?.gender || '',
            interests: data.user.user_metadata?.interests || [],
            primary_goal: data.user.user_metadata?.primary_goal || '',
            bio: data.user.user_metadata?.bio || '',
            occupation: data.user.user_metadata?.occupation || '',
            university: data.user.user_metadata?.university || '',
            profile_completion_percentage: data.user.user_metadata?.profile_completion_percentage || 0,
          },
        });
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, [session]); // Assuming 'session' is the relevant dependency
  // Clear all stored users
  const clearStoredUsers = async () => {
    try {
      setStoredUsers([]);
      await AsyncStorage.removeItem(STORED_USERS_KEY);
    } catch (error) {
      console.error('Error clearing stored users:', error);
    }
  };

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

          const userProfile = {
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
          };

          setProfile(userProfile);

          // Store user in recent users list
          await addStoredUser({
            id: newSession.user.id,
            email: newSession.user.email || '',
            username: userProfile.username,
            full_name: userProfile.full_name,
            avatar_url: userProfile.avatar_url,
            last_login: new Date().toISOString(),
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
        storedUsers,
        addStoredUser,
        removeStoredUser,
        clearStoredUsers,
        currentUser,    
      }}>
      {children}
    </AuthContext.Provider>
  );
}