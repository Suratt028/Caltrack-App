// Builds a reviewable proposal from INMU data (data/inmu/inmu-foods.json, made
// by scripts/fetch-inmu.js) on top of thaiFoods_clean.json. Never touches the
// database or the input files.
//
//   node scripts/propose-food-updates.js
//
// Outputs:
//   thaiFoods_proposed.json             thaiFoods_clean.json + the changes below
//   reports/food-update-proposal.md     what changes, why, and what stays unresolved
//   reports/food-update-proposal.csv    one line per changed value (opens in Excel)
//
// Upload after review:  node seed-foods.js --file thaiFoods_proposed.json

const fs = require('fs');
const path = require('path');
const { rankFoodCandidates, isConfidentMatch } = require('../server/foodMatching');

const ROOT = path.join(__dirname, '..');
const CLEAN = path.join(ROOT, 'thaiFoods_clean.json');
const INMU = path.join(ROOT, 'data', 'inmu', 'inmu-foods.json');
const OUT_JSON = path.join(ROOT, 'thaiFoods_proposed.json');
const REPORT_DIR = path.join(ROOT, 'reports');

const NUTRIENT_FIELDS = [
  'kcal', 'water_g', 'protein_g', 'fat_g', 'carbAvailable_g', 'carbTotal_g', 'fiber_g', 'ash_g',
  'calcium_mg', 'phosphorus_mg', 'magnesium_mg', 'sodium_mg', 'potassium_mg', 'iron_mg', 'copper_mg',
  'zinc_mg', 'iodine_ug', 'betacarotene_ug', 'retinol_ug', 'vitaminA_RAE_ug', 'thiamin_mg',
  'riboflavin_mg', 'niacin_mg', 'vitaminC_mg', 'vitaminE_mg', 'sugar_g', 'cholesterol_mg', 'folate_ug',
];
const INMU_SOURCE = 'INMU Thai Food Composition Database, online v3 (2025)';
const GROUP_BY_INMU_PREFIX = {
  T: ['อาหารปรุงสำเร็จ อาหารจานเดียว', 'One plate dishes, main dishes, local foods'],
  F: ['เนื้อสัตว์ เป็ด ไก่ และผลิตภัณฑ์', 'Meat, poultry and their products'],
  Q: ['อื่นๆ ของทอด เครื่องดื่ม', 'Miscellaneous (Fried foods, beverages)'],
};

// ---------------------------------------------------------------------------
// Decisions. Each one names the INMU record it relies on and why.
// ---------------------------------------------------------------------------

// Common dishes the AI scan returns that had no database row. All have complete
// kcal/protein/fat/carbs in INMU. nameTh keeps INMU's wording unless noted.
const ADDITIONS = [
  { inmuId: 1491, why: 'ต้มยำกุ้ง was missing (only noodle versions existed)' },
  { inmuId: 1492, why: 'ต้มยำไก่ was missing' },
  { inmuId: 1489, why: 'ต้มข่าไก่ was missing (only ต้มข่า ทูน่า existed)' },
  { inmuId: 1446, nameTh: 'ผัดกะเพราไก่', why: 'ผัดกะเพราไก่ without rice was missing. INMU names it "กระเพราไก่"; renamed to the usual dish name with the standard spelling so scans match' },
  { inmuId: 1456, why: 'แกงเขียวหวานไก่ on its own was missing (only with rice / ขนมจีน)' },
  { inmuId: 1551, why: 'ข้าวต้มหมู was missing' },
  { inmuId: 1569, why: 'โจ๊กหมู was missing' },
  { inmuId: 900, why: 'ไก่ย่าง was missing' },
  { inmuId: 1513, why: 'ส้มตำไทย was missing (only ปู-กุ้ง / ปลาร้า / อีสาน)' },
  { inmuId: 1519, why: 'หมูสะเต๊ะ was missing (closest INMU record to grilled pork; หมูปิ้ง itself is not in INMU)' },
  { inmuId: 1527, why: 'ก๋วยเตี๋ยวเส้นปลา was missing' },
  { inmuId: 1555, why: 'ข้าวมันไก่ต้ม was missing (only generic ข้าวมันไก่)' },
  { inmuId: 1556, why: 'ข้าวมันไก่ทอด was missing' },
  { inmuId: 1404, nameTh: 'ชานม', servingSize: '100 mL', why: 'No tea drink with complete values existed. INMU gives it per 100 mL; tea is ~1 g/mL, so it is used as per 100 g' },
];

