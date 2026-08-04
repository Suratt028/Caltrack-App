const { analyzeFoodImage } = require('./geminiService');
const { searchFoodFromFatSecret } = require('./fatsecretService');
const FoodLog = require('../models/FoodLog');

function parseNutritionFromDescription(description = '') {
  const nutrition = {
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
  };

  if (!description || typeof description !== 'string') {
    return nutrition;
  }

  const normalized = description.replace(/\s+/g, ' ').toLowerCase();

  const numberMatch = (regex) => {
    const match = normalized.match(regex);
    return match ? Number(match[1]) : null;
  };

  nutrition.calories = numberMatch(/calories:\s*([\d,.]+)/i);
  nutrition.protein = numberMatch(/protein:\s*([\d,.]+)/i);
  nutrition.carbs = numberMatch(/carbs:\s*([\d,.]+)/i);
  nutrition.fat = numberMatch(/fat:\s*([\d,.]+)/i);

  return nutrition;
}

async function processFoodUpload(imageBuffer, mimeType = 'image/jpeg', options = {}) {
  if (!imageBuffer) {
    throw new Error('Image buffer is required to process food upload');
  }

  const aiResult = await analyzeFoodImage(imageBuffer, mimeType);
  const detectedName = aiResult.foodName || aiResult.name || 'อาหารไม่ทราบชื่อ';
  const fatsecretResults = await searchFoodFromFatSecret(detectedName);

  const defaultNutrition = {
    foodName: detectedName,
    calories: Number(aiResult.estimatedCalories ?? aiResult.kcal ?? 0),
    macronutrients: {
      protein: Number(aiResult.macronutrients?.protein ?? 0),
      carbs: Number(aiResult.macronutrients?.carbs ?? 0),
      fat: Number(aiResult.macronutrients?.fat ?? 0),
    },
    source: 'gemini',
  };

  const finalNutrition = {
    ...defaultNutrition,
    userId: options.userId,
    imageUrl: options.imageUrl,
  };

  if (fatsecretResults.length > 0) {
    const topMatch = fatsecretResults[0];
    const description = topMatch.food_description || topMatch.food_type || '';
    const parsedNutrition = parseNutritionFromDescription(description);

    finalNutrition.foodName = topMatch.food_name || detectedName;
    finalNutrition.source = 'fatsecret';
    finalNutrition.calories = parsedNutrition.calories ?? finalNutrition.calories;
    finalNutrition.macronutrients = {
      protein: parsedNutrition.protein ?? finalNutrition.macronutrients.protein,
      carbs: parsedNutrition.carbs ?? finalNutrition.macronutrients.carbs,
      fat: parsedNutrition.fat ?? finalNutrition.macronutrients.fat,
    };
    finalNutrition.fatSecretData = topMatch;
  }

  const savedLog = await new FoodLog(finalNutrition).save();
  return savedLog;
}

module.exports = {
  processFoodUpload,
};
