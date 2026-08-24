import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Check } from 'phosphor-react-native';

import { SafeText } from '@/components/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T | '';
  onChange: (value: T) => void;
  helper?: string;
  error?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  helper,
  error,
  disabled = false,
  style,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const hint = error ?? helper;

  return (
    <View style={[styles.field, style]}>
      <SafeText variant="label" color={colors.text}>{label}</SafeText>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityHint={hint}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected ? colors.surfacePressed : colors.surface,
                  borderColor: selected ? colors.accent : colors.border,
                  opacity: disabled ? 0.48 : pressed ? 0.76 : 1,
                },
              ]}
            >
              {option.icon && <View pointerEvents="none">{option.icon}</View>}
              <SafeText
                variant="bodyStrong"
                color={colors.text}
                style={styles.optionLabel}
                numberOfLines={1}
              >
                {option.label}
              </SafeText>
              {selected && <Check color={colors.accent} size={18} weight="bold" />}
            </Pressable>
          );
        })}
      </View>
      {hint && (
        <SafeText
          accessibilityLiveRegion={error ? 'assertive' : 'polite'}
          accessibilityRole={error ? 'alert' : undefined}
          variant="caption"
          color={error ? colors.dangerText : colors.textSecondary}
        >
          {hint}
        </SafeText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.micro,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.micro,
  },
  option: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.control,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.optical,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.micro,
  },
  optionLabel: {
    flexShrink: 1,
  },
});
