# Toast Utility Module

A unified toast notification system that works seamlessly across React Native and Web platforms.

## Features

- **Unified API**: Same interface for both React Native and Web
- **Platform-specific implementations**: 
  - React Native: Uses `burnt` for native toast notifications
  - Web: Uses `react-hot-toast` for browser toast notifications
- **TypeScript support**: Fully typed for better developer experience
- **Rich API**: Support for success, error, loading states, and promises
- **Optimized Bundle Size**: Native platforms use minimal adapters that directly expose `burnt`

## Installation

The required dependencies are already included in the project:
- `burnt` for React Native
- `react-hot-toast` for Web

## Setup

### For Web Platform

When running on web, you need to wrap your app with the `ToastProvider`:

```tsx
// In your root component or App.tsx
import { ToastProvider } from '@/lib/toast/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <YourAppContent />
    </ToastProvider>
  );
}
```

### For React Native

No additional setup required! The toast module works out of the box on React Native.

## Usage

### Basic Usage

```tsx
import { toast } from '@/lib/toast';

// Simple toast
toast('Hello World!');

// Toast with options
toast('Operation completed', { 
  preset: 'done',
  duration: 3000 // Web only
});

// Using the options object
toast({
  title: 'Success',
  message: 'Your profile has been updated',
  preset: 'done'
});
```

### Success and Error Toasts

```tsx
import { toast } from '@/lib/toast';

// Success toast
toast.success('Profile saved successfully!');

// Error toast
toast.error('Failed to save profile');

// With additional options
toast.success('Upload complete', {
  duration: 5000, // Web only
  position: 'top-right' // Web only
});
```

### Loading States (Web only)

```tsx
import { toast } from '@/lib/toast';

// Show loading toast
const toastId = toast.loading('Processing...');

// Later, dismiss it
toast.dismiss(toastId);
```

### Promise-based Toasts

```tsx
import { toast } from '@/lib/toast';

// Automatically shows loading, success, or error based on promise resolution
await toast.promise(
  saveUserProfile(data),
  {
    loading: 'Saving profile...',
    success: 'Profile saved!',
    error: 'Failed to save profile'
  }
);

// With dynamic messages
await toast.promise(
  fetchUserData(userId),
  {
    loading: 'Loading user data...',
    success: (data) => `Welcome back, ${data.name}!`,
    error: (err) => `Error: ${err.message}`
  }
);
```

## API Reference

### Toast Options

```typescript
interface ToastOptions {
  title?: string;              // Toast title (main message)
  message?: string;            // Toast subtitle
  duration?: number;           // Duration in ms (Web only)
  icon?: string;              // Icon to display (Web only)
  preset?: 'done' | 'error' | 'none' | 'custom' | 'heart';
  haptic?: 'success' | 'warning' | 'error' | 'none'; // Native only
  layout?: {                  // Native iOS only
    iconSize?: { height: number; width: number };
  };
  position?: 'top-left' | 'top-center' | 'top-right' | 
             'bottom-left' | 'bottom-center' | 'bottom-right'; // Web only
}
```

### Toast Methods

- `toast(message: string, options?: ToastOptions)` - Show a basic toast
- `toast(options: ToastOptions)` - Show a toast with full options
- `toast.success(message: string, options?: ToastOptions)` - Show success toast
- `toast.error(message: string, options?: ToastOptions)` - Show error toast
- `toast.loading(message: string, options?: ToastOptions)` - Show loading toast (Web only)
- `toast.dismiss(toastId?: string)` - Dismiss a toast (Web only)
- `toast.promise(promise, messages, options?)` - Handle async operations with toasts

## Architecture

### Platform-Specific File Resolution

The toast module uses React Native's platform-specific file extensions for optimal bundle size:

