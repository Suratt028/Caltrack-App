// Ranks food-database rows against a dish name returned by the AI scan.
//
// The AI names dishes freely ("ผัดไทยกุ้งสด") while the database uses formal
// composition-table names ("ก๋วยเตี๋ยวผัดไทย, ใส่ไข่"), so a plain substring
// search misses most dishes and returns unrelated rows first. This module:
//   - splits Thai names into words (Intl.Segmenter) and also checks adjacent
//     word pairs, since compound dish words get split ("ผัด|ไทย"),
//   - scores exact > variant ("ส้มตำ, ปลาร้า") > contains > shared words,
//     with English name words as a fallback signal,
//   - pushes rows with incomplete nutrition to the bottom.
// Pure functions only; server.js does the database query.

const thaiSegmenter = new Intl.Segmenter('th', { granularity: 'word' });
const REQUIRED_NUTRIENTS = ['kcal', 'protein_g', 'fat_g', 'carbAvailable_g'];
// Scanned plates are cooked, so raw grains/meat/fish/eggs ("…, ดิบ") are a poor
// default: raw rice is ~350 kcal/100 g, cooked ~130–170. Raw fruit/veg is fine.
const RAW_MARKER = 'ดิบ';
const COOKED_WHEN_SCANNED_GROUPS = ['ธัญพืช', 'เนื้อสัตว์', 'ปลา', 'ไข่', 'ราก หัว'];
const RAW_PENALTY = 25;
const EN_STOP_WORDS = new Set(['with', 'and', 'the', 'of', 'in', 'a', 'thai', 'style', 'fresh', 'food']);

const normalize = (text) => String(text || '').toLowerCase().replace(/[\s,()./-]+/g, '');

function thaiWords(text) {
  return [...thaiSegmenter.segment(String(text || ''))]
    .filter((part) => part.isWordLike)
    .map((part) => part.segment.trim())
    .filter((word) => word.length >= 2);
}

function englishWords(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length >= 3 && !EN_STOP_WORDS.has(word));
}

// Words plus adjacent pairs, longest first, so "ผัดไทย" is tried before "ผัด".
function searchTerms(nameTh) {
  const words = thaiWords(nameTh);
  const pairs = words.slice(1).map((word, i) => words[i] + word);
  return [...new Set([...pairs, ...words])].sort((a, b) => b.length - a.length);
}

function hasCompleteNutrition(food) {
  return REQUIRED_NUTRIENTS.every((key) => typeof food[key] === 'number' && Number.isFinite(food[key]));
}

function isRawStaple(food) {
  return String(food.nameTh || '').includes(RAW_MARKER)
    && COOKED_WHEN_SCANNED_GROUPS.some((group) => String(food.foodGroupTh || '').includes(group));
}

/**
 * Scores one database row against the AI's names.
 * Returns { score, matchType } where matchType is 'exact' | 'variant' |
 * 'contains' | 'partial' | 'english' | null.
 */
function scoreFood(food, nameTh, nameEn) {
  const query = normalize(nameTh);
  const dbName = normalize(food.nameTh);
  if (!query || !dbName) return { score: 0, matchType: null };

  let score = 0;
  let matchType = null;

  if (dbName === query) {
    score = 100;
    matchType = 'exact';
  } else if (String(food.nameTh).trim().startsWith(`${String(nameTh).trim()},`)) {
    // A listed variant of exactly this dish, e.g. AI "ส้มตำ" → "ส้มตำ, ปลาร้า".
    score = 90;
    matchType = 'variant';
  } else if (dbName.includes(query) && query.length >= 3) {
    // Very short names ("ส้ม") are too ambiguous to count as "contains".
    score = 70;
    matchType = 'contains';
  } else {
    // Compare whole words, not substrings: "ชา" must not match inside "กระชาย".
    const words = thaiWords(nameTh);
    if (words.length) {
      const dbWordList = thaiWords(food.nameTh);
      const dbWords = new Set([...dbWordList, ...dbWordList.slice(1).map((word, i) => dbWordList[i] + word)]);
      const pairs = words.slice(1).map((word, i) => words[i] + word);
      const wordHits = words.filter((word) => dbWords.has(word)).length;
      const pairHits = pairs.filter((pair) => dbWords.has(pair)).length;
      // The first word is usually the dish type (ข้าว, ก๋วยเตี๋ยว, ต้มยำ, แกง);
      // without it a shared side word ("ย่าง", "หมู") is too weak to suggest.
      if (dbWords.has(words[0]) && wordHits > 0) {
        score = Math.round(50 * (wordHits / words.length)) + pairHits * 6 + 8;
        matchType = 'partial';
      }
    }
  }

  // English: whole words only ("tea" must not match "steamed"). On its own it
  // must cover at least 2/3 of the AI's English words to be suggested.
  const enWords = englishWords(nameEn);
  if (enWords.length) {
    const dbEnglish = new Set(englishWords(food.nameEn));
    const enHits = enWords.filter((word) => dbEnglish.has(word)).length;
    const enCoverage = enHits / enWords.length;
    const enScore = Math.round(30 * enCoverage);
    if (!matchType && enHits > 0 && enCoverage >= 2 / 3) matchType = 'english';
    score += matchType === 'english' ? enScore : Math.round(enScore / 3);
  }

  if (!matchType) return { score: 0, matchType: null };

  // Prefer names close in length to the query (less extra stuff on the plate).
  score -= Math.min(10, Math.max(0, dbName.length - query.length) / 4);
  if (!hasCompleteNutrition(food)) score -= 30;
  if (isRawStaple(food)) score -= RAW_PENALTY;
  return { score: Math.round(score * 10) / 10, matchType };
}

/** Ranks candidate rows; returns the best `limit` with matchScore/matchType attached. */
function rankFoodCandidates(foods, nameTh, nameEn, limit = 5) {
  return foods
    .map((food) => ({ food, ...scoreFood(food, nameTh, nameEn) }))
    .filter((entry) => entry.matchType && entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ food, score, matchType }) => ({ ...food, matchScore: score, matchType }));
}

// A match the app may pre-select instead of the AI's own estimate.
function isConfidentMatch(candidate) {
  return Boolean(candidate)
    && (candidate.matchType === 'exact' || candidate.matchType === 'variant')
    && hasCompleteNutrition(candidate)
    && !isRawStaple(candidate);
}

module.exports = { searchTerms, englishWords, scoreFood, rankFoodCandidates, isConfidentMatch, hasCompleteNutrition, isRawStaple };
