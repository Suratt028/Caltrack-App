function scaleNutrition(food, grams, fields) {
  const factor = Number(grams) / 100;
  return Object.fromEntries(
    fields.map((field) => {
      const per100g = food[field];
      const value = per100g == null ? null : Math.round(per100g * factor * 100) / 100;
      return [field, value];
    })
  );
}

function addNutritionTotals(totals, nutrition) {
  for (const [field, value] of Object.entries(nutrition)) {
    if (value != null) totals[field] = Math.round((totals[field] + value) * 100) / 100;
  }
}

module.exports = { scaleNutrition, addNutritionTotals };
