import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface CustomDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  icon?: string;
  iconColor?: string;
}

const { width } = Dimensions.get('window');

export default function CustomDialog({
  visible,
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  icon = 'mail-outline',
  iconColor = '#FF7F50'
}: CustomDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <BlurView intensity={90} tint="dark" style={styles.fullScreenBlur}>
        <View style={styles.overlay}>
          <BlurView intensity={30} style={styles.blurContainer}>
            <View style={styles.dialogContainer}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['rgba(255, 127, 80, 0.2)', 'rgba(255, 127, 80, 0.1)']}
                  style={styles.iconBackground}
                >
                  <Ionicons name={icon} size={32} color={iconColor} />
                </LinearGradient>
              </View>
              
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              
              <View style={styles.buttonContainer}>
                {cancelText && (
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={onCancel}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={onConfirm}
                >
                  <LinearGradient
                    colors={['#FF7F50', '#FF6B45']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  blurContainer: {
    width: width * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
  },
  dialogContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
 
  iconContainer: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 127, 80, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'SF-Regular',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    fontFamily: 'SF-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  confirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
}); 