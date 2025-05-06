import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import React from 'react';

interface LoadingIndicatorProps {
    isDark: boolean;
    isCreatingSemester: boolean;
  }
  
  export const LoadingIndicator = ({ isDark, isCreatingSemester }: LoadingIndicatorProps) => {
    const styles = useLoadingIndicatorStyles(isDark);
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7F50" />
        <Text style={[styles.loadingText, isDark && styles.darkText]}>
          {isCreatingSemester ? 'Creating your semester...' : 'Loading your schedule...'}
        </Text>
      </View>
    );
  };
  
  const useLoadingIndicatorStyles = (isDark: boolean) => StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: '#000000',
    },
    darkText: {
      color: '#FFFFFF',
    },
  });