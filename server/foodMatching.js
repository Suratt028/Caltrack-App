// Ranks food-database rows against a dish name returned by the AI scan.
//
// The AI names dishes freely ("ผัดไทยกุ้งสด") while the database uses formal
// composition-table names ("ก๋วยเตี๋ยวผัดไทย, ใส่ไข่"), so a plain substring
// search misses most dishes and returns unrelated rows first. This module:
//   - splits Thai names into words (Intl.Segmenter) and also checks adjacent
//     word pairs, since compound dish words get split ("ผัด|ไทย"),
//   - scores exact > variant ("ส้มตำ, ปลาร้า") > contains > shared words,
//     with English name words as a fallback signal,
//   - pushes rows with incomplete nutrition to the bottom,
//   - folds spelling variants ("กระเพรา" = "กะเพรา") on both sides and tries
//     everyday-name aliases ("ข้าวสวย" → "ข้าวเจ้า, นึ่ง") from thaiFoodAliases.
// Pure functions only; server.js does the database query.

const { SPELLING_VARIANTS, DISH_ALIASES } = require('./thaiFoodAliases');

const thaiSegmenter = new Intl.Segmenter('th', { granularity: 'word' });
const REQUIRED_NUTRIENTS = ['kcal', 'protein_g', 'fat_g', 'carbAvailable_g'];
// Scanned plates are cooked, so raw grains/meat/fish/eggs ("…, ดิบ") are a poor
// default: raw rice is ~350 kcal/100 g, cooked ~130–170. Raw fruit/veg is fine.
const RAW_MARKER = 'ดิบ';
const COOKED_WHEN_SCANNED_GROUPS = ['ธัญพืช', 'เนื้อสัตว์', 'ปลา', 'ไข่', 'ราก หัว'];
const RAW_PENALTY = 25;
const EN_STOP_WORDS = new Set(['with', 'and', 'the', 'of', 'in', 'a', 'thai', 'style', 'fresh', 'food']);

// A name reached through an alias ranks just below the same match on the name itself.
const DISH_ALIAS_PENALTY = 2;
const AI_ALIAS_PENALTY = 4;
const MAX_AI_ALIASES = 5;

const normalize = (text) => String(text || '').toLowerCase().replace(/[\s,()./-]+/g, '');
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Replaces `from` with `to` except where it is already part of `to`
// ("ผัดไท" → "ผัดไทย" must leave "ผัดไทย" alone).
function replaceOutside(text, from, to) {
  return text.split(to).map((part) => part.split(from).join(to)).join(to);
}

function canonicalSpelling(text) {
  return SPELLING_VARIANTS.reduce((result, [from, to]) => replaceOutside(result, from, to), String(text || ''));
}

// Canonical spelling → every spelling of it, for building database regexes.
const SPELLINGS_BY_CANONICAL = SPELLING_VARIANTS.reduce((map, [from, to]) => {
  map.set(to, [...(map.get(to) || [to]), from]);
  return map;
}, new Map());
const CANONICAL_PATTERN = new RegExp(
  [...SPELLINGS_BY_CANONICAL.keys()].sort((a, b) => b.length - a.length).map(escapeRegex).join('|'),
  'g'
);

/** Regex source matching `term` under any listed spelling, e.g. "กะเพราไก่" → "(?:กะเพรา|กระเพรา|…)ไก่". */
function spellingRegexSource(term) {
  const canonical = canonicalSpelling(term);
  let source = '';
  let last = 0;
  for (const match of canonical.matchAll(CANONICAL_PATTERN)) {
    source += escapeRegex(canonical.slice(last, match.index));
    source += `(?:${SPELLINGS_BY_CANONICAL.get(match[0]).map(escapeRegex).join('|')})`;
    last = match.index + match[0].length;
  }
  return source + escapeRegex(canonical.slice(last));
}

/**
 * The names to try for one query: the name itself (canonical spelling), each
 * everyday-name alias that starts it, and any extra names (the AI's aliases),
 * each with a small ranking penalty. Returns [{ name, penalty }].
 */
