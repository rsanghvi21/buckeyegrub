/**
 * BuckeyeGrub Design System – Theme & Style Tokens
 * Official Ohio State University (OSU) Scarlet & Gray Palette
 */

export const colors = {
  // Official OSU Brand Colors
  scarlet: '#BA0C2F',
  scarletDark: '#BB0000',
  scarletDeep: '#8B0000',
  scarletLight: '#FF4D6A',
  scarletWash: '#FFF0F2',

  gray: '#A7B1B7',
  grayDark: '#666666',
  grayMuted: '#8E99A2',
  grayLight: '#E5E8EB',
  grayBorder: '#D0D7DE',
  grayWash: '#F1F3F5',

  // Neutrals & Surfaces
  neutralDark: '#1E1E24',
  neutralCharcoal: '#2D2D34',
  textPrimary: '#1E1E24',
  textSecondary: '#666666',
  textMuted: '#8E99A2',
  textInverse: '#FFFFFF',

  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceHover: '#F4F5F7',
  surfaceElevated: '#FFFFFF',

  // Accents
  gold: '#D4AF37',
  goldLight: '#FFF9DB',
  goldDark: '#B89628',

  // Macro Palette
  macros: {
    calories: '#BA0C2F',
    protein: '#E03131',
    carbs: '#D4AF37',
    fat: '#4DABF7',
  },

  // Dietary Tag Semantics
  dietary: {
    highProtein: {
      bg: '#FFE3E3',
      text: '#C92A2A',
      border: '#FFA8A8',
    },
    vegan: {
      bg: '#E6FCF5',
      text: '#0CA678',
      border: '#63E6BE',
    },
    vegetarian: {
      bg: '#EBFBEE',
      text: '#2F9E44',
      border: '#8CE99A',
    },
    halal: {
      bg: '#E7F5FF',
      text: '#1971C2',
      border: '#74C0FC',
    },
    glutenFree: {
      bg: '#FFF9DB',
      text: '#E67700',
      border: '#FFE066',
    },
    dairyFree: {
      bg: '#F3F0FF',
      text: '#7950F2',
      border: '#D0BFFF',
    },
  },

  // BuckID Payment Badges
  payment: {
    swipe: {
      bg: '#FFE3E3',
      text: '#BA0C2F',
      border: '#FFA8A8',
      label: 'Traditions Swipe',
    },
    diningDollars: {
      bg: '#EBFBEE',
      text: '#2B8A3E',
      border: '#8CE99A',
      label: 'Dining Dollars (35% OFF)',
    },
    buckidCash: {
      bg: '#FFF9DB',
      text: '#E67700',
      border: '#FFE066',
      label: 'BuckID Cash',
    },
  },

  // Status & Feedback
  success: '#2B8A3E',
  warning: '#E67700',
  error: '#BA0C2F',
  info: '#1971C2',
} as const;

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeights: {
    xs: 15,
    sm: 18,
    md: 22,
    lg: 24,
    xl: 28,
    xxl: 32,
    xxxl: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;
export type DietaryTag = keyof typeof colors.dietary;
export type PaymentTypeKey = keyof typeof colors.payment;
export type MacroType = keyof typeof colors.macros;

export default theme;
