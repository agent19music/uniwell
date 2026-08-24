// @ts-nocheck — leftover burnt adapter superseded by lib/toast/index.ts
/**
 * Cross-platform toast utility using burnt
 * 
 * This module provides a simple wrapper around burnt that works on all platforms:
 * - On Web: Uses burnt/web (which uses sonner under the hood)
 * - On React Native: Uses burnt native implementation
 */

import * as Burnt from 'burnt';

// Type definitions for toast options  
export interface ToastOptions {
  duration?: number;
  preset?: 'done' | 'error' | 'none' | 'custom';
  message?: string;
  haptic?: 'none' | 'success' | 'warning' | 'error';
}

/**
 * Show a success toast notification
 */
export const success = (title: string, options?: Omit<ToastOptions, 'preset'>) => {
  return Burnt.toast({
    title,
    preset: 'done',
    duration: (options?.duration || 4000) / 1000, // burnt expects seconds
    message: options?.message,
    haptic: options?.haptic || 'success',
  });
};

/**
 * Show an error toast notification
 */
export const error = (title: string, options?: Omit<ToastOptions, 'preset'>) => {
  return Burnt.toast({
    title,
    preset: 'error',
    duration: (options?.duration || 4000) / 1000, // burnt expects seconds
    message: options?.message,
    haptic: options?.haptic || 'error',
  });
};

/**
 * Show a loading toast notification
 */
export const loading = (title: string, options?: Omit<ToastOptions, 'preset'>) => {
  return Burnt.toast({
    title,
    preset: 'none', // use none preset for loading
    duration: (options?.duration || 4000) / 1000, // burnt expects seconds
    message: options?.message,
    haptic: options?.haptic || 'none',
  });
};

/**
 * Show a regular toast notification
 */
export const show = (title: string, options?: ToastOptions) => {
  return Burnt.toast({
    title,
    preset: options?.preset || 'none',
    duration: (options?.duration || 4000) / 1000, // burnt expects seconds
    message: options?.message,
    haptic: options?.haptic || 'none',
  });
};

/**
 * Dismiss all alerts
 */
export const dismissAll = () => {
  return Burnt.dismissAllAlerts();
};

/**
 * Show an alert (iOS native alert, falls back to toast on Android)
 */
export const alert = (title: string, options?: ToastOptions) => {
  return Burnt.alert({
    title,
    preset: options?.preset || 'none',
    duration: (options?.duration || 4000) / 1000, // burnt expects seconds
    message: options?.message,
  });
};

// Create a callable object that functions like the original toast
const createToastFunction = () => {
  const toastFn = (title: string, options?: ToastOptions) => show(title, options);
  
  // Add methods to the function
  toastFn.success = success;
  toastFn.error = error;
  toastFn.loading = loading;
  toastFn.show = show;
  toastFn.alert = alert;
  toastFn.dismissAll = dismissAll;
  
  return toastFn;
};

// Default export with all methods
export const toast = createToastFunction();

export default toast;