import { Alert, AlertButton } from 'react-native';
import { isWeb } from './platform';

/**
 * Cross-platform Alert.alert replacement. RN's Alert is a no-op on
 * react-native-web, so web falls back to window.alert / window.confirm.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (!isWeb) {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  if (window.confirm(text)) {
    buttons.find((b) => b.style !== 'cancel')?.onPress?.();
  } else {
    buttons.find((b) => b.style === 'cancel')?.onPress?.();
  }
}
