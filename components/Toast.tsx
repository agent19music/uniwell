import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

export const Toast = ({ message, type = 'success' }: { message: string, type?: 'success' | 'error' }) => {
  return (
    <View style={[styles.container, styles[type]]}>
      <Ionicons 
        name={type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
        size={24} 
        color="#FFFFFF" 
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  success: {
    backgroundColor: '#4CAF50',
  },
  error: {
    backgroundColor: '#F44336',
  },
  message: {
    color: '#FFFFFF',
    marginLeft: 12,
    fontSize: 16,
  },
}); 