import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChartLine } from 'phosphor-react-native';

import { SafeText } from '@/components/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ChartPresentationProps = {
  accessibilityLabel: string;
  summary: string;
  children?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  style?: StyleProp<ViewStyle>;
};

export function ChartPresentation({
  accessibilityLabel,
  summary,
  children,
  emptyTitle,
  emptyDescription,
  style,
}: ChartPresentationProps) {
  const { colors } = useTheme();
  const isEmpty = Boolean(emptyTitle);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
    >
      {isEmpty ? (
        <View accessibilityLiveRegion="polite" style={styles.empty}>
          <ChartLine color={colors.textMuted} size={32} weight="regular" />
          <SafeText variant="bodyStrong">{emptyTitle}</SafeText>
          {emptyDescription && (
            <SafeText variant="caption" color={colors.textSecondary} style={styles.emptyText}>
              {emptyDescription}
            </SafeText>
          )}
        </View>
      ) : (
        children
      )}
      <SafeText accessible={false} variant="caption" color={colors.textSecondary} style={styles.summary}>
        {summary}
      </SafeText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderCurve: 'continuous',
    borderRadius: radius.surface,
    borderWidth: 1,
    gap: spacing.macro,
    overflow: 'hidden',
    padding: spacing.control,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.micro,
    justifyContent: 'center',
    minHeight: 180,
  },
  emptyText: {
    maxWidth: 280,
    textAlign: 'center',
  },
  summary: {
    textAlign: 'center',
  },
});
