/**
 * Backfill record-access grants for appointments that predate the grant-doc
 * feature. For every appointment with a non-null doctorUserId, writes
 *   users/{patientId}/authorizedDoctors/{doctorUserId}
 * which is what the Firestore rules check to let a doctor read that patient's
 * medical records. New bookings write this doc themselves (bookAppointment);
 * this one-off script covers already-existing appointments.
 *
 * Run once:  npm run backfill-grants
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json';
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found at: ${serviceAccountPath}`);
  console.error('Download it from Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccountPath), projectId });

const db = getFirestore();

async function backfill() {
  const snap = await db.collection('appointments').get();
  console.log(`Scanning ${snap.size} appointment(s)…`);

  let written = 0;
  let skipped = 0;
  // De-dupe so we don't re-write the same patient↔doctor grant repeatedly.
  const seen = new Set<string>();

  for (const doc of snap.docs) {
    const { patientId, doctorUserId } = doc.data() as {
      patientId?: string;
      doctorUserId?: string | null;
    };

    if (!patientId || !doctorUserId) {
      skipped++;
      continue;
    }

    const key = `${patientId}/${doctorUserId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    await db
      .doc(`users/${patientId}/authorizedDoctors/${doctorUserId}`)
      .set(
        { doctorUserId, doctorId: doc.data().doctorId ?? null, grantedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    written++;
    console.log(`  ✅ grant ${key}`);
  }

  console.log(`\nDone. ${written} grant(s) written, ${skipped} appointment(s) skipped (no patient/doctor uid).`);
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
