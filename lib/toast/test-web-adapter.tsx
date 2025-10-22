/**
 * Test file for Web Toast Adapter
 * 
 * This file demonstrates how to use the web-specific toast adapter
 * with react-hot-toast, ensuring no ReactCurrentDispatcher errors.
 */

import React from 'react';
import { View, Button, Text } from 'react-native';
import { toast } from './index.web';
import { ToastProvider } from './ToastProvider.web';

function TestComponent() {
  const handleBasicToast = () => {
    toast('Hello from web!');
  };

  const handleShowAlias = () => {
    // Test the alias to ensure compatibility
    toast.show('Using show alias!');
  };

  const handleSuccessToast = () => {
    toast.success('Success! Task completed.');
  };

  const handleErrorToast = () => {
    toast.error('Error! Something went wrong.');
  };

  const handleLoadingToast = () => {
    toast.loading('Loading...');
  };

  const handlePromiseToast = async () => {
    const myPromise = new Promise((resolve) => {
      setTimeout(() => resolve('Data loaded!'), 2000);
    });

    toast.promise(
      myPromise,
      {
        loading: 'Loading data...',
        success: 'Data loaded successfully!',
        error: 'Failed to load data',
      }
    );
  };

  const handleCustomToast = () => {
    toast.custom((t) => (
      <div style={{
        background: 'linear-gradient(to right, #667eea 0%, #764ba2 100%)',
        padding: '16px',
        borderRadius: '8px',
        color: 'white'
      }}>
        <strong>Custom Toast!</strong>
        <p>This is a custom styled toast</p>
        <button onClick={() => toast.dismiss(t.id)}>Dismiss</button>
      </div>
    ));
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Web Toast Adapter Test
      </Text>
      
      <View style={{ gap: 10 }}>
        <Button title="Basic Toast" onPress={handleBasicToast} />
        <Button title="Show Alias" onPress={handleShowAlias} />
        <Button title="Success Toast" onPress={handleSuccessToast} />
        <Button title="Error Toast" onPress={handleErrorToast} />
        <Button title="Loading Toast" onPress={handleLoadingToast} />
        <Button title="Promise Toast" onPress={handlePromiseToast} />
        <Button title="Custom Toast" onPress={handleCustomToast} />
      </View>
    </View>
  );
}

// Example App component showing proper usage with ToastProvider
export default function App() {
  return (
    <ToastProvider>
      <TestComponent />
    </ToastProvider>
  );
}
