import { API_BASE_URL } from '../config';

/** Analyze a food image with automatic retry mechanism for 503/transient errors. */
export async function analyzeFoodImage(
  base64,
  mimeType = 'image/jpeg',
  userId = null,
  storeImage = false,
  maxRetries = 2
) {
  if (!base64) {
    throw new Error('กรุณาระบุข้อมูลรูปภาพก่อนทำการวิเคราะห์');
  }

  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: cleanBase64, mimeType, userId, storeImage }),
      });

      const data = await response.json().catch(() => ({}));

      // 1. ตรวจสอบสถานะ HTTP Response
      if (!response.ok) {
        const isUnavailable =
          response.status === 503 ||
          data.code === 'UNAVAILABLE' ||
          data.error?.includes('high demand');

        // หากเจอ 503 ให้ลองใหม่อัตโนมัติก่อนส่ง error
        if (isUnavailable && attempt <= maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          continue;
        }

        if (isUnavailable) {
          throw new Error('บริการ AI มีผู้ใช้งานหนาแน่นชั่วคราว กรุณากดลองใหม่อีกครั้งในภายหลัง');
        }

        throw new Error(data.error || data.message || `เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ (${response.status})`);
      }

      // 2. ตรวจสอบสถานะประมวลผลจาก Backend
      if (!data.success) {
        throw new Error(data.error || 'ไม่สามารถวิเคราะห์ภาพอาหารได้');
      }

      // 3. ตรวจสอบผลลัพธ์รายการอาหาร
      const items = data.result?.items;
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('ไม่พบรายการอาหารในรูปภาพ กรุณาลองถ่ายมุมอื่นหรือค้นหาอาหารด้วยตนเอง');
      }

      return {
        ...data.result,
        source: data.source || 'gemini_vision',
        scanId: data.scanId || null,
      };
    } catch (error) {
      if (attempt > maxRetries) {
        throw error;
      }
    }
  }
}