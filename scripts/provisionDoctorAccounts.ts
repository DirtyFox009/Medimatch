/**
 * Provision Firebase Auth accounts for every seeded doctor and link them to
 * their doctors/{id} documents so they can sign in to the doctor portal.
 *
 * Idempotent: re-running updates links without duplicating accounts.
 *
 * Usage (PowerShell):
 *   $env:DOCTOR_SEED_PASSWORD = "choose-a-strong-password"; npm run provision-doctors
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json';
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const password = process.env.DOCTOR_SEED_PASSWORD;

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found at: ${serviceAccountPath}`);
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error('Set DOCTOR_SEED_PASSWORD (min 8 chars) before running.');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccountPath), projectId });

const db = getFirestore();
const auth = getAuth();

async function provision() {
  const doctorsSnap = await db.collection('doctors').get();
  if (doctorsSnap.empty) {
    console.error('No doctors found — run `npm run seed` first.');
    process.exit(1);
  }

  for (const docSnap of doctorsSnap.docs) {
    const doctorId = docSnap.id;
    const doctor = docSnap.data();
    const email = `${doctorId}@medimatch.app`;

    let uid: string;
    try {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
    } catch {
      const created = await auth.createUser({
        email,
        password,
        displayName: doctor.nameEn,
        emailVerified: true,
      });
      uid = created.uid;
    }

    await db.doc(`users/${uid}`).set(
      {
        uid,
        displayName: doctor.nameEn,
        email,
        phone: null,
        preferredLang: 'en',
        division: doctor.division ?? '',
        fcmToken: null,
        privacyAccepted: true,
        role: 'doctor',
        doctorId,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await docSnap.ref.update({
      userId: uid,
      email,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ ${doctorId} → ${email} (uid ${uid})`);
  }

  console.log(`\nDone. ${doctorsSnap.size} doctor accounts provisioned.`);
  console.log('Doctors sign in with <doctorId>@medimatch.app and the DOCTOR_SEED_PASSWORD.');
  process.exit(0);
}

provision().catch((err) => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});
