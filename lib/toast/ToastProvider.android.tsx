/**
 * Android ToastProvider Component
 * 
 * No-op wrapper for Android platform.
 * Toast notifications are handled natively by burnt, so no provider is needed.
 * This component simply renders its children without any wrapper.
 */

import React from 'react';

export interface ToastProviderProps {
  children: React.ReactNode;
  toasterOptions?: any; // Included for API compatibility, but unused on Android
}

/**
 * ToastProvider for Android - A no-op component that just renders children.
 * 
 * Since burnt handles toasts natively on Android, no provider setup is needed.
 * This component exists for API compatibility with web implementation.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  // Direct passthrough - no wrapper needed
  return <>{children}</>;
};

// Export a hook to check if ToastProvider is needed (always false on Android)
export const useRequiresToastProvider = () => false;

export default ToastProvider;
