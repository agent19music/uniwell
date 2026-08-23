import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Card({ children, onPress, onLongPress, style, contentStyle, accessibilityLabel }: CardProps) {
  const { colors } = useTheme();
  const sharedStyle = [
    styles.card,
    { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
    style,
  ];

  if (!onPress && !onLongPress) {
    return <View style={sharedStyle}><View style={contentStyle}>{children}</View></View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [sharedStyle, pressed && { backgroundColor: colors.surfacePressed }]}
    >
      <View style={contentStyle}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: radius.surface,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.control,
  },
});
