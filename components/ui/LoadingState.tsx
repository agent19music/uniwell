import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { SafeText } from '@/components/ThemedText';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type LoadingStateProps = {
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function LoadingState({ label = 'Loading…', style }: LoadingStateProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="progressbar" style={[styles.container, style]}>
      {!reducedMotion && <ActivityIndicator color={colors.accent} size="large" />}
      <SafeText variant="body" color={colors.textSecondary}>{label}</SafeText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.macro,
    justifyContent: 'center',
    padding: spacing.field,
  },
});
