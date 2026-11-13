import React, { useEffect, useRef, useState } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// One front-facing body silhouette whose build follows the BMI value: every
// width (shoulders, waist, hips, thighs, arms) is interpolated between a slim
// and a heavy body, so the figure grows smoothly instead of jumping in 5 steps.

const BMI_SLIM = 16;
const BMI_HEAVY = 40;

const lerp = (a, b, t) => a + (b - a) * t;

/** BMI → 0 (slim) … 1 (heavy). Gently eased so the middle range reads clearly. */
export function bodyBuild(bmi) {
  const t = Math.min(Math.max((Number(bmi) - BMI_SLIM) / (BMI_HEAVY - BMI_SLIM), 0), 1);
  return t * (1.15 - 0.15 * t);
}

// Closed / open smooth path through points (Catmull–Rom → cubic Bézier).
function smoothThrough(points, closed = true) {
  const n = points.length;
  const at = (i) => points[closed ? (i + n) % n : Math.min(Math.max(i, 0), n - 1)];
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i += 1) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return closed ? `${d} Z` : d;
}

const CX = 100; // centre line of the 200×400 drawing
const mirror = (pts) => pts.map(([x, y]) => [2 * CX - x, y]);

/** Path data for the whole silhouette at build `t` (0…1). */
export function bodyPaths(t) {
  const L = (a, b) => lerp(a, b, t);
  // Half-widths from the centre line.
  const neck = L(10, 15);
  const shoulder = L(42, 58);
  const chest = L(34, 60);
  const waist = L(27, 76);
  const hip = L(33, 72);
  const thighOut = L(31, 66);
  const kneeOut = L(22, 36);
  const calfOut = L(21, 35);
  const ankleOut = L(12, 18);
  const thighIn = L(4, 0.5);
  const kneeIn = L(6, 6);
  const armUpper = L(10, 21);
  const armLower = L(8, 15);
  const armGap = L(7, 3);

  // Torso incl. neck (right half, top to crotch), mirrored into one closed
  // outline so the neck flows into rounded shoulders.
  const torsoRight = [
    [CX + neck, 46],
    [CX + neck + 1, 58],
    [CX + neck + 10, 66],
    [CX + shoulder - 8, 70],
    [CX + shoulder, 82],
    [CX + chest, 112],
    [CX + waist, 162],
    [CX + hip, 200],
    [CX + hip - 5, 218],
    [CX + 2, 232],
  ];
  const torso = smoothThrough([...torsoRight, ...mirror(torsoRight).reverse()]);

  // Right leg outline; left leg is its mirror.
  const legRight = [
    [CX + 1, 214],
    [CX + hip - 2, 206],
    [CX + thighOut, 246],
    [CX + kneeOut, 300],
    [CX + calfOut, 330],
    [CX + ankleOut, 370],
    [CX + ankleOut + 7, 386],
    [CX + Math.max(kneeIn, 5), 390],
    [CX + kneeIn, 368],
    [CX + kneeIn + 1, 330],
    [CX + kneeIn, 300],
    [CX + thighIn, 246],
  ];

  // Right arm: hangs from a rounded shoulder, with a visible gap from the body;
  // hands sit beside the hips, so heavier builds splay the arms outwards.
  const elbowIn = Math.max(chest, waist * 0.92) + armGap;
  const wristIn = Math.max(waist, hip) + armGap;
  const armRight = [
    [CX + shoulder - 10, 72],
    [CX + shoulder + armUpper * 0.45, 80],
    [CX + shoulder + armUpper * 0.75, 100],
    [CX + elbowIn + armUpper, 152],
    [CX + wristIn + armLower, 210],
    [CX + wristIn + armLower * 0.8, 238],
    [CX + wristIn + armLower * 0.25, 242],
    [CX + wristIn - 1, 216],
    [CX + elbowIn, 156],
    [CX + chest + armGap * 0.5, 114],
    [CX + chest - 4, 96],
  ];

  return {
    headR: L(21, 23),
    neck: '',
    torso,
    legs: [smoothThrough(legRight), smoothThrough(mirror(legRight))],
    arms: [smoothThrough(armRight), smoothThrough(mirror(armRight))],
  };
}

/**
 * @param {{ bmi: number, color: string, height?: number }} props
 * Re-shapes smoothly (≈0.4 s) whenever the BMI changes.
 */
export default function BmiBodyFigure({ bmi, color, height = 220 }) {
  const target = Number.isFinite(Number(bmi)) ? bodyBuild(bmi) : 0.3;
  const [t, setT] = useState(target);
  const from = useRef(target);
  const frame = useRef(null);

  useEffect(() => {
    const start = Date.now();
    const begin = from.current;
    const step = () => {
      const p = Math.min((Date.now() - start) / 400, 1);
      const eased = 1 - (1 - p) ** 3;
      const value = begin + (target - begin) * eased;
      from.current = value;
      setT(value);
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target]);

  const body = bodyPaths(t);
  return (
    <Svg width={height / 2} height={height} viewBox="0 0 200 400">
      <Circle cx={CX} cy={28} r={body.headR} fill={color} />
      {body.arms.map((d, i) => <Path key={`a${i}`} d={d} fill={color} />)}
      {body.legs.map((d, i) => <Path key={`l${i}`} d={d} fill={color} />)}
      <Path d={body.torso} fill={color} />
    </Svg>
  );
}
