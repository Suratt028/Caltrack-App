// Design tokens for CalTrack
// Theme concept: "Thai market kitchen" — petrol green (fresh herbs/bai toey),
// turmeric yellow (kha min, appetite/energy) and chili coral (prik) instead of
// the generic mint-green fitness-app palette.

export const colors = {
  // Base
  bg: '#F7F8F6', // soft warm-white, slightly cool (not cream)
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2EF',
  border: '#E1E6E2',

  // Ink
  ink: '#16221F', // near-black charcoal-green
  inkMuted: '#5B6A65',
  inkFaint: '#93A19C',

  // Brand
  primary: '#0F5C56', // deep petrol/pandan green
  primaryDark: '#0A413D',
  primarySoft: '#D8E9E6',

  // Accents
  turmeric: '#F2A93B', // energy / calories / CTA
  turmericSoft: '#FCEACB',
  chili: '#E85C4A', // over-budget / alerts
  chiliSoft: '#FBDCD6',
  sage: '#6B9E78', // success / under-budget

  // Macro colors
  protein: '#0F5C56',
  carbs: '#F2A93B',
  fat: '#E85C4A',

  white: '#FFFFFF',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  h2: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyBold: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8 },
  stat: { fontSize: 42, fontWeight: '800', letterSpacing: -1 },
};

export default { colors, radius, spacing, typography };
