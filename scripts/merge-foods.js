// Merges every food source into one dataset without dropping rows, filling
// gaps value by value from the most trustworthy source available, and records
// where each filled value came from. Never touches the database or the inputs.
//
//   node scripts/merge-foods.js
//
// Inputs
//   thaiFoods_proposed.json      Thai Food Composition Table rows (cleaned) + the
//                                reviewed INMU fixes/additions (scripts/propose-food-updates.js)
//   reports/foods-db-snapshot-*  the live database (newest snapshot); rows missing
//                                from the file above are kept, never lost
//   data/usda/usda-foods.json    international foods (scripts/fetch-usda.js)
//   data/inmu/inmu-all.json      the whole INMU database (scripts/fetch-inmu.js --all);
//                                falls back to data/inmu/inmu-foods.json
//
// Layers, per value (a higher layer never overwrites a lower one):
//   1. measured value already in the row
//   2. INMU, same food: matched by Thai name (raw/fresh suffix ignored), with
//      English or scientific name agreeing, and macros agreeing when both rows
//      have them — so a different sample or recipe never fills our gaps
//   3. calculated from the row's own values (carbTotal, kcal, carbs by
//      difference, vitamin A RAE); listed in `estimated`
//   4. left empty — never 0 — and listed in `missing`
// INMU foods with no match are added as new rows, so nothing INMU has is lost.
//
// Every row also gets: valueSources {field: source}, completeness
// ('complete' when kcal/protein/fat/carbs exist, else 'partial'), nameEn when any
// source has one, and alternatives {field: [{value, source, reason}]} for values
// set aside (e.g. sugar larger than carbohydrate) instead of deleting them.
//
// Outputs
//   thaiFoods_merged.json             the merged dataset
//   reports/food-merge-report.md      coverage before/after per layer, matches, flags
//   reports/food-merge-review.csv     matches and flags a person should check

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'reports');
const OUT_JSON = path.join(ROOT, 'thaiFoods_merged.json');

const NUTRIENTS = [
  'kcal', 'water_g', 'protein_g', 'fat_g', 'carbAvailable_g', 'carbTotal_g', 'fiber_g', 'sugar_g', 'ash_g',
  'calcium_mg', 'phosphorus_mg', 'magnesium_mg', 'sodium_mg', 'potassium_mg', 'iron_mg', 'copper_mg', 'zinc_mg',
  'iodine_ug', 'betacarotene_ug', 'retinol_ug', 'vitaminA_RAE_ug', 'thiamin_mg', 'riboflavin_mg', 'niacin_mg',
  'vitaminC_mg', 'vitaminE_mg', 'folate_ug', 'cholesterol_mg', 'saturatedFat_g',
];
const CORE = ['kcal', 'protein_g', 'fat_g', 'carbAvailable_g'];
const KCAL_PER_G = { protein: 4, carb: 4, fat: 9, fiber: 2 };
const SUGAR_TOLERANCE_G = 0.5;
const ML_PER_US_FL_OZ = 29.5735;
const BEVERAGE_GROUP = 'อื่นๆ ของทอด เครื่องดื่ม';
// INMU code letters that none of our matched rows tell us a group for.
const GROUP_BY_INMU_LETTER = {
  K: ['ไขมัน น้ำมัน และผลิตภัณฑ์', 'Fats, oils and their products'],
  M: ['น้ำตาลและลูกกวาด', 'Sugars and confectionery'],
};
// INMU food codes look like "D133" / "T212"; anything else is a test record.
const VALID_INMU_CODE = /^[A-Z]\d+[A-Za-z]?$/;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const round1 = (v) => Math.round(v * 10) / 10;
const round2 = (v) => Math.round(v * 100) / 100;

// ---------------------------------------------------------------- inputs ----

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

