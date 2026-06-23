import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export async function uploadMedicalFile(
  userId: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<{ url: string; path: string }> {
  const path = `users/${userId}/records/${Date.now()}_${fileName}`;
  const storageRef = ref(storage, path);

  const response = await fetch(fileUri);
  const blob = await response.blob();

  await uploadBytes(storageRef, blob, { contentType: mimeType });
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deleteMedicalFile(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}
