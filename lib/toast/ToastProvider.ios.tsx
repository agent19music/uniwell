/**
 * iOS ToastProvider Component
 * 
 * No-op wrapper for iOS platform.
 * Toast notifications are handled natively by burnt, so no provider is needed.
 * This component simply renders its children without any wrapper.
 */

import React from 'react';

export interface ToastProviderProps {
  children: React.ReactNode;
  toasterOptions?: any; // Included for API compatibility, but unused on iOS
}

/**
 * ToastProvider for iOS - A no-op component that just renders children.
 * 
 * Since burnt handles toasts natively on iOS, no provider setup is needed.
 * This component exists for API compatibility with web implementation.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  // Direct passthrough - no wrapper needed
  return <>{children}</>;
};

// Export a hook to check if ToastProvider is needed (always false on iOS)
export const useRequiresToastProvider = () => false;

export default ToastProvider;
