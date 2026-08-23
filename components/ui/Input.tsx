import { forwardRef, useState, type ReactNode } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { WarningCircle } from 'phosphor-react-native';

import { SafeText } from '@/components/ThemedText';
import { motion, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type InputProps = TextInputProps & {
  label: string;
  helper?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  containerStyle?: ViewStyle;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, helper, error, leading, trailing, containerStyle, editable = true, onFocus, onBlur, style, ...props },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);
  const inputHint = error ?? helper;
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? colors.danger
      : interpolateColor(focus.get(), [0, 1], [colors.border, colors.focusRing]),
  }));

  return (
    <View style={[styles.field, containerStyle]}>
      <SafeText variant="label" color={colors.text}>
        {label}
      </SafeText>
      <Animated.View
        style={[
          styles.shell,
          {
            backgroundColor: editable ? colors.surface : colors.surfacePressed,
            opacity: editable ? 1 : 0.64,
          },
          borderStyle,
        ]}
      >
        {leading && <View pointerEvents="none" style={styles.leading}>{leading}</View>}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={inputHint}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          onBlur={(event) => {
            setFocused(false);
            focus.set(withTiming(0, { duration: motion.state }));
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            focus.set(withTiming(1, { duration: motion.state }));
            onFocus?.(event);
          }}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          style={[
            styles.input,
            { color: colors.text },
            props.multiline ? styles.multiline : undefined,
            style as TextStyle,
          ]}
          {...props}
        />
        {trailing && <View style={styles.trailing}>{trailing}</View>}
      </Animated.View>
      <View accessibilityLiveRegion="polite" style={styles.message}>
        {error ? (
          <>
            <WarningCircle color={colors.dangerText} size={16} weight="fill" />
            <SafeText accessibilityRole="alert" variant="caption" color={colors.dangerText}>
              {error}
            </SafeText>
          </>
        ) : helper ? (
          <SafeText variant="caption" color={colors.textSecondary}>{helper}</SafeText>
        ) : focused ? (
          <SafeText variant="caption" color={colors.textSecondary}>Editing {label.toLowerCase()}</SafeText>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    gap: spacing.micro,
  },
  shell: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingLeft: spacing.control,
  },
  leading: {
    marginRight: spacing.macro,
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  input: {
    flex: 1,
    fontFamily: 'SF-Regular',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 54,
    paddingBottom: 0,
    paddingRight: spacing.micro,
    paddingTop: 0,
    textAlignVertical: 'center',
  },
  multiline: {
    minHeight: 104,
    paddingVertical: spacing.micro,
    textAlignVertical: 'top',
  },
  message: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.optical,
    minHeight: 20,
  },
});
