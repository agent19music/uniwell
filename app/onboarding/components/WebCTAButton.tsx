import React from 'react';
import { Pressable, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface WebCTAButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  primary?: boolean;
  delay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const WebCTAButton: React.FC<WebCTAButtonProps> = ({
  title,
  onPress,
  icon,
  primary = true,
  delay = 0,
}) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    setTimeout(() => {
      scale.value = withTiming(1, {
        duration: 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      opacity.value = withTiming(1, {
        duration: 700,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      translateY.value = withTiming(0, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, delay);
  }, [scale, opacity, translateY, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.button,
        primary ? styles.primaryButton : styles.secondaryButton,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={20}
          color={primary ? 'white' : '#304FFE'}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, primary ? styles.primaryText : styles.secondaryText]}>
        {title}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 100,
    minWidth: 160,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#304FFE',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#304FFE',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: '#304FFE',
  },
  icon: {
    marginRight: 8,
  },
});

export default WebCTAButton; 