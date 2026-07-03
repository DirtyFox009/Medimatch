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
