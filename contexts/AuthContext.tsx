import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { registerForPushNotificationsAsync } from '../lib/NotificationHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Burnt from 'burnt';
import { profileCache, cacheManager } from '../lib/cache';
import type { CachedProfile } from '../lib/cache';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

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
  googleSignInInProgress: boolean;
  handleAuthCallback: () => Promise<void>;
}

const STORED_USERS_KEY = 'uniwell_stored_users';

export const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  profileLoading: true,
  signOut: async () => { },
  profile: {
    username: '',
    full_name: '',
    avatar_url: null,
  },
  setProfile: () => { },
  storedUsers: [],
  addStoredUser: async () => { },
  removeStoredUser: async () => { },
  clearStoredUsers: async () => { },
  currentUser: null,
  fetchProfile: async () => { },
  userRole: null,
  userWithRole: null,
  checkUserRole: async () => null,
  signInWithGoogle: async () => { },
  googleSignInInProgress: false,
  handleAuthCallback: async () => { },
});

// This hook can be used to access the user info.
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [storedUsersResolved, setStoredUsersResolved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileType>({
    username: '',
    full_name: '',
    avatar_url: null,
  });
  const [userRole, setUserRole] = useState<'user' | 'therapist' | 'admin' | null>(null);
  const [userWithRole, setUserWithRole] = useState<UserWithRole | null>(null);
  const [googleSignInInProgress, setGoogleSignInInProgress] = useState(false);
  const googleSignInRef = useRef(false);
  const loading = !authResolved || !storedUsersResolved;

  useEffect(() => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!webClientId) {
      console.warn('[Auth] Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID environment variable');
    }
    GoogleSignin.configure({
      webClientId: webClientId || '',
      offlineAccess: false,
      scopes: ['openid', 'email', 'profile'],
    });
  }, []);

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
      } finally {
        setStoredUsersResolved(true);
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
    const user = session?.user;
    if (!user) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const applyProfile = (data: CachedProfile | null) => {
        const derivedRole = (user.user_metadata as any)?.role ?? null;
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

        setUserRole(derivedRole);
        setUserWithRole(derivedRole ? { id: user.id, email: user.email || '', role: derivedRole, created_at: '', updated_at: '' } : null);
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
        setProfile(userProfile);
        void addStoredUser({
          id: user.id,
          email: user.email || '',
          username: userProfile.username,
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url,
          last_login: new Date().toISOString(),
        });
      };

      const cachedProfile = await profileCache.getProfile(user.id);
      if (cachedProfile) {
        applyProfile(cachedProfile);
        setProfileLoading(false);

        if (await profileCache.getStatus(user.id) === 'stale') {
          void supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
            .then(({ data, error }: { data: CachedProfile | null; error: { message?: string } | null }) => {
              if (!error && data) {
                void profileCache.setProfile(user.id, data as CachedProfile);
                applyProfile(data as CachedProfile);
              }
            });
        }
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;

      if (data) void profileCache.setProfile(user.id, data as CachedProfile);
      applyProfile(data as CachedProfile | null);
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
      void fetchProfile().finally(() => {
        // Warm non-critical data only after profile state is available.
        void cacheManager.warmupCache(session.user.id);
      });
    } else {
      setProfileLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event: string, newSession: Session | null) => {
      console.log(`Supabase auth event: ${event}`);

      // INITIAL_SESSION can fire with null while storage is still being read.
      // getSession() is the startup source of truth so we do not flash guest UI.
      if (event === 'INITIAL_SESSION') {
        return;
      }

      setSession(newSession);

      if (newSession) {
        void registerForPushNotificationsAsync().catch((error: unknown) => {
          console.warn('Push notification registration failed:', error);
        });
      } else if (event === 'SIGNED_OUT') {
        setProfile({
          username: '',
          full_name: '',
          avatar_url: null,
        });
        setCurrentUser(null);
        setUserRole(null);
        setUserWithRole(null);
        void cacheManager.clearAllCaches();
      }
    });

    void supabase.auth.getSession()
      .then(({ data: { session: initialSession } }: { data: { session: Session | null } }) => {
        setSession(initialSession);
      })
      .catch((error: unknown) => console.error('Unable to restore session:', error))
      .finally(() => setAuthResolved(true));

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
      await supabase.auth.signOut();
      setProfile({
        username: '',
        full_name: '',
        avatar_url: null,
      });
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
    if (googleSignInRef.current) return;
    googleSignInRef.current = true;
    setGoogleSignInInProgress(true);

    const clearNativeGoogleAccount = async () => {
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
    };

    try {
      // Check if webClientId is configured
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      if (!webClientId) {
        console.error('[Auth] Google Sign-In not configured - missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
        Burnt.toast({
          title: 'Configuration Error',
          message: 'Google Sign-In is not properly configured',
          preset: 'error',
        });
        throw new Error('Google Sign-In not configured');
      }

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // A failed or cancelled attempt leaves a native Google account selected.
      // Clear it before prompting so Android opens the account picker again.
      await clearNativeGoogleAccount();

      console.log('[Auth] Starting Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      if (!isSuccessResponse(userInfo)) {
        // v16 returns cancellation as a response, rather than throwing. Clear
        // the native account so the next attempt opens account selection.
        await clearNativeGoogleAccount();
        console.log('[Auth] User cancelled Google Sign-In');
        return;
      }
      console.log('[Auth] Google Sign-In returned user:', userInfo.data?.user?.email);

      if (userInfo.data?.idToken) {
        console.log('[Auth] Got ID token, signing in to Supabase...');
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });

        if (error) {
          console.error('[Auth] Supabase signInWithIdToken error:', error);
          throw error;
        }

        console.log('[Auth] Supabase sign-in successful:', data.user?.email);
        // Session will be handled by onAuthStateChange
      } else {
        console.error('[Auth] No ID token received from Google');
        throw new Error('No ID token received from Google');
      }
    } catch (error: any) {
      console.error('[Auth] Google Sign-In error:', error);
      await clearNativeGoogleAccount().catch((clearError) => {
        console.warn('[Auth] Could not clear native Google account:', clearError);
      });

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled - no toast needed
        console.log('[Auth] User cancelled Google Sign-In');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('[Auth] Sign-in already in progress');
        Burnt.toast({
          title: 'Please Wait',
          message: 'Sign-in is already in progress',
          preset: 'none',
        });
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Burnt.toast({
          title: 'Error',
          message: 'Google Play Services not available. Please update.',
          preset: 'error',
        });
      } else {
        // General error
        const isProfileCreationError = typeof error?.message === 'string'
          && error.message.includes('Database error saving new user');
        const errorMessage = isProfileCreationError
          ? 'We could not create your account profile. Please try again.'
          : error.message || 'Failed to sign in with Google';
        Burnt.toast({
          title: 'Sign-In Failed',
          message: errorMessage,
          preset: 'error',
        });
      }

      // Re-throw for caller to handle
      throw error;
    } finally {
      googleSignInRef.current = false;
      setGoogleSignInInProgress(false);
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
        googleSignInInProgress,
        handleAuthCallback,
      }}>
      {children}
    </AuthContext.Provider>
  );
}