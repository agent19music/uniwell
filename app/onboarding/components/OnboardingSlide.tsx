import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { OnboardingSlide as OnboardingSlideType } from '../types';
import Animated, { 
  Extrapolate, 
  interpolate, 
  useAnimatedStyle 
} from 'react-native-reanimated';

interface Props {
  item: OnboardingSlideType;
  index: number;
  scrollX: Animated.SharedValue<number>;
}

const OnboardingSlide: React.FC<Props> = ({ item, index, scrollX }) => {
  const { width, height } = useWindowDimensions();

  const animatedImageStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [20, 0, 20],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  return (
    <View style={[styles.container, { width, backgroundColor: item.backgroundColor }]}>
      <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
        <Image source={item.imageSource} style={styles.image} />
      </Animated.View>
      <Animated.View style={[styles.textContainer, animatedTextStyle]}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    lineHeight: 24,
  },
});

export default OnboardingSlide; 