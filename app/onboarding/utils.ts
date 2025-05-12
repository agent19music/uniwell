import { Platform, Dimensions } from 'react-native';
import { PlatformType } from './types';

export const getPlatformType = (): PlatformType => {
  if (Platform.OS === 'web') {
    return PlatformType.WEB;
  }
  return PlatformType.MOBILE;
};

export const isWeb = (): boolean => {
  return Platform.OS === 'web';
};

export const isMobile = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

export const getWindowDimensions = () => {
  return {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  };
};

export const isLargeScreen = (): boolean => {
  const { width } = getWindowDimensions();
  return width >= 768;
};

export const isMediumScreen = (): boolean => {
  const { width } = getWindowDimensions();
  return width >= 480 && width < 768;
};

export const isSmallScreen = (): boolean => {
  const { width } = getWindowDimensions();
  return width < 480;
}; 