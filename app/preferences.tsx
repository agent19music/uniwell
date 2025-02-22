import { View, Text, ScrollView, StyleSheet, useColorScheme, Switch, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; 
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

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
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    joinDate: '',
    streakCount: 0,
    habitCount: 0,
  });
  const { profile, signOut } = useAuth();
  const [notifications, setNotifications] = useState({
    reminders: true,
    achievements: true,
    weeklyReport: true,
    tips: false,
  });

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Format join date
        const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });

        setUserData({
          name: user.user_metadata?.full_name || 'User',
          email: user.email || '',
          joinDate,
          streakCount: 0, // You'll need to fetch these from your database
          habitCount: 0,  // You'll need to fetch these from your database
        });
      }
    }
    getUserData();
  }, []);


  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, isDark && styles.darkCard]}>
          <View style={styles.profileImageContainer}>
             <Image
                       source={profile.avatar_url ? { uri: profile.avatar_url } : require('../assets/default-avatar.png')}
                       style={styles.profileImage}
                     />
            <TouchableOpacity 
              style={styles.editImageButton}
              onPress={() => router.push('/editprofile')}
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.profileName, isDark && styles.darkText]}>{userData.name}</Text>
          <Text style={[styles.profileEmail, isDark && styles.darkSubText]}>{userData.email}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>{userData.streakCount}</Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubText]}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>{userData.habitCount}</Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubText]}>Active Habits</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <SettingsSection title="Account" isDark={isDark}>
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => router.push('/editprofile')}
            isDark={isDark}
          />
          <SettingItem
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your security credentials"
            onPress={() => {}}
            isDark={isDark}
          />
          <SettingItem
            icon="globe-outline"
            title="Language"
            subtitle="English (US)"
            onPress={() => {}}
            isDark={isDark}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" isDark={isDark}>
          <SettingItem
            icon="notifications-outline"
            title="Daily Reminders"
            subtitle="Receive daily reminders"
            type="toggle"
            value={notifications.reminders}
            onPress={() => setNotifications(prev => ({ ...prev, reminders: !prev.reminders }))}
            isDark={isDark}
          />
          <SettingItem
            icon="trophy-outline"
            title="Achievements"
            subtitle="Receive achievement notifications"
            type="toggle"
            value={notifications.achievements}
            onPress={() => setNotifications(prev => ({ ...prev, achievements: !prev.achievements }))}
            isDark={isDark}
          />
          <SettingItem
            icon="bar-chart-outline"
            title="Weekly Report"
            type="toggle"
            value={notifications.weeklyReport}
            onPress={() => setNotifications(prev => ({ ...prev, weeklyReport: !prev.weeklyReport }))}
            isDark={isDark}
          />
          <SettingItem
            icon="bulb-outline"
            title="Tips & Advice"
            type="toggle"
            value={notifications.tips}
            onPress={() => setNotifications(prev => ({ ...prev, tips: !prev.tips }))}
            isDark={isDark}
          />
        </SettingsSection>

        {/* App Settings */}
        <SettingsSection title="App Settings" isDark={isDark}>
          <SettingItem
            icon="color-palette-outline"
            title="Appearance"
            subtitle={isDark ? "Dark Mode" : "Light Mode"}
            onPress={() => {}}
            isDark={isDark}
          />
          <SettingItem
            icon="sync-outline"
            title="Data Sync"
            subtitle="Manage sync settings"
            onPress={() => {}}
            isDark={isDark}
          />
          <SettingItem
            icon="save-outline"
            title="Backup"
            subtitle="Backup and restore data"
            onPress={() => {}}
            isDark={isDark}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Support" isDark={isDark}>
          <SettingItem
            icon="help-circle-outline"
            title="Help Center"
            onPress={() => {}}
            isDark={isDark}
          />
          <SettingItem
            icon="mail-outline"
            title="Contact Support"
            onPress={() => {}}
            isDark={isDark}
          />
          <SettingItem
            icon="star-outline"
            title="Rate App"
            onPress={() => {}}
            isDark={isDark}
          />
        </SettingsSection>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, isDark && styles.darkCard]} 
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#E74C3C" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Info */}
        <Text style={[styles.versionText, isDark && styles.darkSubText]}>
          Version 1.0.0
        </Text>
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
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImageButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#FF7F50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: 'transparent',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 8,
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginVertical: 16,
  },
});