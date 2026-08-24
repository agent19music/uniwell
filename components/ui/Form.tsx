import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { SafeText } from '@/components/ThemedText';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { Notice } from './Notice';

export function FormSection({ children }: { children: ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

export function FormField({
  label,
  helper,
  error,
  children,
}: {
  label: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const message = error ?? helper;

  return (
    <View style={styles.field}>
      <SafeText variant="label" color={colors.text}>{label}</SafeText>
      {children}
      {message && (
        <SafeText
          accessibilityLiveRegion={error ? 'assertive' : 'polite'}
          accessibilityRole={error ? 'alert' : undefined}
          color={error ? colors.dangerText : colors.textSecondary}
          variant="caption"
        >
          {message}
        </SafeText>
      )}
    </View>
  );
}

export function DividerLabel({ label = 'or' }: { label?: string }) {
  const { colors } = useTheme();

  return (
    <View accessibilityRole="text" style={styles.divider}>
      <View style={[styles.line, { backgroundColor: colors.divider }]} />
      <SafeText variant="caption" color={colors.textMuted} style={styles.dividerLabel}>{label}</SafeText>
      <View style={[styles.line, { backgroundColor: colors.divider }]} />
    </View>
  );
}

export function InlineNotice({
  children,
  tone = 'error',
}: {
  children: ReactNode;
  tone?: 'default' | 'error' | 'success';
}) {
  return <Notice state={tone}>{children}</Notice>;
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.field,
  },
  field: {
    gap: spacing.micro,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.control,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    textTransform: 'lowercase',
  },
});
