// Downloads selected foods from the INMU online Thai Food Composition Database
// (Institute of Nutrition, Mahidol University, online version 3, Aug 2025) and
// saves a dated snapshot. Read-only towards INMU; nothing is written to our database.
//
//   node scripts/fetch-inmu.js           the foods scripts/propose-food-updates.js uses
//   node scripts/fetch-inmu.js --all     every food in the database (ids are scanned
//                                        in order; takes ~30 min at a gentle pace)
//
// Output: data/inmu/inmu-foods.json (selection) or data/inmu/inmu-all.json (--all)
// — one entry per INMU food id, values per 100 g edible portion, mapped to our
// field names, plus the source reference.
//
// INMU terms: free for non-commercial use with acknowledgement; commercial use
// needs permission (kunchit.jud@mahidol.ac.th). Cite as:
//   Judprasong K, Puwastien P, Rojroongwasinkul N, Nitithamyong A, Sridonpai P,
//   Somjai A. Institute of Nutrition, Mahidol University (2025). Thai Food
//   Composition Database, Online version 3, August 2025. https://inmu.mahidol.ac.th/thaifcd/home

const fs = require('fs');
const path = require('path');

const BASE = 'https://inmu.mahidol.ac.th/thaifcd';
const ALL = process.argv.includes('--all');
const OUT = path.join(__dirname, '..', 'data', 'inmu', ALL ? 'inmu-all.json' : 'inmu-foods.json');
// --all: INMU ids are sparse integers (currently ~100–1,800). Scan upward and
// stop once this many ids past the last food found return nothing. A few
// requests run at once (each ~1–3 s); progress is saved so a rerun resumes.
const ALL_START_ID = 1;
const ALL_STOP_AFTER_MISSES = 400;
const ALL_WORKERS = 4;
const DELAY_MS = 300; // pause per worker between requests, to be gentle with INMU's server
const PARTIAL = `${OUT}.partial`;

// INMU internal ids used by scripts/propose-food-updates.js (see the reasons there).
const INMU_IDS = [
  1491, 1492, 1489, 1446, 1456, 1551, 1569, 900, 1513, 1519, 1527, 1555, 1556, 1404, // new dishes
  809, 1003, 588, 932, 1071, 1473, 1474, 526, // rows we fix or compare
];

// INMU nutrient label -> our field name.
const FIELD_MAP = {
  'Energy, by calculation': 'kcal',
  Moisture: 'water_g',
  'Protein, total': 'protein_g',
  'Fat, total': 'fat_g',
  'Carbohydrate, available': 'carbAvailable_g',
  'Carbohydrate, total': 'carbTotal_g',
  'Dietary fibre': 'fiber_g',
  Ash: 'ash_g',
  Calcium: 'calcium_mg',
  Phosphorus: 'phosphorus_mg',
  Magnesium: 'magnesium_mg',
  Sodium: 'sodium_mg',
  Potassium: 'potassium_mg',
  Iron: 'iron_mg',
  Copper: 'copper_mg',
  Zinc: 'zinc_mg',
  Retinol: 'retinol_ug',
  'b-carotene': 'betacarotene_ug',
  'Vitamin A; retinol activity equivalent': 'vitaminA_RAE_ug',
  Thiamin: 'thiamin_mg',
  Riboflavin: 'riboflavin_mg',
  Niacin: 'niacin_mg',
  'Vitamin C': 'vitaminC_mg',
  'Sugars, total': 'sugar_g',
  Cholesterol: 'cholesterol_mg',
  'Fatty acids, total saturated': 'saturatedFat_g',
  'Edible portion': 'ediblePortion_pct',
  Density: 'density_g_per_ml',
};

const decode = (s) => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

