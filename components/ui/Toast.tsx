import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { CheckCircle, CircleNotch, Info, WarningCircle, X } from 'phosphor-react-native';

import { SafeText } from '@/components/ThemedText';
import { radius, shadows, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import type { FeedbackState } from './Dialog';

type ToastProps = {
  message: string;
  state?: Exclude<FeedbackState, 'destructive'>;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Toast({ message, state = 'default', onDismiss, style }: ToastProps) {
  const { colors } = useTheme();
  const palette = {
    default: { background: colors.surfaceRaised, color: colors.text, Icon: Info },
    loading: { background: colors.surfaceRaised, color: colors.text, Icon: CircleNotch },
    error: { background: colors.dangerSurface, color: colors.dangerText, Icon: WarningCircle, role: 'alert' as const },
    success: { background: colors.successSurface, color: colors.success, Icon: CheckCircle },
  }[state];

  return (
    <View
      accessibilityLiveRegion={state === 'error' ? 'assertive' : 'polite'}
      accessibilityRole={state === 'error' ? 'alert' : undefined}
      style={[styles.toast, { backgroundColor: palette.background, borderColor: colors.border }, shadows.overlay, style]}
    >
      <palette.Icon color={palette.color} size={20} weight="fill" />
      <SafeText style={styles.message} variant="caption" color={palette.color}>{message}</SafeText>
      {onDismiss ? (
        <Pressable
          accessibilityHint="Dismisses this message"
          accessibilityLabel="Dismiss notification"
          accessibilityRole="button"
          hitSlop={spacing.micro}
          onPress={onDismiss}
          style={styles.dismiss}
        >
          <X color={palette.color} size={18} weight="bold" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.micro,
    minHeight: 56,
    paddingHorizontal: spacing.control,
    paddingVertical: spacing.micro,
  },
  message: {
    flex: 1,
  },
  dismiss: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
});
