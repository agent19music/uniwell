import { ImageSourcePropType } from 'react-native';

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  imageSource: ImageSourcePropType;
  backgroundColor: string;
  icon?: string;
}

export interface OnboardingContextType {
  isFirstTime: boolean;
  setIsFirstTime: (value: boolean) => void;
  skipOnboarding: () => void;
  isLoading: boolean;
}

export enum PlatformType {
  WEB = 'web',
  MOBILE = 'mobile',
} 