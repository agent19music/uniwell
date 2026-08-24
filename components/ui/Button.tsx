import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SafeText } from '@/components/ThemedText';
import { motion, radius, shadows, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const supportsInsetBoxShadow = Platform.OS !== 'android' || Number(Platform.Version) >= 29;

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link';
type ButtonSize = 'compact' | 'regular';

type ButtonProps = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  loading = false,
  disabled = false,
  leading,
  trailing,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const unavailable = disabled || loading;
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const palette = {
    primary: { backgroundColor: colors.accent, borderColor: colors.accent, text: colors.textOnAccent },
    secondary: { backgroundColor: colors.surface, borderColor: colors.borderStrong, text: colors.text },
    ghost: { backgroundColor: colors.transparent, borderColor: colors.transparent, text: colors.text },
    destructive: { backgroundColor: colors.danger, borderColor: colors.danger, text: colors.textOnAccent },
    link: { backgroundColor: colors.transparent, borderColor: colors.transparent, text: colors.link },
  }[variant];

  const isTextAction = variant === 'link';
  const sheen =
    supportsInsetBoxShadow && variant === 'primary'
      ? `inset 0 1px 0 ${colors.sheen}, inset 0 10px 14px -8px ${colors.sheenSubtle}`
      : supportsInsetBoxShadow && variant === 'secondary'
        ? `inset 0 1px 0 ${colors.sheenSubtle}`
        : undefined;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      hitSlop={isTextAction ? spacing.micro : undefined}
      onPress={onPress}
      onPressIn={() => {
        if (!unavailable && !reducedMotion) {
          scale.set(withTiming(0.97, { duration: motion.press }));
        }
      }}
      onPressOut={() => scale.set(withTiming(1, { duration: motion.press }))}
      pressRetentionOffset={spacing.macro}
      style={[
        styles.base,
        size === 'regular' ? styles.regular : styles.compact,
        isTextAction && styles.link,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          boxShadow: sheen,
          opacity: unavailable ? 0.48 : 1,
        },
        variant === 'primary' ? shadows.raisedControl : undefined,
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={palette.text} /> : leading}
        <SafeText variant={isTextAction ? 'link' : 'bodyStrong'} color={palette.text}>
          {label}
        </SafeText>
        {!loading && trailing}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.control,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  regular: {
    minHeight: 56,
    paddingHorizontal: spacing.control,
  },
  compact: {
    minHeight: 44,
    paddingHorizontal: spacing.micro,
  },
  link: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 0,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.micro,
    justifyContent: 'center',
  },
});
