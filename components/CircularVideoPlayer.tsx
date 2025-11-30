import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Play, Pause } from 'phosphor-react-native';

interface CircularVideoPlayerProps {
  uri: string;
  colorScheme: {
    button: string;
    gradient: string[];
  };
  size?: number;
}

export const CircularVideoPlayer: React.FC<CircularVideoPlayerProps> = ({
  uri,
  colorScheme,
  size = 120,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    return () => {
      // Cleanup
      player.pause();
    };
  }, []);

  const togglePlayback = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Circular Video */}
      <View style={[styles.circularMask, { width: size, height: size, borderRadius: size / 2 }]}>
        <VideoView
          style={[styles.video, { width: size, height: size }]}
          player={player}
          nativeControls={false}
          contentFit="cover"
        />
      </View>

      {/* Overlay Controls */}
      <TouchableOpacity
        style={[
          styles.overlay,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        onPress={togglePlayback}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : !player.playing ? (
          <View
            style={[
              styles.playButton,
              { backgroundColor: colorScheme.button },
            ]}
          >
            <Play size={size * 0.15} color="#fff" weight="fill" />
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  circularMask: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
