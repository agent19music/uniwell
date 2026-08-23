import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Pause, Play } from 'phosphor-react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

import { MediaFrame } from '@/components/ui/MediaFrame';
import { radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface CircularVideoPlayerProps {
  uri: string;
  size?: number;
  /** @deprecated The player now inherits the semantic app accent. */
  colorScheme?: {
    button: string;
    gradient: string[];
  };
}

export function CircularVideoPlayer({ uri, size = 120 }: CircularVideoPlayerProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = false;
  });

  useEffect(() => {
    const statusSubscription = player.addListener('statusChange', ({ status, error: playerError }) => {
      setIsLoading(status === 'loading');
      setError(playerError?.message ?? null);
    });
    const playingSubscription = player.addListener('playingChange', ({ isPlaying: playing }) => setIsPlaying(playing));

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
      player.pause();
    };
  }, [player]);

  const togglePlayback = () => {
    if (isPlaying) player.pause();
    else player.play();
  };

  const controlLabel = isPlaying ? 'Pause video note' : 'Play video note';

  return (
    <MediaFrame
      accessibilityLabel="Video journal note"
      circular
      error={error}
      loading={isLoading}
      style={{ height: size, width: size }}
    >
      <VideoView
        accessibilityLabel="Video journal note"
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={StyleSheet.absoluteFill}
      />
      {!isLoading && !error && (
        <Pressable
          accessibilityHint="Toggles video playback."
          accessibilityLabel={controlLabel}
          accessibilityRole="button"
          onPress={togglePlayback}
          style={({ pressed }) => [
            styles.overlay,
            { backgroundColor: isPlaying ? colors.transparent : colors.scrim, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <View pointerEvents="none" style={[styles.control, { backgroundColor: colors.accent }]}>
            {isPlaying
              ? <Pause color={colors.textOnAccent} size={20} weight="fill" />
              : <Play color={colors.textOnAccent} size={20} weight="fill" />}
          </View>
        </Pressable>
      )}
    </MediaFrame>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  control: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
});
