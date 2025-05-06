import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


interface EmptyStateProps {
    message: string;
    isDark: boolean;
    activeSemester: boolean;
    onAddClass: () => void;
  }
  
  export const EmptyState = ({ message, isDark, activeSemester, onAddClass }: EmptyStateProps) => {
    const styles = useEmptyStateStyles(isDark);
    
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons
          name="calendar-outline"
          size={70}
          color={isDark ? "#666666" : "#CCCCCC"}
          style={styles.emptyStateIcon}
        />
        <Text style={[styles.emptyStateText, isDark && styles.darkText]}>
          {message}
        </Text>
        {activeSemester && (
          <TouchableOpacity 
            style={styles.addClassButton} 
            onPress={onAddClass}
          >
            <Text style={styles.addClassButtonText}>Add Classes</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  const useEmptyStateStyles = (isDark: boolean) => StyleSheet.create({
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateText: {
      fontSize: 16,
      textAlign: 'center',
      color: '#000000',
      marginBottom: 24,
    },
    darkText: {
      color: '#FFFFFF',
    },
    addClassButton: {
      backgroundColor: '#FF7F50',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    addClassButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });