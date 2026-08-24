import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { Typography, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

// Merged variant map: new Typography roles + legacy aliases from typography
const variants = { ...typography, ...Typography } as Record<string, object>;

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export type SafeTextProps = TextProps & {
  variant?: keyof typeof typography | keyof typeof Typography;
  color?: string;
};

export function SafeText({
  style,
  variant = 'body',
  color,
  ...rest
}: SafeTextProps) {
  const { colors } = useTheme();

  return (
    <Text
      allowFontScaling
      style={[variants[variant], { color: color ?? (variant === 'link' ? colors.link : colors.text) }, style]}
      {...rest}
    />
  );
}

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? typography.body : undefined,
        type === 'title' ? typography.display : undefined,
        type === 'defaultSemiBold' ? typography.bodyStrong : undefined,
        type === 'subtitle' ? typography.heading : undefined,
        type === 'link' ? [typography.link, { color }] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
