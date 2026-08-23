import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type IconButtonProps = {
  accessibilityLabel: string;
  accessibilityHint?: string;
  children: ReactNode;
  onPress: () => void;
  variant?: 'ghost' | 'surface' | 'destructive';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  accessibilityLabel,
  accessibilityHint,
  children,
  onPress,
  variant = 'ghost',
  disabled = false,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const palette = {
    ghost: { backgroundColor: colors.transparent, borderColor: colors.transparent },
    surface: { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
    destructive: { backgroundColor: colors.dangerSurface, borderColor: colors.danger },
  }[variant];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={spacing.micro}
      onPress={onPress}
      onPressIn={() => {
        if (!disabled && !reducedMotion) {
          scale.set(withTiming(0.97, { duration: motion.press }));
        }
      }}
      onPressOut={() => scale.set(withTiming(1, { duration: motion.press }))}
      pressRetentionOffset={spacing.macro}
      style={[
        styles.button,
        palette,
        { opacity: disabled ? 0.48 : 1 },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.control,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
});
