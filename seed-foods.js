require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Imports a food dataset (default thaiFoods_full.json) into the "foods" collection.
//
//   node seed-foods.js                              upsert by foodId: updates dataset rows,
//                                                   keeps foods added from the admin console
//   node seed-foods.js --file thaiFoods_clean.json  same, from another file
//                                                   (e.g. the output of scripts/clean-foods.js)
//   node seed-foods.js --replace --yes              delete EVERY food first, then insert
//   node seed-foods.js --file thaiFoods_merged.json --collection foods_v2
//                                                   write to another collection, leaving
//                                                   "foods" untouched (switch over later)
//
// --replace also removes admin-added foods, so it refuses to run without --yes.

const argv = process.argv.slice(2);
const flagValue = (flag, example) => {
  const i = argv.indexOf(flag);
  if (i === -1) return null;
  if (!argv[i + 1] || argv[i + 1].startsWith('--')) {
    console.error(`❌ ${flag} needs a value, e.g. ${flag} ${example}`);
    process.exit(1);
  }
  return argv[i + 1];
};
const fileArg = flagValue('--file', 'thaiFoods_clean.json');
const SOURCE_FILE = fileArg ? path.resolve(process.cwd(), fileArg) : path.join(__dirname, 'thaiFoods_full.json');
const COLLECTION_NAME = flagValue('--collection', 'foods_v2') || 'foods';
if (!/^[A-Za-z][\w-]{0,63}$/.test(COLLECTION_NAME)) {
  console.error(`❌ invalid collection name: ${COLLECTION_NAME}`);
  process.exit(1);
}

const args = new Set(argv);
const replaceAll = args.has('--replace');

const foodSchema = new mongoose.Schema({}, { strict: false }); // accept any shape
const Food = mongoose.model('Food', foodSchema, COLLECTION_NAME);

(async () => {
  try {
    if (replaceAll && !args.has('--yes')) {
      throw new Error('--replace deletes every food, including ones added in the admin console. Re-run with --replace --yes to confirm.');
    }

    console.log(`--- Reading dataset file: ${path.relative(process.cwd(), SOURCE_FILE) || SOURCE_FILE} ---`);
    const data = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));
    if (!Array.isArray(data)) {
      throw new Error('Dataset file must contain a JSON array of objects');
    }
    const missingId = data.filter((food) => food.foodId == null || String(food.foodId).trim() === '');
    if (missingId.length) throw new Error(`${missingId.length} records have no foodId`);
    console.log(`Found ${data.length} records to import`);

    console.log('--- Connecting to MongoDB ---');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'caltrack',
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected');

    if (replaceAll) {
      const deleted = await Food.deleteMany({});
      console.log(`Cleared ${deleted.deletedCount} existing records in "${COLLECTION_NAME}"`);
      const result = await Food.insertMany(data, { ordered: false });
      console.log(`✅ Inserted ${result.length} records into "${COLLECTION_NAME}"`);
    } else {
      const result = await Food.bulkWrite(
        data.map((food) => ({
          replaceOne: {
            filter: { foodId: String(food.foodId) },
            replacement: { ...food, foodId: String(food.foodId) },
            upsert: true,
          },
        })),
        { ordered: false }
      );
      console.log(`✅ Upserted "${COLLECTION_NAME}": ${result.upsertedCount} new, ${result.modifiedCount} updated, ${result.matchedCount - result.modifiedCount} unchanged`);
    }

    await mongoose.disconnect();
    console.log('--- Done ---');
  } catch (err) {
    console.error('❌ Import failed:', err.message);
    process.exit(1);
  }
})();
