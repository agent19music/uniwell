import type { TextStyle, ViewStyle } from 'react-native';

const light = {
  transparent: 'transparent',
  canvas: '#F7F3EF',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfacePressed: '#F0EBE6',
  text: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#78716C',
  textOnAccent: '#FFFFFF',
  border: '#DED8D1',
  borderStrong: '#AEA69D',
  focusRing: '#2D6CDF',
  divider: '#DED8D1',
  accent: '#2D6CDF',
  accentPressed: '#1E55B7',
  sheen: 'rgba(255, 255, 255, 0.42)',
  sheenSubtle: 'rgba(255, 255, 255, 0.16)',
  link: '#245BBE',
  danger: '#B42318',
  dangerSurface: '#FEE4E2',
  dangerText: '#8D1D14',
  success: '#16794B',
  successSurface: '#DCFCE7',
  scrim: 'rgba(28, 25, 23, 0.56)',
  imageVeil: 'rgba(247, 243, 239, 0.84)',
  navigation: {
    background: '#F7F3EF',
    border: '#DED8D1',
    tabActive: '#2D6CDF',
    tabInactive: '#78716C',
  },
} as const;

const dark = {
  transparent: 'transparent',
  canvas: '#171513',
  surface: '#24211E',
  surfaceRaised: '#2D2925',
  surfacePressed: '#38332F',
  text: '#FAF7F2',
  textSecondary: '#D3CBC2',
  textMuted: '#A89E94',
  textOnAccent: '#FFFFFF',
  border: '#4B443E',
  borderStrong: '#766D64',
  focusRing: '#8AB4FF',
  divider: '#4B443E',
  accent: '#6E9EFF',
  accentPressed: '#94B9FF',
  sheen: 'rgba(255, 255, 255, 0.3)',
  sheenSubtle: 'rgba(255, 255, 255, 0.12)',
  link: '#A8C5FF',
  danger: '#FF8C82',
  dangerSurface: '#542522',
  dangerText: '#FFD0CC',
  success: '#6DDA9C',
  successSurface: '#173D2B',
  scrim: 'rgba(0, 0, 0, 0.68)',
  imageVeil: 'rgba(23, 21, 19, 0.86)',
  navigation: {
    background: '#171513',
    border: '#4B443E',
    tabActive: '#8AB4FF',
    tabInactive: '#A89E94',
  },
} as const;

export type ThemeColors = typeof light;

export const colorThemes = { light, dark } as const;

export const spacing = {
  optical: 4,
  micro: 8,
  macro: 12,
  control: 16,
  field: 24,
  section: 36,
  page: 48,
} as const;

export const radius = {
  control: 14,
  surface: 16,
  full: 9999,
} as const;

export const typography = {
  display: { fontFamily: 'SF-Regular', fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontFamily: 'SF-Regular', fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontFamily: 'SF-Regular', fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontFamily: 'SF-Regular', fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontFamily: 'SF-Regular', fontSize: 16, lineHeight: 24, fontWeight: '600' },
  label: { fontFamily: 'SF-Regular', fontSize: 15, lineHeight: 20, fontWeight: '600' },
  caption: { fontFamily: 'SF-Regular', fontSize: 14, lineHeight: 20, fontWeight: '400' },
  link: { fontFamily: 'SF-Regular', fontSize: 15, lineHeight: 20, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;

export const motion = {
  press: 120,
  state: 160,
  transition: 240,
} as const;

export const shadows = {
  flat: {} as ViewStyle,
  raisedControl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  overlay: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,
} as const;