function newestSnapshot() {
  const files = fs.existsSync(REPORT_DIR)
    ? fs.readdirSync(REPORT_DIR).filter((f) => /^foods-db-snapshot-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
    : [];
  return files.length ? path.join('reports', files[files.length - 1]) : null;
}

function loadInmu() {
  const file = ['data/inmu/inmu-all.json', 'data/inmu/inmu-foods.json'].find((f) => fs.existsSync(path.join(ROOT, f)));
  if (!file) return { file: null, foods: [] };
  const raw = readJson(file);
  const all = Object.values(raw.foods || {}).filter((f) => f && f.code);
  return {
    file,
    meta: raw,
    foods: all.filter((f) => VALID_INMU_CODE.test(f.code)),
    skipped: all.filter((f) => !VALID_INMU_CODE.test(f.code)),
  };
}

// Some bottled drinks in the Thai table give values per bottle ("1 bottle (20 oz)")
// with no energy, water or carbs: e.g. 11 g fat — impossible per 100 g of iced
// coffee, normal per 590 mL bottle. Convert them to per 100 g (density ~1 g/mL),
// keeping the per-bottle values in originalValues.
function perServingToPer100g(row) {
  const oz = Number(String(row.servingSize || '').match(/(\d+(?:\.\d+)?)\s*oz/i)?.[1]);
  if (!oz || row.foodGroupTh !== BEVERAGE_GROUP || isNum(row.kcal) || isNum(row.water_g)) return false;
  const factor = 100 / (oz * ML_PER_US_FL_OZ);
  row.originalValues = { ...(row.originalValues || {}) };
  for (const field of NUTRIENTS) {
    if (!isNum(row[field])) continue;
    row.originalValues[field] = row[field];
    row[field] = round2(row[field] * factor);
    row.valueSources[field] = 'thai-table (per bottle → per 100 g)';
  }
  row.originalValues.basis = `per ${row.servingSize}`;
  row.servingGrams = Math.round(oz * ML_PER_US_FL_OZ);
  return true;
}

// --------------------------------------------------------------- matching ---

const RAW_SUFFIX = /,\s*(ดิบ|สด)$/;
const normTh = (s) => String(s || '').replace(RAW_SUFFIX, '').replace(/[\s,()./\-–]+/g, '').toLowerCase();
const normEn = (s) => String(s || '').toLowerCase().replace(/\b(raw|fresh)\b/g, '').replace(/[^a-z]+/g, '');
const normSci = (s) => String(s || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim().split(' ').slice(0, 2).join(' ');

// Both rows describe the same sample when the macros both of them have agree.
function macroAgreement(a, b) {
  const checks = [
    ['kcal', 15, 0.2],
    ['protein_g', 1.5, 0.25],
    ['fat_g', 1.5, 0.3],
    ['carbAvailable_g', 2, 0.25],
  ];
  let compared = 0;
  for (const [field, absTol, relTol] of checks) {
    if (!isNum(a[field]) || !isNum(b[field])) continue;
    compared += 1;
    const diff = Math.abs(a[field] - b[field]);
    if (diff > Math.max(absTol, relTol * Math.max(Math.abs(a[field]), Math.abs(b[field])))) return { ok: false, compared };
  }
  return { ok: true, compared };
}

// Values identical to INMU's (kcal, protein and fat all equal) mean the Thai
// table copied that INMU record, whatever either one calls the food.
const valueKey = (v) => (['kcal', 'protein_g', 'fat_g'].every((k) => isNum(v?.[k])) ? `${v.kcal}|${v.protein_g}|${v.fat_g}` : null);

// Second chance for rows whose Thai name differs from INMU's spelling or
// wording: identical values, or the same English name with agreeing macros.
function matchInmuOther(row, inmuByValues, inmuByEnglish) {
  const key = valueKey(row);
  const identical = key ? (inmuByValues.get(key) || []) : [];
  if (identical.length === 1) return { food: identical[0], how: 'identical-values' };
  const en = normEn(row.nameEn);
  const byEnglish = en ? (inmuByEnglish.get(en) || []) : [];
  const agreeing = byEnglish
    .map((food) => ({ food, agreement: macroAgreement(row, food.values || {}) }))
    .filter((s) => s.agreement.ok && s.agreement.compared >= 2)
    .sort((a, b) => Math.abs((a.food.values.kcal ?? 0) - (row.kcal ?? 0)) - Math.abs((b.food.values.kcal ?? 0) - (row.kcal ?? 0)));
  if (agreeing.length) return { food: agreeing[0].food, how: `english+macros(${agreeing[0].agreement.compared})` };
  return null;
}

// Returns { food, how } for the INMU food that is the same as `row`, or a reason it isn't used.
function matchInmu(row, inmuByName, inmuById) {
  const explicit = row.sourceRef?.inmuId ?? (String(row.foodId).startsWith('INMU-') ? null : undefined);
  if (explicit != null && inmuById.has(explicit)) return { food: inmuById.get(explicit), how: 'sourceRef' };
  if (String(row.foodId).startsWith('INMU-')) {
    const code = String(row.foodId).slice(5);
    const byCode = [...inmuById.values()].find((f) => f.code === code);
    if (byCode) return { food: byCode, how: 'code' };
  }
  const candidates = inmuByName.get(normTh(row.nameTh)) || [];
  if (!candidates.length) return null;
  const scored = candidates.map((food) => {
    const values = food.values || {};
    const agreement = macroAgreement(row, values);
    const enSame = Boolean(row.nameEn && food.english && normEn(row.nameEn) === normEn(food.english));
    const sciSame = Boolean(row.scientificName && food.scientific && normSci(row.scientificName) === normSci(food.scientific));
    const exactTh = String(row.nameTh).replace(/\s+/g, '') === String(food.thai || '').replace(/\s+/g, '');
    const kcalDiff = isNum(row.kcal) && isNum(values.kcal) ? Math.abs(row.kcal - values.kcal) : Infinity;
    return { food, agreement, enSame, sciSame, exactTh, kcalDiff };
  });
  // Accept when macros agree, and the identity is backed by something besides a similar name.
  const accepted = scored
    .filter((s) => s.agreement.ok && (s.agreement.compared >= 2 || s.enSame || s.sciSame || s.exactTh))
    .sort((a, b) => a.kcalDiff - b.kcalDiff);
  if (accepted.length) {
    const best = accepted[0];
    const how = [best.exactTh ? 'thai-exact' : 'thai-name', best.enSame && 'english', best.sciSame && 'scientific', best.agreement.compared && `macros(${best.agreement.compared})`]
      .filter(Boolean).join('+');
    return { food: best.food, how };
  }
  return { rejected: scored.map((s) => s.food), reason: scored.some((s) => !s.agreement.ok) ? 'same name, macros differ (different sample/recipe)' : 'same name, nothing else agrees' };
}

// ---------------------------------------------------------------- filling ---

function setValue(row, field, value, source) {
  row[field] = value;
  row.valueSources[field] = source;
}

function fillFromInmu(row, inmu) {
  const filled = [];
  for (const field of NUTRIENTS) {
    const value = inmu.values?.[field];
    if (!isNum(row[field]) && isNum(value)) {
      setValue(row, field, value, `INMU:${inmu.code}`);
      filled.push(field);
    }
  }
  if (!row.nameEn && inmu.english) { row.nameEn = inmu.english; row.valueSources.nameEn = `INMU:${inmu.code}`; }
  if (!row.scientificName && inmu.scientific) { row.scientificName = inmu.scientific; row.valueSources.scientificName = `INMU:${inmu.code}`; }
  return filled;
}

function markEstimated(row, field, value, rule) {
  setValue(row, field, round1(value), `calc:${rule}`);
  row.estimated = [...new Set([...(row.estimated || []), field])];
}

function fillByCalculation(row) {
  const filled = [];
  const fiber = isNum(row.fiber_g) ? row.fiber_g : 0;
  // Available carbs by difference: 100 − water − protein − fat − ash − fibre.
  if (!isNum(row.carbAvailable_g) && ['water_g', 'protein_g', 'fat_g', 'ash_g'].every((k) => isNum(row[k]))) {
    const value = 100 - row.water_g - row.protein_g - row.fat_g - row.ash_g - fiber;
    if (value >= -1.5 && value <= 100) { markEstimated(row, 'carbAvailable_g', Math.max(0, value), 'carb-by-difference'); filled.push('carbAvailable_g'); }
  }
  // Coffee/tea/milk drinks: practically all their carbohydrate is sugar.
  if (!isNum(row.carbAvailable_g) && isNum(row.sugar_g) && row.foodGroupTh === BEVERAGE_GROUP) {
    markEstimated(row, 'carbAvailable_g', row.sugar_g, 'drink carbs ≈ sugar');
    filled.push('carbAvailable_g');
  }
  if (!isNum(row.kcal) && ['protein_g', 'fat_g', 'carbAvailable_g'].every((k) => isNum(row[k]))) {
    const value = KCAL_PER_G.protein * row.protein_g + KCAL_PER_G.carb * row.carbAvailable_g + KCAL_PER_G.fat * row.fat_g + KCAL_PER_G.fiber * fiber;
    markEstimated(row, 'kcal', Math.round(value), 'atwater');
    filled.push('kcal');
  }
  if (!isNum(row.carbTotal_g) && isNum(row.carbAvailable_g) && isNum(row.fiber_g)) {
    markEstimated(row, 'carbTotal_g', row.carbAvailable_g + row.fiber_g, 'carbAvailable+fiber');
    filled.push('carbTotal_g');
  }
  // RAE = retinol + β-carotene / 12 (Institute of Medicine 2001).
  if (!isNum(row.vitaminA_RAE_ug) && isNum(row.retinol_ug) && isNum(row.betacarotene_ug)) {
    markEstimated(row, 'vitaminA_RAE_ug', row.retinol_ug + row.betacarotene_ug / 12, 'retinol+betacarotene/12');
    filled.push('vitaminA_RAE_ug');
  }
  return filled;
}

// ------------------------------------------------------------- validation ---

function setAside(row, field, reason) {
  row.alternatives = row.alternatives || {};
  (row.alternatives[field] ||= []).push({ value: row[field], source: row.valueSources[field] || 'original', reason });
  row[field] = null;
  delete row.valueSources[field];
}

function validate(row) {
  const flags = [];
  if (isNum(row.sugar_g) && isNum(row.carbAvailable_g) && row.sugar_g > row.carbAvailable_g + SUGAR_TOLERANCE_G) {
    setAside(row, 'sugar_g', `sugar ${row.sugar_g} g > available carbohydrate ${row.carbAvailable_g} g`);
    flags.push('sugar set aside (> carbs)');
  }
  for (const field of NUTRIENTS) {
    if (isNum(row[field]) && row[field] < 0) flags.push(`${field} negative`);
  }
  if (isNum(row.fiber_g) && isNum(row.carbTotal_g) && row.fiber_g > row.carbTotal_g + 0.5) flags.push('fibre > total carbohydrate');
  const mass = ['water_g', 'protein_g', 'fat_g', 'carbAvailable_g', 'fiber_g', 'ash_g'].reduce((s, k) => s + (isNum(row[k]) ? row[k] : 0), 0);
  if (mass > 105) flags.push(`water+macros+ash ${Math.round(mass)} g/100 g`);
  if (CORE.every((k) => isNum(row[k])) && !(row.estimated || []).includes('kcal')) {
    const est = KCAL_PER_G.protein * row.protein_g + KCAL_PER_G.carb * row.carbAvailable_g + KCAL_PER_G.fat * row.fat_g + KCAL_PER_G.fiber * (row.fiber_g || 0);
    if (Math.abs(row.kcal - est) > 20 && Math.abs(row.kcal - est) / Math.max(row.kcal, 1) > 0.25) flags.push(`kcal ${row.kcal} vs ${Math.round(est)} from macros`);
  }
  return flags;
}

// ------------------------------------------------------------------- main ---

function coverage(rows) {
  return Object.fromEntries(NUTRIENTS.map((f) => [f, rows.filter((r) => isNum(r[f])).length]));
}

function main() {
  const proposed = readJson('thaiFoods_proposed.json');
  const snapshotFile = newestSnapshot();
  const snapshot = snapshotFile ? readJson(snapshotFile) : [];
  const usda = fs.existsSync(path.join(ROOT, 'data/usda/usda-foods.json')) ? readJson('data/usda/usda-foods.json').foods || [] : [];
  const inmu = loadInmu();

  // --- Base: every row from every source, keyed by foodId, nothing dropped.
  const base = new Map();
  const addBase = (row, origin) => {
    const id = String(row.foodId);
    if (base.has(id)) return false;
    const { _id, __v, ...clean } = row;
    base.set(id, { ...clean, foodId: id, origins: [origin] });
    return true;
  };
  proposed.forEach((r) => addBase(r, 'thai-table'));
  const fromDbOnly = snapshot.filter((r) => addBase(r, 'database'));
  const takenNames = new Set([...base.values()].map((r) => normTh(r.nameTh)));
  const usdaAdded = usda.filter((r) => !takenNames.has(normTh(r.nameTh)) && addBase(r, 'usda'));

  const rows = [...base.values()].map((r) => ({
    ...r,
    valueSources: Object.fromEntries(NUTRIENTS.filter((f) => isNum(r[f])).map((f) => [f, r.estimated?.includes(f) ? 'calc:clean-foods' : sourceTag(r)])),
  }));
  const before = coverage(rows);
  const perBottle = rows.filter(perServingToPer100g);

  // --- Layer 2: INMU, same food only.
  const inmuByName = new Map();
  const inmuById = new Map();
  const inmuByValues = new Map();
  const inmuByEnglish = new Map();
  const index = (map, key, food) => { if (key) (map.get(key) || map.set(key, []).get(key)).push(food); };
  for (const food of inmu.foods) {
    inmuById.set(food.inmuId, food);
    index(inmuByName, normTh(food.thai), food);
    index(inmuByValues, valueKey(food.values), food);
    index(inmuByEnglish, normEn(food.english), food);
  }
  const matched = []; // { row, food, how, filled }
  const rejected = []; // { row, foods, reason }
  const usedInmu = new Set();
  for (const row of rows) {
    let m = matchInmu(row, inmuByName, inmuById);
    if (!m?.food) m = matchInmuOther(row, inmuByValues, inmuByEnglish) || m;
    if (!m) continue;
    if (m.food) {
      usedInmu.add(m.food.inmuId);
      const filled = fillFromInmu(row, m.food);
      row.inmuCode = m.food.code;
      matched.push({ row, food: m.food, how: m.how, filled });
    } else {
      rejected.push({ row, foods: m.rejected, reason: m.reason });
      // Same name, different sample or recipe: not mixed into the row and not added
      // as a second row of the same name, but kept on the row so nothing is lost.
      row.alternatives = row.alternatives || {};
      row.alternatives.inmuSamples = m.rejected.map((f) => ({
        code: f.code, nameTh: f.thai, ...Object.fromEntries(CORE.filter((k) => isNum(f.values?.[k])).map((k) => [k, f.values[k]])),
      }));
      m.rejected.forEach((f) => usedInmu.add(f.inmuId));
    }
  }
  const afterInmu = coverage(rows);

  // INMU foods nobody matched become new rows; their food group follows the
  // group most matched rows with the same code letter belong to.
  const groupByLetter = {};
  for (const { row, food } of matched) {
    const letter = food.code[0];
    groupByLetter[letter] ||= {};
    const key = `${row.foodGroupTh}|${row.foodGroupEn}`;
    groupByLetter[letter][key] = (groupByLetter[letter][key] || 0) + 1;
  }
  const groupFor = (code) => {
    const counts = groupByLetter[code[0]];
    if (!counts) return GROUP_BY_INMU_LETTER[code[0]] || [null, null];
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0].split('|');
  };
  const inmuAdded = [];
  const baseByEnglish = new Map();
  rows.forEach((r) => index(baseByEnglish, normEn(r.nameEn), r));
  for (const food of inmu.foods) {
    if (usedInmu.has(food.inmuId)) continue;
    const [groupTh, groupEn] = groupFor(food.code);
    const row = {
      foodId: `INMU-${food.code}`,
      nameTh: food.thai,
      nameEn: food.english || undefined,
      scientificName: food.scientific || undefined,
      foodGroupTh: groupTh || undefined,
      foodGroupEn: groupEn || undefined,
      source: `INMU Thai Food Composition Database, ${inmu.meta?.source?.match(/Online version \d+, \w+ \d{4}/)?.[0] || 'online'}`,
      sourceRef: { database: 'INMU', code: food.code, inmuId: food.inmuId, url: inmu.meta?.url },
      inmuCode: food.code,
      origins: ['inmu'],
      valueSources: {},
    };
    if (base.has(row.foodId)) continue;
    for (const field of NUTRIENTS) {
      if (isNum(food.values?.[field])) setValue(row, field, food.values[field], `INMU:${food.code}`);
    }
    if (isNum(food.values?.density_g_per_ml)) row.density_g_per_ml = food.values.density_g_per_ml;
    if (isNum(food.values?.ediblePortion_pct)) row.ediblePortion_pct = food.values.ediblePortion_pct;
    // Same English name as a row we have, but different values: another sample or
    // variety. Kept as its own row, linked so search can group them.
    const similar = baseByEnglish.get(normEn(food.english)) || [];
    if (similar.length) row.similarTo = similar.map((r) => r.foodId);
    rows.push(row);
    inmuAdded.push(row);
  }

  // --- Names no source has: reviewed translations from data/food-name-translations.json.
  const translations = fs.existsSync(path.join(ROOT, 'data/food-name-translations.json'))
    ? readJson('data/food-name-translations.json').names || {}
    : {};
  let translated = 0;
  for (const row of rows) {
    const t = translations[row.foodId];
    if (!t) continue;
    for (const field of ['nameTh', 'nameEn']) {
      if (!row[field] && t[field]) { row[field] = t[field]; row.valueSources[field] = 'translated'; translated += 1; }
    }
  }

  // --- Layer 3: calculations; then validation.
  const calcFilled = {};
  const flags = [];
  for (const row of rows) {
    for (const f of fillByCalculation(row)) calcFilled[f] = (calcFilled[f] || 0) + 1;
    const rowFlags = validate(row);
    if (rowFlags.length) flags.push({ row, flags: rowFlags });
    row.missing = CORE.filter((k) => !isNum(row[k]));
    row.completeness = row.missing.length ? 'partial' : 'complete';
    if (!row.missing.length) delete row.missing;
  }
  const after = coverage(rows);
  const afterBase = coverage(rows.filter((r) => !r.origins.includes('inmu')));

  // --- Write: omit empty fields (an empty field means "not known", never 0).
  const clean = (row) => Object.fromEntries(Object.entries(row).filter(([, v]) =>
    v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)));
  const out = rows.map(clean).sort((a, b) => String(a.foodGroupTh || '~').localeCompare(String(b.foodGroupTh || '~'), 'th') || String(a.foodId).localeCompare(String(b.foodId)));
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(out, null, 2)}\n`);

  // --- Reports
  const total = out.length;
  const cells = (cov, n) => NUTRIENTS.reduce((s, f) => s + cov[f], 0) / (n * NUTRIENTS.length);
  const pct = (v) => `${(v * 100).toFixed(1)}%`;
  const baseCount = base.size;
  const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const review = [
    ['type', 'foodId', 'nameTh', 'detail', 'inmuCode', 'inmuName'],
    ...matched.filter((m) => !/^(sourceRef|code)$/.test(m.how)).map((m) => ['match', m.row.foodId, m.row.nameTh, `${m.how}; filled ${m.filled.length}: ${m.filled.join(' ')}`, m.food.code, m.food.thai]),
    ...rejected.map((r) => ['not-matched', r.row.foodId, r.row.nameTh, r.reason, r.foods.map((f) => f.code).join(' '), r.foods.map((f) => f.thai).join(' | ')]),
    ...flags.map((f) => ['flag', f.row.foodId, f.row.nameTh, f.flags.join('; '), f.row.inmuCode || '', '']),
    ...inmuAdded.filter((r) => !r.foodGroupTh).map((r) => ['no-group', r.foodId, r.nameTh, 'INMU food group letter not seen in matched rows', r.inmuCode, '']),
  ];
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, 'food-merge-review.csv'), `﻿${review.map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`);

  const md = [
    '# Food merge report',
    '',
    `Generated by \`scripts/merge-foods.js\`; nothing was written to the database. Output: \`thaiFoods_merged.json\` (${total} rows).`,
    '',
    '## Sources',
    '',
    '| source | rows in | how it is used |',
    '|---|---|---|',
    `| \`thaiFoods_proposed.json\` (Thai table + reviewed INMU fixes) | ${proposed.length} | base rows |`,
    `| live database snapshot \`${snapshotFile || '—'}\` | ${snapshot.length} | base rows not in the file above: ${fromDbOnly.length} |`,
    `| USDA FoodData Central | ${usda.length} | new rows whose name isn't already present: ${usdaAdded.length} |`,
    `| INMU \`${inmu.file || '—'}\` | ${inmu.foods.length} | fills gaps of matched rows (${matched.length} rows); unmatched foods added as new rows: ${inmuAdded.length} |`,
    '',
    `No row is dropped: ${baseCount} base rows + ${inmuAdded.length} INMU rows = ${total}. Rows still missing kcal/protein/fat/carbs are kept and marked \`completeness: "partial"\` (${out.filter((r) => r.completeness === 'partial').length} rows).`,
    '',
    '## Coverage per nutrient',
    '',
    `Rows with a value. "base" is before filling (${baseCount} rows); the final column also counts the ${inmuAdded.length} added INMU rows.`,
    '',
    '| nutrient | base before | base + INMU fill | base + INMU + calc | base % before → after | all rows incl. new INMU | all % |',
    '|---|---|---|---|---|---|---|',
    ...NUTRIENTS.map((f) => `| ${f} | ${before[f]} | ${afterInmu[f]} (+${afterInmu[f] - before[f]}) | ${afterBase[f]} | ${pct(before[f] / baseCount)} → ${pct(afterBase[f] / baseCount)} | ${after[f]} | ${pct(after[f] / total)} |`),
    `| **all nutrient cells** | ${pct(cells(before, baseCount))} | ${pct(cells(afterInmu, baseCount))} | ${pct(cells(afterBase, baseCount))} | | ${pct(cells(after, total))} | |`,
    '',
    'INMU has no folate, vitamin E or iodine, so those can only come from the Thai table or USDA.',
    '',
    'Calculated values (listed in each row\'s `estimated`): ' + (Object.entries(calcFilled).map(([f, n]) => `${f} ${n}`).join(', ') || 'none') + '.',
    '',
    '## INMU matching',
    '',
    `- matched and used: ${matched.length} (by how: ${Object.entries(matched.reduce((a, m) => { const k = m.how.split('+')[0]; a[k] = (a[k] || 0) + 1; return a; }, {})).map(([k, n]) => `${k} ${n}`).join(', ')})`,
    `- same name but not used (different sample or recipe): ${rejected.length} — listed in \`reports/food-merge-review.csv\``,
    `- values filled from INMU: ${matched.reduce((s, m) => s + m.filled.length, 0)}`,
    '',
    '## Flags (values kept unless noted)',
    '',
    `${flags.length} rows. Sugar larger than available carbohydrate is moved to \`alternatives.sugar_g\` (not deleted). Everything else is only listed.`,
    '',
    '## Corrections',
    '',
    `- bottled drinks whose values were per bottle, converted to per 100 g (old values in \`originalValues\`): ${perBottle.length} — ${perBottle.map((r) => `${r.foodId} ${r.nameTh}`).join(', ') || 'none'}`,
    `- INMU test records skipped: ${inmu.skipped?.length || 0} (${(inmu.skipped || []).map((f) => f.code).join(', ') || '—'})`,
    `- names filled from \`data/food-name-translations.json\` (tagged \`translated\`, need review): ${translated}`,
    '',
    '## Language',
    '',
    `- rows without an English name: ${out.filter((r) => !r.nameEn).length}`,
    `- rows without a Thai name: ${out.filter((r) => !r.nameTh).length}`,
    `- rows without a food group: ${out.filter((r) => !r.foodGroupTh).length}`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(REPORT_DIR, 'food-merge-report.md'), md);

  console.log(`rows: base ${baseCount} + INMU new ${inmuAdded.length} = ${total} (partial ${out.filter((r) => r.completeness === 'partial').length})`);
  console.log(`INMU: ${inmu.foods.length} foods from ${inmu.file}; matched ${matched.length}, same-name rejected ${rejected.length}, values filled ${matched.reduce((s, m) => s + m.filled.length, 0)}`);
  console.log(`nutrient cells filled (base rows): ${pct(cells(before, baseCount))} → ${pct(cells(afterBase, baseCount))}; all rows ${pct(cells(after, total))}; flags ${flags.length}; new rows similar to existing ${inmuAdded.filter((r) => r.similarTo).length}`);
  console.log('wrote thaiFoods_merged.json, reports/food-merge-report.md, reports/food-merge-review.csv');
}

function sourceTag(row) {
  const s = String(row.source || '');
  if (s.startsWith('USDA')) return `USDA:${row.sourceRef?.fdcId ?? ''}`;
  if (s.startsWith('INMU')) return `INMU:${row.sourceRef?.code ?? ''}`;
  return 'thai-table';
}

main();
