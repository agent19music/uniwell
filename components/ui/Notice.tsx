import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { CheckCircle, Info, WarningCircle } from 'phosphor-react-native';

import { SafeText } from '@/components/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import type { FeedbackState } from './Dialog';

type NoticeProps = {
  children: ReactNode;
  state?: Exclude<FeedbackState, 'loading' | 'destructive'>;
  style?: StyleProp<ViewStyle>;
};

export function Notice({ children, state = 'default', style }: NoticeProps) {
  const { colors } = useTheme();
  const palette = {
    default: { background: colors.surfacePressed, color: colors.textSecondary, Icon: Info },
    error: { background: colors.dangerSurface, color: colors.dangerText, Icon: WarningCircle, role: 'alert' as const },
    success: { background: colors.successSurface, color: colors.success, Icon: CheckCircle },
  }[state];

  return (
    <View
      accessibilityLiveRegion={state === 'error' ? 'assertive' : 'polite'}
      accessibilityRole={state === 'error' ? 'alert' : undefined}
      style={[styles.notice, { backgroundColor: palette.background }, style]}
    >
      <palette.Icon color={palette.color} size={18} weight="fill" />
      <SafeText style={styles.text} variant="caption" color={palette.color}>{children}</SafeText>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    alignItems: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: radius.control,
    flexDirection: 'row',
    gap: spacing.micro,
    padding: spacing.micro,
  },
  text: {
    flex: 1,
  },
});
