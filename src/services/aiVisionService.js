import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { API_BASE_URL } from '../config';
import { authHeaders, fetchWithTimeout, isOfflineError } from './atlasService';

// The server spends up to 25 s per Gemini call and may make three (a retry plus a
// fallback model), so give the whole scan request a little more than that.
const SCAN_TIMEOUT_MS = 90000;
const SCAN_RETRY_DELAY_MS = 1500;
const SCAN_MAX_EDGE_PX = 1024;
const SCAN_JPEG_QUALITY = 0.7;

/**
 * Shrinks a picked image to ~1024 px on its long edge and re-encodes it as JPEG,
 * so uploads stay small. Falls back to the picker's own base64 if that fails.
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
export async function prepareScanImage(asset) {
  const original = { base64: asset?.base64, mimeType: asset?.mimeType || 'image/jpeg' };
  if (!asset?.uri) return original;
  try {
    const context = ImageManipulator.manipulate(asset.uri);
    const width = Number(asset.width) || 0;
    const height = Number(asset.height) || 0;
    if (!width || !height || Math.max(width, height) > SCAN_MAX_EDGE_PX) {
      context.resize(width >= height ? { width: SCAN_MAX_EDGE_PX } : { height: SCAN_MAX_EDGE_PX });
    }
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ compress: SCAN_JPEG_QUALITY, format: SaveFormat.JPEG, base64: true });
    return saved?.base64 ? { base64: saved.base64, mimeType: 'image/jpeg' } : original;
  } catch (error) {
    console.warn('Scan image could not be resized; sending the original', error);
    return original;
  }
}

/**
 * Analyze a food image. The server already retries Gemini with model fallback, so the
 * client retries once only when the server was unreachable or reported 503 UNAVAILABLE.
 */
export async function analyzeFoodImage(
  base64,
  mimeType = 'image/jpeg',
  userId = null,
  storeImage = false,
  maxRetries = 1
) {
  if (!base64) {
    throw new Error('กรุณาระบุข้อมูลรูปภาพก่อนทำการวิเคราะห์');
  }

  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  const retries = Math.min(1, Math.max(0, Number(maxRetries) || 0));

  for (let attempt = 0; ; attempt++) {
    const canRetry = attempt < retries;
    let response;
    try {
      response = await fetchWithTimeout(
        `${API_BASE_URL}/ai/scan`,
        {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ imageBase64: cleanBase64, mimeType, userId, storeImage }),
        },
        { timeoutMs: SCAN_TIMEOUT_MS, timeoutMessage: 'วิเคราะห์ภาพนานเกินไป กรุณาลองใหม่อีกครั้ง' }
      );
    } catch (error) {
      // A timed-out scan already waited the full budget; only quick network failures are retried.
      if (isOfflineError(error) && !error.timedOut && canRetry) {
        await new Promise((resolve) => setTimeout(resolve, SCAN_RETRY_DELAY_MS));
        continue;
      }
      throw error;
    }

    const data = await response.json().catch(() => ({}));

    // 1. ตรวจสอบสถานะ HTTP Response
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('เซสชันหมดอายุ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่');
      }

      // Maintenance mode is also a 503, but retrying won't help and its message is already user-facing.
      const isUnavailable =
        (response.status === 503 && data.code !== 'MAINTENANCE') ||
        data.code === 'UNAVAILABLE' ||
        data.error?.includes('high demand');

      // หากเจอ 503 ให้ลองใหม่อัตโนมัติหนึ่งครั้งก่อนส่ง error
      if (isUnavailable && canRetry) {
        await new Promise((resolve) => setTimeout(resolve, SCAN_RETRY_DELAY_MS));
        continue;
      }

      if (isUnavailable) {
        throw new Error('บริการ AI มีผู้ใช้งานหนาแน่นชั่วคราว กรุณากดลองใหม่อีกครั้งในภายหลัง');
      }

      const error = new Error(data.error || data.message || `เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ (${response.status})`);
      error.status = response.status;
      error.code = data.code;
      throw error;
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
  }
}
