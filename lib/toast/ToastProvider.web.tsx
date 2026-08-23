/**
 * Web ToastProvider Component
 * 
 * This component provides the toast notification context for web platform.
 * It uses react-hot-toast's Toaster component to display toasts.
 * The alias prevents the ReactCurrentDispatcher runtime error by ensuring 
 * we never import burnt on web.
 */

import React from 'react';
import { Toaster } from 'react-hot-toast';

export interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * ToastProvider component that sets up the toast notification system for Web.
 * 
 * Usage:
 * ```tsx
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
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => (
  <>
    {children}
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '14px',
          fontFamily: 'SF-Regular, system-ui, sans-serif',
          maxWidth: '360px',
        },
        success: { duration: 4000 },
        // react-hot-toast's stock renderer has no explicit dismiss control; use a
        // long, finite duration until action/error toasts move to the UI Toast host.
        error: { duration: 8000 },
      }}
    />
  </>
);

export default ToastProvider;
