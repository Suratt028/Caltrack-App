// Scan-accuracy helper for section 3.4.1 / table 4.10 of the report.
//
// Sends every photo in a folder to POST /api/ai/scan (the same endpoint the app
// uses) and records, per dish, two of the three values the method needs:
//   A = the AI's own estimate (estimated_nutrition, summed over the detected items)
//   B = what the scan review screen shows before the user touches anything:
//       a confident database match uses the database value at the AI's grams
//       (via POST /api/nutrition/calculate, exactly like FoodScanReview.js);
//       any other item keeps the AI's own estimate.
// C (after the tester corrects names/amounts in the app) and the reference
// values (from the kitchen scale) are filled in by hand in the same CSV.
//
// Usage (server must be running: npm run server):
//   node scripts/scan-accuracy.js <photo-folder> [--api http://localhost:3001/api]
//   credentials: SCAN_EMAIL / SCAN_PASSWORD in the environment, or --email / --password
//
// Photos: .jpg / .jpeg / .png / .webp, processed in file-name order (01.jpg, 02.jpg ...).
// Like the app, each photo is resized to 1024 px on the long edge as JPEG quality 70
// when the optional "sharp" package is installed (npm i -D sharp); otherwise the
// original file is sent and a warning is printed. The app also crops to a square,
// so take the test photos square, or crop them first, to scan what the app scans.
//
// Each photo uses one Gemini call and counts toward the account's daily scan quota.
//
// Outputs (in the photo folder, nothing is written to the database except the
// normal scanLogs row the server keeps for every scan):
//   scan-accuracy.csv        one row per dish: A and B totals + empty columns
//                            for the reference and C values to fill in by hand
//   scan-accuracy-items.csv  one row per detected item (name, grams, match, values)
//   scan-accuracy-raw.json   the full server responses, for checking later

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const folder = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const API = (flag('--api') || process.env.SCAN_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const EMAIL = flag('--email') || process.env.SCAN_EMAIL;
const PASSWORD = flag('--password') || process.env.SCAN_PASSWORD;
const PAUSE_MS = 2000; // be gentle with the Gemini quota between photos
const DEFAULT_MANUAL_GRAMS = 100; // same fallback as FoodScanReview.js
const KEYS = ['kcal', 'protein', 'carbs', 'fat'];

if (!folder || !fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
  console.error('Usage: node scripts/scan-accuracy.js <photo-folder> [--api URL] [--email E --password P]');
  process.exit(1);
}
if (!EMAIL || !PASSWORD) {
  console.error('Set SCAN_EMAIL and SCAN_PASSWORD (or pass --email and --password) for a test account.');
  process.exit(1);
}

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const photos = fs.readdirSync(folder)
  .filter((f) => MIME[path.extname(f).toLowerCase()])
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
if (photos.length === 0) {
  console.error(`No .jpg/.jpeg/.png/.webp files in ${folder}`);
  process.exit(1);
}

let sharp = null;
try { sharp = require('sharp'); } catch { /* optional */ }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (v) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));
// Same key mapping as displayNutrition() in FoodScanReview.js.
const pick = (n) => ({
  kcal: num(n?.kcal),
  protein: num(n?.protein ?? n?.protein_g),
  carbs: num(n?.carbs ?? n?.carbAvailable_g),
  fat: num(n?.fat ?? n?.fat_g),
});
const round = (v) => (v == null ? '' : Math.round(v * 10) / 10);
const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvLine = (cells) => cells.map(csvCell).join(',');

async function api(pathname, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, data };
}

async function loadImage(file) {
  const ext = path.extname(file).toLowerCase();
  if (sharp) {
    const buf = await sharp(file)
      .rotate()
      .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    return { base64: buf.toString('base64'), mimeType: 'image/jpeg' };
  }
  const buf = fs.readFileSync(file);
  if (buf.length > 7 * 1024 * 1024) {
    throw new Error('photo is over 7 MB; install sharp (npm i -D sharp) or shrink it first');
  }
  return { base64: buf.toString('base64'), mimeType: MIME[ext] };
}

function sum(list) {
  const out = { kcal: null, protein: null, carbs: null, fat: null };
  for (const n of list) {
    for (const k of KEYS) {
      if (n[k] != null) out[k] = (out[k] || 0) + n[k];
    }
  }
  return out;
}

