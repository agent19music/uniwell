import React from 'react';
import { Calendar } from 'phosphor-react-native';
import { Button } from '@/components/ui/Button';
import { EmptyState as SharedEmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/hooks/useTheme';

interface EmptyStateProps {
    message: string;
    isDark: boolean;
    activeSemester: boolean;
    onAddClass: () => void;
  }
  
  export const EmptyState = ({ message, activeSemester, onAddClass }: EmptyStateProps) => {
    const { colors } = useTheme();

    return (
      <SharedEmptyState
        title={activeSemester ? 'No classes yet' : 'Choose a semester'}
        description={message}
        icon={<Calendar size={48} color={colors.textMuted} weight="regular" />}
        action={activeSemester ? <Button label="Add classes" onPress={onAddClass} /> : undefined}
        style={{ flex: 1 }}
      />
    );
  };