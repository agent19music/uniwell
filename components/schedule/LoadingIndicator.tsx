import React from 'react';
import { LoadingState } from '@/components/ui/LoadingState';

interface LoadingIndicatorProps {
    isDark: boolean;
    isCreatingSemester: boolean;
  }
  
  export const LoadingIndicator = ({ isCreatingSemester }: LoadingIndicatorProps) => {
    return (
      <LoadingState
        label={isCreatingSemester ? 'Creating your semester…' : 'Loading your schedule…'}
        style={{ flex: 1 }}
      />
    );
  };