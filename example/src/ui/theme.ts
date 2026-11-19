import { Platform, StyleSheet } from 'react-native';

/**
 * Colors of the showcase. The accent is the red of the SDK's own
 * illustrations, so the host screens and the SDK screens they open look like
 * one product.
 */
export const colors = {
  accent: '#E73439',
  accentSoft: '#FDECEC',
  accentOnSoft: '#B3262A',
  ink: '#16181D',
  inkSecondary: '#5A606B',
  inkTertiary: '#8B919B',
  background: '#F4F2EF',
  surface: '#FFFFFF',
  surfaceSunken: '#F0EEEA',
  border: '#E7E4DF',
  /** The track of a switch that's off: dark enough for its white thumb. */
  switchOff: '#CDC8C1',
  success: '#1E8E5A',
  white: '#FFFFFF',
  whiteMuted: 'rgba(255, 255, 255, 0.78)',
} as const;

export const radius = {
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#2B1B12',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  default: { elevation: 2 },
});

export const type = {
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headline: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
} as const;

export const fonts = {
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
} as const;

/** Styles several components share. */
export const shared = StyleSheet.create({
  /** A title over a subtitle, taking the row's free width. */
  textStack: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...type.headline,
    color: colors.ink,
  },
  subtitle: {
    ...type.caption,
    color: colors.inkSecondary,
  },
  label: {
    ...type.overline,
    color: colors.inkSecondary,
  },
  /** Buttons or chips side by side. */
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
