// src/services/aiVisionService.js
import { API_BASE_URL } from '../config';

/**
 * Analyzes an image of food using AI Vision (Gemini 1.5 Flash Vision / Server API).
 * @param {string} base64 - Base64 encoded string of the image
 * @param {string} mimeType - Image mime type (default: 'image/jpeg')
 * @returns {Promise<{
 *   name: string, kcal: number, protein: number, carbs: number, fat: number,
 *   confidence: number, source: string,
 *   dbMatch: { foodId: string, nameTh: string, nameEn: string, per100g: object } | null
 * }>}
 */
export async function analyzeFoodImage(base64, mimeType = 'image/jpeg', userId = null) {
  if (!base64) {
    throw new Error('Image base64 data is required for AI analysis');
  }

  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');

  // Keep the Gemini API key on the server; the mobile app only calls this endpoint.
  try {
    const response = await fetch(`${API_BASE_URL}/ai/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: cleanBase64, mimeType, userId }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.result) {
        return {
          ...data.result,
          source: data.source || 'gemini_vision',
          scanId: data.scanId || null,
          // Real per-100g nutrition from our own Thai food database, if Gemini's
          // guessed name matched something in it. null when no confident match.
          dbMatch: data.dbMatch || null,
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI Scan endpoint unavailable:', err.message);
  }

  // Backend returns its own fallback when Gemini is unavailable. This local
  // fallback keeps the screen usable when the backend itself cannot be reached.
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
    scanId: null,
    dbMatch: null,
  };
}