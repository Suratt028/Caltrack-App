// Cleans thaiFoods_full.json and writes a reviewable result. Never touches the
// database or the source file.
//
//   node scripts/clean-foods.js
//
// Outputs:
//   thaiFoods_clean.json                 cleaned dataset (same shape + audit fields)
//   reports/food-cleaning-report.md      summary, method accuracy, rows to review
//   reports/food-cleaning-changes.csv    one line per changed value (opens in Excel)
//
// Every value this script fills in or clears is recorded on the row:
//   estimated:      fields whose value was calculated here, not measured
//   originalValues: the value each changed field had before cleaning
// so the app can label estimates and nothing is silently lost.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'thaiFoods_full.json');
const OUT_JSON = path.join(ROOT, 'thaiFoods_clean.json');
const REPORT_DIR = path.join(ROOT, 'reports');

// Atwater general factors (kcal per gram); fibre counted at 2 kcal/g.
const KCAL_PER_G = { protein: 4, carb: 4, fat: 9, fiber: 2 };
// Ash (mineral residue, mostly salt) is checked by mass balance: water + protein
// + fat + ash + fibre (+ carbs when known) can't exceed ~100 g per 100 g. When
// carbs are unknown that check is weak, so a cap also applies: salted/pickled
// foods reach ~20 g, seasonings (salt, fish sauce, shrimp paste) far more.
const MASS_BALANCE_MAX_G = 105;
const ASH_MAX_G = 25;
const ASH_MAX_G_SEASONING = 60;
const SEASONING_GROUP = 'เครื่องเทศและเครื่องปรุงรส';
// Measured kcal further than this from the Atwater estimate is reported for review.
const KCAL_REVIEW_REL = 0.25;
const KCAL_REVIEW_ABS = 20;
const REQUIRED = ['kcal', 'protein_g', 'fat_g', 'carbAvailable_g'];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const round1 = (v) => Math.round(v * 10) / 10;

function atwaterKcal(f) {
  return (
    KCAL_PER_G.protein * f.protein_g +
    KCAL_PER_G.carb * f.carbAvailable_g +
    KCAL_PER_G.fat * f.fat_g +
    KCAL_PER_G.fiber * (isNum(f.fiber_g) ? f.fiber_g : 0)
  );
}

function ashIsPlausible(f) {
  if (!isNum(f.ash_g) || f.ash_g < 0) return false;
  const known = ['water_g', 'protein_g', 'fat_g', 'fiber_g', 'carbAvailable_g'].reduce((sum, k) => sum + (isNum(f[k]) ? f[k] : 0), 0);
  if (known + f.ash_g > MASS_BALANCE_MAX_G) return false;
  if (isNum(f.carbAvailable_g)) return true; // full balance checked above
  const cap = f.foodGroupTh === SEASONING_GROUP ? ASH_MAX_G_SEASONING : ASH_MAX_G;
  return f.ash_g <= cap;
}

// Carbohydrate by difference: everything per 100 g that isn't water, protein,
// fat, ash or fibre. Returns null when inputs are missing or the result is
// outside 0–100 g (small negative rounding noise is clamped to 0).
// `ashOverride` lets the caller substitute a typical ash value when the row's own is unusable.
function carbByDifference(f, ashOverride = null) {
  if (!['water_g', 'protein_g', 'fat_g'].every((k) => isNum(f[k]))) return null;
  const ash = ashOverride ?? (ashIsPlausible(f) ? f.ash_g : null);
  if (ash == null) return null;
  const value = 100 - f.water_g - f.protein_g - f.fat_g - ash - (isNum(f.fiber_g) ? f.fiber_g : 0);
  if (value < -1.5 || value > 100) return null;
  return round1(Math.max(0, value));
}

