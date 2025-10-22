/**
 * Test file for Native Toast Adapters
 * 
 * This demonstrates how the platform-specific implementations work:
 * - iOS and Android use burnt directly (minimal bundle size)
 * - Web uses the full implementation with react-hot-toast
 */

import React from 'react';
import { View, Button, Text, Platform } from 'react-native';
import { toast } from './index'; // Will automatically resolve to .ios.ts, .android.ts, or .ts based on platform
import { ToastProvider } from './ToastProvider'; // Will automatically resolve to platform-specific version

export const TestNativeAdapter = () => {
  const handleTestToast = () => {
    // On iOS/Android, this directly calls burnt
    // On Web, this uses react-hot-toast
    toast({
      title: 'Test Toast',
      message: 'This is a test message',
      preset: 'done',
      haptic: 'success'
    });
  };

  const handleSuccessToast = () => {
    toast.success?.('Operation successful!');
  };

  const handleErrorToast = () => {
    toast.error?.('Something went wrong');
  };

  return (
    <ToastProvider>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 20 }}>
          Platform: {Platform.OS}
        </Text>
        
        <Button 
          title="Test Basic Toast" 
          onPress={handleTestToast}
        />
        
        <View style={{ height: 10 }} />
        
        <Button 
          title="Test Success Toast" 
          onPress={handleSuccessToast}
        />
        
        <View style={{ height: 10 }} />
        
        <Button 
          title="Test Error Toast" 
          onPress={handleErrorToast}
        />
        
        <Text style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
          {Platform.OS === 'ios' && 'Using burnt directly (index.ios.ts)'}
          {Platform.OS === 'android' && 'Using burnt directly (index.android.ts)'}
          {Platform.OS === 'web' && 'Using react-hot-toast (index.ts)'}
        </Text>
      </View>
    </ToastProvider>
  );
};

/**
 * Bundle Size Impact:
 * 
 * iOS/Android:
 * - Only includes burnt library
 * - No react-hot-toast dependency
 * - Minimal wrapper code
 * 
 * Web:
 * - Includes react-hot-toast
 * - Full toast implementation with all features
 * 
 * The platform-specific files ensure that each platform only bundles
 * what it needs, keeping the app size optimal.
 */
