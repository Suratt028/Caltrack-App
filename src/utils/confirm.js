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
  onCancel,
}) {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(text)
      : true;
    if (ok && typeof onConfirm === 'function') onConfirm();
    if (!ok && typeof onCancel === 'function') onCancel();
    return;
  }

  Alert.alert(
    title,
    message,
    [
      { text: cancelLabel, style: 'cancel', onPress: onCancel },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ],
    { cancelable: true, onDismiss: onCancel }
  );
}

/** Promise form: resolves true when confirmed, false when cancelled or dismissed. */
export function confirmAsync(options) {
  return new Promise((resolve) => {
    confirmAction({ ...options, onConfirm: () => resolve(true), onCancel: () => resolve(false) });
  });
}

export default confirmAction;
