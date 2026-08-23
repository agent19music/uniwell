import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

interface SkipButtonProps {
  currentIndex: SharedValue<number>;
  dataLength: number;
  onSkip: () => void;
}

const SkipButton: React.FC<SkipButtonProps> = ({
  currentIndex,
  dataLength,
  onSkip,
}) => {
  const isLastSlide = currentIndex.value === dataLength - 1;
  
  const skipButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: isLastSlide ? withTiming(0) : withTiming(1),
      transform: [{ translateY: isLastSlide ? withTiming(50) : withTiming(0) }],
    };
  });

  return (
    <Animated.View style={[styles.container, skipButtonAnimatedStyle]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={onSkip}
        disabled={isLastSlide}
      >
        <Text style={styles.text}>Skip</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  text: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SkipButton; 