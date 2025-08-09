/**
 * Unified Toast Utility Module
 * 
 * This module provides a consistent API for showing toast notifications
 * across both React Native and Web platforms.
 * 
 * - React Native: Uses `burnt` for native toast notifications
 * - Web: Uses `react-hot-toast` for toast notifications
 */

import { Platform } from 'react-native';

// Type definitions for toast options
export interface ToastOptions {
  /** Toast title (main message) */
  title?: string;
  /** Toast message/description (subtitle) */
  message?: string;
  /** Duration in milliseconds (web only) */
  duration?: number;
  /** Icon to display (web only) */
  icon?: string;
  /** Preset style for the toast */
  preset?: 'done' | 'error' | 'none' | 'custom' | 'heart';
  /** Haptic feedback setting (native only) */
  haptic?: 'success' | 'warning' | 'error' | 'none';
  /** Custom layout for native (iOS only) */
  layout?: {
    iconSize?: { height: number; width: number };
  };
  /** Position on screen (web only) */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

// Type for the unified toast function
export type ToastFunction = {
  (message: string, options?: Omit<ToastOptions, 'message'>): void;
  (options: ToastOptions): void;
  success: (message: string, options?: Omit<ToastOptions, 'message' | 'preset'>) => void;
  error: (message: string, options?: Omit<ToastOptions, 'message' | 'preset'>) => void;
  loading: (message: string, options?: Omit<ToastOptions, 'message'>) => string | void;
  dismiss: (toastId?: string) => void;
  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: Omit<ToastOptions, 'message'>
  ) => Promise<T>;
};

// Platform-specific implementations
let toastImplementation: ToastFunction;

if (Platform.OS === 'web') {
  // Web implementation using react-hot-toast
  const hotToast = require('react-hot-toast').default;
  
  toastImplementation = Object.assign(
    function toast(messageOrOptions: string | ToastOptions, options?: Omit<ToastOptions, 'message'>): void {
      if (typeof messageOrOptions === 'string') {
        // Simple string message
        const message = messageOrOptions;
        const toastOptions = {
          duration: options?.duration || 4000,
          position: options?.position || 'bottom-center',
          icon: options?.icon,
        };
        
        if (options?.preset === 'error') {
          hotToast.error(message, toastOptions);
        } else if (options?.preset === 'done') {
          hotToast.success(message, toastOptions);
        } else {
          hotToast(message, toastOptions);
        }
      } else {
        // Full options object
        const { title, message, preset, duration = 4000, position = 'bottom-center', icon } = messageOrOptions;
        const displayMessage = title && message ? `${title}\n${message}` : title || message || '';
        
        const toastOptions = {
          duration,
          position,
          icon,
        };
        
        if (preset === 'error') {
          hotToast.error(displayMessage, toastOptions);
        } else if (preset === 'done') {
          hotToast.success(displayMessage, toastOptions);
        } else {
          hotToast(displayMessage, toastOptions);
        }
      }
    },
    {
      success: (message: string, options?: Omit<ToastOptions, 'message' | 'preset'>) => {
        hotToast.success(message, {
          duration: options?.duration || 4000,
          position: options?.position || 'bottom-center',
          icon: options?.icon,
        });
      },
      error: (message: string, options?: Omit<ToastOptions, 'message' | 'preset'>) => {
        hotToast.error(message, {
          duration: options?.duration || 4000,
          position: options?.position || 'bottom-center',
          icon: options?.icon,
        });
      },
      loading: (message: string, options?: Omit<ToastOptions, 'message'>) => {
        return hotToast.loading(message, {
          duration: options?.duration || Infinity,
          position: options?.position || 'bottom-center',
        });
      },
      dismiss: (toastId?: string) => {
        if (toastId) {
          hotToast.dismiss(toastId);
        } else {
          hotToast.dismiss();
        }
      },
      promise: async <T,>(
        promise: Promise<T>,
        msgs: {
          loading: string;
          success: string | ((data: T) => string);
          error: string | ((error: any) => string);
        },
        options?: Omit<ToastOptions, 'message'>
      ): Promise<T> => {
        return hotToast.promise(
          promise,
          msgs,
          {
            duration: options?.duration || 4000,
            position: options?.position || 'bottom-center',
          }
        );
      },
    }
  ) as ToastFunction;
} else {
  // React Native implementation using burnt
  const burnt = require('burnt');
  
  toastImplementation = Object.assign(
    function toast(messageOrOptions: string | ToastOptions, options?: Omit<ToastOptions, 'message'>): void {
      if (typeof messageOrOptions === 'string') {
        // Simple string message
        burnt.toast({
          title: messageOrOptions,
          preset: options?.preset || 'none',
          haptic: options?.haptic || 'none',
          layout: options?.layout,
        });
      } else {
        // Full options object
        const { title, message, preset = 'none', haptic = 'none', layout } = messageOrOptions;
        
        burnt.toast({
          title: title || message || '',
          message: title && message ? message : undefined,
          preset,
          haptic,
          layout,
        });
      }
    },
    {
      success: (message: string, options?: Omit<ToastOptions, 'message' | 'preset'>) => {
        burnt.toast({
          title: message,
          preset: 'done',
          haptic: options?.haptic || 'success',
          layout: options?.layout,
        });
      },
      error: (message: string, options?: Omit<ToastOptions, 'message' | 'preset'>) => {
        burnt.toast({
          title: message,
          preset: 'error',
          haptic: options?.haptic || 'error',
          layout: options?.layout,
        });
      },
      loading: (message: string, _options?: Omit<ToastOptions, 'message'>) => {
        // Native doesn't support loading state in the same way
        // Show a regular toast instead
        burnt.toast({
          title: message,
          preset: 'none',
          haptic: 'none',
        });
      },
      dismiss: (_toastId?: string) => {
        // Burnt doesn't support dismissing toasts programmatically
        // This is a no-op on native
      },
      promise: async <T,>(
        promise: Promise<T>,
        msgs: {
          loading: string;
          success: string | ((data: T) => string);
          error: string | ((error: any) => string);
        },
        _options?: Omit<ToastOptions, 'message'>
      ): Promise<T> => {
        // Show loading toast
        burnt.toast({
          title: msgs.loading,
          preset: 'none',
          haptic: 'none',
        });
        
        try {
          const result = await promise;
          // Show success toast
          const successMsg = typeof msgs.success === 'function' ? msgs.success(result) : msgs.success;
          burnt.toast({
            title: successMsg,
            preset: 'done',
            haptic: 'success',
          });
          return result;
        } catch (error) {
          // Show error toast
          const errorMsg = typeof msgs.error === 'function' ? msgs.error(error) : msgs.error;
          burnt.toast({
            title: errorMsg,
            preset: 'error',
            haptic: 'error',
          });
          throw error;
        }
      },
    }
  ) as ToastFunction;
}

// Export the unified toast function
export const toast = toastImplementation;

// Export a helper to check if we're on web
export const isWeb = Platform.OS === 'web';

// Default export for convenience
export default toast;
