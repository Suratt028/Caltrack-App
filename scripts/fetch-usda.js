// Downloads selected international foods from USDA FoodData Central and maps
// them to our dataset shape. Read-only towards USDA; nothing is written to our
// database.
//
//   node scripts/fetch-usda.js                     via the FDC API (USDA_API_KEY in .env,
//                                                  else the rate-limited DEMO_KEY)
//   node scripts/fetch-usda.js --bulk <folder>     from the unzipped bulk JSON files
//                                                  (no key, no rate limit)
//
// Bulk files: https://fdc.nal.usda.gov/download-datasets/ — Foundation Foods,
// SR Legacy and FNDDS ("Survey") in JSON. A free API key: https://fdc.nal.usda.gov/api-key-signup
//
// Output: data/usda/usda-foods.json — values per 100 g, our field names, every
// row citing its fdcId and data type. scripts/build-final-foods.js adds these
// rows to thaiFoods_final.json.
//
// USDA FoodData Central data are public domain (CC0 1.0); USDA asks to be cited as:
//   U.S. Department of Agriculture, Agricultural Research Service. FoodData Central. https://fdc.nal.usda.gov/

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'data', 'usda', 'usda-foods.json');
const API = 'https://api.nal.usda.gov/fdc/v1/foods';
const API_BATCH = 20; // the API's maximum fdcIds per request

const GROUPS = {
  cereal: ['ธัญพืชและผลิตภัณฑ์', 'Cereals and their products'],
  tuber: ['ราก หัวของพืช และผลิตภัณฑ์', 'Starchy roots, tubers and their products'],
  nut: ['ถั่วเมล็ดแห้ง พืชเมล็ด ผลไม้เปลือกแข็ง', 'Pulses, seeds, nuts and their products'],
  vegetable: ['ผักและผลิตภัณฑ์', 'Vegetables and their products'],
  fruit: ['ผลไม้และผลิตภัณฑ์', 'Fruits and their products'],
  meat: ['เนื้อสัตว์ เป็ด ไก่ และผลิตภัณฑ์', 'Meat, poultry and their products'],
  fish: ['ปลา กุ้ง สัตว์น้ำอื่นๆ และผลิตภัณฑ์', 'Finfish, shellfish, aquatic animals and their products'],
  egg: ['ไข่', 'Eggs'],
  milk: ['นมและผลิตภัณฑ์', 'Milk and its products'],
  condiment: ['เครื่องเทศและเครื่องปรุงรส', 'Spices and condiments'],
  dish: ['อาหารปรุงสำเร็จ อาหารจานเดียว', 'One plate dishes, main dishes, local foods'],
  dessert: ['ขนมหวานและขนมอบ', 'Desserts and Bakeries'],
  misc: ['อื่นๆ ของทอด เครื่องดื่ม', 'Miscellaneous (Fried foods, beverages)'],
};

