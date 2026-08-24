import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WarningCircle } from 'phosphor-react-native';

import { SafeText } from '@/components/ThemedText';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({ title, description, icon, action, style }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {icon}
      <SafeText variant="heading" style={styles.title}>{title}</SafeText>
      {description && <SafeText variant="body" color={colors.textSecondary} style={styles.description}>{description}</SafeText>}
      {action}
    </View>
  );
}

type ErrorStateProps = Omit<EmptyStateProps, 'icon'>;

export function ErrorState({ title, ...props }: ErrorStateProps) {
  const { colors } = useTheme();
  return <EmptyState title={title} icon={<WarningCircle size={48} color={colors.danger} weight="regular" />} {...props} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.macro,
    justifyContent: 'center',
    padding: spacing.field,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    maxWidth: 400,
    textAlign: 'center',
  },
});
