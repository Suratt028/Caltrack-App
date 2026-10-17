// Shared confirmation helper so destructive actions behave the same on
// iOS, Android and Web (Alert on native, window.confirm on web).
import { Alert, Platform } from 'react-native';

/**
 * Ask the user to confirm an action that is hard to undo.
 * Falls back to running the action when no confirmation UI is available.
 */
export function confirmAction({
  title,
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  destructive = true,
  onConfirm,
}) {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(text)
      : true;
    if (ok && typeof onConfirm === 'function') onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

export default confirmAction;
