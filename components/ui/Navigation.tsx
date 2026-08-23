import type { ReactNode } from 'react';
import { ArrowLeft } from 'phosphor-react-native';

import { useTheme } from '@/hooks/useTheme';

import { IconButton } from './IconButton';

type HeaderActionProps = {
  accessibilityLabel: string;
  accessibilityHint?: string;
  children: ReactNode;
  onPress: () => void;
};

export function HeaderAction({
  accessibilityLabel,
  accessibilityHint,
  children,
  onPress,
}: HeaderActionProps) {
  return (
    <IconButton
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      variant="surface"
    >
      {children}
    </IconButton>
  );
}

type BackActionProps = {
  accessibilityHint?: string;
  onPress: () => void;
};

export function BackAction({ accessibilityHint = 'Returns to the previous screen', onPress }: BackActionProps) {
  const { colors } = useTheme();

  return (
    <HeaderAction accessibilityHint={accessibilityHint} accessibilityLabel="Go back" onPress={onPress}>
      <ArrowLeft color={colors.text} size={24} weight="regular" />
    </HeaderAction>
  );
}
