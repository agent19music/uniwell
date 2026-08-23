import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Repeat, Fire, Trophy, Bell, BellSlash } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { getUserNotifications, markNotificationAsRead } from '../lib/NotificationHandler';
import { SafeText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { BackAction } from '@/components/ui/Navigation';
import { LoadingState } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface Notification {
  id: string;
  title: string;
  description: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (isRefresh = false) => {
    try {
      setError(false);
      if (!isRefresh) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const notificationsData = await getUserNotifications(user.id);
        setNotifications(notificationsData as Notification[]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, is_read: true } : n
      ));
    }
    
    // Navigate based on notification category
    switch (notification.category) {
      case 'profile':
        router.push('/profile-completion');
        break;
      case 'habit':
        router.push('/(tabs)/habits');
        break;
      case 'streak':
        router.push('/(tabs)/routines');
        break;
      case 'achievement':
        router.push('/achievements');
        break;
      default:
        // Just stay on the notifications screen
        break;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const formattedDate = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    
    const iconColor = colors.accent;
    const getNotifIcon = () => {
      switch (item.category) {
        case 'profile': return <User size={24} color={iconColor} weight="regular" />;
        case 'habit': return <Repeat size={24} color={iconColor} weight="regular" />;
        case 'streak': return <Fire size={24} color={iconColor} weight="regular" />;
        case 'achievement': return <Trophy size={24} color={iconColor} weight="regular" />;
        default: return <Bell size={24} color={iconColor} weight="regular" />;
      }
    };
    
    return (
      <Card
        accessibilityLabel={`${item.is_read ? '' : 'Unread '}notification: ${item.title}`}
        contentStyle={styles.notificationItem}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.is_read ? colors.surfacePressed : colors.dangerSurface }]}>
          {getNotifIcon()}
        </View>
        <View style={styles.notificationContent}>
          <SafeText variant="bodyStrong" style={!item.is_read && styles.unreadText}>
            {item.title}
          </SafeText>
          <SafeText variant="caption" color={colors.textSecondary}>
            {item.description}
          </SafeText>
          <SafeText variant="caption" color={colors.textMuted}>{formattedDate}</SafeText>
        </View>
        {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.canvas }]} edges={['top']}>
      <View style={styles.header}>
        <BackAction onPress={() => router.back()} />
        <SafeText variant="heading">Notifications</SafeText>
        <View style={styles.placeholder} />
      </View>

      {loading && !refreshing ? (
        <LoadingState label="Loading notifications…" style={styles.state} />
      ) : error ? (
        <ErrorState
          title="Couldn’t load notifications"
          description="Check your connection and try again."
          action={<Button label="Try again" onPress={() => fetchNotifications()} />}
          style={styles.state}
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="You’re all caught up"
          description="Important updates and achievements will appear here."
          icon={<BellSlash size={48} color={colors.textMuted} weight="regular" />}
          style={styles.state}
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.field,
    paddingVertical: spacing.micro,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  placeholder: {
    width: 48,
  },
  listContainer: {
    padding: spacing.field,
    gap: spacing.micro,
  },
  notificationItem: {
    flexDirection: 'row',
    gap: spacing.macro,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: spacing.optical,
  },
  unreadText: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: spacing.optical,
  },
  state: {
    flex: 1,
  },
});