// Changes to existing rows.
//  - 'replace': use INMU's full nutrient set (our row is empty, inconsistent, or a different sample)
//  - 'set': change only the listed fields
//  - 'rename': change nameTh only
const UPDATES = [
  { foodId: '5137', action: 'replace', inmuId: 809, why: 'Row had no nutrient values at all; INMU E117 is the same food (ส้มเช้ง, Citrus sinensis)' },
  { foodId: '14023', action: 'replace', inmuId: 1003, why: 'Row lacked kcal and carbs. INMU F154 is a different sample (P 14.7 vs 16.9 g), so its full set is used instead of mixing samples' },
  { foodId: '4187', action: 'set', inmuId: 588, fields: ['kcal'], why: 'Protein/fat/carbs equal INMU D133 exactly, but kcal was 11 instead of 35' },
  { foodId: '6027', action: 'replace', inmuId: 932, why: 'Stated 16 kcal contradicts its own macros (≈50); INMU F50 gives a consistent set (24 kcal)' },
  { foodId: '7016', action: 'atwater', inmuId: 1071, why: 'Stated 29 kcal contradicts its own macros. Recomputed from them (≈88); INMU G37 (another grouper species) is 82 kcal, which corroborates' },
  { foodId: '11139', action: 'rename', nameTh: 'แกงหอยขม, ภาคกลาง', inmuId: 1473, why: 'Duplicate name. Its macros (P 5.5, F 10) match INMU T292 central style' },
  { foodId: '11191', action: 'rename', nameTh: 'แกงหอยขม, ภาคอีสาน', inmuId: 1474, why: 'Duplicate name. Its macros (P 5.4, F 0.3) match INMU T293 northeastern style' },
  { foodId: '4025', action: 'rename', nameTh: 'ขมิ้นมะม่วง (ขมิ้นขาว)', why: 'Duplicate of 10004 ขมิ้นขาว. This row is mango ginger (Curcuma amada), which is also called ขมิ้นมะม่วง' },
];

// Looked up in INMU but not changed automatically.
const UNRESOLVED = [
  { ref: '4208 ส้มป่อย', note: 'Our row lists Raphanus sativus (radish) as the species and its values differ from INMU D329 ผักส้มป่อย (Acacia concinna, 57 kcal). Which food the row means needs a person to decide.' },
  { ref: '4181 มะเดื่อ, ผลอ่อน', note: 'INMU D345 is incomplete too (no kcal, fat or carbs).' },
  { ref: '4183 มะยม, ยอดอ่อน', note: 'kcal contradicts its macros; INMU D251 has no kcal to compare.' },
  { ref: '5048 เชอร์รี่นอก', note: 'Not in INMU (only wild cherry / cherry tomato).' },
  { ref: '7058 ปลาส้ม, ตัวใหญ่, ปลาหมัก', note: 'INMU only has fried or small/ground variants, not this one.' },
  { ref: '11 café drinks (14046–14058)', note: 'Coffee/tea café drinks are not in INMU. Values would need another source (e.g. the café or a recipe calculation).' },
  { ref: 'Fried garnishes (14039–14045, 14014, 14016)', note: 'Fried garlic, shallot, lemongrass, basil, etc. are not in INMU (only raw versions).' },
  { ref: 'Other incomplete rows (4049, 4077, 4078, 4126, 5047)', note: 'Not found in INMU.' },
  { ref: 'Duplicate names: ลูกชิ้นปลา ทอด (7086 = 14022, identical values)', note: 'True duplicate. Removing one is safe for new logs, but not done automatically.' },
  { ref: 'Duplicate names: ลูกชิ้นกุ้ง ทอด, สมันปลา, ขนมจีนน้ำพริก, ขนมจีนน้ำยาป่า', note: 'Different values from different sources; INMU has no matching variants to tell them apart. Keep, or rename after checking the original tables.' },
  { ref: 'Dishes still missing: ข้าวสวย, ไก่ทอด, หมูปิ้ง, ลาบหมู, ชาไทย, ก๋วยเตี๋ยวเรือ', note: 'Not in INMU online v3, or INMU has no kcal/carbs (ข้าวเจ้า สุก A11). Existing rows cover some: ข้าวเจ้า, นึ่ง; ลาบคั่ว, หมู.' },
  { ref: 'INMU dishes skipped as incomplete', note: 'แกงเขียวหวานหมู (T285), ผัดซีอิ๊ว (T11), ราดหน้า (T13), ผัดขี้เมา (T8): INMU has no kcal or carbs.' },
  { ref: 'Already in our data', note: 'เย็นตาโฟ (11028) and ข้าวราดแกงเขียวหวานไก่ (11047) exist, so INMU T10/T46 were not added.' },
];

