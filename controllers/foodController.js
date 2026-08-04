const { analyzeFoodImage } = require('../services/geminiService');
const FoodLog = require('../models/FoodLog');

async function processAndSaveFood(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    const aiResult = await analyzeFoodImage(imageBuffer, mimeType);

    const newFoodLog = new FoodLog({
      foodName: aiResult.foodName,
      calories: aiResult.estimatedCalories,
      macronutrients: {
        protein: aiResult.macronutrients.protein,
        carbs: aiResult.macronutrients.carbs,
        fat: aiResult.macronutrients.fat,
      },
      source: 'gemini',
    });

    const savedLog = await newFoodLog.save();

    return res.status(201).json({
      success: true,
      message: 'บันทึกข้อมูลอาหารเรียบร้อยแล้ว',
      data: savedLog,
    });
  } catch (error) {
    console.error('Error processing food image:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพหรือบันทึกข้อมูล',
      error: error.message,
    });
  }
}

module.exports = { processAndSaveFood };
