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
    <Toaster position="top-center" />
  </>
);

export default ToastProvider;
