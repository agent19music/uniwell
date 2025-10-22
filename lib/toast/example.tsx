/**
 * Toast Module Usage Examples
 * 
 * This file demonstrates various ways to use the unified toast module
 * across React Native and Web platforms.
 */

import React from 'react';
import { View, Button, Text, Platform } from 'react-native';
import { toast } from './index';
import { ToastProvider } from './ToastProvider';

/**
 * Example component showing different toast usage patterns
 */
export const ToastExamples: React.FC = () => {
  // Simulate an async operation
  const simulateAsyncOperation = (shouldSucceed: boolean = true): Promise<any> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldSucceed) {
          resolve({ message: 'Operation completed successfully', data: { id: 123 } });
        } else {
          reject(new Error('Operation failed due to network error'));
        }
      }, 2000);
    });
  };

  // Example: Basic toast
  const showBasicToast = () => {
    toast('This is a basic toast message');
  };

  // Example: Toast with title and message
  const showDetailedToast = () => {
    toast({
      title: 'Notification',
      message: 'You have a new message in your inbox',
      preset: 'none',
    });
  };

  // Example: Success toast
  const showSuccessToast = () => {
    toast.success('Profile updated successfully!');
  };

  // Example: Error toast
  const showErrorToast = () => {
    toast.error('Failed to upload image. Please try again.');
  };

  // Example: Loading toast (Web only)
  const showLoadingToast = () => {
    if (Platform.OS === 'web') {
      const loadingToastId = toast.loading('Processing your request...');
      
      // Simulate completion after 3 seconds
      setTimeout(() => {
        toast.dismiss(loadingToastId);
        toast.success('Request processed!');
      }, 3000);
    } else {
      // On native, show a regular toast since loading is not supported
      toast('Processing your request...');
      setTimeout(() => {
        toast.success('Request processed!');
      }, 3000);
    }
  };

  // Example: Promise-based toast (success case)
  const showPromiseToastSuccess = async () => {
    try {
      const result = await toast.promise(
        simulateAsyncOperation(true),
        {
          loading: 'Saving your changes...',
          success: (data) => `Saved! ID: ${data.data.id}`,
          error: (err) => `Error: ${err.message}`,
        }
      );
      console.log('Operation result:', result);
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  // Example: Promise-based toast (error case)
  const showPromiseToastError = async () => {
    try {
      await toast.promise(
        simulateAsyncOperation(false),
        {
          loading: 'Attempting to connect...',
          success: 'Connected successfully!',
          error: 'Connection failed. Please check your internet.',
        }
      );
    } catch (error) {
      // Error is already displayed by toast.promise
      console.error('Expected error:', error);
    }
  };

  // Example: Platform-specific options
  const showPlatformSpecificToast = () => {
    if (Platform.OS === 'web') {
      // Web-specific options
      toast.success('This toast appears at the top!', {
        duration: 5000,
        position: 'top-center',
      });
    } else {
      // Native-specific options
      toast({
        title: 'Haptic Feedback',
        message: 'You should feel a vibration',
        preset: 'done',
        haptic: 'success',
      });
    }
  };

  // Example: Custom preset toasts
  const showCustomPresetToast = () => {
    toast({
      title: '❤️ Liked!',
      message: 'Added to your favorites',
      preset: 'heart', // Special preset for native
    });
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Toast Examples
      </Text>

      <View style={{ gap: 10 }}>
        <Button title="Basic Toast" onPress={showBasicToast} />
        <Button title="Detailed Toast" onPress={showDetailedToast} />
        <Button title="Success Toast" onPress={showSuccessToast} />
        <Button title="Error Toast" onPress={showErrorToast} />
        <Button title="Loading Toast (Web Only)" onPress={showLoadingToast} />
        <Button title="Promise Toast (Success)" onPress={showPromiseToastSuccess} />
        <Button title="Promise Toast (Error)" onPress={showPromiseToastError} />
        <Button title="Platform Specific" onPress={showPlatformSpecificToast} />
        <Button title="Custom Preset" onPress={showCustomPresetToast} />
      </View>

      <Text style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        Platform: {Platform.OS}
      </Text>
    </View>
  );
};

/**
 * Example App component showing how to set up ToastProvider for Web
 */
export const ExampleApp: React.FC = () => {
  // The app content
  const AppContent = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ToastExamples />
    </View>
  );

  // On Web, wrap with ToastProvider
  if (Platform.OS === 'web') {
    return (
      <ToastProvider
        toasterOptions={{
          position: 'bottom-center',
          toastOptions: {
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '16px',
            },
          },
        }}
      >
        <AppContent />
      </ToastProvider>
    );
  }

  // On Native, no provider needed
  return <AppContent />;
};

/**
 * Migration example: Converting from direct burnt usage
 */
export const MigrationFromBurnt = () => {
  // OLD WAY (direct burnt usage)
  // import * as burnt from 'burnt';
  // const showOldToast = () => {
  //   burnt.toast({
  //     title: 'Hello',
  //     message: 'This is the old way',
  //     preset: 'done',
  //   });
  // };

  // NEW WAY (unified toast module)
  const showNewToast = () => {
    toast({
      title: 'Hello',
      message: 'This is the new unified way',
      preset: 'done',
    });
  };

  return <Button title="Show Toast (New Way)" onPress={showNewToast} />;
};

/**
 * Migration example: Converting from direct react-hot-toast usage
 */
export const MigrationFromReactHotToast = () => {
  // OLD WAY (direct react-hot-toast usage)
  // import hotToast from 'react-hot-toast';
  // const showOldToast = () => {
  //   hotToast.success('Success!', {
  //     duration: 5000,
  //     position: 'top-right',
  //   });
  // };

  // NEW WAY (unified toast module)
  const showNewToast = () => {
    toast.success('Success!', {
      duration: 5000, // Only works on web
      position: 'top-right', // Only works on web
    });
  };

  return <Button title="Show Success Toast" onPress={showNewToast} />;
};
