import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { VideoView, useVideoPlayer } from 'expo-video';
import { X, CameraRotate, CheckCircle, ArrowCounterClockwise } from 'phosphor-react-native';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';

const CIRCLE_SIZE = 280;
const MAX_DURATION = 60; // 60 seconds max

interface CircularVideoRecorderProps {
  onSave: (uri: string) => Promise<void>;
  onClose: () => void;
}

export const CircularVideoRecorder: React.FC<CircularVideoRecorderProps> = ({
  onSave,
  onClose,
}) => {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('front');
  const [duration, setDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const isRecordingRef = useRef(false);
  const recordingStartTime = useRef<number>(0);
  const player = recordedUri ? useVideoPlayer(recordedUri, (player) => {
    player.loop = true;
    player.muted = false;
  }) : null;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Start progress animation
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: MAX_DURATION * 1000,
        useNativeDriver: false,
      }).start();

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_DURATION) {
            handleStopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      progressAnimation.setValue(0);
      pulseAnimation.setValue(1);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    }
  }, [isRecording]);

  const handleStartRecording = async () => {
    if (!cameraRef.current || isRecordingRef.current) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRecording(true);
      setDuration(0);
      isRecordingRef.current = true;
      recordingStartTime.current = Date.now();
      
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION,
      });
      
      // Recording completed (either by user stopping or max duration reached)
      isRecordingRef.current = false;
      setIsRecording(false);
      
      if (video?.uri) {
        setRecordedUri(video.uri);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const handleStopRecording = async () => {
    if (!cameraRef.current || !isRecordingRef.current) return;
    
    // Ensure at least 1 second has been recorded to avoid the error
    const recordingDuration = Date.now() - recordingStartTime.current;
    if (recordingDuration < 1000) {
      // Wait until at least 1 second has passed
      setTimeout(() => {
        if (isRecordingRef.current && cameraRef.current) {
          handleStopRecording();
        }
      }, 1000 - recordingDuration);
      return;
    }
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const handleRetake = () => {
    setRecordedUri(null);
    setDuration(0);
    isRecordingRef.current = false;
    recordingStartTime.current = 0;
    progressAnimation.setValue(0);
  };

  const handleSave = async () => {
    if (!recordedUri) return;
    
    try {
      setIsSaving(true);
      await onSave(recordedUri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving video:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionText, { color: colors.textPrimary }]}>
            Camera access is required to record video notes
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progressInterpolation = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <X size={28} color={colors.textPrimary} weight="bold" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {recordedUri ? 'Preview' : isRecording ? 'Recording...' : 'Video Note'}
      </Text>

      {/* Circular Camera/Video Container */}
      <View style={styles.circularContainer}>
        {/* Progress Ring */}
        {isRecording && (
          <Animated.View
            style={[
              styles.progressRing,
              {
                borderColor: colors.primary,
                transform: [
                  { rotate: progressInterpolation },
                  { scale: pulseAnimation },
                ],
              },
            ]}
          />
        )}

        {/* Camera or Video Preview */}
        <View style={styles.circularMask}>
          {recordedUri ? (
            <VideoView
              style={styles.video}
              player={player!}
              nativeControls={false}
              contentFit="cover"
            />
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            />
          )}
        </View>

        {/* Duration Timer */}
        {(isRecording || recordedUri) && (
          <View style={[styles.durationBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.durationText}>
              {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {recordedUri ? (
          // Preview Controls
          <>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.card }]}
              onPress={handleRetake}
            >
              <ArrowCounterClockwise size={28} color={colors.textPrimary} weight="bold" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                isSaving && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <CheckCircle size={32} color="#fff" weight="fill" />
              )}
            </TouchableOpacity>

            <View style={styles.controlButton} />
          </>
        ) : (
          // Recording Controls
          <>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.card }]}
              onPress={toggleCameraFacing}
              disabled={isRecording}
            >
              <CameraRotate
                size={28}
                color={isRecording ? colors.textSecondary : colors.textPrimary}
                weight="bold"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.recordButton,
                { borderColor: colors.primary },
                isRecording && styles.recordingButton,
              ]}
              onPress={isRecording ? handleStopRecording : handleStartRecording}
            >
              <View
                style={[
                  styles.recordButtonInner,
                  { backgroundColor: colors.primary },
                  isRecording && styles.recordButtonInnerRecording,
                ]}
              />
            </TouchableOpacity>

            <View style={styles.controlButton} />
          </>
        )}
      </View>

      {/* Hint Text */}
      {!recordedUri && !isRecording && (
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          Tap to record (1-{MAX_DURATION}s)
        </Text>
      )}
      {isRecording && duration < 1 && (
        <Text style={[styles.hintText, { color: colors.primary }]}>
          Recording... (min 1 second)
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 40,
    marginTop: Platform.OS === 'ios' ? 60 : 40,
  },
  circularContainer: {
    position: 'relative',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    marginBottom: 60,
  },
  progressRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 16,
    height: CIRCLE_SIZE + 16,
    borderRadius: (CIRCLE_SIZE + 16) / 2,
    borderWidth: 4,
    borderStyle: 'dashed',
    top: -8,
    left: -8,
  },
  circularMask: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  camera: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  video: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  durationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Vercetti-Regular',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  recordingButton: {
    borderWidth: 3,
  },
  recordButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  recordButtonInnerRecording: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  saveButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  hintText: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
    marginTop: 20,
    textAlign: 'center',
  },
  permissionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Vercetti-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
});
