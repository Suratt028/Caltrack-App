require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// --- CONFIG: adjust these two lines if needed ---
const SOURCE_FILE = path.join(__dirname, 'thaiFoods_full.json'); // path to your dataset
const COLLECTION_NAME = 'foods';                                 // target collection name
// -------------------------------------------------

const foodSchema = new mongoose.Schema({}, { strict: false }); // accept any shape
const Food = mongoose.model('Food', foodSchema, COLLECTION_NAME);

(async () => {
  try {
    console.log('--- Connecting to MongoDB ---');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'caltrack',
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected');

    console.log('--- Reading dataset file ---');
    const raw = fs.readFileSync(SOURCE_FILE, 'utf-8');
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      throw new Error('Dataset file must contain a JSON array of objects');
    }
    console.log(`Found ${data.length} records to import`);

    // Optional: clear existing data in the collection first.
    // Comment this out if you want to append instead of replace.
    const deleted = await Food.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing records in "${COLLECTION_NAME}"`);

    console.log('--- Inserting records ---');
    const result = await Food.insertMany(data, { ordered: false });
    console.log(`✅ Inserted ${result.length} records into "${COLLECTION_NAME}"`);

    await mongoose.disconnect();
    console.log('--- Done ---');
  } catch (err) {
    console.error('❌ Import failed:', err.message);
    process.exit(1);
  }
})();
