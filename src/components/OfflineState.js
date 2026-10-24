import React from 'react';
import EmptyState from './EmptyState';

/**
 * Shown when a request fails because the server can't be reached
 * (see isOfflineError in atlasService), so it reads differently from
 * "no results" and always offers a retry.
 */
export default function OfflineState({ timedOut = false, message, onRetry, retryTitle = 'ลองใหม่' }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={timedOut ? 'เซิร์ฟเวอร์ตอบสนองช้าเกินไป' : 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต'}
      message={
        message ||
        (timedOut
          ? 'การเชื่อมต่ออาจช้าหรือไม่เสถียร รอสักครู่แล้วลองใหม่อีกครั้ง'
          : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบ Wi-Fi หรืออินเทอร์เน็ตมือถือแล้วลองใหม่')
      }
      actionTitle={onRetry ? retryTitle : undefined}
      onAction={onRetry}
    />
  );
}