// Carbohydrate from measured energy: (kcal − 4P − 9F − 2·fibre) / 4.
function carbFromEnergy(f) {
  if (!['kcal', 'protein_g', 'fat_g'].every((k) => isNum(f[k]))) return null;
  const fiberKcal = KCAL_PER_G.fiber * (isNum(f.fiber_g) ? f.fiber_g : 0);
  const value = (f.kcal - KCAL_PER_G.protein * f.protein_g - KCAL_PER_G.fat * f.fat_g - fiberKcal) / KCAL_PER_G.carb;
  if (value < -1.5 || value > 100) return null;
  return round1(Math.max(0, value));
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

function main() {
  const source = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const changes = []; // { foodId, nameTh, field, before, after, rule }
  const review = []; // rows a person should look at
  const ruleCounts = {};

  // --- Accuracy of the two estimation methods, measured on complete rows ---
  const complete = source.filter((f) => REQUIRED.every((k) => isNum(f[k])));
  const carbDiffErr = complete
    .map((f) => { const c = carbByDifference(f); return c == null ? null : Math.abs(c - f.carbAvailable_g); })
    .filter((v) => v != null).sort((a, b) => a - b);
  const kcalErr = complete.map((f) => Math.abs(atwaterKcal(f) - f.kcal)).sort((a, b) => a - b);

  // Typical ash per food group (median of plausible measured values), used only
  // when a row's own ash is missing or corrupt. Real ash is small for most foods,
  // so the substitution moves carbs by ~1–2 g at most.
  const groupAshMedian = {};
  for (const group of new Set(source.map((f) => f.foodGroupTh))) {
    const values = source.filter((f) => f.foodGroupTh === group && ashIsPlausible(f)).map((f) => f.ash_g).sort((a, b) => a - b);
    if (values.length >= 5) groupAshMedian[group] = percentile(values, 0.5);
  }
  const groupAshErr = complete
    .map((f) => {
      const ash = groupAshMedian[f.foodGroupTh];
      const c = ash == null ? null : carbByDifference(f, ash);
      return c == null ? null : Math.abs(c - f.carbAvailable_g);
    })
    .filter((v) => v != null).sort((a, b) => a - b);

  const record = (row, field, before, after, rule) => {
    changes.push({ foodId: row.foodId, nameTh: row.nameTh, field, before, after, rule });
    ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
    if (!(field in row.originalValues)) row.originalValues[field] = before;
  };

  const cleaned = source.map((original) => {
    const row = { ...original, estimated: [], originalValues: {} };

    // 1. carbTotal_g smaller than carbAvailable_g is impossible (total ⊇ available);
    //    these rows hold a shifted column (often the fibre value). Clear them.
    if (isNum(row.carbTotal_g) && isNum(row.carbAvailable_g) && row.carbTotal_g + 0.5 < row.carbAvailable_g) {
      record(row, 'carbTotal_g', row.carbTotal_g, null, 'carbTotal < carbAvailable (shifted column)');
      row.carbTotal_g = null;
    }

    // 2. Implausible ash: clear it so it can't poison carb-by-difference.
    if (isNum(row.ash_g) && !ashIsPlausible(row)) {
      record(row, 'ash_g', row.ash_g, null, 'ash impossible (mass balance or cap)');
      row.ash_g = null;
    }

    // 3. Fill missing available carbohydrate, best method first:
    //    by difference with the row's own ash → from measured energy →
    //    by difference with the food group's typical ash.
    if (!isNum(row.carbAvailable_g)) {
      const candidates = [
        ['carb by difference', () => carbByDifference(row)],
        ['carb from measured energy', () => carbFromEnergy(row)],
        ['carb by difference (typical ash for food group)', () => (groupAshMedian[row.foodGroupTh] == null ? null : carbByDifference(row, groupAshMedian[row.foodGroupTh]))],
      ];
      for (const [rule, compute] of candidates) {
        const value = compute();
        if (value == null) continue;
        record(row, 'carbAvailable_g', null, value, rule);
        row.carbAvailable_g = value;
        row.estimated.push('carbAvailable_g');
        break;
      }
    }

    // 4. Fill missing energy from macros (Atwater).
    if (!isNum(row.kcal) && ['protein_g', 'fat_g', 'carbAvailable_g'].every((k) => isNum(row[k]))) {
      const value = Math.round(atwaterKcal(row));
      record(row, 'kcal', null, value, 'kcal from Atwater factors');
      row.kcal = value;
      row.estimated.push('kcal');
    }

    // 5. Measured energy that disagrees with its own macros: report, don't guess
    //    which column is wrong (e.g. a typo in kcal vs. in carbs).
    if (!row.estimated.includes('kcal') && REQUIRED.every((k) => isNum(row[k]))) {
      const est = atwaterKcal(row);
      const diff = row.kcal - est;
      if (Math.abs(diff) > KCAL_REVIEW_ABS && Math.abs(diff) / Math.max(row.kcal, 1) > KCAL_REVIEW_REL) {
        review.push({ foodId: row.foodId, nameTh: row.nameTh, issue: `kcal ${row.kcal} vs ${Math.round(est)} from macros (P ${row.protein_g}, F ${row.fat_g}, C ${row.carbAvailable_g})` });
      }
    }

    // 6. Still incomplete: list it so the app can show "no data" and a person can source values.
    const missing = REQUIRED.filter((k) => !isNum(row[k]));
    if (missing.length) {
      review.push({ foodId: row.foodId, nameTh: row.nameTh, issue: `still missing: ${missing.join(', ')}` });
    }

    if (!row.estimated.length) delete row.estimated;
    if (!Object.keys(row.originalValues).length) delete row.originalValues;
    return row;
  });

  // --- Summary numbers ---
  const countMissing = (rows, k) => rows.filter((f) => !isNum(f[k])).length;
  const unusable = (rows) => rows.filter((f) => !REQUIRED.every((k) => isNum(f[k]))).length;
  const nameCounts = new Map();
  cleaned.forEach((f) => nameCounts.set(f.nameTh, (nameCounts.get(f.nameTh) || 0) + 1));
  const duplicateNames = [...nameCounts].filter(([, n]) => n > 1);
  for (const [name, n] of duplicateNames) {
    cleaned.filter((f) => f.nameTh === name).forEach((f) => review.push({ foodId: f.foodId, nameTh: f.nameTh, issue: `duplicate nameTh (${n} rows)` }));
  }

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(cleaned, null, 2)}\n`);
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const csvCell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = ['foodId,nameTh,field,before,after,rule', ...changes.map((c) => [c.foodId, c.nameTh, c.field, c.before, c.after, c.rule].map(csvCell).join(','))];
  fs.writeFileSync(path.join(REPORT_DIR, 'food-cleaning-changes.csv'), `﻿${csv.join('\r\n')}\r\n`);

  const fmt = (v) => (v == null ? '—' : v.toFixed(1));
  const md = [
    '# Food data cleaning report',
    '',
    `Source: \`thaiFoods_full.json\` (${source.length} rows) → \`thaiFoods_clean.json\`. Generated by \`scripts/clean-foods.js\`; nothing was written to the database.`,
    '',
    '## Before / after',
    '',
    '| | before | after |',
    '|---|---|---|',
    ...['kcal', 'protein_g', 'fat_g', 'carbAvailable_g', 'carbTotal_g', 'ash_g'].map((k) => `| \`${k}\` missing | ${countMissing(source, k)} | ${countMissing(cleaned, k)} |`),
    `| rows missing any of kcal/protein/fat/carbAvailable (can't be saved from the scan review; show 0 elsewhere) | ${unusable(source)} | ${unusable(cleaned)} |`,
    `| rows with at least one estimated value | — | ${cleaned.filter((f) => f.estimated).length} |`,
    '',
    '## Changes by rule',
    '',
    '| rule | values changed |',
    '|---|---|',
    ...Object.entries(ruleCounts).map(([rule, n]) => `| ${rule} | ${n} |`),
    '',
    'Every change is listed in `reports/food-cleaning-changes.csv`, and each changed row keeps its old values in `originalValues`.',
    '',
    '## How accurate are the estimates?',
    '',
    `Tested on the ${complete.length} rows that already have measured kcal, protein, fat and carbs:`,
    '',
    `- **Carbs by difference** vs measured carbs (${carbDiffErr.length} rows with usable inputs): median error ${fmt(percentile(carbDiffErr, 0.5))} g, 90th percentile ${fmt(percentile(carbDiffErr, 0.9))} g per 100 g.`,
    `- **Carbs by difference with the food group's typical ash** (used only when a row's ash is missing or corrupt; ${groupAshErr.length} rows): median error ${fmt(percentile(groupAshErr, 0.5))} g, 90th percentile ${fmt(percentile(groupAshErr, 0.9))} g per 100 g.`,
    `- **kcal from Atwater factors** vs measured kcal: median error ${fmt(percentile(kcalErr, 0.5))} kcal, 90th percentile ${fmt(percentile(kcalErr, 0.9))} kcal per 100 g.`,
    '',
    '## Needs a person to review',
    '',
    `${review.length} items. Values here were **not** changed automatically.`,
    '',
    '| foodId | nameTh | issue |',
    '|---|---|---|',
    ...review.map((r) => `| ${r.foodId} | ${r.nameTh} | ${r.issue} |`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(REPORT_DIR, 'food-cleaning-report.md'), md);

  console.log(`rows: ${source.length}`);
  console.log(`unusable rows (missing kcal/protein/fat/carbAvailable): ${unusable(source)} → ${unusable(cleaned)}`);
  console.log('changes by rule:', ruleCounts);
  console.log(`rows to review: ${review.length}`);
  console.log(`wrote ${path.relative(ROOT, OUT_JSON)}, reports/food-cleaning-report.md, reports/food-cleaning-changes.csv`);
}

main();