// Foods missing from thaiFoods_final.json that people in Thailand commonly log.
// Foundation Foods (newer lab analyses) is preferred where it has the food,
// then SR Legacy; FNDDS only for prepared drinks. Thai names are ours.
const SELECTION = [
  { fdcId: 169737, nameTh: 'พาสต้า/สปาเก็ตตี้, ต้มสุก', group: 'cereal' },
  { fdcId: 168917, nameTh: 'ควินัว, สุก', group: 'cereal' },
  { fdcId: 2708381, nameTh: 'โอ๊ตมีล, ต้มกับน้ำ', group: 'cereal' },
  { fdcId: 171646, nameTh: 'กราโนล่า', group: 'cereal' },
  { fdcId: 172688, nameTh: 'ขนมปังโฮลวีต', group: 'cereal' },
  { fdcId: 174899, nameTh: 'เบเกิล', group: 'cereal' },
  { fdcId: 170093, nameTh: 'มันฝรั่ง, อบทั้งเปลือก', group: 'tuber' },
  { fdcId: 168555, nameTh: 'มันฝรั่งบด', group: 'tuber' },
  { fdcId: 170698, nameTh: 'เฟรนช์ฟรายส์', group: 'tuber' },
  { fdcId: 172470, nameTh: 'เนยถั่ว', group: 'nut' },
  { fdcId: 170567, nameTh: 'อัลมอนด์', group: 'nut' },
  { fdcId: 170187, nameTh: 'วอลนัท', group: 'nut' },
  { fdcId: 170554, nameTh: 'เมล็ดเจีย', group: 'nut' },
  { fdcId: 173757, nameTh: 'ถั่วลูกไก่, ต้มสุก', group: 'nut' },
  { fdcId: 321358, nameTh: 'ฮัมมัส', group: 'nut' },
  { fdcId: 323505, nameTh: 'เคล, ดิบ', group: 'vegetable' },
  { fdcId: 171705, nameTh: 'อะโวคาโด', group: 'fruit' },
  { fdcId: 2346411, nameTh: 'บลูเบอร์รี่', group: 'fruit' },
  { fdcId: 327046, nameTh: 'กีวี, เขียว', group: 'fruit' },
  { fdcId: 2709187, nameTh: 'น้ำส้มคั้นสด', group: 'misc' },
  { fdcId: 171477, nameTh: 'อกไก่, ไม่มีหนัง, อบ', group: 'meat' },
  { fdcId: 174054, nameTh: 'สเต๊กเนื้อสันนอก, ย่าง', group: 'meat' },
  { fdcId: 170693, nameTh: 'แฮมเบอร์เกอร์', group: 'dish' },
  { fdcId: 175167, nameTh: 'ปลาแซลมอน, ดิบ', group: 'fish' },
  { fdcId: 334194, nameTh: 'ปลาทูน่ากระป๋อง, ในน้ำ', group: 'fish' },
  { fdcId: 173424, nameTh: 'ไข่ไก่, ต้มสุก', group: 'egg' },
  { fdcId: 330137, nameTh: 'กรีกโยเกิร์ต, ไขมัน 0%', group: 'milk' },
  { fdcId: 2259794, nameTh: 'กรีกโยเกิร์ต, นมสด', group: 'milk' },
  { fdcId: 170845, nameTh: 'มอซซาเรลลาชีส', group: 'milk' },
  { fdcId: 173418, nameTh: 'ครีมชีส', group: 'milk' },
  { fdcId: 174832, nameTh: 'นมอัลมอนด์, ไม่หวาน', group: 'misc' },
  { fdcId: 173177, nameTh: 'เวย์โปรตีน, ไอโซเลท, ผง', group: 'misc' },
  { fdcId: 171413, nameTh: 'น้ำมันมะกอก', group: 'condiment' },
  { fdcId: 169640, nameTh: 'น้ำผึ้ง', group: 'condiment' },
  { fdcId: 171009, nameTh: 'มายองเนส', group: 'condiment' },
  { fdcId: 168556, nameTh: 'ซอสมะเขือเทศ (แบบฝรั่ง)', group: 'condiment' },
  { fdcId: 170273, nameTh: 'ดาร์กช็อกโกแลต 70–85%', group: 'dessert' },
  { fdcId: 171890, nameTh: 'กาแฟดำ/อเมริกาโน, ไม่ใส่น้ำตาล', group: 'misc' },
  { fdcId: 171891, nameTh: 'เอสเพรสโซ', group: 'misc' },
  { fdcId: 2710386, nameTh: 'ลาเต้, ไม่หวาน', group: 'misc' },
  { fdcId: 173227, nameTh: 'ชาดำ, ไม่ใส่น้ำตาล', group: 'misc' },
  { fdcId: 2710490, nameTh: 'ชาเขียว (ชงจากใบ), ไม่ใส่น้ำตาล', group: 'misc' },
  // FNDDS doesn't say whether this recipe is sweetened (8.7 g sugar per 100 g), so the name doesn't either.
  { fdcId: 2710506, nameTh: 'ชาร้อนใส่นม (สูตรสากล)', group: 'misc' },
];

// USDA nutrient number(s) → our field, first number found wins.
const NUTRIENTS = {
  water_g: ['255'],
  kcal: ['208', '957', '958'], // Energy; Foundation Foods may only carry Atwater energy (957/958)
  protein_g: ['203'],
  fat_g: ['204'],
  carbTotal_g: ['205', '205.2'], // by difference (205.2 = by summation)
  fiber_g: ['291'],
  sugar_g: ['269', '269.3'],
  ash_g: ['207'],
  calcium_mg: ['301'],
  iron_mg: ['303'],
  magnesium_mg: ['304'],
  phosphorus_mg: ['305'],
  potassium_mg: ['306'],
  sodium_mg: ['307'],
  zinc_mg: ['309'],
  copper_mg: ['312'],
  vitaminA_RAE_ug: ['320'],
  retinol_ug: ['319'],
  betacarotene_ug: ['321'],
  vitaminE_mg: ['323'],
  vitaminC_mg: ['401'],
  thiamin_mg: ['404'],
  riboflavin_mg: ['405'],
  niacin_mg: ['406'],
  folate_ug: ['435', '417'],
  cholesterol_mg: ['601'],
};

const round2 = (v) => Math.round(v * 100) / 100;

