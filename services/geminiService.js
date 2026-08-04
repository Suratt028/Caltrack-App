const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * วิเคราะห์รูปภาพอาหารด้วย Gemini 1.5 Flash
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 */
async function analyzeFoodImage(imageBuffer, mimeType = 'image/jpeg') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `
    คุณคือผู้เชี่ยวชาญด้านโภชนาการ โปรดวิเคราะห์รูปภาพอาหารนี้และประเมินค่าโภชนาการ
    ตอบกลับในรูปแบบ JSON ตามโครงสร้างนี้เท่านั้น:
    {
      "foodName": "ชื่ออาหารภาษาไทย",
      "estimatedCalories": 0,
      "macronutrients": {
        "protein": 0,
        "carbs": 0,
        "fat": 0
      }
    }
  `;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const responseText = await result.response.text();
  return JSON.parse(responseText);
}

module.exports = { analyzeFoodImage };
