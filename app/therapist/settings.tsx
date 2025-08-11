import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTherapist } from '../../contexts/TherapistContext';
import { router, useLocalSearchParams } from 'expo-router';
import ProfileEditor from './components/ProfileEditor';
import AvailabilityManagement from './components/AvailabilityManagement';

// Only render the settings on web - mobile will redirect
const isWeb = Platform.OS === 'web';

export default function TherapistSettings() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { profile, signOut } = useTherapist();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'profile' | 'availability'>('profile');
  
  // Set active tab based on URL parameter
  useEffect(() => {
    if (params.tab === 'availability') {
      setActiveTab('availability');
    } else if (params.tab === 'profile') {
      setActiveTab('profile');
    }
  }, [params.tab]);
  
  // Redirect non-web users to the login screen
  useEffect(() => {
    if (!isWeb) {
      router.replace('/therapist/mobile-notice');
    }
  }, [isWeb]);
  
  if (!isWeb) {
    return null; // Will be redirected by useEffect
  }
  
  if (!profile) {
    router.replace('/therapist/loginscreen');
    return null;
  }
  
  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Settings</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#333"} />
          <Text style={[styles.backText, isDark && styles.darkText]}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'profile' && styles.activeTab,
            isDark && styles.darkTab,
            activeTab === 'profile' && isDark && styles.darkActiveTab
          ]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={activeTab === 'profile' ? '#FF7F50' : isDark ? '#aaa' : '#666'} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'profile' && styles.activeTabText,
              isDark && styles.darkTabText,
              activeTab === 'profile' && styles.activeTabText
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'availability' && styles.activeTab,
            isDark && styles.darkTab,
            activeTab === 'availability' && isDark && styles.darkActiveTab
          ]}
          onPress={() => setActiveTab('availability')}
        >
          <Ionicons 
            name="calendar" 
            size={20} 
            color={activeTab === 'availability' ? '#FF7F50' : isDark ? '#aaa' : '#666'} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'availability' && styles.activeTabText,
              isDark && styles.darkTabText,
              activeTab === 'availability' && styles.activeTabText
            ]}
          >
            Availability
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {activeTab === 'profile' ? (
          <ProfileEditor />
        ) : (
          <AvailabilityManagement />
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  darkHeader: {
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  darkTab: {
    backgroundColor: '#1e1e1e',
  },
  darkActiveTab: {
    backgroundColor: '#2c2c2c',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF7F50',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  darkTabText: {
    color: '#aaa',
  },
  activeTabText: {
    color: '#FF7F50',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
}); 