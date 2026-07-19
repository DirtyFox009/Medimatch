import { Platform } from 'react-native';
import * as Print from 'expo-print';
import type { Prescription } from '../../types/prescription';
import { buildPrescriptionHtml } from './html';

/**
 * Print / save the prescription as PDF.
 * Native: expo-print renders the HTML into the OS print/PDF dialog.
 * Web: expo-print prints the current page, not arbitrary HTML — so we render
 * the letterhead HTML in a hidden iframe and print that instead.
 */
export async function printPrescription(prescription: Prescription): Promise<void> {
  const html = buildPrescriptionHtml(prescription);

  if (Platform.OS !== 'web') {
    await Print.printAsync({ html });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    const cleanup = () => {
      // Delay removal so the print dialog has detached from the frame.
      setTimeout(() => iframe.remove(), 60_000);
      resolve();
    };

    iframe.onload = () => {
      try {
        const frameWindow = iframe.contentWindow;
        if (!frameWindow) throw new Error('print frame unavailable');
        frameWindow.focus();
        frameWindow.print();
        cleanup();
      } catch (err) {
        iframe.remove();
        // Fallback: open in a new tab and print from there.
        const win = window.open('', '_blank');
        if (!win) {
          reject(err instanceof Error ? err : new Error(String(err)));
          return;
        }
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
        resolve();
      }
    };

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}
