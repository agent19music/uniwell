import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { SafeText } from '@/components/ThemedText';
import { radius, shadows, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { Button } from './Button';

export type FeedbackState = 'default' | 'loading' | 'error' | 'success' | 'destructive';

export type DialogAction = {
  label: string;
  onPress: () => void;
  state?: FeedbackState;
  loading?: boolean;
  disabled?: boolean;
};

type DialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Dialog({
  visible,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = false,
  scrollable = true,
  style,
}: DialogProps) {
  const { colors } = useTheme();

  return (
    <Modal
      animationType="fade"
      onRequestClose={dismissible ? onClose : undefined}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.viewport}
      >
        <Pressable
          accessibilityLabel="Dismiss dialog"
          accessibilityRole="button"
          disabled={!dismissible}
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
        />
        <View
          accessibilityLabel={title}
          accessibilityViewIsModal
          style={[styles.surface, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }, shadows.overlay, style]}
        >
          <View style={styles.header}>
            <SafeText variant="heading" color={colors.text}>{title}</SafeText>
            {description ? (
              <SafeText variant="body" color={colors.textSecondary}>{description}</SafeText>
            ) : null}
          </View>
          {children ? (
            scrollable ? (
              <ScrollView
                bounces={false}
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            ) : <View style={styles.body}>{children}</View>
          ) : null}
          {footer ? <View style={[styles.footer, { borderTopColor: colors.divider }]}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type AlertDialogProps = Omit<DialogProps, 'footer'> & {
  cancel?: DialogAction;
  confirm: DialogAction;
};

export function AlertDialog({ cancel, confirm, ...dialog }: AlertDialogProps) {
  const variant = confirm.state === 'destructive' ? 'destructive' : 'primary';

  return (
    <Dialog
      {...dialog}
      dismissible={dialog.dismissible ?? Boolean(cancel)}
      footer={
        <View style={styles.actions}>
          {cancel ? (
            <Button
              disabled={cancel.disabled}
              label={cancel.label}
              loading={cancel.loading}
              onPress={cancel.onPress}
              style={styles.action}
              variant="secondary"
            />
          ) : null}
          <Button
            disabled={confirm.disabled}
            label={confirm.label}
            loading={confirm.loading}
            onPress={confirm.onPress}
            style={styles.action}
            variant={variant}
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  viewport: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.field,
    paddingVertical: spacing.page,
  },
  surface: {
    borderCurve: 'continuous',
    borderRadius: radius.surface,
    borderWidth: 1,
    maxHeight: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    gap: spacing.micro,
    padding: spacing.field,
    paddingBottom: spacing.control,
  },
  body: {
    gap: spacing.control,
    paddingHorizontal: spacing.field,
    paddingBottom: spacing.field,
  },
  footer: {
    borderTopWidth: 1,
    padding: spacing.control,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.micro,
  },
  action: {
    flex: 1,
  },
});
