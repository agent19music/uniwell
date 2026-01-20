import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { registerForPushNotificationsAsync } from '../lib/NotificationHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Burnt from 'burnt';
import { profileCache, cacheManager } from '../lib/cache';
import type { CachedProfile } from '../lib/cache';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

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

interface UserWithRole {
  id: string;
  email: string;
  role: 'user' | 'therapist' | 'admin';
  created_at: string;
  updated_at: string;
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
  userRole: 'user' | 'therapist' | 'admin' | null;
  userWithRole: UserWithRole | null;
  checkUserRole: () => Promise<'user' | 'therapist' | 'admin' | null>;
  signInWithGoogle: () => Promise<void>;
  handleAuthCallback: () => Promise<void>;
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
  userRole: null,
  userWithRole: null,
  checkUserRole: async () => null,
  signInWithGoogle: async () => {},
  handleAuthCallback: async () => {},
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
    const isAuthScreen = ['loginscreen', 'signupscreen', 'index', 'login-callback', 'reset-password', 'therapist/loginscreen'].includes(segments[0] || '');
    const isOnboardingScreen = segments[0] === 'onboarding';
    const isTherapistScreen = segments[0] === 'therapist';

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !session &&
      !inAuthGroup &&
      !isAuthScreen &&
      !isOnboardingScreen &&
      segments[0] !== 'profile-completion' &&
      segments[0] !== 'user-selection' &&
      !isTherapistScreen
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
  const [userRole, setUserRole] = useState<'user' | 'therapist' | 'admin' | null>(null);
  const [userWithRole, setUserWithRole] = useState<UserWithRole | null>(null);
  const router = useRouter();

  useEffect(() => {
    GoogleSignin.configure({
      // scopes: ['https://www.googleapis.com/auth/drive.readonly'], // Remove if not needed
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // TODO: Replace with your actual web client ID from Google Cloud Console
    });
  }, []);

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

      // Try cache first
      let data = await profileCache.getProfile(user.id);
      
      if (!data) {
        // Not in cache, fetch from server
        const { data: serverData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        
        if (serverData) {
          // Cache the fetched data
          await profileCache.setProfile(user.id, serverData as CachedProfile);
          data = serverData;
        }
      } else {
        // Check if cache is stale and refresh in background
        const status = await profileCache.getStatus(user.id);
        if (status === 'stale') {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data: freshData }: { data: any }) => {
              if (freshData) {
                profileCache.setProfile(user.id, freshData as CachedProfile);
              }
            });
        }
      }

      // Derive role from auth metadata when available
      const derivedRole = (user.user_metadata as any)?.role ?? null;
      setUserRole(derivedRole);
      setUserWithRole(derivedRole ? { id: user.id, email: user.email || '', role: derivedRole, created_at: '', updated_at: '' } : null);

      // Update current user
      setCurrentUser({
        id: user.id,
        email: user.email,
        user_metadata: {
          full_name: user.user_metadata?.full_name || data?.full_name || '',
          avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || '',
          gender: data?.gender || user.user_metadata?.gender || '',
          interests: data?.interests || user.user_metadata?.interests || [],
          primary_goal: data?.primary_goal || user.user_metadata?.primary_goal || '',
          bio: data?.bio || user.user_metadata?.bio || '',
          occupation: data?.occupation || user.user_metadata?.occupation || '',
          university: data?.university || user.user_metadata?.university || '',
          profile_completion_percentage: data?.profile_completion_percentage || user.user_metadata?.profile_completion_percentage || 0,
        },
      });

      // Update profile
      const userProfile: ProfileType = {
        username: data?.username || user.user_metadata?.full_name || 'User',
        full_name: user.user_metadata?.full_name || data?.full_name || 'User',
        avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || null,
        gender: data?.gender ?? undefined,
        interests: data?.interests ?? undefined,
        primary_goal: data?.primary_goal ?? undefined,
        bio: data?.bio ?? undefined,
        occupation: data?.occupation ?? undefined,
        university: data?.university ?? undefined,
        profile_completion_percentage: data?.profile_completion_percentage,
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
      Burnt.toast({
        title: 'Error',
        message: (error as Error).message,
        preset: 'error',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
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
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, newSession: Session | null) => {
      console.log(`Supabase auth event: ${event}`);
      setSession(newSession);
      
      if (newSession) {
        // Register for push notifications (wrapped in try-catch to handle Firebase not being initialized)
        try {
          await registerForPushNotificationsAsync();
        } catch (error) {
          console.warn('Push notification registration failed:', error);
        }
        
        // Check user role on sign in
        try {
          await checkUserRole();
        } catch (error) {
          console.warn('Error checking user role:', error);
        }
        
        // Warmup cache with user data
        if (newSession.user) {
          try {
            await cacheManager.warmupCache(newSession.user.id);
          } catch (error) {
            console.warn('Error warming up cache:', error);
          }
        }
      } else {
        // Reset everything when logged out
        setProfile({
          username: '',
          full_name: '',
          avatar_url: null,
        });
        setCurrentUser(null);
        setUserRole(null);
        setUserWithRole(null);
        // Clear all caches on logout
        cacheManager.clearAllCaches();
      }
      
      setLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }: { data: { session: Session | null } }) => {
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
      Burnt.toast({
        title: 'Success',
        message: 'You have been logged out successfully',
        preset: 'done',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
      });
    } catch (error) {
      Alert.alert('Error signing out', (error as Error).message);
      Burnt.toast({
        title: 'Error',
        message: (error as Error).message,
        preset: 'error',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
      });
    }
  };

  const checkUserRole = async (): Promise<'user' | 'therapist' | 'admin' | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const role = (user.user_metadata as any)?.role ?? null;
      setUserRole(role);
      return role;
    } catch (error) {
      console.error('Error checking user role:', error);
      return null;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        
        if (error) throw error;
        
        // Session will be handled by onAuthStateChange
      } else {
        throw new Error('No ID token present!');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
        console.log('User cancelled login');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
        console.log('Sign in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        Burnt.toast({
          title: 'Error',
          message: 'Google Play Services not available',
          preset: 'error',
        });
      } else {
        // some other error happened
        console.error('Google Sign-In Error:', error);
        Burnt.toast({
          title: 'Error',
          message: error.message || 'Failed to sign in with Google',
          preset: 'error',
        });
      }
    }
  };

  const handleAuthCallback = async () => {
    // This function is kept for compatibility with the requested architecture
    // but for Google Sign-In we use signInWithGoogle directly.
    // If you have other OAuth providers that redirect, handle them here.
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        setSession(session);
        await fetchProfile();
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Auth Callback Error:', error);
      throw error;
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
        userRole,
        userWithRole,
        checkUserRole,
        signInWithGoogle,
        handleAuthCallback,
      }}>
      {children}
    </AuthContext.Provider>
  );
}