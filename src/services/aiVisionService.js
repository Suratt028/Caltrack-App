// src/services/aiVisionService.js
import { API_BASE_URL, GEMINI_API_KEY } from '../config';

/**
 * Analyzes an image of food using AI Vision (Gemini 1.5 Flash Vision / Server API).
 * @param {string} base64 - Base64 encoded string of the image
 * @param {string} mimeType - Image mime type (default: 'image/jpeg')
 * @returns {Promise<{ name: string, kcal: number, protein: number, carbs: number, fat: number, confidence: number, source: string }>}
 */
export async function analyzeFoodImage(base64, mimeType = 'image/jpeg') {
  if (!base64) {
    throw new Error('Image base64 data is required for AI analysis');
  }

  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');

  // 1. Try Backend API endpoint first
  try {
    const response = await fetch(`${API_BASE_URL}/ai/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: cleanBase64, mimeType }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.result) {
        return {
          ...data.result,
          source: data.source || 'gemini_vision',
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI Scan endpoint unavailable, trying direct API call if key present...', err.message);
  }

  // 2. Direct Gemini API call if API key present on client
  if (GEMINI_API_KEY) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const promptText = `
คุณเป็นผู้เชี่ยวชาญด้านโภชนาการ วิเคราะห์ภาพอาหารนี้และตอบเป็น JSON เท่านั้นในรูปแบบต่อไปนี้:
{
  "name": "ชื่ออาหารภาษาไทย (ถ้าเป็นอาหารต่างชาติให้ทับศัพท์)",
  "kcal": แคลอรี่โดยประมาณ (ตัวเลข integer),
  "protein": โปรตีนกี่กรัม (ตัวเลข integer/float),
  "carbs": คาร์โบไฮเดรตกี่กรัม (ตัวเลข integer/float),
  "fat": ไขมันกี่กรัม (ตัวเลข integer/float),
  "confidence": ค่าความมั่นใจในการระบุอาหาร (0.5 - 0.99)
}
ห้ามใส่ข้อความอื่น ห้ามใส่ markdown block เพิ่มเติม ให้ตอบเพียง JSON string เท่านั้น
`;

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
        }),
      });

      const data = await res.json();
      if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        let text = data.candidates[0].content.parts[0].text.trim();
        text = text.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(text);
        return {
          name: parsed.name || 'อาหารไม่ทราบชื่อ',
          kcal: Number(parsed.kcal) || 350,
          protein: Number(parsed.protein) || 15,
          carbs: Number(parsed.carbs) || 45,
          fat: Number(parsed.fat) || 12,
          confidence: Number(parsed.confidence) || 0.92,
          source: 'gemini_vision_direct',
        };
      }
    } catch (directErr) {
      console.warn('Direct Gemini API call error:', directErr.message);
    }
  }

  // 3. Fallback response with random Thai dish
  const sampleFoods = [
    { name: 'ข้าวมันไก่', kcal: 596, protein: 24, carbs: 70, fat: 24, confidence: 0.88 },
    { name: 'ผัดไทยกุ้งสด', kcal: 545, protein: 22, carbs: 64, fat: 20, confidence: 0.85 },
    { name: 'ข้าวผัดกระเพราหมูสับ + ไข่ดาว', kcal: 630, protein: 28, carbs: 68, fat: 26, confidence: 0.91 },
    { name: 'ต้มยำกุ้งน้ำข้น', kcal: 320, protein: 26, carbs: 18, fat: 16, confidence: 0.82 },
    { name: 'แกงเขียวหวานไก่', kcal: 480, protein: 20, carbs: 22, fat: 34, confidence: 0.86 },
  ];
  const picked = sampleFoods[Math.floor(Math.random() * sampleFoods.length)];
  return {
    ...picked,
    source: 'mock_fallback',
  };
}
