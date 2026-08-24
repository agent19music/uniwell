import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ImageSquare } from 'phosphor-react-native';

import { SafeText } from '@/components/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type MediaFrameProps = {
  children?: ReactNode;
  accessibilityLabel: string;
  loading?: boolean;
  error?: string | null;
  fallbackLabel?: string;
  circular?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function MediaFrame({
  children,
  accessibilityLabel,
  loading = false,
  error,
  fallbackLabel = 'Media unavailable',
  circular = false,
  style,
}: MediaFrameProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={[
        styles.frame,
        circular ? styles.circular : styles.rounded,
        { backgroundColor: colors.surfacePressed, borderColor: colors.border },
        style,
      ]}
    >
      {!error && children}
      {(loading || error) && (
        <View
          accessibilityLiveRegion="polite"
          accessibilityRole={error ? 'alert' : 'progressbar'}
          style={[styles.feedback, { backgroundColor: colors.imageVeil }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <>
              <ImageSquare color={colors.textMuted} size={24} weight="regular" />
              <SafeText variant="caption" color={colors.textSecondary} style={styles.feedbackText}>
                {error || fallbackLabel}
              </SafeText>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  rounded: {
    borderCurve: 'continuous',
    borderRadius: radius.surface,
  },
  circular: {
    borderRadius: radius.full,
  },
  feedback: {
    alignItems: 'center',
    bottom: 0,
    gap: spacing.micro,
    justifyContent: 'center',
    left: 0,
    padding: spacing.control,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  feedbackText: {
    textAlign: 'center',
  },
});
