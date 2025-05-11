import React from 'react';
import { Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OnboardingButtonProps {
  currentIndex: Animated.SharedValue<number>;
  scrollX: Animated.SharedValue<number>;
  dataLength: number;
  onContinue: () => void;
  onGetStarted: () => void;
}

const OnboardingButton: React.FC<OnboardingButtonProps> = ({
  currentIndex,
  scrollX,
  dataLength,
  onContinue,
  onGetStarted,
}) => {
  const { width } = useWindowDimensions();
  
  const isLastSlide = currentIndex.value === dataLength - 1;

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      [0, width, 2 * width, 3 * width],
      ['#304FFE', '#FE9730', '#30FE57', '#A530FE']
    );

    return {
      width: isLastSlide ? withSpring(160) : withSpring(60),
      backgroundColor,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: isLastSlide ? withTiming(1) : withTiming(0),
      transform: [
        {
          translateX: isLastSlide ? withTiming(0) : withTiming(100),
        },
      ],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: isLastSlide ? withTiming(0) : withTiming(1),
      transform: [
        {
          translateX: isLastSlide ? withTiming(-100) : withTiming(0),
        },
      ],
    };
  });

  const handlePress = () => {
    if (isLastSlide) {
      onGetStarted();
    } else {
      onContinue();
    }
  };

  return (
    <AnimatedPressable
      style={[styles.button, buttonAnimatedStyle]}
      onPress={handlePress}
    >
      <Animated.Text style={[styles.buttonText, textAnimatedStyle]}>
        Get Started
      </Animated.Text>
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <Ionicons name="arrow-forward" size={24} color="white" />
      </Animated.View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    position: 'absolute',
  },
  iconContainer: {
    position: 'absolute',
  },
});

export default OnboardingButton; 