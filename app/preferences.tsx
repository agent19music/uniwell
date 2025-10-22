import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as Burnt from 'burnt'
import Octicons from '@expo/vector-icons/Octicons';
import ProgressArchive from '../components/ProgressArchive';
import { useDialog } from '../hooks/useDialog'; 
import Dialog from '../components/Dialog';
import { useTheme } from '../hooks/useTheme';
import { Colors } from '../constants/Colors';
import { LoadingIndicator } from '@rn-nui/loading-indicator';

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
      <Ionicons name={icon as any} size={24} color="#FF7F50" />
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
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
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
  
  const { profile, signOut, setProfile, currentUser } = useAuth();
  
  const [notifications, setNotifications] = useState({
    reminders: true,
    achievements: true,
    weeklyReport: true,
    tips: false,
  });

  useEffect(() => {
    if (currentUser?.id) {
      fetchUserData();
    }
  }, [currentUser?.id]);

  async function fetchUserData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('user', user);
        // Format join date
        const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id);
          
        if (profileError) throw profileError;
        
        // If no profile exists, create a default one
        let profile = profileData?.[0];
        if (!profile) {
          console.log('No profile found for user:', user.id);
         
        }
        
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
        const notificationPrefs = profile?.notification_preferences || {
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
          gender: profile?.gender || '',
          university: profile?.university || '',
          occupation: profile?.occupation || '',
          profileCompletion: profile?.profile_completion_percentage || 40,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Burnt.toast({
        title: 'Error',
        message: 'Failed to load profile data',
        preset: 'error',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
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

      Burnt.toast({
        title: 'Success',
        message: 'Your notification preferences have been saved',
        preset: 'done',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      Burnt.toast({
        title: 'Error',
        message: 'Failed to update preferences',
        preset: 'error',
        duration: 2,
        from: 'top',
        shouldDismissByDrag: true
      });
      // Revert the toggle if there was an error
      setNotifications({ ...notifications });
    }
  };

  const { dialog, showDialog, hideDialog } = useDialog();

  const handleSignOut = async () => {
    showDialog({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      actions: [
        {
          label: 'Cancel',
          variant: 'secondary',
          onPress: () => hideDialog(),
        },
        {
          label: 'Sign Out',
          variant: 'primary',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ],
    });

   
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <LoadingIndicator containerColor={Colors.primary} animating={true} color={Colors.background} />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: profile?.avatar_url || 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png' }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>{userData.name}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{userData.email}</Text>
              <Text style={[styles.joinDate, { color: colors.textSecondary }]}>Joined {userData.joinDate}</Text>
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
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Octicons name="flame" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{userData.streakCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Streaks</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="repeat" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{userData.habitCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Habits</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.editProfileButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={handleEditProfile}
          >
            <Text style={[styles.editProfileText, { color: colors.textPrimary }]}>Edit Profile</Text>
            <Ionicons name="pencil" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Progress</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.divider }]} 
            onPress={() => setShowArchiveModal(true)}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name="time-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>View Progress Archive</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notification Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.preferenceText, { color: colors.textPrimary }]}>Daily Reminders</Text>
            </View>
            <Switch
              value={notifications.reminders}
              onValueChange={(value) => handleNotificationToggle('reminders', value)}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="trophy-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.preferenceText, { color: colors.textPrimary }]}>Achievements</Text>
            </View>
            <Switch
              value={notifications.achievements}
              onValueChange={(value) => handleNotificationToggle('achievements', value)}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="calendar-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.preferenceText, { color: colors.textPrimary }]}>Weekly Report</Text>
            </View>
            <Switch
              value={notifications.weeklyReport}
              onValueChange={(value) => handleNotificationToggle('weeklyReport', value)}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="bulb-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.preferenceText, { color: colors.textPrimary }]}>Tips & Advice</Text>
            </View>
            <Switch
              value={notifications.tips}
              onValueChange={(value) => handleNotificationToggle('tips', value)}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={() => router.push('/change-password')}>
            <View style={styles.menuItemContent}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={() => router.push('/privacy-settings')}>
            <View style={styles.menuItemContent}>
              <Ionicons name="shield-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Privacy Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={() => router.push('/help-support')}>
            <View style={styles.menuItemContent}>
              <Ionicons name="help-circle-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={() => router.push('/about')}>
            <View style={styles.menuItemContent}>
              <Ionicons name="information-circle-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>About UniWell</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>UniWell v1.0.0</Text>
        </View>
      </ScrollView>

      <ProgressArchive
        visible={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
      />
       <Dialog
        visible={dialog.visible}
        onClose={hideDialog}
        title={dialog.title}
        message={dialog.message}
        icon={dialog.icon}
        actions={dialog.actions}
      />
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },  
  settingIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  settingContent: {   
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
 
  sectionContent: {
    flex: 1,
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
    backgroundColor: Colors.primary,
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
  darkMenuItem: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
});