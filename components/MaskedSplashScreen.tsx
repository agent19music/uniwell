import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

interface MaskedSplashScreenProps {
  onAnimationFinish?: () => void;
}

export const MaskedSplashScreen: React.FC<MaskedSplashScreenProps> = ({
  onAnimationFinish,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const animate = async () => {
      // Start the animation after a short delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Animate the scale and opacity
      scale.value = withSpring(1.5, {
        damping: 15,
        stiffness: 100,
      });
      opacity.value = withTiming(0, { duration: 1000 }, () => {
        runOnJS(onAnimationFinish)();
      });
    };

    animate();
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mask, animatedStyle]}>
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },
  mask: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
}); 