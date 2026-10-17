function getGeminiScanError(error) {
  const status = Number(error?.status);
  const code = String(error?.code || '').toUpperCase();

  if (status === 400 || status === 413) {
    return {
      code: 'INVALID_IMAGE_REQUEST',
      error: 'AI ไม่รับรูปนี้ กรุณาเลือกรูปอาหารที่ชัดเจนและมีขนาดเล็กลง',
    };
  }
  if (status === 401 || status === 403) {
    return {
      code: 'AI_CONFIGURATION_ERROR',
      error: 'บริการ AI ยังตั้งค่าไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ',
    };
  }
  if (status === 404) {
    return {
      code: 'AI_MODEL_UNAVAILABLE',
      error: 'ไม่พบโมเดล AI ที่ตั้งค่าไว้ กรุณาติดต่อผู้ดูแลระบบ',
    };
  }
  if (status === 429 || code.includes('RESOURCE_EXHAUSTED')) {
    return {
      code: 'AI_RATE_LIMITED',
      error: 'ขณะนี้มีการใช้งาน AI มากเกินไป กรุณารอสักครู่แล้วลองใหม่',
    };
  }
  if (status >= 500) {
    return {
      code: 'AI_TEMPORARILY_UNAVAILABLE',
      error: 'บริการ AI ขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง',
    };
  }
  if (error?.name === 'AbortError' || error?.cause?.name === 'AbortError') {
    return {
      code: 'AI_REQUEST_TIMEOUT',
      error: 'AI ใช้เวลาวิเคราะห์นานเกินไป กรุณาลองใหม่ด้วยรูปที่มีขนาดเล็กลง',
    };
  }
  return {
    code: 'AI_CONNECTION_ERROR',
    error: 'เชื่อมต่อบริการ AI ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่',
  };
}

module.exports = { getGeminiScanError };
