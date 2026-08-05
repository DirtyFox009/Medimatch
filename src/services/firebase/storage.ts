// Firebase Cloud Storage requires the paid Blaze plan for new projects, so
// record files are stored inline in the Firestore record document as a data
// URI instead (protected by the same owner-only rules). Firestore caps
// documents at 1 MiB; base64 inflates ~33%, hence the raw-file limit below.
export const MAX_RECORD_FILE_BYTES = 700 * 1024;

export class FileTooLargeError extends Error {
  constructor() {
    super('file_too_large');
    this.name = 'FileTooLargeError';
  }
}

/**
 * Converts an inline `data:` URI into a `blob:` object URL.
 *
 * Browsers block top-level navigation to `data:` URIs (Chrome 60+, as an
 * anti-phishing measure), so `window.open(dataUri)` returns null and an iframe
 * pointed at one is refused. `blob:` URLs carry the same bytes and are allowed
 * in both. `<img src="data:…">` is unaffected and needs no conversion.
 *
 * Caller owns the returned URL and must URL.revokeObjectURL() it.
 */
export function dataUriToBlobUrl(dataUri: string): string | null {
  const match = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(dataUri);
  if (!match) return null;
  const [, mimeType, isBase64, payload] = match;
  try {
    let blob: Blob;
    if (isBase64) {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      blob = new Blob([bytes], { type: mimeType || 'application/octet-stream' });
    } else {
      blob = new Blob([decodeURIComponent(payload)], { type: mimeType || 'text/plain' });
    }
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function uploadMedicalFile(
  userId: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<{ url: string; path: string }> {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  if (blob.size > MAX_RECORD_FILE_BYTES) throw new FileTooLargeError();

  const dataUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('file_read_failed'));
    reader.readAsDataURL(blob);
  });

  return { url: dataUri, path: '' };
}
