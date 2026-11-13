// Builds the final, upload-ready food dataset from thaiFoods_proposed.json
// (thaiFoods_clean.json + INMU additions, made by scripts/propose-food-updates.js)
// plus the international foods in data/usda/usda-foods.json when present
// (made by scripts/fetch-usda.js). Never touches the database or the inputs.
//
//   node scripts/build-final-foods.js
//
// Steps:
//   1. Drop rows missing any of kcal / protein / fat / available carbs: they
//      can't be logged (the scan review refuses them) and only show as 0 kcal.
//   2. Merge duplicate names whose core values are the same sample; keep both
//      rows (and list them) when the values differ — mixing samples is a guess.
//   3. Clear sugar that exceeds available carbohydrate (sugar is part of it, so
//      the value is wrong — in the dessert group it is often a shifted column,
//      up to 497 g per 100 g). The old value is kept in originalValues.
//   4. Remove every null field, so each value in the file is a real number/text.
//      The app and server treat a missing field exactly like null.
//   5. Flag any other physically impossible values for review (not changed).
//
// Outputs:
//   thaiFoods_final.json                 the dataset to upload after review
//   reports/food-final-report.md         what was dropped, merged and flagged
//   reports/food-final-dropped.csv       every dropped row with its missing fields
//
// Upload after review:  node seed-foods.js --file thaiFoods_final.json

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'thaiFoods_proposed.json');
const USDA = path.join(ROOT, 'data', 'usda', 'usda-foods.json');
const OUT_JSON = path.join(ROOT, 'thaiFoods_final.json');
const REPORT_DIR = path.join(ROOT, 'reports');

const REQUIRED = ['kcal', 'protein_g', 'fat_g', 'carbAvailable_g'];
// Same sample when every core value agrees to within rounding.
const SAME_SAMPLE_TOLERANCE = 0.05;
const MACRO_FIELDS = ['water_g', 'protein_g', 'fat_g', 'carbAvailable_g', 'carbTotal_g', 'fiber_g', 'ash_g', 'sugar_g'];
const SUGAR_TOLERANCE_G = 0.5;
const MAX_KCAL_PER_100G = 900; // pure fat is ~900 kcal/100 g
const MASS_MAX_G = 105; // water + macros + ash per 100 g, allowing rounding

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isEmpty = (v) => v == null || (typeof v === 'string' && v.trim() === '');

function stripNulls(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (isEmpty(value)) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // originalValues legitimately records "was null" — keep it as written.
      if (key === 'originalValues') { if (Object.keys(value).length) out[key] = value; continue; }
      const inner = stripNulls(value);
      if (Object.keys(inner).length) out[key] = inner;
      continue;
    }
    out[key] = value;
  }
  return out;
}

function filledCount(row) {
  return Object.values(row).filter((v) => !isEmpty(v)).length;
}

function sameSample(a, b) {
  return REQUIRED.every((k) => Math.abs(a[k] - b[k]) <= SAME_SAMPLE_TOLERANCE);
}

