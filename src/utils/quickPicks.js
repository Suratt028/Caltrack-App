// Suggestions shown on the Log screen before the user types anything.
// Thai eaters repeat meals a lot, so one tap on a chip fills the search box.

// Common Thai street/office meals, used until the user has logged anything.
export const POPULAR_FOODS = [
  'ข้าวมันไก่',
  'ข้าวกะเพราไก่',
  'ผัดไทย',
  'ข้าวผัด',
  'ส้มตำ',
  'ก๋วยเตี๋ยว',
  'ข้าวขาหมู',
  'ไข่เจียว',
];

/**
 * Unique food names the user logged most recently, newest first.
 * @param {Record<string, Array<{ name?: string, time?: string }>>} logsByDay
 * @param {number} limit
 * @returns {string[]}
 */
export function recentFoodNames(logsByDay, limit = 8) {
  const entries = Object.entries(logsByDay || {})
    .flatMap(([dateKey, dayEntries]) =>
      (Array.isArray(dayEntries) ? dayEntries : []).map((entry, index) => ({
        name: String(entry?.name || '').trim(),
        // Same-day entries without a time keep their logged order.
        sortKey: `${dateKey}|${entry?.time || ''}|${String(index).padStart(4, '0')}`,
      }))
    )
    .filter((entry) => entry.name)
    .sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0));

  const seen = new Set();
  const names = [];
  for (const { name } of entries) {
    if (seen.has(name)) continue;
    seen.add(name);
    names.push(name);
    if (names.length >= limit) break;
  }
  return names;
}
