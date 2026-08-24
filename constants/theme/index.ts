import type { TextStyle, ViewStyle } from 'react-native';

// ─── Color palettes ──────────────────────────────────────────────────────────

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

// ─── Fonts ───────────────────────────────────────────────────────────────────
// Two families, three weights. Never set `fontWeight` inline — each entry IS
// the font file for that weight.

export const Fonts = {
  heading:  'Manrope_600SemiBold',   // titles, headings, display text
  headingBold: 'Manrope_700Bold',    // extra emphasis on large display
  body:     'Inter_400Regular',      // body copy, captions, default UI text
  emphasis: 'Inter_500Medium',       // labels, inline emphasis, UI chrome
} as const;

// ─── Typography scale ────────────────────────────────────────────────────────

export const Typography = {
  display:    { fontSize: 36, lineHeight: 42, letterSpacing: -1.0, fontFamily: Fonts.headingBold },
  title:      { fontSize: 24, lineHeight: 30, letterSpacing: -0.6, fontFamily: Fonts.headingBold },
  heading:    { fontSize: 20, lineHeight: 26, letterSpacing: -0.4, fontFamily: Fonts.heading },
  subheading: { fontSize: 17, lineHeight: 23, letterSpacing: -0.2, fontFamily: Fonts.heading },
  headline:   { fontSize: 15, lineHeight: 21, letterSpacing: -0.1, fontFamily: Fonts.heading },
  body:       { fontSize: 15, lineHeight: 22, letterSpacing:  0,   fontFamily: Fonts.body },
  bodySm:     { fontSize: 14, lineHeight: 20, letterSpacing:  0,   fontFamily: Fonts.body },
  label:      { fontSize: 13, lineHeight: 18, letterSpacing:  0,   fontFamily: Fonts.emphasis },
  caption:    { fontSize: 12, lineHeight: 16, letterSpacing:  0,   fontFamily: Fonts.body },
} as const satisfies Record<string, TextStyle>;

// Legacy aliases — existing screens still resolve via SafeText variants
export const typography = {
  display:    Typography.display,
  title:      Typography.title,
  heading:    Typography.heading,
  body:       Typography.body,
  bodyStrong: { ...Typography.body, fontFamily: Fonts.emphasis },
  label:      Typography.label,
  caption:    Typography.caption,
  link:       { ...Typography.label, color: undefined },
} as const satisfies Record<string, TextStyle>;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const Spacing = {
  s4:  4,
  s8:  8,
  s12: 12,
  s16: 16,
  s20: 20,
  s24: 24,
  s28: 28,
  s32: 32,
  s40: 40,
  s48: 48,
  s64: 64,
  s80: 80,
} as const;

// Legacy aliases
export const spacing = {
  optical:  Spacing.s4,
  micro:    Spacing.s8,
  macro:    Spacing.s12,
  control:  Spacing.s16,
  field:    Spacing.s24,
  section:  Spacing.s28,
  page:     Spacing.s48,
} as const;

// ─── Radius ───────────────────────────────────────────────────────────────────

export const Radius = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  card: 24,
  pill: 9999,
} as const;

// Legacy aliases
export const radius = {
  control: Radius.md,
  surface: Radius.lg,
  full:    Radius.pill,
} as const;

// ─── Motion ───────────────────────────────────────────────────────────────────

export const Motion = {
  spring: {
    press:    { damping: 20, stiffness: 400 },
    release:  { damping: 16, stiffness: 300 },
    entrance: { damping: 20, stiffness: 110 },
    sheet:    { damping: 50, stiffness: 300 },
    pop:      { damping: 22, stiffness: 260 },
  },
  timing: {
    fast:   100,
    base:   150,
    exit:   180,
    gentle: 250,
  },
  scale: {
    press: 0.97,
    chip:  0.93,
    icon:  0.85,
  },
} as const;

// Legacy alias
export const motion = {
  press:      Motion.timing.fast,
  state:      Motion.timing.base,
  transition: Motion.timing.gentle,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

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
