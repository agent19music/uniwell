import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
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

// New functions for library notifications

/**
 * Notify user about new content in the library
 * @param userId User ID to notify
 * @param resource The new resource that was added
 * @param userPreferences User preferences for personalization
 */
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
    // Check if this content matches user preferences
    let isRelevant = true;
    let personalizedReason = '';
    
    if (userPreferences) {
      // If we have user preferences, check if this content is relevant
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
    
    // Only notify if content is relevant or if no preferences are set
    if (isRelevant) {
      // Create in-app notification
      const notificationTitle = 'New in Your Library';
      const notificationBody = personalizedReason 
        ? `${personalizedReason}: "${resource.title}"`
        : `New ${resource.content_type}: "${resource.title}"`;
      
      await createInAppNotification(
        userId,
        notificationTitle,
        notificationBody,
        'library'
      );
      
      // Schedule local notification if user has push token
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_token, notification_preferences')
        .eq('id', userId)
        .single();
      
      if (profile?.push_token && 
          (!profile.notification_preferences || 
           profile.notification_preferences.library !== false)) {
        
        await scheduleLocalNotification(
          notificationTitle,
          notificationBody,
          { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 }
        );
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error sending library notification:', error);
    return false;
  }
}

/**
 * Send a weekly digest of new library content
 * @param userId User ID to notify
 * @param resources Array of new resources added this week
 * @param streaks User's active streaks for personalization
 */
export async function sendWeeklyLibraryDigest(
  userId: string,
  resources: Array<{
    id: string;
    title: string;
    content_type: string;
    categories: string[];
    tags: string[];
  }>,
  streaks?: Array<{
    habitId: string;
    streak: number;
    type: string;
  }>
) {
  try {
    if (resources.length === 0) return false;
    
    // Get user preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token, notification_preferences, interests')
      .eq('id', userId)
      .single();
    
    // Check if user wants weekly digests
    if (profile?.notification_preferences?.weekly_digest === false) {
      return false;
    }
    
    // Personalize based on streaks if available
    let personalizedIntro = 'Here\'s your weekly content update';
    let highlightedResources = resources;
    
    if (streaks && streaks.length > 0) {
      // Find the streak with the highest count
      const topStreak = [...streaks].sort((a, b) => b.streak - a.streak)[0];
      
      if (topStreak) {
        personalizedIntro = `To support your ${topStreak.streak}-day ${topStreak.habitId} streak`;
        
        // Filter resources that might be relevant to the top streak
        const streakKeywords = topStreak.habitId.toLowerCase().split(' ');
        
        // Find resources that match the streak keywords
        const relevantResources = resources.filter(resource => {
          const resourceText = `${resource.title} ${resource.tags?.join(' ')}`.toLowerCase();
          return streakKeywords.some(keyword => resourceText.includes(keyword));
        });
        
        if (relevantResources.length > 0) {
          highlightedResources = relevantResources;
        }
      }
    }
    
    // Create notification content
    const title = 'Your Weekly Library Update';
    const body = `${personalizedIntro}, we've added ${resources.length} new items to your library this week.`;
    
    // Create in-app notification with more details
    let detailedDescription = body + '\n\nHighlights:';
    highlightedResources.slice(0, 3).forEach(resource => {
      detailedDescription += `\n• ${resource.title} (${resource.content_type})`;
    });
    
    if (highlightedResources.length > 3) {
      detailedDescription += '\n\nAnd more...';
    }
    
    await createInAppNotification(
      userId,
      title,
      detailedDescription,
      'digest'
    );
    
    // Send push notification if user has token
    if (profile?.push_token) {
      await scheduleLocalNotification(
        title,
        body,
        { 
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          weekday: 1, // Monday
          hour: 9,    // 9 AM
          minute: 0,
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error sending weekly digest:', error);
    return false;
  }
}