```
lib/toast/
├── index.ts           # Fallback/unified implementation
├── index.web.ts       # Web adapter (react-hot-toast with alias)
├── index.ios.ts       # iOS native adapter (burnt direct export)
├── index.android.ts   # Android native adapter (burnt direct export)
├── ToastProvider.tsx  # Fallback/unified provider
├── ToastProvider.web.tsx    # Web provider with Toaster
├── ToastProvider.ios.tsx    # iOS no-op provider
└── ToastProvider.android.tsx # Android no-op provider
```

**Native Adapters (iOS/Android)**:
- Directly export `burnt` library as `toast`
- ToastProvider is a no-op component (returns children)
- Minimal wrapper code = smaller bundle size
- No web dependencies included in native builds

**Web Adapter (index.web.ts)**:
- Uses `react-hot-toast` with spread operator to preserve all methods
- Includes `show` alias (`toast.show()`) for compatibility
- Prevents ReactCurrentDispatcher runtime error by never importing `burnt`
- ToastProvider renders the Toaster component with `position="top-center"`

## Platform Differences

| Feature | React Native | Web |
|---------|-------------|-----|
| Basic toasts | ✅ | ✅ |
| Success/Error presets | ✅ | ✅ |
| Loading state | ⚠️ Shows as regular toast | ✅ |
| Dismiss programmatically | ❌ | ✅ |
| Duration control | ❌ | ✅ |
| Position control | ❌ | ✅ |
| Haptic feedback | ✅ | ❌ |
| Custom icons | ❌ | ✅ |

## Migration Guide

### From direct `burnt` usage:

```tsx
// Before
import * as burnt from 'burnt';
burnt.toast({
  title: 'Hello',
  preset: 'done'
});

// After
import { toast } from '@/lib/toast';
toast('Hello', { preset: 'done' });
```

### From direct `react-hot-toast` usage:

```tsx
// Before
import toast from 'react-hot-toast';
toast.success('Success!');

// After
import { toast } from '@/lib/toast';
toast.success('Success!');
```

## Examples

### Authentication Flow

```tsx
import { toast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';

async function handleLogin(email: string, password: string) {
  try {
    await toast.promise(
      supabase.auth.signInWithPassword({ email, password }),
      {
        loading: 'Signing in...',
        success: 'Welcome back!',
        error: (err) => err.message || 'Failed to sign in'
      }
    );
    // Navigate to home
  } catch (error) {
    // Error is already shown by toast.promise
  }
}
```

### Form Submission

```tsx
import { toast } from '@/lib/toast';

async function handleSubmit(formData: FormData) {
  if (!formData.isValid) {
    toast.error('Please fill in all required fields');
    return;
  }

  try {
    await saveData(formData);
    toast.success('Data saved successfully!');
  } catch (error) {
    toast.error('Failed to save data. Please try again.');
  }
}
```

### File Upload

```tsx
import { toast } from '@/lib/toast';

async function handleFileUpload(file: File) {
  const uploadPromise = uploadFile(file);
  
  await toast.promise(uploadPromise, {
    loading: `Uploading ${file.name}...`,
    success: `${file.name} uploaded successfully!`,
    error: `Failed to upload ${file.name}`
  });
}
```

## Best Practices

1. **Keep messages concise**: Toast messages should be brief and actionable
2. **Use appropriate presets**: Use 'done' for success, 'error' for failures
3. **Consider platform**: Remember that some features are platform-specific
4. **Avoid toast spam**: Don't show multiple toasts for the same action
5. **Provide context**: Include enough information for users to understand what happened

## Troubleshooting

### Toasts not showing on Web
- Ensure `ToastProvider` is wrapped around your app
- Check that you're importing from the correct path

### TypeScript errors
- Make sure to import types from the toast module
- Use the provided `ToastOptions` interface for custom configurations

### Platform-specific features not working
- Check the platform differences table above
- Use feature detection or platform checks when necessary

## Contributing

When adding new features or modifying the toast module:
1. Ensure compatibility with both platforms
2. Update types in `index.ts`
3. Update this documentation
4. Test on both React Native and Web platforms
