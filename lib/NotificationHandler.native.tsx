/**
 * Native Notification Handler
 * 
 * Provides notification functionality for iOS and Android platforms
 * using expo-notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase.native';
import * as burnt from 'burnt';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF7F50',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    burnt.toast({
      title: 'Notification Permission',
      message: 'Enable notifications to stay on track with your goals',
      preset: 'done',
    });
    return;
  }

  const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;

  if (!projectId) {
    console.error('EXPO_PUBLIC_PROJECT_ID is not defined in the environment.');
    return;
  }

  const pushToken = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  token = pushToken.data;

  // Save token to user profile
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);
    }
  } catch (error) {
    console.error('Error saving push token:', error);
  }

  return token;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput | null = null
) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      badge: 1,
    },
    trigger,
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function createInAppNotification(
  userId: string,
  title: string,
  description: string,
  category: string
) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        description,
        category,
        is_read: false
      })
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating in-app notification:', error);
    return null;
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function getUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// Library notification functions
export async function notifyAboutNewLibraryContent(
  userId: string,
  resource: {
    id: string;
    title: string;
    description: string;
    content_type: string;
    categories?: string[];
    tags?: string[];
  },
  userPreferences?: {
    categories?: string[];
    tags?: string[];
  }
) {
  try {
    let isRelevant = true;
    let personalizedReason = '';
    
    if (userPreferences) {
      const hasMatchingCategory = resource.categories?.some(
        cat => userPreferences.categories?.includes(cat)
      ) ?? false;
      
      const hasMatchingTag = resource.tags?.some(
        tag => userPreferences.tags?.includes(tag)
      ) ?? false;
      
      isRelevant = hasMatchingCategory || hasMatchingTag;
      
      if (hasMatchingCategory) {
        personalizedReason = 'Based on your interests';
      } else if (hasMatchingTag) {
        personalizedReason = 'Related to topics you follow';
      }
    }
    
    if (isRelevant) {
      const notificationTitle = 'New in Your Library';
      const notificationBody = personalizedReason 
        ? `${personalizedReason}: ${resource.title}`
        : `Check out: ${resource.title}`;
      
      // Schedule immediate notification
      await scheduleLocalNotification(notificationTitle, notificationBody);
      
      // Also create in-app notification
      return await createInAppNotification(
        userId,
        notificationTitle,
        notificationBody,
        'library'
      );
    }
  } catch (error) {
    console.error('Error notifying about new library content:', error);
    return null;
  }
}