function impossibleValues(row) {
  const issues = [];
  for (const k of [...MACRO_FIELDS, 'kcal']) {
    if (isNum(row[k]) && row[k] < 0) issues.push(`${k} is negative (${row[k]})`);
  }
  for (const k of MACRO_FIELDS) {
    if (isNum(row[k]) && row[k] > 100) issues.push(`${k} ${row[k]} g > 100 g per 100 g`);
  }
  if (isNum(row.kcal) && row.kcal > MAX_KCAL_PER_100G) issues.push(`kcal ${row.kcal} > ${MAX_KCAL_PER_100G}`);
  const mass = ['water_g', 'protein_g', 'fat_g', 'carbAvailable_g', 'fiber_g', 'ash_g']
    .reduce((sum, k) => sum + (isNum(row[k]) ? row[k] : 0), 0);
  if (mass > MASS_MAX_G) issues.push(`water+macros+ash = ${Math.round(mass)} g per 100 g`);
  return issues;
}

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function main() {
  const proposed = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  // USDA rows only fill gaps: a Thai table entry with the same name or id wins.
  const usdaAll = fs.existsSync(USDA) ? JSON.parse(fs.readFileSync(USDA, 'utf8')).foods || [] : [];
  const takenNames = new Set(proposed.map((r) => String(r.nameTh).trim()));
  const takenIds = new Set(proposed.map((r) => String(r.foodId)));
  const usdaAdded = usdaAll.filter((r) => !takenNames.has(String(r.nameTh).trim()) && !takenIds.has(String(r.foodId)));
  const usdaSkipped = usdaAll.filter((r) => !usdaAdded.includes(r));
  const source = [...proposed, ...usdaAdded];

  // 1. Drop rows that can't be used.
  const dropped = [];
  const usable = [];
  for (const row of source) {
    const missing = REQUIRED.filter((k) => !isNum(row[k]));
    if (missing.length) dropped.push({ row, missing });
    else usable.push(row);
  }

  // 2. Merge duplicate names that are the same sample.
  const byName = new Map();
  usable.forEach((row) => {
    const key = String(row.nameTh).trim();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(row);
  });
  const merged = []; // { kept, removed: [] }
  const conflicting = []; // { name, rows }
  const removedIds = new Set();
  for (const [name, rows] of byName) {
    if (rows.length < 2) continue;
    const groups = [];
    for (const row of rows) {
      const group = groups.find((g) => sameSample(g[0], row));
      if (group) group.push(row); else groups.push([row]);
    }
    for (const group of groups) {
      if (group.length < 2) continue;
      // Keep the most complete row (then the lowest foodId); fill its gaps from the others.
      group.sort((a, b) => filledCount(b) - filledCount(a) || Number(a.foodId) - Number(b.foodId));
      const [kept, ...others] = group;
      for (const other of others) {
        for (const [k, v] of Object.entries(other)) {
          if (isEmpty(kept[k]) && !isEmpty(v)) kept[k] = v;
        }
        removedIds.add(other.foodId);
      }
      kept.mergedFrom = others.map((o) => String(o.foodId));
      merged.push({ kept, removed: others });
    }
    if (groups.length > 1) conflicting.push({ name, rows: groups.map((g) => g[0]) });
  }

  // 3. Clear impossible sugar; 4. strip nulls; 5. flag what's left.
  const sugarCleared = [];
  const flagged = [];
  const finalRows = usable
    .filter((row) => !removedIds.has(row.foodId))
    .map((original) => {
      const row = { ...original };
      if (isNum(row.sugar_g) && row.sugar_g > row.carbAvailable_g + SUGAR_TOLERANCE_G) {
        sugarCleared.push({ row, sugar: row.sugar_g });
        row.originalValues = { ...(row.originalValues || {}), sugar_g: row.sugar_g };
        row.sugar_g = null;
      }
      const issues = impossibleValues(row);
      if (issues.length) flagged.push({ row, issues });
      return stripNulls(row);
    });

  const nullsBefore = source.reduce((n, row) => n + Object.values(row).filter((v) => v === null).length, 0);
  const nullsAfter = finalRows.reduce((n, row) => n + Object.values(row).filter((v) => v === null).length, 0);
  const fieldsPerRow = (rows) => (rows.reduce((n, r) => n + Object.keys(r).length, 0) / rows.length).toFixed(1);

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(finalRows, null, 2)}\n`);
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const csv = ['foodId,nameTh,foodGroupTh,missing,source', ...dropped.map(({ row, missing }) =>
    [row.foodId, row.nameTh, row.foodGroupTh, missing.join(' '), row.source].map(csvCell).join(','))];
  fs.writeFileSync(path.join(REPORT_DIR, 'food-final-dropped.csv'), `﻿${csv.join('\r\n')}\r\n`);

  const groupCounts = {};
  finalRows.forEach((r) => { groupCounts[r.foodGroupTh || '—'] = (groupCounts[r.foodGroupTh || '—'] || 0) + 1; });

  const md = [
    '# Final food dataset',
    '',
    `\`thaiFoods_proposed.json\` (${proposed.length} rows) + \`data/usda/usda-foods.json\` (${usdaAdded.length} of ${usdaAll.length} rows added) → \`thaiFoods_final.json\` (${finalRows.length} rows). Generated by \`scripts/build-final-foods.js\`; nothing was written to the database.`,
    '',
    'Upload after review: `node seed-foods.js --file thaiFoods_final.json`',
    '',
    '## Summary',
    '',
    '| | rows |',
    '|---|---|',
    `| input: Thai tables + INMU (\`thaiFoods_proposed.json\`) | ${proposed.length} |`,
    `| input: USDA FoodData Central (name not already in the Thai tables) | ${usdaAdded.length} |`,
    ...(usdaSkipped.length ? [`| USDA rows skipped (same name or id already present) | ${usdaSkipped.length} |`] : []),
    `| dropped: missing kcal, protein, fat or carbs | ${dropped.length} |`,
    `| merged into another row (same name, same values) | ${removedIds.size} |`,
    `| **final** | **${finalRows.length}** |`,
    `| rows with at least one estimated value (\`estimated\`) | ${finalRows.filter((r) => r.estimated).length} |`,
    `| rows whose sugar was cleared (sugar > available carbs) | ${sugarCleared.length} |`,
    `| rows flagged for other impossible values (kept, not changed) | ${flagged.length} |`,
    '',
    `Null values: ${nullsBefore} in the input → ${nullsAfter} in the final file (empty fields are omitted; average ${fieldsPerRow(source)} → ${fieldsPerRow(finalRows)} fields per row).`,
    '',
    '## Dropped rows',
    '',
    'Full list with food group and source: `reports/food-final-dropped.csv`.',
    '',
    '| foodId | nameTh | missing |',
    '|---|---|---|',
    ...dropped.map(({ row, missing }) => `| ${row.foodId} | ${row.nameTh} | ${missing.join(', ')} |`),
    '',
    '## Merged duplicates',
    '',
    merged.length ? '| kept | removed | nameTh |' : 'None.',
    ...(merged.length ? ['|---|---|---|'] : []),
    ...merged.map(({ kept, removed }) => `| ${kept.foodId} | ${removed.map((r) => r.foodId).join(', ')} | ${kept.nameTh} |`),
    '',
    '## Same name, different values (kept apart — needs a person)',
    '',
    conflicting.length ? 'These are different samples or recipes under one name. Both rows stay; give them distinct names (e.g. by region or recipe) before relying on search.' : 'None.',
    '',
    ...(conflicting.length ? ['| nameTh | foodId: kcal / P / F / C |', '|---|---|'] : []),
    ...conflicting.map(({ name, rows }) => `| ${name} | ${rows.map((r) => `${r.foodId}: ${r.kcal} / ${r.protein_g} / ${r.fat_g} / ${r.carbAvailable_g}`).join('<br>')} |`),
    '',
    '## Sugar cleared',
    '',
    'Sugar is part of available carbohydrate, so a larger value is wrong. Old values are in each row\'s `originalValues.sugar_g`.',
    '',
    sugarCleared.length ? '| foodId | nameTh | group | sugar (removed) | available carbs |' : 'None.',
    ...(sugarCleared.length ? ['|---|---|---|---|---|'] : []),
    ...sugarCleared.map(({ row, sugar }) => `| ${row.foodId} | ${row.nameTh} | ${row.foodGroupTh} | ${sugar} | ${row.carbAvailable_g} |`),
    '',
    '## Other impossible values (kept, not changed)',
    '',
    flagged.length ? '| foodId | nameTh | issue |' : 'None.',
    ...(flagged.length ? ['|---|---|---|'] : []),
    ...flagged.map(({ row, issues }) => `| ${row.foodId} | ${row.nameTh} | ${issues.join('; ')} |`),
    '',
    '## Rows per food group',
    '',
    '| group | rows |',
    '|---|---|',
    ...Object.entries(groupCounts).sort((a, b) => b[1] - a[1]).map(([g, n]) => `| ${g} | ${n} |`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(REPORT_DIR, 'food-final-report.md'), md);

  console.log(`rows ${proposed.length} + USDA ${usdaAdded.length} → ${finalRows.length} (dropped ${dropped.length}, merged ${removedIds.size})`);
  console.log(`nulls ${nullsBefore} → ${nullsAfter}; sugar cleared ${sugarCleared.length}; flagged ${flagged.length}; same-name conflicts ${conflicting.length}`);
  console.log('wrote thaiFoods_final.json, reports/food-final-report.md, reports/food-final-dropped.csv');
}

main();
