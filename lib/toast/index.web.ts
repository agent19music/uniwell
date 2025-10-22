/**
 * Web Toast Adapter
 * 
 * This module provides toast notifications for web platform using react-hot-toast.
 * The alias `show` ensures compatibility and prevents the ReactCurrentDispatcher
 * runtime error by ensuring we never import burnt on web.
 */

import { toast as hotToast, Toaster } from 'react-hot-toast';

// Create toast object with spread of hotToast and alias
export const toast = {
  ...hotToast,
  show: hotToast  // alias so `toast.show()` still works
};

// Export the Toaster component for use in ToastProvider
export { Toaster };

// Default export for convenience
export default toast;
