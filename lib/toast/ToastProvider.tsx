/**
 * ToastProvider Component
 * 
 * This component provides the necessary context for toast notifications on Web.
 * It should be included at the root of your app when running on Web platform.
 * 
 * On React Native, this component is not needed as burnt handles toasts natively.
 */

import React from 'react';
import { Platform } from 'react-native';

// Only import and use Toaster on web
let Toaster: any = null;
if (Platform.OS === 'web') {
  Toaster = require('react-hot-toast').Toaster;
}

export interface ToastProviderProps {
  children: React.ReactNode;
  /**
   * Configuration options for the Toaster (Web only)
   */
  toasterOptions?: {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    reverseOrder?: boolean;
    gutter?: number;
    containerClassName?: string;
    containerStyle?: React.CSSProperties;
    toastOptions?: {
      duration?: number;
      style?: React.CSSProperties;
      className?: string;
      icon?: string;
      iconTheme?: {
        primary?: string;
        secondary?: string;
      };
      ariaProps?: {
        role?: string;
        'aria-live'?: 'polite' | 'assertive' | 'off';
      };
    };
  };
}

/**
 * ToastProvider component that sets up the toast notification system for Web.
 * 
 * Usage:
 * ```tsx
 * // In your root component or App.tsx
 * import { ToastProvider } from '@/lib/toast/ToastProvider';
 * 
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourAppContent />
 *     </ToastProvider>
 *   );
 * }
 * ```
 * 
 * On React Native, this component simply renders its children without any additional setup.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  toasterOptions 
}) => {
  // On native platforms, just render children
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // On web, render the Toaster component alongside children
  return (
    <>
      {children}
      {Toaster && (
        <Toaster
          position={toasterOptions?.position || 'bottom-center'}
          reverseOrder={toasterOptions?.reverseOrder || false}
          gutter={toasterOptions?.gutter || 8}
          containerClassName={toasterOptions?.containerClassName || ''}
          containerStyle={toasterOptions?.containerStyle || {}}
          toastOptions={{
            duration: toasterOptions?.toastOptions?.duration || 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              ...toasterOptions?.toastOptions?.style,
            },
            className: toasterOptions?.toastOptions?.className || '',
            icon: toasterOptions?.toastOptions?.icon,
            iconTheme: {
              primary: toasterOptions?.toastOptions?.iconTheme?.primary || '#fff',
              secondary: toasterOptions?.toastOptions?.iconTheme?.secondary || '#333',
            },
            ariaProps: {
              role: toasterOptions?.toastOptions?.ariaProps?.role || 'status',
              'aria-live': toasterOptions?.toastOptions?.ariaProps?.['aria-live'] || 'polite',
            },
            // Custom styles for different toast types
            success: {
              style: {
                background: '#10b981',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
            loading: {
              style: {
                background: '#6b7280',
                color: '#fff',
              },
            },
          } as any}
        />
      )}
    </>
  );
};

// Export a hook to check if ToastProvider is needed (for conditional rendering)
export const useRequiresToastProvider = () => Platform.OS === 'web';

export default ToastProvider;
