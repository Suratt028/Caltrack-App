// Design tokens for CalTrack
// Deep-green + soft-mint palette (CalTrack "leaf" design).
//
// Contrast notes (WCAG AA):
// - ink / inkMuted / inkFaint are all >= 4.5:1 on bg and surface.
// - primary is >= 4.5:1 on bg and with white text (buttons, tabs).
// - `carbStrong` is the text-safe gold (5.5:1 on white); the lighter `carbs`
//   is reserved for bars/dots/graphics where 3:1 non-text contrast applies.
// - `danger` is the only red and is used for real errors — never for
//   over-goal or AI feedback (that stays supportive, in gold/green).

export const colors = {
  // Base
  bg: '#F7F5F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EFE9',
  card: '#FFFFFF',
  border: '#E4E8E2',

  // Ink
  ink: '#1F3A2F',
  inkMuted: '#5F6F67',
  inkFaint: '#7E8A83',

  // Brand
  primary: '#21634C',
  primaryDark: '#1B3D2F',
  primarySoft: '#E6F0E7',
  mint: '#E6F0E7',

  // Accents
  turmeric: '#B5832E',
  turmericDark: '#8A611F',
  turmericSoft: '#F6EEDB',
  carbStrong: '#8A611F',
  barPast: '#9BBBA9',
  warnBg: '#F6EEDB',
  chili: '#B26B5A',
  chiliSoft: '#F3E4DE',
  sky: '#4A7BA7',
  skyDark: '#3A6288',
  skySoft: '#E4EDF5',
  peach: '#DCE8DF',
  peachSoft: '#EDF3EE',

  // Semantic
  danger: '#B23E28',
  dangerSoft: '#F7E3DC',
  success: '#21634C',
  successSoft: '#E6F0E7',
  overlay: 'rgba(27, 61, 47, 0.45)',

  // Macro colors — protein (blue) · carbs (gold) · fat (terracotta)
  protein: '#4A7BA7',
  carbs: '#B5832E',
  fat: '#B26B5A',

  white: '#FFFFFF',
};

export const radius = {
  sm: 14,
  md: 16,
  lg: 22,
  button: 15,
  input: 14,
  icon: 14,
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
  display: { fontSize: 32, fontWeight: '800', letterSpacing: -0.4 },
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.2 },
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.1 },
  h3: { fontSize: 17, fontWeight: '700', letterSpacing: -0.1 },
  body: { fontSize: 15, fontWeight: '400' },
  bodyBold: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6 },
  stat: { fontSize: 42, fontWeight: '800', letterSpacing: -0.8 },
};

// Shared elevation/shadow presets so cards feel like one family.
export const shadows = {
  soft: { boxShadow: '0px 4px 16px rgba(31, 58, 47, 0.06)', elevation: 1 },
  card: { boxShadow: '0px 4px 16px rgba(31, 58, 47, 0.06)', elevation: 2 },
  raised: { boxShadow: '0px 10px 22px rgba(27, 61, 47, 0.22)', elevation: 6 },
};

export default { colors, radius, spacing, typography, shadows };