function thaiNameVariants(nameTh, extraNames = []) {
  const variants = new Map();
  const add = (name, penalty) => {
    const key = normalize(name);
    if (key && (!variants.has(key) || variants.get(key).penalty > penalty)) variants.set(key, { name, penalty });
  };
  const expand = (rawName, penalty) => {
    const name = canonicalSpelling(String(rawName || '').trim());
    if (!name) return;
    add(name, penalty);
    for (const [phrase, targets] of DISH_ALIASES) {
      const canonicalPhrase = canonicalSpelling(phrase);
      if (!name.startsWith(canonicalPhrase)) continue;
      const rest = name.slice(canonicalPhrase.length);
      for (const target of targets) add(canonicalSpelling(target) + rest, penalty + DISH_ALIAS_PENALTY);
    }
  };
  expand(nameTh, 0);
  (Array.isArray(extraNames) ? extraNames : [])
    .filter((name) => typeof name === 'string' && name.trim() && name.length <= 80)
    .slice(0, MAX_AI_ALIASES)
    .forEach((name) => expand(name, AI_ALIAS_PENALTY));
  return [...variants.values()];
}

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
// Spelling is canonical; pass each term through spellingRegexSource for the database.
function searchTerms(nameTh) {
  const words = thaiWords(canonicalSpelling(nameTh));
  const pairs = words.slice(1).map((word, i) => words[i] + word);
  return [...new Set([...pairs, ...words])].sort((a, b) => b.length - a.length);
}

/** Every name to look up for a scan item: { names: whole variant names, terms: their words/pairs }. */
function candidateSearchTerms(nameTh, aliases = []) {
  const names = thaiNameVariants(nameTh, aliases).map((variant) => variant.name);
  const terms = [...new Set(names.flatMap(searchTerms))].sort((a, b) => b.length - a.length);
  return { names, terms };
}

function hasCompleteNutrition(food) {
  return REQUIRED_NUTRIENTS.every((key) => typeof food[key] === 'number' && Number.isFinite(food[key]));
}

function isRawStaple(food) {
  return String(food.nameTh || '').includes(RAW_MARKER)
    && COOKED_WHEN_SCANNED_GROUPS.some((group) => String(food.foodGroupTh || '').includes(group));
}

// Per-row values reused across query variants (segmenting is the slow part).
function prepareFood(food) {
  const nameTh = canonicalSpelling(String(food.nameTh || '').trim());
  let dbWords;
  let dbEnglish;
  return {
    food,
    nameTh,
    dbName: normalize(nameTh),
    get dbWords() {
      if (!dbWords) {
        const list = thaiWords(nameTh);
        dbWords = new Set([...list, ...list.slice(1).map((word, i) => list[i] + word)]);
      }
      return dbWords;
    },
    get dbEnglish() {
      if (!dbEnglish) dbEnglish = new Set(englishWords(food.nameEn));
      return dbEnglish;
    },
  };
}

function scorePrepared(row, nameTh, nameEn) {
  const query = normalize(nameTh);
  const { dbName } = row;
  if (!query || !dbName) return { score: 0, matchType: null };

  let score = 0;
  let matchType = null;

  if (dbName === query) {
    score = 100;
    matchType = 'exact';
  } else if (row.nameTh.startsWith(`${String(nameTh).trim()},`)) {
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
      const { dbWords } = row;
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
    const { dbEnglish } = row;
    const enHits = enWords.filter((word) => dbEnglish.has(word)).length;
    const enCoverage = enHits / enWords.length;
    const enScore = Math.round(30 * enCoverage);
    if (!matchType && enHits > 0 && enCoverage >= 2 / 3) matchType = 'english';
    score += matchType === 'english' ? enScore : Math.round(enScore / 3);
  }

  if (!matchType) return { score: 0, matchType: null };

  // Prefer names close in length to the query (less extra stuff on the plate).
  score -= Math.min(10, Math.max(0, dbName.length - query.length) / 4);
  if (!hasCompleteNutrition(row.food)) score -= 30;
  if (isRawStaple(row.food)) score -= RAW_PENALTY;
  return { score: Math.round(score * 10) / 10, matchType };
}