async function scanOne(file, token) {
  const image = await loadImage(file);
  let res = await api('/ai/scan', {
    method: 'POST', token, body: { imageBase64: image.base64, mimeType: image.mimeType },
  });
  if (res.status >= 500 || res.status === 408) { // one retry for a transient failure
    await sleep(3000);
    res = await api('/ai/scan', {
      method: 'POST', token, body: { imageBase64: image.base64, mimeType: image.mimeType },
    });
  }
  if (res.status !== 200 || !res.data?.success) {
    const err = new Error(res.data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = res.data?.code;
    throw err;
  }

  const items = res.data.result?.items || [];
  const rows = items.map((item) => {
    const aiGrams = num(item.estimated_grams?.likely) || 0;
    const grams = aiGrams || DEFAULT_MANUAL_GRAMS;
    const best = item.candidates?.[0]?.confident ? item.candidates[0] : null;
    return { item, aiGrams, grams, best, a: pick(item.estimated_nutrition) };
  });

  // B for confident matches: the server's own calculation, as the app does it.
  const matched = rows.filter((r) => r.best);
  if (matched.length) {
    const calc = await api('/nutrition/calculate', {
      method: 'POST',
      body: { items: matched.map((r) => ({ foodId: r.best.foodId, grams: r.grams })) },
    });
    if (calc.status !== 200) throw new Error(`nutrition/calculate failed: HTTP ${calc.status}`);
    matched.forEach((r, i) => { r.b = pick(calc.data.breakdown?.[i]?.nutrition); });
  }
  rows.forEach((r) => { if (!r.best) r.b = r.a; });

  return { raw: res.data, rows, a: sum(rows.map((r) => r.a)), b: sum(rows.map((r) => r.b)) };
}

(async () => {
  console.log(`API: ${API}`);
  if (!sharp) console.warn('⚠️  sharp is not installed: photos are sent at their original size (the app sends 1024 px JPEG).');

  const login = await api('/auth/login', { method: 'POST', body: { email: EMAIL, password: PASSWORD } });
  const token = login.data?.user?.token;
  if (login.status !== 200 || !token) {
    console.error(`Login failed (HTTP ${login.status}): ${login.data?.error || 'no user token returned'}`);
    process.exit(1);
  }

  const dishHeader = [
    'no', 'file', 'dish_name', 'items_detected', 'matched_items', 'status',
    'A_kcal', 'A_protein', 'A_carbs', 'A_fat',
    'B_kcal', 'B_protein', 'B_carbs', 'B_fat',
    'weight_g', 'ref_kcal', 'ref_protein', 'ref_carbs', 'ref_fat',
    'C_kcal', 'C_protein', 'C_carbs', 'C_fat',
  ];
  const itemHeader = [
    'no', 'file', 'ai_name', 'ai_grams', 'confidence', 'matched_food', 'match_type',
    'A_kcal', 'A_protein', 'A_carbs', 'A_fat', 'B_kcal', 'B_protein', 'B_carbs', 'B_fat',
  ];
  const dishLines = [csvLine(dishHeader)];
  const itemLines = [csvLine(itemHeader)];
  const raw = [];

  for (let i = 0; i < photos.length; i += 1) {
    const file = photos[i];
    const no = i + 1;
    process.stdout.write(`[${no}/${photos.length}] ${file} ... `);
    try {
      const r = await scanOne(path.join(folder, file), token);
      raw.push({ no, file, response: r.raw });
      dishLines.push(csvLine([
        no, file, '', r.rows.length, r.rows.filter((x) => x.best).length, 'ok',
        ...KEYS.map((k) => round(r.a[k])), ...KEYS.map((k) => round(r.b[k])),
        '', '', '', '', '', '', '', '', '',
      ]));
      r.rows.forEach((x) => itemLines.push(csvLine([
        no, file, x.item.name_th, x.aiGrams || '', x.item.confidence,
        x.best ? x.best.nameTh : '', x.best ? x.best.matchType : 'ai_estimate',
        ...KEYS.map((k) => round(x.a[k])), ...KEYS.map((k) => round(x.b[k])),
      ])));
      console.log(`A ${round(r.a.kcal)} kcal, B ${round(r.b.kcal)} kcal (${r.rows.length} items)`);
    } catch (error) {
      const message = String(error.message).split('\n')[0];
      raw.push({ no, file, error: message, code: error.code || null });
      dishLines.push(csvLine([
        no, file, '', 0, 0, `failed: ${message}`,
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      ]));
      console.log(`FAILED: ${message}`);
      if (error.code === 'SCAN_QUOTA_EXCEEDED') {
        console.error('Daily scan quota reached: set it to 0 in Admin → Settings, or continue tomorrow.');
        break;
      }
    }
    if (i < photos.length - 1) await sleep(PAUSE_MS);
  }

  // UTF-8 BOM so Excel shows Thai text correctly.
  fs.writeFileSync(path.join(folder, 'scan-accuracy.csv'), '﻿' + dishLines.join('\n') + '\n');
  fs.writeFileSync(path.join(folder, 'scan-accuracy-items.csv'), '﻿' + itemLines.join('\n') + '\n');
  fs.writeFileSync(path.join(folder, 'scan-accuracy-raw.json'), JSON.stringify(raw, null, 2));
  console.log(`\nSaved scan-accuracy.csv, scan-accuracy-items.csv and scan-accuracy-raw.json in ${folder}`);
  console.log('Next: fill dish_name, weight_g, ref_* (scale + food table) and C_* (values saved after correcting in the app).');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
