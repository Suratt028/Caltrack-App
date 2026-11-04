import { useWindowDimensions } from 'react-native';

// Breakpoints from the design handoff:
//   mobile  < 600  — one column, bottom tab bar
//   tablet  600–1023 — top navigation, two columns where it helps
//   desktop ≥ 1024 — side navigation, multi-column dashboard
export const breakpoints = {
  tablet: 600,
  desktop: 1024,
};

// Widest the content column grows on each layout, so lines stay readable.
export const contentMaxWidth = {
  mobile: 640,
  tablet: 920,
  desktop: 1160,
  // Single-task flows (Portion, Scan) stay narrow even on desktop.
  flow: 640,
};

export function layoutForWidth(width) {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

/**
 * Current layout bucket plus the screen gutter for it.
 * `isWide` is true for tablet and desktop (two-column layouts).
 */
export function useLayout() {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);
  return {
    width,
    layout,
    isMobile: layout === 'mobile',
    isTablet: layout === 'tablet',
    isDesktop: layout === 'desktop',
    isWide: layout !== 'mobile',
    gutter: layout === 'desktop' ? 32 : layout === 'tablet' ? 28 : 16,
  };
}
