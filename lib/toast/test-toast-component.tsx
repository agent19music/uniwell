/**
 * Test Component for Toast Validation
 * 
 * This component provides buttons to test various toast types
 * to ensure they work correctly across web and native platforms.
 */

import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import toast from './index';

export const TestToastComponent: React.FC = () => {
  const handleSuccessToast = () => {
    toast.success('✅ Success! Operation completed successfully');
  };

  const handleErrorToast = () => {
    toast.error('❌ Error! Something went wrong');
  };

  const handleBasicToast = () => {
    toast('📢 Basic toast notification');
  };

  const handleLoadingToast = () => {
    toast.loading('⏳ Loading...');
  };

  const handlePromiseToast = async () => {
    const mockPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('Data loaded!'), 2000);
    });

    await toast.promise(
      mockPromise,
      {
        loading: '🔄 Fetching data...',
        success: (data) => `✅ ${data}`,
        error: (err) => `❌ Failed: ${err}`,
      }
    );
  };

  const handleCustomToast = () => {
    toast({
      title: '🎉 Custom Toast',
      message: 'This is a custom toast with title and message',
      preset: 'heart',
      duration: 5000,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="Test Success Toast" onPress={handleSuccessToast} color="#4CAF50" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Test Error Toast" onPress={handleErrorToast} color="#F44336" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Test Basic Toast" onPress={handleBasicToast} color="#2196F3" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Test Loading Toast" onPress={handleLoadingToast} color="#FF9800" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Test Promise Toast" onPress={handlePromiseToast} color="#9C27B0" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Test Custom Toast" onPress={handleCustomToast} color="#E91E63" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
  },
  buttonContainer: {
    marginVertical: 5,
  },
});

export default TestToastComponent;
