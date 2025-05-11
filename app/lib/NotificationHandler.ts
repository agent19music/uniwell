import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification settings with proper typing
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF7F50',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    })).data;
  } else {
    console.log('Must use physical device for push notifications');
  }

  return token;
}

// Function to schedule a local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {},
  trigger: Notifications.NotificationTriggerInput = null,
  identifier: string = `notification-${Date.now()}`
) {
  // Request permissions if needed
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') {
      console.log('Failed to get notification permission');
      return;
    }
  }

  // Schedule the notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      color: '#FF7F50',
    },
    trigger,
    identifier,
  });

  return identifier;
}

// Function to cancel a notification by ID
export async function cancelScheduledNotification(identifier: string) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

// Function to cancel all notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Function to get all scheduled notifications
export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Function to handle notification response
export function setNotificationResponseHandler(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

// Helper function to create common notification triggers
export const NotificationTriggers = {
  // Immediate notification
  immediate: null,
  
  // Notification after certain seconds
  seconds: (seconds: number) => ({ seconds }),
  
  // Notification at a specific time
  dateTime: (date: Date) => date,
  
  // Daily notification at specific time
  daily: (hour: number, minute: number = 0) => ({
    hour,
    minute,
    repeats: true,
  }),
  
  // Weekly notification
  weekly: (weekday: number, hour: number, minute: number = 0) => ({
    weekday,
    hour,
    minute,
    repeats: true,
  }),
};

// Dummy component to satisfy Expo Router's default export requirement
export default function NotificationHandler() {
  return null;
}
