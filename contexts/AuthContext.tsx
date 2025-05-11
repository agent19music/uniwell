import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { registerForPushNotificationsAsync } from '../lib/NotificationHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as burnt from 'burnt';

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
  profileLoading: boolean;
  signOut: () => Promise<void>;
  profile: ProfileType;
  setProfile: React.Dispatch<React.SetStateAction<ProfileType>>;
  storedUsers: StoredUser[];
  addStoredUser: (user: StoredUser) => Promise<void>;
  removeStoredUser: (userId: string) => Promise<void>;
  clearStoredUsers: () => Promise<void>;
  currentUser: User | null;
  fetchProfile: () => Promise<void>;
}

const STORED_USERS_KEY = 'uniwell_stored_users';

export const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  profileLoading: true,
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
  fetchProfile: async () => {},
});

// This hook can be used to access the user info.
export function useAuth() {
  return useContext(AuthContext);
}

// This hook will protect the route access based on user authentication.
function useProtectedRoute(session: Session | null) {
  const segments = useSegments();
  const router = useRouter();
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);

  // Load stored users first
  useEffect(() => {
    const loadStoredUsers = async () => {
      try {
        const storedUsersJson = await AsyncStorage.getItem(STORED_USERS_KEY);
        if (storedUsersJson) {
          setStoredUsers(JSON.parse(storedUsersJson));
        }
      } catch (error) {
        console.error('Error loading stored users:', error);
      }
    };

    loadStoredUsers();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const isAuthScreen = ['loginscreen', 'signupscreen', 'index', 'login-callback', 'reset-password'].includes(segments[0] || '');
    const isOnboardingScreen = segments[0] === 'onboarding';

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !session &&
      !inAuthGroup &&
      !isAuthScreen &&
      !isOnboardingScreen &&
      segments[0] !== 'profile-completion' &&
      segments[0] !== 'user-selection'
    ) {
      // If we have stored users, redirect to user selection instead of login
      if (storedUsers.length > 0) {
        router.replace('/user-selection');
      } else {
        // Otherwise go to login screen
        router.replace('/loginscreen');
      }
    } else if (session && (inAuthGroup || isAuthScreen || segments[0] === 'user-selection')) {
      // Redirect away from auth screens when signed in
      router.replace('/(tabs)/home');
    }

    // If user is on onboarding screen but has a session, skip to home
    if (session && isOnboardingScreen) {
      router.replace('/(tabs)/home');
    }
  }, [session, segments, storedUsers]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileType>({
    username: '',
    full_name: '',
    avatar_url: null,
  });
  const router = useRouter();

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

  // Clear all stored users
  const clearStoredUsers = async () => {
    try {
      setStoredUsers([]);
      await AsyncStorage.removeItem(STORED_USERS_KEY);
    } catch (error) {
      console.error('Error clearing stored users:', error);
    }
  };

  // Fetch current user profile data
  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Update current user
      setCurrentUser({
        id: user.id,
        email: user.email,
        user_metadata: {
          full_name: user.user_metadata?.full_name || data.full_name || '',
          avatar_url: data.avatar_url || user.user_metadata?.avatar_url || '',
          gender: data.gender || user.user_metadata?.gender || '',
          interests: data.interests || user.user_metadata?.interests || [],
          primary_goal: data.primary_goal || user.user_metadata?.primary_goal || '',
          bio: data.bio || user.user_metadata?.bio || '',
          occupation: data.occupation || user.user_metadata?.occupation || '',
          university: data.university || user.user_metadata?.university || '',
          profile_completion_percentage: data.profile_completion_percentage || user.user_metadata?.profile_completion_percentage || 0,
        },
      });

      // Update profile
      const userProfile: ProfileType = {
        username: data.username || user.user_metadata?.full_name || 'User',
        full_name: user.user_metadata?.full_name || data.full_name || 'User',
        avatar_url: data.avatar_url || user.user_metadata?.avatar_url,
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
        id: user.id,
        email: user.email || '',
        username: userProfile.username,
        full_name: userProfile.full_name,
        avatar_url: userProfile.avatar_url,
        last_login: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      burnt.toast({
        title: 'Error',
        message: (error as Error).message,
        preset: 'error',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  useEffect(() => {
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`Supabase auth event: ${event}`);
      setSession(newSession);
      
      if (newSession) {
        // Register for push notifications
        await registerForPushNotificationsAsync();
      } else {
        // Reset profile when logged out
        setProfile({
          username: '',
          full_name: '',
          avatar_url: null,
        });
        setCurrentUser(null);
      }
      
      setLoading(false);
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
      router.replace('/');
      burnt.toast({
        title: 'Success',
        message: 'You have been logged out successfully',
        preset: 'done',
      });
    } catch (error) {
      Alert.alert('Error signing out', (error as Error).message);
      burnt.toast({
        title: 'Error',
        message: (error as Error).message,
        preset: 'error',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        profileLoading,
        signOut,
        profile,
        setProfile,
        storedUsers,
        addStoredUser,
        removeStoredUser,
        clearStoredUsers,
        currentUser,
        fetchProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}