import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { CheckCircle, Info, WarningCircle } from 'phosphor-react-native';

import { SafeText } from '@/components/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type BadgeTone = 'default' | 'success' | 'danger';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = 'default', icon, style }: BadgeProps) {
  const { colors } = useTheme();
  const palette = {
    default: { backgroundColor: colors.surfacePressed, color: colors.textSecondary },
    success: { backgroundColor: colors.successSurface, color: colors.success },
    danger: { backgroundColor: colors.dangerSurface, color: colors.dangerText },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }, style]}>
      {icon}
      <SafeText variant="caption" color={palette.color} style={styles.label}>{label}</SafeText>
    </View>
  );
}

type StatusBadgeProps = Omit<BadgeProps, 'tone' | 'icon'> & {
  status?: BadgeTone;
};

export function StatusBadge({ label, status = 'default', style }: StatusBadgeProps) {
  const { colors } = useTheme();
  const Icon = status === 'success' ? CheckCircle : status === 'danger' ? WarningCircle : Info;
  const color = status === 'success' ? colors.success : status === 'danger' ? colors.dangerText : colors.textSecondary;

  return <Badge label={label} tone={status} icon={<Icon size={16} color={color} weight="fill" />} style={style} />;
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.optical,
    minHeight: 28,
    paddingHorizontal: spacing.micro,
    paddingVertical: spacing.optical,
  },
  label: {
    textTransform: 'capitalize',
  },
});
