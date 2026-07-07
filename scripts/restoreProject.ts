/**
 * Restore a backup produced by backupProject.ts into the Firebase project that
 * .env.local currently points at (via FIREBASE_SERVICE_ACCOUNT_PATH — download
 * a fresh service account for the NEW project first).
 *
 * Auth users are imported with their original uids so every Firestore document
 * keyed by uid keeps working. Password hashes cannot be verified across
 * projects without the old project's hash parameters (console-only), so users
 * are imported without passwords — they sign in again via "Forgot password",
 * and seeded doctor accounts get theirs back from `npm run provision-doctors`.
 *
 * Usage:
 *   npm run restore -- backup/<timestamp>
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint } from 'firebase-admin/firestore';
import { getAuth, UserImportRecord } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const backupDirArg = process.argv[2];
if (!backupDirArg) {
  console.error('Usage: npm run restore -- backup/<timestamp>');
  process.exit(1);
}
const backupDir = path.resolve(__dirname, '..', backupDirArg);
if (!fs.existsSync(path.join(backupDir, 'firestore.json'))) {
  console.error(`No firestore.json found in: ${backupDir}`);
  process.exit(1);
}

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found at: ${serviceAccountPath}`);
  console.error('Download one for the NEW project: Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
const projectId: string = serviceAccount.project_id;
const bucketName = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`;

initializeApp({ credential: cert(serviceAccountPath), projectId });

const db = getFirestore();
const auth = getAuth();

function decodeValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(decodeValue);
  const obj = value as Record<string, unknown>;
  switch (obj.__type) {
    case 'timestamp':
      return Timestamp.fromDate(new Date(obj.value as string));
    case 'geopoint':
      return new GeoPoint(obj.latitude as number, obj.longitude as number);
    case 'ref':
      return db.doc(obj.path as string);
    case 'bytes':
      return Buffer.from(obj.base64 as string, 'base64');
    default: {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) out[k] = decodeValue(v);
      return out;
    }
  }
}

async function restoreFirestore(): Promise<number> {
  const docs: Array<{ path: string; data: Record<string, unknown> }> = JSON.parse(
    fs.readFileSync(path.join(backupDir, 'firestore.json'), 'utf8'),
  );
  for (let i = 0; i < docs.length; i += 500) {
    const batch = db.batch();
    for (const doc of docs.slice(i, i + 500)) {
      batch.set(db.doc(doc.path), decodeValue(doc.data) as Record<string, unknown>);
    }
    await batch.commit();
    console.log(`  ${Math.min(i + 500, docs.length)}/${docs.length} docs`);
  }
  return docs.length;
}

async function restoreAuthUsers(): Promise<number> {
  const authFile = path.join(backupDir, 'auth-users.json');
  if (!fs.existsSync(authFile)) return 0;
  const users: any[] = JSON.parse(fs.readFileSync(authFile, 'utf8'));
  let imported = 0;
  for (let i = 0; i < users.length; i += 1000) {
    const records: UserImportRecord[] = users.slice(i, i + 1000).map((u) => ({
      uid: u.uid,
      email: u.email ?? undefined,
      emailVerified: u.emailVerified ?? false,
      displayName: u.displayName ?? undefined,
      photoURL: u.photoURL ?? undefined,
      phoneNumber: u.phoneNumber ?? undefined,
      disabled: u.disabled ?? false,
      customClaims: u.customClaims ?? undefined,
      metadata: {
        creationTime: u.metadata?.creationTime,
        lastSignInTime: u.metadata?.lastSignInTime,
      },
    }));
    const result = await auth.importUsers(records);
    imported += result.successCount;
    for (const err of result.errors) {
      console.warn(`  import error for uid ${records[err.index]?.uid}: ${err.error.message}`);
    }
  }
  return imported;
}

async function restoreStorage(): Promise<number> {
  const manifestFile = path.join(backupDir, 'storage-manifest.json');
  if (!fs.existsSync(manifestFile)) return 0;
  const manifest: Array<{ name: string; contentType?: string }> = JSON.parse(
    fs.readFileSync(manifestFile, 'utf8'),
  );
  const bucket = getStorage().bucket(bucketName);
  let uploaded = 0;
  for (const entry of manifest) {
    const src = path.join(backupDir, 'storage', entry.name);
    if (!fs.existsSync(src)) {
      console.warn(`  missing local file, skipped: ${entry.name}`);
      continue;
    }
    await bucket.upload(src, {
      destination: entry.name,
      metadata: { contentType: entry.contentType },
    });
    uploaded += 1;
    console.log(`  file: ${entry.name}`);
  }
  return uploaded;
}

async function main() {
  console.log(`Restoring ${backupDir}\n  → project "${projectId}" (bucket: ${bucketName})\n`);

  console.log('Firestore…');
  const docCount = await restoreFirestore();

  console.log('Auth users…');
  const userCount = await restoreAuthUsers();

  console.log('Storage…');
  let fileCount = 0;
  try {
    fileCount = await restoreStorage();
  } catch (err: any) {
    console.warn(`  storage skipped: ${err.message}`);
  }

  console.log(`\nDone. ${docCount} Firestore docs, ${userCount} auth users, ${fileCount} storage files.`);
  console.log('Next: set DOCTOR_SEED_PASSWORD and run `npm run provision-doctors` to restore doctor logins.');
}

main().catch((err) => {
  console.error('\nRestore failed:', err.message ?? err);
  process.exit(1);
});
