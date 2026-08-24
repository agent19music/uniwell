export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  backgroundColor: string;
  icon?: string;
}

export interface OnboardingContextType {
  isFirstTime: boolean;
  setIsFirstTime: (value: boolean) => void;
  skipOnboarding: (redirectPath?: string) => void;
  isLoading: boolean;
}

export enum PlatformType {
  WEB = 'web',
  MOBILE = 'mobile',
}

