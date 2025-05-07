import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ResourceDetail from '@/components/ResourceDetail';
import { StatusBar } from 'expo-status-bar';

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ResourceDetail 
        resourceId={id as string} 
        onClose={() => {}} // No-op since we're using the back button for navigation
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});