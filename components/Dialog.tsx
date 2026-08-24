import { WarningCircle, CheckCircle, Warning, Question, Plus, IconProps } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import { AlertDialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface DialogProps {
  visible: boolean;
  onClose: () => void;  
  title: string;
  message: string;
  icon?: {
    name: string;
    color?: string;
    backgroundColor?: string;
  };
  actions?: {
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
    onPress: (text?: string) => void;
  }[];
  closeOnBackdropPress?: boolean;
  showTextInput?: boolean;
  textInputPlaceholder?: string;
  textInputValue?: string;
  onTextChange?: (text: string) => void;
}

export default function Dialog({
  visible,
  onClose,
  title,
  message,
  icon,
  actions = [],
  closeOnBackdropPress = false,
  showTextInput = false,
  textInputPlaceholder = 'Enter text...',
  textInputValue = '',
  onTextChange,
}: DialogProps) {
  const { colors } = useTheme();
  const primaryAction = actions.find((action) => action.variant === 'primary')
    ?? actions.find((action) => action.variant === 'danger')
    ?? actions[0];
  const secondaryAction = actions.find((action) => action !== primaryAction);
  const confirm = primaryAction ?? { label: 'OK', onPress: onClose };

  return (
    <AlertDialog
      visible={visible}
      title={title}
      description={message}
      dismissible={closeOnBackdropPress}
      onClose={onClose}
      cancel={secondaryAction ? {
        label: secondaryAction.label,
        onPress: () => secondaryAction.onPress(textInputValue),
      } : undefined}
      confirm={{
        label: confirm.label,
        onPress: () => confirm.onPress(textInputValue),
        state: confirm.variant === 'danger' ? 'destructive' : 'default',
      }}
    >
      {icon ? (
        <View accessibilityElementsHidden style={[styles.icon, { backgroundColor: icon.backgroundColor ?? colors.accent }]}>
          {(() => {
            const iconColor = icon.color ?? colors.textOnAccent;
            const iconProps: IconProps = { size: 28, color: iconColor, weight: 'regular' };
            switch (icon.name) {
              case 'alert-circle': return <WarningCircle {...iconProps} />;
              case 'check-circle': return <CheckCircle {...iconProps} />;
              case 'alert': return <Warning {...iconProps} />;
              case 'help-circle': return <Question {...iconProps} />;
              case 'plus': return <Plus {...iconProps} />;
              default: return <Warning {...iconProps} />;
            }
          })()}
        </View>
      ) : null}
      {showTextInput ? (
        <Input
          autoFocus
          label={textInputPlaceholder}
          onChangeText={onTextChange}
          placeholder={textInputPlaceholder}
          returnKeyType="done"
          value={textInputValue}
        />
      ) : null}
    </AlertDialog>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.micro,
    width: 56,
  },
});