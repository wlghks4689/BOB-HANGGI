import { Platform } from 'react-native';

export const colors = {
  canvas: '#ECEBEA',
  background: '#FFF9FA',
  surface: '#FFFFFF',
  ink: '#211B28',
  muted: '#746D7B',
  subtle: '#A39CAA',
  line: '#E8E1E9',
  coral: '#F43B64',
  coralSoft: '#FFF0F3',
  coralPressed: '#D92D55',
  violet: '#8357DF',
  violetSoft: '#F4EEFF',
  violetPressed: '#6E44C7',
  warning: '#E2536B',
  success: '#2E8B6E',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const typography = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'system-ui' }),
  note: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
} as const;

export type FlowTone = 'coral' | 'violet';

export const toneColor = (tone: FlowTone) =>
  tone === 'coral' ? colors.coral : colors.violet;

export const toneSoftColor = (tone: FlowTone) =>
  tone === 'coral' ? colors.coralSoft : colors.violetSoft;
