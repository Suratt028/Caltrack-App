// Compares a food dataset file with the live "foods" collection. Read-only:
// it only runs find() on MongoDB and writes local report files.
//
//   node scripts/compare-foods-db.js                       (thaiFoods_final.json)
//   node scripts/compare-foods-db.js --file thaiFoods_clean.json
//
// Outputs:
//   reports/foods-db-snapshot-<date>.json   what the database held (backup)
//   reports/food-file-vs-db.md              summary and row lists
//   reports/food-file-vs-db.csv             one line per differing value

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const ROOT = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'reports');
const argv = process.argv.slice(2);
const fileFlag = argv.indexOf('--file');
const FILE = path.resolve(ROOT, fileFlag === -1 ? 'thaiFoods_final.json' : argv[fileFlag + 1]);

const CORE = ['kcal', 'protein_g', 'fat_g', 'carbAvailable_g'];
// Fields that describe the row's history rather than the food.
const IGNORE = new Set([
  '_id', '__v', 'createdAt', 'updatedAt', 'originalValues', 'estimated', 'mergedFrom', 'sourceRef',
  // bookkeeping added by scripts/merge-foods.js
  'valueSources', 'origins', 'completeness', 'missing', 'alternatives', 'inmuCode', 'similarTo', 'servingGrams',
]);
const TOLERANCE = 0.005;

const isEmpty = (v) => v == null || (typeof v === 'string' && v.trim() === '');
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function sameValue(a, b) {
  if (isEmpty(a) && isEmpty(b)) return true;
  if (isNum(a) && isNum(b)) return Math.abs(a - b) <= TOLERANCE;
  return JSON.stringify(a) === JSON.stringify(b);
}

