const DISPLAY_NAME_ALIASES = new Map([
  ['ข้าวเจ้า, นึ่ง', 'ข้าวสวย'],
]);

export function getFoodDisplayName(name) {
  const normalizedName = String(name || '').trim();
  return DISPLAY_NAME_ALIASES.get(normalizedName) || normalizedName;
}
