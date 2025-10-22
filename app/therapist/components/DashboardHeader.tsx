import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTherapist } from '../../../contexts/TherapistContext';

export default function DashboardHeader() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { profile, signOut } = useTherapist();

  const handleNotifications = () => {
    // Handle notifications
  };

  const handleProfile = () => {
    // Handle profile view
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (bio?: string) => {
    if (!bio) return 'T';
    const words = bio.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return bio[0].toUpperCase();
  };

  return (
    <View style={[styles.header, isDark && styles.darkHeader]}>
      <View style={styles.headerLeft}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(profile?.bio)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.welcomeText, isDark && styles.darkText]}>
            Welcome back
          </Text>
          <Text style={[styles.nameText, isDark && styles.darkText]}>
            {profile?.bio?.split(' ').slice(0, 2).join(' ') || 'Therapist'}
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleNotifications}
        >
          <Ionicons 
            name="notifications-outline" 
            size={24} 
            color={isDark ? '#ffffff' : '#333333'} 
          />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>3</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleProfile}
        >
          <Ionicons 
            name="person-outline" 
            size={24} 
            color={isDark ? '#ffffff' : '#333333'} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleSignOut}
        >
          <Ionicons 
            name="log-out-outline" 
            size={24} 
            color={isDark ? '#ffffff' : '#333333'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkHeader: {
    backgroundColor: '#1e1e1e',
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF7F50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
  },
  headerInfo: {
    gap: 2,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Vercetti-Regular',
  },
}); 