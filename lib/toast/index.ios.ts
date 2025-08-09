/**
 * iOS Toast Implementation
 * 
 * Native adapter for iOS platform using burnt library.
 * This preserves the existing API while keeping bundle size minimal.
 */

import Toast from 'burnt';

// Export burnt directly as the toast implementation
export const toast = Toast;

// Type definitions matching the main index.ts for consistency
export interface ToastOptions {
  title?: string;
  message?: string;
  duration?: number;
  icon?: string;
  preset?: 'done' | 'error' | 'none' | 'custom' | 'heart';
  haptic?: 'success' | 'warning' | 'error' | 'none';
  layout?: {
    iconSize?: { height: number; width: number };
  };
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

// Export type for consistency
export type ToastFunction = typeof Toast;

// Platform indicator
export const isWeb = false;

// Default export
export default toast;
