import React from 'react';

import { AlertDialog } from '@/components/ui/Dialog';

interface CustomDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  icon?: React.ReactNode;
}

export default function CustomDialog({
  visible,
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  icon,
}: CustomDialogProps) {
  return (
    <AlertDialog
      cancel={cancelText && onCancel ? { label: cancelText, onPress: onCancel } : undefined}
      confirm={{ label: confirmText, onPress: onConfirm }}
      description={message}
      dismissible={Boolean(cancelText && onCancel)}
      onClose={onCancel ?? (() => undefined)}
      title={title}
      visible={visible}
    >
      {icon ? <>{icon}</> : null}
    </AlertDialog>
  );
}
