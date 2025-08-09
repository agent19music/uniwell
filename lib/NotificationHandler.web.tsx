/**
 * Web Notification Handler
 * 
 * Provides notification functionality for web platform using browser APIs
 * and toast notifications as fallback
 */

import { toast } from './toast/index.web';
import { supabase } from './supabase.web';

// Web implementation uses browser Notification API
export async function registerForPushNotificationsAsync() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return null;
  }

  if (Notification.permission === 'granted') {
    return 'web-notification-enabled';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return 'web-notification-enabled';
    }
  }

  return null;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: any = null
) {
  // On web, we'll use browser notifications if available
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon.png', // You can customize this
      badge: '/badge.png',
    });
  } else {
    // Fallback to toast notifications
    toast(body, { title });
  }
}

export async function cancelAllNotifications() {
  // Web doesn't have a direct way to cancel all notifications
  // This is a no-op on web
  console.log('Cancelling all notifications is not supported on web');
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

// Library notification functions (same for both platforms)
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
      
      // Use toast for immediate feedback on web
      toast.success(notificationBody, { title: notificationTitle });
      
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
