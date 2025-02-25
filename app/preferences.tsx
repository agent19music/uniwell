import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  useColorScheme,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as burnt from 'burnt';
import { LinearGradient } from 'expo-linear-gradient';
import Octicons from '@expo/vector-icons/Octicons';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: boolean;
  onPress: () => void;
  isDark: boolean;
  type?: 'navigate' | 'toggle';
}

const SettingItem = ({ icon, title, subtitle, value, onPress, isDark, type = 'navigate' }: SettingItemProps) => (
  <TouchableOpacity 
    style={[styles.settingItem, isDark && styles.darkCard]}
    onPress={onPress}
  >
    <View style={styles.settingIcon}>
      <Ionicons name={icon} size={24} color="#FF7F50" />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, isDark && styles.darkText]}>{title}</Text>
      {subtitle && <Text style={[styles.settingSubtitle, isDark && styles.darkSubText]}>{subtitle}</Text>}
    </View>
    {type === 'navigate' && (
      <Ionicons name="chevron-forward" size={24} color={isDark ? '#aaaaaa' : '#666'} />
    )}
    {type === 'toggle' && value !== undefined && (
      <Switch
        value={value}
        onValueChange={onPress}
        trackColor={{ false: '#767577', true: '#FF7F50' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    )}
  </TouchableOpacity>
);

const SettingsSection = ({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, isDark && styles.darkSubText]}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    joinDate: '',
    streakCount: 0,
    habitCount: 0,
    gender: '',
    university: '',
    occupation: '',
    profileCompletion: 0,
  });
  
  const { profile, signOut, setProfile } = useAuth();
  
  const [notifications, setNotifications] = useState({
    reminders: true,
    achievements: true,
    weeklyReport: true,
    tips: false,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Format join date
        const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Get habit and streak counts
        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', user.id);
          
        if (habitsError) throw habitsError;
        
        const { data: streaksData, error: streaksError } = await supabase
          .from('streaks')
          .select('id')
          .eq('user_id', user.id);
          
        if (streaksError) throw streaksError;
        
        // Get notification preferences
        const notificationPrefs = profileData.notification_preferences || {
          reminders: true,
          achievements: true,
          weeklyReport: true,
          tips: false,
        };
        
        setNotifications(notificationPrefs);
        
        setUserData({
          name: user.user_metadata?.full_name || 'User',
          email: user.email || '',
          joinDate,
          streakCount: streaksData?.length || 0,
          habitCount: habitsData?.length || 0,
          gender: profileData?.gender || '',
          university: profileData?.university || '',
          occupation: profileData?.occupation || '',
          profileCompletion: profileData?.profile_completion_percentage || 40,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      burnt.toast({
        title: 'Error',
        message: 'Failed to load profile data',
        preset: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleEditProfile = () => {
    router.push('/editprofile');
  };

  const handleCompleteProfile = () => {
    router.push('/profile-completion');
  };

  const handleNotificationToggle = async (key: string, value: boolean) => {
    try {
      setNotifications({ ...notifications, [key]: value });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      // Update notification preferences in database
      await supabase
        .from('profiles')
        .update({
          notification_preferences: {
            ...notifications,
            [key]: value
          }
        })
        .eq('id', user.id);
        
      burnt.toast({
        title: 'Preferences Updated',
        message: 'Your notification preferences have been saved',
        preset: 'done',
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      burnt.toast({
        title: 'Error',
        message: 'Failed to update preferences',
        preset: 'error',
      });
      // Revert the toggle if there was an error
      setNotifications({ ...notifications });
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7F50" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: profile.avatar_url || 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png' }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, isDark && styles.darkText]}>{userData.name}</Text>
              <Text style={[styles.profileEmail, isDark && styles.darkSubText]}>{userData.email}</Text>
              <Text style={[styles.joinDate, isDark && styles.darkSubText]}>Joined {userData.joinDate}</Text>
            </View>
          </View>

          {userData.profileCompletion < 100 && (
            <View style={styles.completionCard}>
              <View style={styles.completionHeader}>
                <Text style={styles.completionTitle}>Complete Your Profile</Text>
                <Text style={styles.completionPercentage}>{userData.profileCompletion}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${userData.profileCompletion}%` }]} />
              </View>
              <Text style={styles.completionText}>
                Tell us more about yourself to get personalized recommendations
              </Text>
              <TouchableOpacity style={styles.completionButton} onPress={handleCompleteProfile}>
                <Text style={styles.completionButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={[styles.statCard, isDark && styles.darkCard]}>
              <Octicons name="flame" size={24} color="#FF7F50" />
              <Text style={[styles.statValue, isDark && styles.darkText]}>{userData.streakCount}</Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubText]}>Active Streaks</Text>
            </View>
            <View style={[styles.statCard, isDark && styles.darkCard]}>
              <Ionicons name="repeat" size={24} color="#FF7F50" />
              <Text style={[styles.statValue, isDark && styles.darkText]}>{userData.habitCount}</Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubText]}>Habits</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.editProfileButton, isDark && styles.darkCard]} 
            onPress={handleEditProfile}
          >
            <Text style={[styles.editProfileText, isDark && styles.darkText]}>Edit Profile</Text>
            <Ionicons name="pencil" size={20} color={isDark ? '#ffffff' : '#333333'} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, isDark && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Notification Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="notifications-outline" size={24} color={isDark ? '#ffffff' : '#333333'} />
              <Text style={[styles.preferenceText, isDark && styles.darkText]}>Daily Reminders</Text>
            </View>
            <Switch
              value={notifications.reminders}
              onValueChange={(value) => handleNotificationToggle('reminders', value)}
              trackColor={{ false: '#767577', true: '#FF7F50' }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="trophy-outline" size={24} color={isDark ? '#ffffff' : '#333333'} />
              <Text style={[styles.preferenceText, isDark && styles.darkText]}>Achievements</Text>
            </View>
            <Switch
              value={notifications.achievements}
              onValueChange={(value) => handleNotificationToggle('achievements', value)}
              trackColor={{ false: '#767577', true: '#FF7F50' }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="calendar-outline" size={24} color={isDark ? '#ffffff' : '#333333'} />
              <Text style={[styles.preferenceText, isDark && styles.darkText]}>Weekly Report</Text>
            </View>
            <Switch
              value={notifications.weeklyReport}
              onValueChange={(value) => handleNotificationToggle('weeklyReport', value)}
              trackColor={{ false: '#767577', true: '#FF7F50' }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="bulb-outline" size={24} color={isDark ? '#ffffff' : '#333333'} />
              <Text style={[styles.preferenceText, isDark && styles.darkText]}>Tips & Advice</Text>
            </View>
            <Switch
              value={notifications.tips}
              onValueChange={(value) => handleNotificationToggle('tips', value)}
              trackColor={{ false: '#767577', true: '#FF7F50' }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        <View style={[styles.section, isDark && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/change-password')}>
            <View style={styles.menuItemContent}>
              <Ionicons name="lock-closed-outline" size={24} color={isDark ? '#ffffff' : '#333333'} />
              <Text style={[styles.menuItemText, isDark && styles.darkText]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#ffffff' : '#333333'} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy-settings')}>
            <View style={styles.menuItemContent}>
              <Ionicons name="shield-outline" size={24} color={isDark ? '#ffffff' : '#333333'} />
              <Text style={[styles.menuItemText, isDark && styles.darkText]}>Privacy Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#ffffff' : '#333333'} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/help-support')}>
            <View style={styles.menuItemContent}>
              <Ionicons name="help-circle-outline" size={24} color={isDark ? '#ffffff' : '#333333'} />
              <Text style={[styles.menuItemText, isDark && styles.darkText]}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#ffffff' : '#333333'} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/about')}>
            <View style={styles.menuItemContent}>
              <Ionicons name="information-circle-outline" size={24} color={isDark ? '#ffffff' : '#333333'} />
              <Text style={[styles.menuItemText, isDark && styles.darkText]}>About UniWell</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#ffffff' : '#333333'} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, isDark && styles.darkSubText]}>UniWell v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#666666',
  },
  completionCard: {
    backgroundColor: '#FF7F50',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  completionPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  completionText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 16,
  },
  completionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  completionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkSection: {
    backgroundColor: '#1e1e1e',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  signOutButton: {
    backgroundColor: '#f44336',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  versionInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  versionText: {
    fontSize: 14,
    color: '#999999',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333333',
  },
});