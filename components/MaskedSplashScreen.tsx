import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, useColorScheme, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const animate = async () => {
      // Start the animation after a short delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Animate the scale and opacity
      scale.value = withSpring(1.5, {
        damping: 15,
        stiffness: 100,
      });
      opacity.value = withTiming(0, { 
        duration: 800, 
        easing: Easing.out(Easing.ease) 
      }, () => {
        if (onAnimationFinish) {
          runOnJS(onAnimationFinish)();
        }
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
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <Animated.View style={[styles.mask, animatedStyle]}>
        <Image 
          source={require('../assets/uniwell-logo-removebg.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mask: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.6,
    height: height * 0.2,
  },
}); 