function nutrientMap(food) {
  const byNumber = {};
  for (const n of food.foodNutrients || []) {
    const number = String(n.nutrient?.number ?? n.number ?? '');
    const amount = n.amount;
    if (number && typeof amount === 'number' && Number.isFinite(amount) && !(number in byNumber)) {
      byNumber[number] = amount;
    }
  }
  return byNumber;
}

function toRow(food, pick) {
  const byNumber = nutrientMap(food);
  const row = {
    foodId: `USDA-${food.fdcId}`,
    nameTh: pick.nameTh,
    nameEn: food.description,
    foodGroupTh: GROUPS[pick.group][0],
    foodGroupEn: GROUPS[pick.group][1],
  };
  for (const [field, numbers] of Object.entries(NUTRIENTS)) {
    const number = numbers.find((n) => n in byNumber);
    if (number) row[field] = round2(byNumber[number]);
  }
  // Thai tables use available carbohydrate (excluding fibre); USDA reports
  // total carbohydrate by difference, which includes it.
  if ('carbTotal_g' in row) {
    row.carbAvailable_g = round2(Math.max(0, row.carbTotal_g - (row.fiber_g || 0)));
  }
  row.source = `USDA FoodData Central, ${food.dataType}${food.publicationDate ? ` (${food.publicationDate})` : ''}`;
  row.sourceRef = { fdcId: food.fdcId, dataType: food.dataType, url: `https://fdc.nal.usda.gov/food-search?query=${food.fdcId}` };
  return row;
}

async function fromApi(ids) {
  const key = process.env.USDA_API_KEY || 'DEMO_KEY';
  if (key === 'DEMO_KEY') console.warn('No USDA_API_KEY in .env — using DEMO_KEY (a few requests per hour).');
  const foods = [];
  for (let i = 0; i < ids.length; i += API_BATCH) {
    const res = await fetch(`${API}?api_key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fdcIds: ids.slice(i, i + API_BATCH), format: 'full' }),
    });
    if (!res.ok) throw new Error(`FDC API HTTP ${res.status}${res.status === 429 ? ' (rate limit: set USDA_API_KEY or use --bulk)' : ''}`);
    foods.push(...(await res.json()));
  }
  return foods;
}

function fromBulk(folder, ids) {
  const wanted = new Set(ids);
  const foods = [];
  for (const file of fs.readdirSync(folder).filter((f) => f.endsWith('.json'))) {
    const raw = JSON.parse(fs.readFileSync(path.join(folder, file), 'utf8'));
    for (const list of Object.values(raw)) {
      if (!Array.isArray(list)) continue;
      for (const food of list) if (food && wanted.has(food.fdcId)) foods.push(food);
    }
  }
  return foods;
}

async function main() {
  const argv = process.argv.slice(2);
  const bulkFlag = argv.indexOf('--bulk');
  if (bulkFlag !== -1 && !argv[bulkFlag + 1]) throw new Error('--bulk needs the folder holding the unzipped FDC JSON files');
  const ids = SELECTION.map((s) => s.fdcId);
  const foods = bulkFlag === -1 ? await fromApi(ids) : fromBulk(path.resolve(argv[bulkFlag + 1]), ids);

  const byId = new Map(foods.map((f) => [f.fdcId, f]));
  const rows = [];
  const problems = [];
  for (const pick of SELECTION) {
    const food = byId.get(pick.fdcId);
    if (!food) { problems.push(`${pick.fdcId} ${pick.nameTh}: not returned by USDA`); continue; }
    const row = toRow(food, pick);
    const missing = ['kcal', 'protein_g', 'fat_g', 'carbAvailable_g'].filter((k) => !(k in row));
    if (missing.length) { problems.push(`${pick.fdcId} ${pick.nameTh}: missing ${missing.join(', ')}`); continue; }
    rows.push(row);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify({
    fetchedAt: new Date().toISOString(),
    source: 'U.S. Department of Agriculture, Agricultural Research Service. FoodData Central. https://fdc.nal.usda.gov/',
    license: 'Public domain (CC0 1.0). Cite USDA FoodData Central as the source.',
    method: bulkFlag === -1 ? 'FDC API v1' : 'FDC bulk JSON download',
    foods: rows,
  }, null, 2)}\n`);

  console.log(`fetched ${rows.length} of ${SELECTION.length} foods → ${path.relative(process.cwd(), OUT)}`);
  problems.forEach((p) => console.warn(`skipped ${p}`));
}

main().catch((error) => {
  console.error('USDA fetch failed:', error.message);
  process.exit(1);
});
