import type { ReactNode } from 'react';
import { StyleSheet, Switch, View, type StyleProp, type ViewStyle } from 'react-native';

import { SafeText } from '@/components/ThemedText';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type SwitchRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SwitchRow({
  label,
  value,
  onValueChange,
  description,
  icon,
  disabled = false,
  style,
}: SwitchRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, style]}>
      <View style={styles.copy}>
        {icon && <View pointerEvents="none" style={styles.icon}>{icon}</View>}
        <View style={styles.labels}>
          <SafeText variant="bodyStrong" color={colors.text}>{label}</SafeText>
          {description && <SafeText variant="caption" color={colors.textSecondary}>{description}</SafeText>}
        </View>
      </View>
      <View style={styles.control}>
        <Switch
          accessibilityLabel={label}
          accessibilityHint={description}
          accessibilityState={{ checked: value, disabled }}
          disabled={disabled}
          onValueChange={onValueChange}
          thumbColor={colors.surface}
          trackColor={{ false: colors.borderStrong, true: colors.accent }}
          value={value}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.macro,
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: spacing.micro,
  },
  copy: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.macro,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 24,
  },
  labels: {
    flex: 1,
    gap: spacing.optical,
  },
  control: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
});