function csvCell(v) {
  const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function complete(row) {
  return CORE.every((k) => isNum(row[k]));
}

// Which known dataset file the database rows look like (share of identical rows).
function matchShare(dbById, file) {
  const rows = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  let same = 0;
  for (const row of rows) {
    const db = dbById.get(String(row.foodId));
    if (db && CORE.every((k) => sameValue(db[k], row[k]))) same += 1;
  }
  return { file, rows: rows.length, same };
}

async function main() {
  const fileRows = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'caltrack',
    serverSelectionTimeoutMS: 15000,
  });
  const dbRows = await mongoose.connection.db.collection('foods').find({}).toArray();
  await mongoose.disconnect();

  const today = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORT_DIR, `foods-db-snapshot-${today}.json`),
    `${JSON.stringify(dbRows.map(({ _id, ...row }) => row), null, 2)}\n`
  );

  const dbById = new Map(dbRows.map((row) => [String(row.foodId), row]));
  const fileById = new Map(fileRows.map((row) => [String(row.foodId), row]));
  const datasetIds = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'thaiFoods_full.json'), 'utf8')).map((r) => String(r.foodId)));
  const mergedAway = new Map();
  fileRows.forEach((row) => (row.mergedFrom || []).forEach((id) => mergedAway.set(String(id), row.foodId)));

  const onlyInFile = fileRows.filter((row) => !dbById.has(String(row.foodId)));
  const onlyInDb = dbRows.filter((row) => !fileById.has(String(row.foodId)));
  const diffs = []; // { foodId, nameTh, field, db, file, kind }
  const changedRows = new Set();
  const coreChangedRows = new Set();

  for (const row of fileRows) {
    const db = dbById.get(String(row.foodId));
    if (!db) continue;
    const fields = new Set([...Object.keys(row), ...Object.keys(db)].filter((k) => !IGNORE.has(k)));
    for (const field of fields) {
      if (sameValue(db[field], row[field])) continue;
      const kind = isEmpty(db[field]) ? 'filled' : isEmpty(row[field]) ? 'removed' : 'changed';
      diffs.push({ foodId: row.foodId, nameTh: row.nameTh, field, db: db[field], file: row[field], kind });
      changedRows.add(row.foodId);
      if (CORE.includes(field)) coreChangedRows.add(row.foodId);
    }
  }

  const byKind = (kind) => diffs.filter((d) => d.kind === kind).length;
  const byField = {};
  diffs.forEach((d) => {
    byField[d.field] ||= { filled: 0, changed: 0, removed: 0 };
    byField[d.field][d.kind] += 1;
  });
  const dbNulls = dbRows.reduce((n, r) => n + Object.values(r).filter((v) => v === null).length, 0);
  const fileNulls = fileRows.reduce((n, r) => n + Object.values(r).filter((v) => v === null).length, 0);
  const shares = ['thaiFoods_full.json', 'thaiFoods_clean.json'].map((f) => matchShare(dbById, f));

  const classify = (row) => {
    const id = String(row.foodId);
    if (mergedAway.has(id)) return `merged into ${mergedAway.get(id)}`;
    if (!complete(row)) return 'dropped: missing core nutrients';
    if (!datasetIds.has(id)) return 'not from the dataset (added in the admin console?)';
    return 'in the dataset but not in this file';
  };

  const csv = ['foodId,nameTh,field,kind,database,file', ...diffs.map((d) =>
    [d.foodId, d.nameTh, d.field, d.kind, d.db, d.file].map(csvCell).join(','))];
  fs.writeFileSync(path.join(REPORT_DIR, 'food-file-vs-db.csv'), `﻿${csv.join('\r\n')}\r\n`);

  const rel = path.relative(ROOT, FILE);
  const coreRows = [...coreChangedRows].map((id) => ({ db: dbById.get(String(id)), file: fileById.get(String(id)) }));
  const md = [
    `# \`${rel}\` vs the live database`,
    '',
    `Read-only comparison on ${today} (database \`${process.env.MONGODB_DB_NAME || 'caltrack'}\`, collection \`foods\`). Generated by \`scripts/compare-foods-db.js\`. A copy of what the database held is in \`reports/foods-db-snapshot-${today}.json\`.`,
    '',
    '## Summary',
    '',
    '| | database | file |',
    '|---|---|---|',
    `| rows | ${dbRows.length} | ${fileRows.length} |`,
    `| rows missing kcal/protein/fat/carbs | ${dbRows.filter((r) => !complete(r)).length} | ${fileRows.filter((r) => !complete(r)).length} |`,
    `| null values | ${dbNulls} | ${fileNulls} |`,
    '',
    `The database currently matches (same kcal/protein/fat/carbs, by foodId): ${shares.map((s) => `\`${s.file}\` ${s.same}/${s.rows}`).join(', ')}.`,
    '',
    '| difference | count |',
    '|---|---|',
    `| rows only in the file (new on upload) | ${onlyInFile.length} |`,
    `| rows only in the database | ${onlyInDb.length} |`,
    `| rows in both with any difference | ${changedRows.size} |`,
    `| — of which kcal/protein/fat/carbs differ | ${coreChangedRows.size} |`,
    `| values filled (empty in database, set in file) | ${byKind('filled')} |`,
    `| values changed | ${byKind('changed')} |`,
    `| values removed (set in database, empty in file) | ${byKind('removed')} |`,
    '',
    '**Uploading with `node seed-foods.js --file ' + rel + '` replaces matching rows and adds new ones, but does not delete rows that are only in the database** (see below).',
    '',
    '## Differences by field',
    '',
    '| field | filled | changed | removed |',
    '|---|---|---|---|',
    ...Object.entries(byField).sort((a, b) => (b[1].filled + b[1].changed + b[1].removed) - (a[1].filled + a[1].changed + a[1].removed))
      .map(([f, c]) => `| ${f} | ${c.filled} | ${c.changed} | ${c.removed} |`),
    '',
    'Every value is listed in `reports/food-file-vs-db.csv`.',
    '',
    '## Rows only in the database',
    '',
    onlyInDb.length ? '| foodId | nameTh | why |' : 'None.',
    ...(onlyInDb.length ? ['|---|---|---|'] : []),
    ...onlyInDb.map((row) => `| ${row.foodId} | ${row.nameTh} | ${classify(row)} |`),
    '',
    '## Rows only in the file',
    '',
    onlyInFile.length ? '| foodId | nameTh | kcal |' : 'None.',
    ...(onlyInFile.length ? ['|---|---|---|'] : []),
    ...onlyInFile.map((row) => `| ${row.foodId} | ${row.nameTh} | ${row.kcal} |`),
    '',
    '## kcal / protein / fat / carbs that differ',
    '',
    coreRows.length ? '| foodId | nameTh | database kcal / P / F / C | file kcal / P / F / C |' : 'None.',
    ...(coreRows.length ? ['|---|---|---|---|'] : []),
    ...coreRows.map(({ db, file }) => `| ${file.foodId} | ${file.nameTh} | ${CORE.map((k) => db[k] ?? '—').join(' / ')} | ${CORE.map((k) => file[k] ?? '—').join(' / ')} |`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(REPORT_DIR, 'food-file-vs-db.md'), md);

  console.log(`database ${dbRows.length} rows, file ${fileRows.length} rows`);
  console.log(`only in file ${onlyInFile.length}, only in database ${onlyInDb.length}, rows differing ${changedRows.size} (core ${coreChangedRows.size})`);
  console.log(`values filled ${byKind('filled')}, changed ${byKind('changed')}, removed ${byKind('removed')}`);
  console.log(shares.map((s) => `db matches ${s.file}: ${s.same}/${s.rows}`).join('; '));
  console.log(`wrote reports/food-file-vs-db.md, reports/food-file-vs-db.csv, reports/foods-db-snapshot-${today}.json`);
}

main().catch(async (error) => {
  console.error('Comparison failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
