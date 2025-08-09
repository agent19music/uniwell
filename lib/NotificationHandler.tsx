/**
 * Notification Handler Module
 * 
 * This module provides platform-specific notification implementations.
 * Expo's metro bundler will automatically select the correct version:
 * - NotificationHandler.web.tsx for web platform
 * - NotificationHandler.native.tsx for iOS and Android
 * 
 * This file serves as a fallback for environments that don't support
 * platform-specific extensions.
 */

import { Platform } from 'react-native';

// Conditionally import based on platform
const isWeb = Platform.OS === 'web';

// Use dynamic imports to ensure proper bundling
let notificationModule: any;

if (isWeb) {
  // Web implementation
  notificationModule = require('./NotificationHandler.web');
} else {
  // Native implementation
  notificationModule = require('./NotificationHandler.native');
}

// Re-export all functions from the platform-specific module
export const registerForPushNotificationsAsync = notificationModule.registerForPushNotificationsAsync;
export const scheduleLocalNotification = notificationModule.scheduleLocalNotification;
export const cancelAllNotifications = notificationModule.cancelAllNotifications;
export const createInAppNotification = notificationModule.createInAppNotification;
export const markNotificationAsRead = notificationModule.markNotificationAsRead;
export const getUserNotifications = notificationModule.getUserNotifications;
export const notifyAboutNewLibraryContent = notificationModule.notifyAboutNewLibraryContent;
