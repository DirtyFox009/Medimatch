/**
 * Full read-only export of a Firebase project: Firestore documents (recursive,
 * type-preserving), Auth users, and Storage files.
 *
 * The project is derived from the service account file itself so this works
 * regardless of what .env.local points at (needed when migrating projects).
 *
 * Usage:
 *   npm run backup                                  # uses ./service-account.json
 *   BACKUP_SA_PATH=./old-sa.json npm run backup     # explicit service account
 *
 * Output: backup/<timestamp>/{firestore.json, auth-users.json, storage-manifest.json, storage/**}
 */
import { initializeApp, cert } from 'firebase-admin/app';
import {
  getFirestore,
  Timestamp,
  GeoPoint,
  DocumentReference,
  CollectionReference,
} from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const serviceAccountPath =
  process.env.BACKUP_SA_PATH ??
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
  './service-account.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found at: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
const projectId: string = serviceAccount.project_id;
const bucketName =
  process.env.BACKUP_BUCKET ??
  (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === projectId
    ? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
    : undefined) ??
  `${projectId}.firebasestorage.app`;

initializeApp({ credential: cert(serviceAccountPath), projectId });

const db = getFirestore();
const auth = getAuth();

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.resolve(__dirname, `../backup/${stamp}`);
fs.mkdirSync(path.join(outDir, 'storage'), { recursive: true });

/** Firestore values that don't survive JSON round-trips get tagged wrappers. */
function encodeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (value instanceof Timestamp) return { __type: 'timestamp', value: value.toDate().toISOString() };
  if (value instanceof GeoPoint) return { __type: 'geopoint', latitude: value.latitude, longitude: value.longitude };
  if (value instanceof DocumentReference) return { __type: 'ref', path: value.path };
  if (value instanceof Buffer || value instanceof Uint8Array)
    return { __type: 'bytes', base64: Buffer.from(value).toString('base64') };
  if (Array.isArray(value)) return value.map(encodeValue);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = encodeValue(v);
    return out;
  }
  return value;
}

async function exportCollection(
  col: CollectionReference,
  docs: Array<{ path: string; data: unknown }>,
): Promise<void> {
  const snap = await col.get();
  for (const doc of snap.docs) {
    docs.push({ path: doc.ref.path, data: encodeValue(doc.data()) });
    for (const sub of await doc.ref.listCollections()) {
      await exportCollection(sub, docs);
    }
  }
}

async function backupFirestore(): Promise<number> {
  const docs: Array<{ path: string; data: unknown }> = [];
  for (const col of await db.listCollections()) {
    console.log(`  collection: ${col.id}`);
    await exportCollection(col, docs);
  }
  fs.writeFileSync(path.join(outDir, 'firestore.json'), JSON.stringify(docs, null, 2));
  return docs.length;
}

async function backupAuthUsers(): Promise<number> {
  const users: unknown[] = [];
  let pageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users.map((u) => u.toJSON()));
    pageToken = page.pageToken;
  } while (pageToken);
  fs.writeFileSync(path.join(outDir, 'auth-users.json'), JSON.stringify(users, null, 2));
  return users.length;
}

async function backupStorage(): Promise<number> {
  const bucket = getStorage().bucket(bucketName);
  const [files] = await bucket.getFiles();
  const manifest: Array<{ name: string; contentType?: string; size?: string }> = [];
  for (const file of files) {
    const dest = path.join(outDir, 'storage', file.name);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await file.download({ destination: dest });
    manifest.push({
      name: file.name,
      contentType: file.metadata.contentType,
      size: String(file.metadata.size ?? ''),
    });
    console.log(`  file: ${file.name}`);
  }
  fs.writeFileSync(path.join(outDir, 'storage-manifest.json'), JSON.stringify(manifest, null, 2));
  return files.length;
}

async function main() {
  console.log(`Backing up project "${projectId}" (bucket: ${bucketName})`);
  console.log(`Output: ${outDir}\n`);

  console.log('Firestore…');
  const docCount = await backupFirestore();

  console.log('Auth users…');
  const userCount = await backupAuthUsers();

  console.log('Storage…');
  let fileCount = 0;
  try {
    fileCount = await backupStorage();
  } catch (err: any) {
    // A project that never initialized Storage has no default bucket — not fatal.
    console.warn(`  storage skipped: ${err.message}`);
  }

  console.log(`\nDone. ${docCount} Firestore docs, ${userCount} auth users, ${fileCount} storage files.`);
}

main().catch((err) => {
  console.error('\nBackup failed:', err.message ?? err);
  process.exit(1);
});