/**
 * Scores one database row against the AI's names.
 * Returns { score, matchType } where matchType is 'exact' | 'variant' |
 * 'contains' | 'partial' | 'english' | null.
 */
function scoreFood(food, nameTh, nameEn) {
  return scorePrepared(prepareFood(food), canonicalSpelling(String(nameTh || '').trim()), nameEn);
}

// Best score over every name variant (the name itself, aliases, AI aliases).
function bestScore(row, variants, nameEn) {
  let best = { score: 0, matchType: null };
  for (const { name, penalty } of variants) {
    const result = scorePrepared(row, name, nameEn);
    if (!result.matchType) continue;
    const score = Math.round((result.score - penalty) * 10) / 10;
    if (!best.matchType || score > best.score) best = { score, matchType: result.matchType };
  }
  return best;
}

/**
 * Ranks candidate rows; returns the best `limit` with matchScore/matchType attached.
 * `aliases` are other names for the dish (the AI scan's `aliases` field).
 */
function rankFoodCandidates(foods, nameTh, nameEn, limit = 5, { aliases = [] } = {}) {
  const variants = thaiNameVariants(nameTh, aliases);
  return foods
    .map((food) => ({ food, ...bestScore(prepareFood(food), variants, nameEn) }))
    .filter((entry) => entry.matchType && entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ food, score, matchType }) => ({ ...food, matchScore: score, matchType }));
}

// Typed search: every row the database matched stays in the results; this only
// orders them. Exact > listed variant ("ข้าวเจ้า" → "ข้าวเจ้า, นึ่ง") > starts
// with > contains, on the Thai name (any spelling or alias) or the English
// name; rows with incomplete nutrition and raw staples sink.
const SEARCH_RAW_PENALTY = 8;

function searchMatchScore(text, rawText, query, rawQuery) {
  if (!text || !query) return 0;
  if (text === query) return 100;
  if (rawText.startsWith(`${rawQuery},`)) return 90;
  if (text.startsWith(query)) return 80;
  if (text.includes(query)) return 60;
  return 0;
}

function scoreSearchResult(row, variants, q) {
  const enRaw = String(row.food.nameEn || '').trim().toLowerCase();
  const en = normalize(enRaw);
  const qEn = String(q || '').trim().toLowerCase();
  let best = 0;
  let extraLength = 0; // how much longer the matched name is than the query
  const consider = (score, field, query) => {
    if (score > best) {
      best = score;
      extraLength = Math.max(0, field.length - query.length);
    }
  };
  for (const { name, penalty } of variants) {
    const query = normalize(name);
    const score = searchMatchScore(row.dbName, row.nameTh, query, name);
    if (score) consider(score - penalty, row.dbName, query);
  }
  const qEnNorm = normalize(qEn);
  const enScore = searchMatchScore(en, enRaw, qEnNorm, qEn);
  if (enScore) consider(enScore - 1, en, qEnNorm);
  // Matched only on scientific name (or some other way the database found it).
  if (best <= 0) best = 20;

  let score = best - Math.min(10, extraLength / 4);
  if (!hasCompleteNutrition(row.food)) score -= 30;
  if (isRawStaple(row.food)) score -= SEARCH_RAW_PENALTY;
  return score;
}

/** Orders search-endpoint rows best first and returns the top `limit`. */
function rankSearchResults(foods, q, limit = 20) {
  const variants = thaiNameVariants(q);
  return foods
    .map((food, index) => ({ food, index, score: scoreSearchResult(prepareFood(food), variants, q) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.food);
}

// A match the app may pre-select instead of the AI's own estimate.
function isConfidentMatch(candidate) {
  return Boolean(candidate)
    && (candidate.matchType === 'exact' || candidate.matchType === 'variant')
    && hasCompleteNutrition(candidate)
    && !isRawStaple(candidate);
}

module.exports = {
  searchTerms,
  candidateSearchTerms,
  englishWords,
  canonicalSpelling,
  spellingRegexSource,
  thaiNameVariants,
  scoreFood,
  rankFoodCandidates,
  rankSearchResults,
  isConfidentMatch,
  hasCompleteNutrition,
  isRawStaple,
};

