// Small helpers shared by the Trends line charts (react-native-svg).

// Axis text: 12 is the smallest size that keeps Thai tone marks readable in SVG.
export const AXIS_FONT_SIZE = 12;
export const VALUE_FONT_SIZE = 13;

/**
 * Monotone cubic (Fritsch–Carlson) path through points: smooth, but never
 * overshoots between two readings, so the curve can't invent a peak or dip.
 * @param {{x:number,y:number}[]} pts sorted by x
 */
export function smoothPath(pts) {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

  const n = pts.length;
  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = pts[i + 1].x - pts[i].x || 1e-6;
    slope[i] = (pts[i + 1].y - pts[i].y) / dx[i];
  }
  const tangent = [slope[0]];
  for (let i = 1; i < n - 1; i += 1) {
    tangent[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  }
  tangent[n - 1] = slope[n - 2];
  for (let i = 0; i < n - 1; i += 1) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      tangent[i] = t * a * slope[i];
      tangent[i + 1] = t * b * slope[i];
    }
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const third = dx[i] / 3;
    d += ` C ${pts[i].x + third} ${pts[i].y + tangent[i] * third}, ${pts[i + 1].x - third} ${pts[i + 1].y - tangent[i + 1] * third}, ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return d;
}

/** Closes a line path down to `baseY` so it can be filled as an area. */
export function areaPath(linePath, pts, baseY) {
  if (!pts.length) return '';
  return `${linePath} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;
}

/**
 * Round axis bounds and ticks around [min, max], e.g. 57.6–59.1 kg -> 57–60 step 1.
 * A flat series still gets a visible band instead of collapsing to one line.
 */
export function niceScale(min, max, tickCount = 4) {
  let lo = Number(min);
  let hi = Number(max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { min: 0, max: 1, ticks: [0, 1] };
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const rawStep = (hi - lo) / Math.max(1, tickCount - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) || 10 * magnitude;
  const niceMin = Math.floor(lo / step) * step;
  const niceMax = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return { min: niceMin, max: niceMax, ticks };
}
