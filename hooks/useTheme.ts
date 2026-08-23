import { useColorScheme } from 'react-native';
import { Colors, DarkColors } from '../constants/Colors';
import { colorThemes } from '../constants/theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const semantic = colorThemes[isDark ? 'dark' : 'light'];
  const legacy = isDark ? DarkColors : Colors;
  
  return {
    // Semantic roles are used by all new primitives. Legacy aliases preserve
    // the existing screens until they are migrated.
    colors: {
      ...legacy,
      ...semantic,
      background: semantic.canvas,
      card: semantic.surfaceRaised,
      primary: semantic.accent,
      primaryLight: semantic.surfacePressed,
      primaryDark: semantic.accentPressed,
      primaryMuted: semantic.surfacePressed,
      textPrimary: semantic.text,
      textSecondary: semantic.textSecondary,
      textTertiary: semantic.textMuted,
      border: semantic.border,
      divider: semantic.divider,
      surface: semantic.surface,
      error: semantic.danger,
      success: semantic.success,
      input: {
        background: semantic.surface,
        border: semantic.border,
        placeholder: semantic.textMuted,
        text: semantic.text,
      },
    },
    isDark,
  };
}
