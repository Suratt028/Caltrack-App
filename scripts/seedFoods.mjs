// scripts/seedFoods.mjs
// Run this script with Node.js to seed your MongoDB Atlas collection:
//   MONGODB_URI=mongodb+srv://... node scripts/seedFoods.mjs
import { MongoClient } from mongodb;

const MONGODB_URI = process.env.MONGODB_URI || mongodb://localhost:27017/caltrack;
const DB_NAME = caltrack;
const COLLECTION = foods;

let _id = 0;
const nextId = () => seed_;
const item = (name, nameEn, kcal, protein, carbs, fat, serving, category) => ({
  id: nextId(), name, nameEn, kcal, protein, carbs, fat, serving, category,
});

const FOOD_SEED = [
  item(\u0e02\u0e49\u0e32\u0e27\u0e1c\u0e31\u0e14\u0e01\u0e30\u0e40\u0e1e\u0e23\u0e32\u0e2b\u0e21\u0e39\u0e2a\u0e31\u0e1a (\u0e44\u0e02\u0e48\u0e14\u0e32\u0e27), Pad Kra Pao Moo with fried egg, 620, 28, 55, 32, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e15\u0e49\u0e21\u0e22\u0e33\u0e01\u0e38\u0e49\u0e07\u0e19\u0e49\u0e33\u0e43\u0e2a, Tom Yum Goong (clear), 210, 20, 12, 8, 1 \u0e0a\u0e32\u0e21, thai),
  item(\u0e2a\u0e49\u0e21\u0e15\u0e33\u0e44\u0e17\u0e22, Som Tam Thai, 180, 4, 30, 5, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e02\u0e49\u0e32\u0e27\u0e21\u0e31\u0e19\u0e44\u0e01\u0e48, Khao Man Gai, 620, 26, 70, 24, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e41\u0e01\u0e07\u0e40\u0e02\u0e35\u0e22\u0e27\u0e2b\u0e27\u0e32\u0e19\u0e44\u0e01\u0e48 + \u0e02\u0e49\u0e32\u0e27, Green Curry Chicken with rice, 650, 24, 60, 34, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e1c\u0e31\u0e14\u0e44\u0e17\u0e22\u0e01\u0e38\u0e49\u0e07\u0e2a\u0e14, Pad Thai with shrimp, 540, 20, 65, 20, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e02\u0e49\u0e32\u0e27\u0e02\u0e32\u0e2b\u0e21\u0e39, Khao Kha Moo, 720, 30, 68, 36, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e25\u0e32\u0e1a\u0e2b\u0e21\u0e39, Larb Moo, 320, 24, 12, 20, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e15\u0e49\u0e21\u0e02\u0e48\u0e32\u0e44\u0e01\u0e48, Tom Kha Gai, 280, 18, 10, 20, 1 \u0e0a\u0e32\u0e21, thai),
  item(\u0e02\u0e49\u0e32\u0e27\u0e40\u0e2b\u0e19\u0e35\u0e22\u0e27\u0e2b\u0e21\u0e39\u0e1b\u0e34\u0e49\u0e07, Sticky rice with grilled pork skewers, 480, 22, 55, 18, 1 \u0e0a\u0e38\u0e14, thai),
  item(\u0e01\u0e4b\u0e27\u0e22\u0e40\u0e15\u0e35\u0e4b\u0e22\u0e27\u0e40\u0e23\u0e37\u0e2d\u0e40\u0e19\u0e37\u0e49\u0e2d, Boat noodles beef, 380, 18, 48, 12, 1 \u0e0a\u0e32\u0e21, thai),
  item(\u0e22\u0e33\u0e27\u0e38\u0e49\u0e19\u0e40\u0e2a\u0e49\u0e19, Yum Woon Sen, 260, 14, 30, 9, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e02\u0e49\u0e32\u0e27\u0e1c\u0e31\u0e14\u0e2b\u0e21\u0e39, Pork fried rice, 550, 18, 68, 20, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e44\u0e02\u0e48\u0e40\u0e08\u0e35\u0e22\u0e27\u0e2b\u0e21\u0e39\u0e2a\u0e31\u0e1a, Thai omelet with minced pork, 320, 14, 6, 26, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e44\u0e01\u0e48\u0e17\u0e2d\u0e14\u0e2b\u0e32\u0e14\u0e43\u0e2b\u0e0d\u0e48, Hat Yai fried chicken, 400, 26, 14, 26, 3 \u0e0a\u0e34\u0e49\u0e19, thai),
  item(\u0e2a\u0e38\u0e01\u0e35\u0e49\u0e19\u0e49\u0e33\u0e17\u0e30\u0e40\u0e25, Suki soup seafood, 260, 22, 20, 8, 1 \u0e0a\u0e32\u0e21, thai),
  item(\u0e1c\u0e31\u0e14\u0e0b\u0e35\u0e2d\u0e34\u0e4a\u0e27\u0e2b\u0e21\u0e39, Pad See Ew pork, 580, 20, 66, 22, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e41\u0e01\u0e07\u0e21\u0e31\u0e2a\u0e21\u0e31\u0e48\u0e19\u0e44\u0e01\u0e48 + \u0e02\u0e49\u0e32\u0e27, Massaman curry chicken with rice, 700, 26, 62, 38, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e02\u0e19\u0e21\u0e08\u0e35\u0e19\u0e19\u0e49\u0e33\u0e22\u0e32, Khanom Chin Nam Ya, 420, 16, 55, 14, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e02\u0e49\u0e32\u0e27\u0e40\u0e1b\u0e25\u0e48\u0e32 (\u0e2a\u0e27\u0e22), Steamed jasmine rice, 240, 5, 53, 0.5, 1 \u0e08\u0e32\u0e19, thai),
  item(\u0e2d\u0e01\u0e44\u0e01\u0e48\u0e22\u0e48\u0e32\u0e07 (\u0e44\u0e21\u0e48\u0e15\u0e34\u0e14\u0e2b\u0e19\u0e31\u0e07), Grilled chicken breast, 165, 31, 0, 3.6, 100 \u0e01\u0e23\u0e31\u0e21, international),
  item(\u0e02\u0e49\u0e32\u0e27\u0e01\u0e25\u0e49\u0e2d\u0e07, Brown rice, cooked, 215, 5, 45, 1.8, 1 \u0e16\u0e49\u0e27\u0e22, international),
  item(\u0e01\u0e25\u0e49\u0e27\u0e22\u0e2b\u0e2d\u0e21, Banana, 105, 1.3, 27, 0.4, 1 \u0e1c\u0e25, international),
  item(\u0e44\u0e02\u0e48\u0e15\u0e49\u0e21, Boiled egg, 78, 6.3, 0.6, 5.3, 1 \u0e1f\u0e2d\u0e07, international),
  item(\u0e02\u0e49\u0e32\u0e27\u0e42\u0e2d\u0e4a\u0e15, Oatmeal, cooked, 150, 5, 27, 3, 1 \u0e16\u0e49\u0e27\u0e22, international),
  item(\u0e41\u0e0b\u0e25\u0e21\u0e2d\u0e19\u0e22\u0e48\u0e32\u0e07, Grilled salmon, 208, 22, 0, 13, 100 \u0e01\u0e23\u0e31\u0e21, international),
  item(\u0e1a\u0e23\u0e47\u0e2d\u0e01\u0e42\u0e04\u0e25\u0e35\u0e19\u0e36\u0e48\u0e07, Steamed broccoli, 55, 3.7, 11, 0.6, 1 \u0e16\u0e49\u0e27\u0e22, international),
  item(\u0e2d\u0e31\u0e25\u0e21\u0e2d\u0e19\u0e14\u0e4c, Almonds, 164, 6, 6, 14, 28 \u0e01\u0e23\u0e31\u0e21, international),
  item(\u0e01\u0e23\u0e35\u0e01\u0e42\u0e22\u0e40\u0e01\u0e34\u0e23\u0e4c\u0e15\u0e23\u0e2a\u0e18\u0e23\u0e23\u0e21\u0e0a\u0e32\u0e15\u0e34, Greek yogurt, plain, 100, 17, 6, 0.7, 170 \u0e01\u0e23\u0e31\u0e21, international),
  item(\u0e2d\u0e30\u0e42\u0e27\u0e04\u0e32\u0e42\u0e14, Avocado, 240, 3, 13, 22, 1 \u0e1c\u0e25, international),
  item(\u0e41\u0e2d\u0e1b\u0e40\u0e1b\u0e34\u0e49\u0e25, Apple, 95, 0.5, 25, 0.3, 1 \u0e1c\u0e25, international),
  item(\u0e19\u0e21\u0e08\u0e37\u0e14, Milk, whole, 149, 8, 12, 8, 1 \u0e41\u0e01\u0e49\u0e27 (240ml), international),
  item(\u0e02\u0e19\u0e21\u0e1b\u0e31\u0e07\u0e42\u0e2e\u0e25\u0e27\u0e35\u0e15, Whole wheat bread, 80, 4, 14, 1, 1 \u0e41\u0e1c\u0e48\u0e19, international),
  item(\u0e1e\u0e32\u0e2a\u0e15\u0e49\u0e32\u0e0b\u0e2d\u0e2a\u0e21\u0e30\u0e40\u0e02\u0e37\u0e2d\u0e40\u0e17\u0e28, Pasta with tomato sauce, 480, 14, 80, 10, 1 \u0e08\u0e32\u0e19, international),
  item(\u0e2a\u0e40\u0e15\u0e47\u0e01\u0e40\u0e19\u0e37\u0e49\u0e2d, Beef steak, 340, 33, 0, 22, 150 \u0e01\u0e23\u0e31\u0e21, international),
  item(\u0e1e\u0e34\u0e0b\u0e0b\u0e48\u0e32 (\u0e2a\u0e44\u0e25\u0e0b\u0e4c), Pizza, cheese slice, 285, 12, 36, 10, 1 \u0e0a\u0e34\u0e49\u0e19, international),
  item(\u0e40\u0e1a\u0e2d\u0e23\u0e4c\u0e40\u0e01\u0e2d\u0e23\u0e4c\u0e40\u0e19\u0e37\u0e49\u0e2d, Beef burger, 540, 25, 40, 29, 1 \u0e0a\u0e34\u0e49\u0e19, international),
  item(\u0e40\u0e1f\u0e23\u0e19\u0e0a\u0e4c\u0e1f\u0e23\u0e32\u0e22\u0e2a\u0e4c, French fries, 365, 4, 48, 17, 1 \u0e17\u0e35\u0e48 (\u0e02\u0e19\u0e32\u0e14\u0e01\u0e25\u0e32\u0e07), international),
  item(\u0e01\u0e32\u0e41\u0e1f\u0e25\u0e32\u0e40\u0e15\u0e49 (\u0e19\u0e21\u0e2a\u0e14), Latte with whole milk, 190, 10, 18, 9, 1 \u0e41\u0e01\u0e49\u0e27 (12oz), international),
];

const client = new MongoClient(MONGODB_URI);

async function seed() {
  try {
    await client.connect();
    console.log(Connected to MongoDB);
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);
    await col.deleteMany({});
    const result = await col.insertMany(FOOD_SEED);
    console.log(Seeded  food items into .);
    await col.createIndex({ name: 1 });
    await col.createIndex({ nameEn: 1 });
    await col.createIndex({ category: 1 });
    console.log(Indexes created);
  } finally {
    await client.close();
  }
}

seed().catch(console.error);
