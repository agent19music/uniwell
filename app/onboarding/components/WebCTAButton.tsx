import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface WebCTAButtonProps {
  title: string;
  onPress: () => void;
  primary?: boolean;
  icon?: string;
  delay: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const WebCTAButton: React.FC<WebCTAButtonProps> = ({
  title,
  onPress,
  primary = false,
  icon,
  delay,
  style,
  textStyle,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);

  React.useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    scale.value = withDelay(
      delay,
      withTiming(1, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, [delay, opacity, translateY, scale]);

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
    scale.value = withTiming(0.97, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200 });
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.container,
          primary ? styles.primaryContainer : styles.secondaryContainer,
          {
            transform: [
              { scale: pressed ? 0.98 : 1 },
            ],
          },
          style,
        ]}
      >
        <Text
          style={[
            styles.text,
            primary ? styles.primaryText : styles.secondaryText,
            textStyle,
          ]}
        >
          {title}
          {icon && <Text style={styles.icon}> {icon === 'arrow-forward' ? '→' : icon}</Text>}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 180,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.1,
    elevation: 5,
  },
  primaryContainer: {
    backgroundColor: '#212121',
  },
  secondaryContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#212121',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'SF-Regular',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#212121',
  },
  icon: {
    marginLeft: 8,
    fontSize: 18,
  },
});

export default WebCTAButton;