// ---------------------------------------------------------------------------

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const atwater = (f) => 4 * f.protein_g + 4 * f.carbAvailable_g + 9 * f.fat_g + 2 * (isNum(f.fiber_g) ? f.fiber_g : 0);
const inmuUrl = 'https://inmu.mahidol.ac.th/thaifcd/home';

function sourceRef(inmu, extra = {}) {
  return { database: INMU_SOURCE, code: inmu.code, inmuId: inmu.inmuId, inmuNameTh: inmu.thai, url: inmuUrl, ...extra };
}

function main() {
  const clean = JSON.parse(fs.readFileSync(CLEAN, 'utf8'));
  const inmuFile = JSON.parse(fs.readFileSync(INMU, 'utf8'));
  const inmu = (id) => {
    const food = inmuFile.foods[id];
    if (!food) throw new Error(`INMU id ${id} missing from ${path.relative(ROOT, INMU)}; run scripts/fetch-inmu.js`);
    return food;
  };

  const rows = clean.map((row) => ({ ...row }));
  const byId = new Map(rows.map((row) => [String(row.foodId), row]));
  const changes = []; // { foodId, nameTh, action, field, before, after, source }
  const summary = [];

  // --- updates ---
  for (const u of UPDATES) {
    const row = byId.get(u.foodId);
    if (!row) throw new Error(`foodId ${u.foodId} not found`);
    const src = u.inmuId ? inmu(u.inmuId) : null;
    const note = (field, before, after) => changes.push({ foodId: row.foodId, nameTh: row.nameTh, action: u.action, field, before, after, source: src ? `INMU ${src.code}` : 'rename' });
    const keepOriginal = (field) => {
      row.originalValues = row.originalValues || {};
      if (!(field in row.originalValues)) row.originalValues[field] = row[field] ?? null;
    };

    if (u.action === 'rename') {
      keepOriginal('nameTh');
      note('nameTh', row.nameTh, u.nameTh);
      row.nameTh = u.nameTh;
      if (src) row.sourceRef = sourceRef(src, { usedFor: 'name only (macros match)' });
    } else if (u.action === 'replace' || u.action === 'set') {
      const fields = u.action === 'replace' ? Object.keys(src.values) : u.fields;
      for (const field of fields) {
        const after = src.values[field] ?? null;
        if (JSON.stringify(row[field] ?? null) === JSON.stringify(after)) continue;
        keepOriginal(field);
        note(field, row[field] ?? null, after);
        row[field] = after;
      }
      // INMU values are measured/published, not our estimates.
      if (Array.isArray(row.estimated)) {
        row.estimated = row.estimated.filter((field) => !fields.includes(field));
        if (!row.estimated.length) delete row.estimated;
      }
      row.sourceRef = sourceRef(src, { usedFor: u.action === 'replace' ? 'all listed nutrients' : fields.join(', ') });
    } else if (u.action === 'atwater') {
      const value = Math.round(atwater(row));
      keepOriginal('kcal');
      note('kcal', row.kcal, value);
      row.kcal = value;
      row.estimated = [...new Set([...(row.estimated || []), 'kcal'])];
      row.sourceRef = sourceRef(src, { usedFor: `corroboration only (INMU ${src.values.kcal} kcal)` });
    }
    summary.push({ ...u, nameTh: row.nameTh });
  }

  // --- additions ---
  const added = [];
  for (const a of ADDITIONS) {
    const src = inmu(a.inmuId);
    const missing = ['kcal', 'protein_g', 'fat_g', 'carbAvailable_g'].filter((k) => !isNum(src.values[k]));
    if (missing.length) throw new Error(`INMU ${src.code} is missing ${missing.join(', ')}; don't add it`);
    const [groupTh, groupEn] = GROUP_BY_INMU_PREFIX[src.code[0]] || GROUP_BY_INMU_PREFIX.T;
    const foodId = `INMU-${src.code}`;
    if (byId.has(foodId)) throw new Error(`${foodId} already exists`);
    const row = {
      foodId,
      nameTh: a.nameTh || src.thai,
      nameEn: src.english,
      scientificName: src.scientific,
      ...Object.fromEntries(NUTRIENT_FIELDS.map((field) => [field, src.values[field] ?? null])),
      servingSize: a.servingSize || null,
      foodGroupTh: groupTh,
      foodGroupEn: groupEn,
      source: INMU_SOURCE,
      sourceRef: sourceRef(src),
    };
    rows.push(row);
    byId.set(foodId, row);
    added.push({ ...a, foodId, row });
    changes.push({ foodId, nameTh: row.nameTh, action: 'add', field: '(new row)', before: null, after: `${row.kcal} kcal, P ${row.protein_g}, F ${row.fat_g}, C ${row.carbAvailable_g}`, source: `INMU ${src.code}` });
  }

  // --- matching preview: what a scan would now pick for these names ---
  const previewNames = [
    ['ต้มยำกุ้ง', 'Tom yum goong'], ['ต้มข่าไก่', 'Chicken coconut soup'], ['ผัดกะเพราไก่', 'Basil chicken'],
    ['โจ๊กหมู', 'Pork congee'], ['ส้มตำไทย', 'Papaya salad'], ['ไก่ย่าง', 'Grilled chicken'],
    ['แกงเขียวหวานไก่', 'Green curry chicken'], ['ข้าวมันไก่ทอด', 'Fried chicken rice'], ['ชานม', 'Milk tea'],
  ];
  const preview = previewNames.map(([th, en]) => {
    const before = rankFoodCandidates(clean, th, en, 1)[0];
    const after = rankFoodCandidates(rows, th, en, 1)[0];
    const label = (c) => (c ? `${c.nameTh} (${c.matchType}${isConfidentMatch(c) ? ', auto' : ''})` : '—');
    return `| ${th} | ${label(before)} | ${label(after)} |`;
  });

  // --- outputs ---
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(rows, null, 2)}\n`);
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  fs.writeFileSync(
    path.join(REPORT_DIR, 'food-update-proposal.csv'),
    `﻿${['foodId,nameTh,action,field,before,after,source', ...changes.map((c) => [c.foodId, c.nameTh, c.action, c.field, c.before, c.after, c.source].map(csvCell).join(','))].join('\r\n')}\r\n`
  );

  const unusable = (list) => list.filter((f) => !['kcal', 'protein_g', 'fat_g', 'carbAvailable_g'].every((k) => isNum(f[k]))).length;
  const md = [
    '# Food data update proposal (INMU)',
    '',
    `Source: ${inmuFile.source} ${inmuFile.url} — fetched ${inmuFile.fetchedAt.slice(0, 10)}, values ${inmuFile.basis}.`,
    `License: ${inmuFile.license}`,
    '',
    `Input \`thaiFoods_clean.json\` (${clean.length} rows) → \`thaiFoods_proposed.json\` (${rows.length} rows). **Nothing has been written to the database.** After review: \`node seed-foods.js --file thaiFoods_proposed.json\`.`,
    '',
    '| | before | after |',
    '|---|---|---|',
    `| rows | ${clean.length} | ${rows.length} |`,
    `| rows missing kcal/protein/fat/carbs | ${unusable(clean)} | ${unusable(rows)} |`,
    `| values changed in existing rows | — | ${changes.filter((c) => c.action !== 'add').length} |`,
    '',
    `## New dishes (${added.length})`,
    '',
    '| foodId | nameTh | INMU | kcal | P | F | C | why |',
    '|---|---|---|---|---|---|---|---|',
    ...added.map((a) => `| ${a.foodId} | ${a.row.nameTh} | ${a.row.sourceRef.code} ${a.row.sourceRef.inmuNameTh} | ${a.row.kcal} | ${a.row.protein_g} | ${a.row.fat_g} | ${a.row.carbAvailable_g} | ${a.why} |`),
    '',
    `## Changes to existing rows (${summary.length})`,
    '',
    '| foodId | nameTh (after) | action | INMU | why |',
    '|---|---|---|---|---|',
    ...summary.map((u) => `| ${u.foodId} | ${u.nameTh} | ${u.action} | ${u.inmuId ? inmu(u.inmuId).code : '—'} | ${u.why} |`),
    '',
    'Every changed value, with before/after, is in `reports/food-update-proposal.csv`; changed rows keep old values in `originalValues` and cite INMU in `sourceRef`.',
    '',
    '## What a scan would pick (top candidate)',
    '',
    '| AI name | before | after |',
    '|---|---|---|',
    ...preview,
    '',
    '## Not changed — needs a person or another source',
    '',
    '| item | why |',
    '|---|---|',
    ...UNRESOLVED.map((u) => `| ${u.ref} | ${u.note} |`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(REPORT_DIR, 'food-update-proposal.md'), md);

  console.log(`rows ${clean.length} → ${rows.length}; incomplete ${unusable(clean)} → ${unusable(rows)}; changed values ${changes.length}`);
  console.log(`wrote ${path.relative(ROOT, OUT_JSON)}, reports/food-update-proposal.md, reports/food-update-proposal.csv`);
}

main();
