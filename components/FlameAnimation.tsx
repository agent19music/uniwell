import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

interface FlameAnimationProps {
  streakCount: number;
  isActive: boolean;
}

export default function FlameAnimation({ streakCount, isActive }: FlameAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.5)).current;
  
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1 : 0.5,
      useNativeDriver: true,
      tension: 40,
      friction: 7
    }).start();
  }, [isActive]);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <LottieView
        source={require('../assets/animations/flame.json')} // You'll need this animation file
        autoPlay
        loop
        style={styles.flame}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  flame: {
    width: 200,
    height: 200,
  }
}); 