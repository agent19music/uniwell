import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from 'react-native';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Haptics from 'expo-haptics';
import { ArrowCounterClockwise, CameraRotate, CheckCircle, Stop, X } from 'phosphor-react-native';

import { SafeText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { Notice } from '@/components/ui/Notice';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const MAX_DURATION = 60;

interface CircularVideoRecorderProps {
  onSave: (uri: string) => Promise<void>;
  onClose: () => void;
}

export function CircularVideoRecorder({ onSave, onClose }: CircularVideoRecorderProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('front');
  const [duration, setDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const isRecordingRef = useRef(false);
  const recordingStartTime = useRef(0);
  const player = useVideoPlayer(recordedUri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = false;
  });
  const circleSize = Math.min(276, width - spacing.field * 2);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setDuration((currentDuration) => {
        if (currentDuration + 1 >= MAX_DURATION) {
          handleStopRecording();
          return MAX_DURATION;
        }
        return currentDuration + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => () => player.pause(), [player]);

  const handleStartRecording = async () => {
    if (!cameraRef.current || isRecordingRef.current) return;
    try {
      setError(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDuration(0);
      setIsRecording(true);
      isRecordingRef.current = true;
      recordingStartTime.current = Date.now();
      const video = await cameraRef.current.recordAsync({ maxDuration: MAX_DURATION });
      isRecordingRef.current = false;
      setIsRecording(false);
      if (video?.uri) setRecordedUri(video.uri);
    } catch (recordingError) {
      console.error('Error recording video:', recordingError);
      setError('Video recording could not start. Please try again.');
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const handleStopRecording = async () => {
    if (!cameraRef.current || !isRecordingRef.current) return;
    const elapsed = Date.now() - recordingStartTime.current;
    if (elapsed < 1000) {
      setTimeout(handleStopRecording, 1000 - elapsed);
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      cameraRef.current.stopRecording();
    } catch (recordingError) {
      console.error('Error stopping recording:', recordingError);
      setError('Video recording could not stop. Please try again.');
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const handleRetake = () => {
    player.pause();
    setRecordedUri(null);
    setDuration(0);
    setError(null);
    isRecordingRef.current = false;
    recordingStartTime.current = 0;
  };

  const handleSave = async () => {
    if (!recordedUri) return;
    try {
      setIsSaving(true);
      setError(null);
      await onSave(recordedUri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (saveError) {
      console.error('Error saving video:', saveError);
      setError('Your video could not be saved. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDuration = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;

  if (!permission) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
        <ActivityIndicator accessibilityLabel="Checking camera permission" color={colors.accent} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
        <View style={styles.permission}>
          <SafeText variant="heading">Camera access needed</SafeText>
          <SafeText variant="body" color={colors.textSecondary} style={styles.centered}>
            Allow camera access to record a video note.
          </SafeText>
          <Button label="Allow camera access" onPress={requestPermission} />
          <Button label="Close" onPress={onClose} variant="link" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={styles.topBar}>
        <SafeText variant="title">{recordedUri ? 'Preview video note' : isRecording ? 'Recording video note' : 'New video note'}</SafeText>
        <IconButton accessibilityLabel="Close video recorder" onPress={onClose}>
          <X color={colors.text} size={24} weight="bold" />
        </IconButton>
      </View>

      <MediaFrame
        accessibilityLabel={recordedUri ? 'Recorded video note preview' : 'Camera preview'}
        circular
        style={{ height: circleSize, width: circleSize }}
      >
        {recordedUri ? (
          <VideoView contentFit="cover" nativeControls player={player} style={StyleSheet.absoluteFill} />
        ) : (
          <CameraView ref={cameraRef} facing={facing} style={StyleSheet.absoluteFill} />
        )}
      </MediaFrame>

      {(isRecording || recordedUri) && (
        <View accessibilityLiveRegion="polite" style={styles.duration}>
          <SafeText variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>{formattedDuration} / 1:00</SafeText>
          <View accessibilityLabel={`${duration} seconds recorded out of 60`} accessibilityRole="progressbar" style={[styles.progressTrack, { backgroundColor: colors.surfacePressed }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${(duration / MAX_DURATION) * 100}%` }]} />
          </View>
        </View>
      )}

      {error && <Notice state="error">{error}</Notice>}

      <View style={styles.controls}>
        {recordedUri ? (
          <>
            <IconButton accessibilityLabel="Retake video note" accessibilityHint="Discards this recording and returns to the camera." onPress={handleRetake} variant="surface">
              <ArrowCounterClockwise color={colors.text} size={24} weight="bold" />
            </IconButton>
            <Button
              label={isSaving ? 'Saving video note' : 'Save video note'}
              loading={isSaving}
              onPress={handleSave}
              leading={!isSaving ? <CheckCircle color={colors.textOnAccent} size={20} weight="fill" /> : undefined}
            />
          </>
        ) : (
          <>
            <IconButton
              accessibilityLabel="Switch camera"
              accessibilityHint="Switches between front and back camera."
              disabled={isRecording}
              onPress={() => {
                setFacing((current) => current === 'back' ? 'front' : 'back');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              variant="surface"
            >
              <CameraRotate color={colors.text} size={24} weight="bold" />
            </IconButton>
            <Button
              label={isRecording ? 'Stop recording' : 'Start recording'}
              onPress={isRecording ? handleStopRecording : handleStartRecording}
              leading={isRecording ? <Stop color={colors.textOnAccent} size={20} weight="fill" /> : undefined}
              variant={isRecording ? 'destructive' : 'primary'}
            />
          </>
        )}
      </View>
      {!recordedUri && !isRecording && <SafeText variant="caption" color={colors.textSecondary}>Record up to 60 seconds.</SafeText>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.control,
    justifyContent: 'center',
    padding: spacing.control,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  permission: {
    alignItems: 'center',
    gap: spacing.control,
    maxWidth: 360,
  },
  centered: {
    textAlign: 'center',
  },
  duration: {
    gap: spacing.micro,
    width: '100%',
  },
  progressTrack: {
    borderCurve: 'continuous',
    borderRadius: radius.full,
    height: spacing.micro,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.control,
    justifyContent: 'center',
  },
});
