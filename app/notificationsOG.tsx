import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  useColorScheme 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DeviceMobile, Fire, GraduationCap, Heart, Calendar, Bell } from 'phosphor-react-native';
import { useRouter } from 'expo-router';

// Notification Categories Configuration
type NotificationCategoryKey = 'login' | 'streak' | 'class' | 'affirmations' | 'routine';

const NOTIFICATION_CATEGORIES: Record<NotificationCategoryKey, {
  icon: React.ReactNode;
  title: string;
  color: string;
  notifications: {
    id: string;
    title: string;
    description: string;
    time: string;
    opened: boolean;
    category: NotificationCategoryKey;
  }[];
}> = {
  login: {
    icon: <DeviceMobile size={30} color="#4A90E2" weight="regular" />,
    title: 'Device Logins',
    color: '#4A90E2',
    notifications: [
      { 
        id: 'login1', 
        title: 'New Device Login', 
        description: 'Logged in from iPhone 14 Pro', 
        time: '1 hour ago',
        opened: false,
        category: 'login'
      },
      { 
        id: 'login2', 
        title: 'Suspicious Activity', 
        description: 'Suspicious Activity', 
        time: '1 day ago',
        opened: true,
        category: 'login'
      }
    ]
  },
  streak: {
    icon: <Fire size={30} color="#FF6B6B" weight="regular" />,
    title: 'Streak Encouragements',
    color: '#FF6B6B',
    notifications: [
      { 
        id: 'streak1', 
        title: 'Streak Milestone', 
        description: 'You\'ve maintained a 7-day learning streak!', 
        time: '3 hours ago',
        opened: false,
        category: 'streak'
      }
    ]
  },
  class: {
    icon: <GraduationCap size={30} color="#4CAF50" weight="regular" />,
    title: 'Class Reminders',
    color: '#4CAF50',
    notifications: [
      { 
        id: 'class1', 
        title: 'Upcoming Class', 
        description: 'Mathematics class starts in 30 minutes', 
        time: '45 mins ago',
        opened: false ,
        category: 'class'
      }
    ]
  },
  affirmations: {
    icon: <Heart size={30} color="#9C27B0" weight="regular" />,
    title: 'Daily Affirmations',
    color: '#9C27B0',
    notifications: [
      { 
        id: 'aff1', 
        title: 'Today\'s Affirmation', 
        description: 'You are capable of amazing things!', 
        time: '1 hour ago',
        opened: true ,
        category: 'affirmations'
      }
    ]
  },
  routine: {
    icon: <Calendar size={30} color="#FF9800" weight="regular" />,
    title: 'Routine Reminders',
    color: '#FF9800',
    notifications: [
      { 
        id: 'routine1', 
        title: 'Morning Routine', 
        description: 'Time to start your morning meditation', 
        time: '20 mins ago',
        opened: false ,
        category: 'routine'
      }
    ]
  }
};

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const router = useRouter();

  const allNotifications = Object.values(NOTIFICATION_CATEGORIES)
    .flatMap(category => category.notifications)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const handleNotificationPress = (notification: { id: string; category: NotificationCategoryKey }) => {
    // Handle navigation based on notification type
    switch (notification.id) {
      case 'login1':
      case 'login2':
        router.push('/login-details');
        break;
      case 'streak1':
        router.push('/streak-details');
        break;
      case 'class1':
        router.push('/class-details');
        break;
      case 'aff1':
        router.push('/affirmation-details');
        break;
      case 'routine1':
        router.push('/routine-details');
        break;
      default:
        break;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#F4F4F4'
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF'
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      marginLeft: 15,
      color: isDarkMode ? '#FFFFFF' : '#000000'
    },
    notificationList: {
      flex: 1,
      marginTop: 12,
      backgroundColor: isDarkMode ? '#121212' : '#F4F4F4'
    },
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginHorizontal: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: isDarkMode ? '#333333' : '#E0E0E0',
      backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF'
    },
    notificationContent: {
      marginLeft: 15,
      flex: 1
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#000000'
    },
    notificationDescription: {
      fontSize: 14,
      color: isDarkMode ? '#B0B0B0' : '#666666',
      marginTop: 5
    },
    notificationTime: {
      fontSize: 12,
      color: isDarkMode ? '#888888' : '#999999'
    },
    openedNotification: {
      opacity: 0.6
    },
    separator: {
      height: 1,
      backgroundColor: isDarkMode ? '#333333' : '#E0E0E0',
      marginVertical: 10
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Bell size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} weight="regular" />
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      
      <ScrollView style={styles.notificationList}>
        {allNotifications.map((notification, index) => (
          <View key={notification.id}>
            <TouchableOpacity 
              style={[
                styles.notificationItem, 
                notification.opened && styles.openedNotification
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              {NOTIFICATION_CATEGORIES[notification.category].icon}
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationDescription}>
                  {notification.description}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </TouchableOpacity>
            {index < allNotifications.length - 1 && (
              <View style={styles.separator} />
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

