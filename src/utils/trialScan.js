// Turns a scan result into the short preview shown to guests on the trial
// scan screen. Prefers the database match the server marked as confident
// (per-100 g values × estimated grams) over the AI's own estimate.

const round = (value) => Math.round(Number(value) || 0);

export function summarizeScanItems(items) {
  const rows = (Array.isArray(items) ? items : []).map((item) => {
    const grams = Number(item?.estimated_grams?.likely) || 0;
    const match = (item?.candidates || []).find((candidate) => candidate?.confident && candidate.per100g);
    if (match && Number.isFinite(Number(match.per100g.kcal))) {
      const scale = grams / 100;
      return {
        name: match.nameTh || item.name_th,
        grams: round(grams),
        kcal: round(match.per100g.kcal * scale),
        protein: round(match.per100g.protein_g * scale),
        carbs: round(match.per100g.carbAvailable_g * scale),
        fat: round(match.per100g.fat_g * scale),
        fromDatabase: true,
      };
    }
    const nutrition = item?.estimated_nutrition || {};
    return {
      name: item?.name_th || '',
      grams: round(grams),
      kcal: round(nutrition.kcal),
      protein: round(nutrition.protein),
      carbs: round(nutrition.carbs),
      fat: round(nutrition.fat),
      fromDatabase: false,
    };
  }).filter((row) => row.name);

  const total = rows.reduce(
    (sum, row) => ({
      kcal: sum.kcal + row.kcal,
      protein: sum.protein + row.protein,
      carbs: sum.carbs + row.carbs,
      fat: sum.fat + row.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return { rows, total };
}
