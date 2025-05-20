// Create app/therapist/mobile-notice.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function MobileNotice() {
  const handleOpenWebsite = () => {
    Linking.openURL('https://uniwell.app/therapist');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="desktop-outline" size={80} color="#FF7F50" style={styles.icon} />
        <Text style={styles.title}>Therapist Portal</Text>
        <Text style={styles.message}>
          The Therapist Portal is exclusively available on our website. Please access it using a desktop or laptop computer for the best experience.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleOpenWebsite}>
          <Text style={styles.buttonText}>Open on Web</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Vercetti-Regular',
    lineHeight: 24,
    color: '#666',
    maxWidth: 400,
  },
  button: {
    backgroundColor: '#FF7F50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
});