function parseDetail(html) {
  const text = decode(html);
  const header = (label, next) => {
    const m = text.match(new RegExp(`${label}:\\s*(.*?)\\s*${next}:`));
    return m ? m[1].trim() : null;
  };
  const values = {};
  for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => decode(c[1]));
    const field = FIELD_MAP[cells[0]];
    if (!field || cells.length < 3) continue;
    const num = Number(String(cells[2]).replace(/,/g, ''));
    values[field] = cells[2] === '-' || cells[2] === '' || !Number.isFinite(num) ? null : num;
  }
  return {
    code: header('Food Code', 'Thai name'),
    thai: header('Thai name', 'English name'),
    english: header('English name', 'Scientific name'),
    scientific: (text.match(/Scientific name:\s*(.*?)\s*(?:Save as PDF|Use your|Nutrients)/)?.[1] || '').replace(/^-$/, '').trim() || null,
    values,
  };
}

async function fetchDetail(id) {
  const params = new URLSearchParams({
    order_fields: '', order_directions: '', page_no: 1, dummy_page_no: 1, status: 'A',
    selected_name: '', selected_id: String(id), selected_dbcode: 'STD', food_group_id: '',
    food_name: '', mode: 'food_group_result', ci_csrf_token: '',
  });
  const res = await fetch(`${BASE}/foodsearch/food_name_result?${params}`);
  if (!res.ok) throw new Error(`INMU ${id}: HTTP ${res.status}`);
  const parsed = parseDetail(await res.text());
  if (!parsed.code) throw new Error(`INMU ${id}: could not parse food code`);
  return parsed;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Network hiccups during a long scan: retry a few times before giving up on an id.
async function fetchWithRetry(id) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fetchDetail(id);
    } catch (error) {
      if (/could not parse/.test(error.message)) return null; // no food with this id
      if (attempt >= 3) throw error;
      await sleep(2000 * attempt);
    }
  }
}

async function main() {
  const foods = {};
  if (ALL) {
    if (fs.existsSync(PARTIAL)) Object.assign(foods, JSON.parse(fs.readFileSync(PARTIAL, 'utf8')));
    const known = Object.keys(foods).map(Number);
    let lastHit = known.length ? Math.max(...known) : ALL_START_ID;
    let nextId = ALL_START_ID;
    let sinceSave = 0;
    const save = () => {
      fs.mkdirSync(path.dirname(PARTIAL), { recursive: true });
      fs.writeFileSync(PARTIAL, JSON.stringify(foods));
    };
    const worker = async () => {
      while (nextId <= lastHit + ALL_STOP_AFTER_MISSES) {
        const id = nextId;
        nextId += 1;
        if (foods[id]) continue;
        const food = await fetchWithRetry(id);
        if (food) {
          foods[id] = { inmuId: id, ...food };
          lastHit = Math.max(lastHit, id);
          const count = Object.keys(foods).length;
          if (count % 50 === 0) console.log(`${count} foods (id ${id}, ${food.code})`);
          sinceSave += 1;
          if (sinceSave >= 50) { save(); sinceSave = 0; }
        }
        await sleep(DELAY_MS);
      }
    };
    await Promise.all(Array.from({ length: ALL_WORKERS }, worker));
    // Keep ids in numeric order in the output.
    for (const id of Object.keys(foods).map(Number).sort((a, b) => a - b)) {
      const food = foods[id];
      delete foods[id];
      foods[id] = food;
    }
  } else {
    for (const id of INMU_IDS) {
      foods[id] = { inmuId: id, ...(await fetchDetail(id)) };
      console.log(`${id}\t${foods[id].code}\t${foods[id].thai}\t${foods[id].values.kcal ?? '-'} kcal`);
      await sleep(DELAY_MS);
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify({
    source: 'Institute of Nutrition, Mahidol University (INMU). Thai Food Composition Database, Online version 3, August 2025.',
    url: `${BASE}/home`,
    license: 'Free for non-commercial use with acknowledgement; commercial use requires permission from INMU.',
    fetchedAt: new Date().toISOString(),
    basis: 'per 100 g edible portion',
    foods,
  }, null, 2)}\n`);
  if (ALL && fs.existsSync(PARTIAL)) fs.unlinkSync(PARTIAL);
  console.log(`saved ${Object.keys(foods).length} foods to ${path.relative(process.cwd(), OUT)}`);
}

main().catch((error) => {
  console.error('❌', error.message);
  process.exit(1);
});
