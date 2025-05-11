import { Platform, Dimensions } from 'react-native';
import { PlatformType } from './types';

export const getPlatformType = (): PlatformType => {
  return Platform.OS === 'web' ? PlatformType.WEB : PlatformType.MOBILE;
};

export const isWeb = (): boolean => {
  return getPlatformType() === PlatformType.WEB;
};

export const isMobile = (): boolean => {
  return getPlatformType() === PlatformType.MOBILE;
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