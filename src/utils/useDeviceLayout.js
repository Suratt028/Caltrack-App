import { useWindowDimensions } from 'react-native';

// Same breakpoints the screens already use (web sm / lg).
export const BREAKPOINTS = { tablet: 640, desktop: 1024 };

// Fixed chart heights per device class. Wider screens get taller charts so a
// chart keeps a readable shape instead of turning into a long flat strip.
export const CHART_HEIGHTS = {
  cumulative: { mobile: 210, tablet: 250, desktop: 280 },
  macro: { mobile: 170, tablet: 210, desktop: 240 },
  // Same height as `macro` on desktop, where the two sit side by side.
  daily: { mobile: 190, tablet: 210, desktop: 240 },
  weight: { mobile: 200, tablet: 230, desktop: 250 },
  bmi: { mobile: 220, tablet: 240, desktop: 250 },
};

export function deviceFor(width) {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

/**
 * Which device class the app is on right now (re-renders on resize/rotation).
 * @returns {{ device: 'mobile'|'tablet'|'desktop', isMobile: boolean, isTablet: boolean, isDesktop: boolean, chartHeight: (kind: keyof CHART_HEIGHTS) => number }}
 */
export default function useDeviceLayout() {
  const { width } = useWindowDimensions();
  const device = deviceFor(width);
  return {
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    chartHeight: (kind) => CHART_HEIGHTS[kind]?.[device] ?? CHART_HEIGHTS[kind]?.mobile,
  };
}
