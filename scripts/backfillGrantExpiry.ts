/**
 * Stamp `expiresAt` onto existing record-access grants, and delete the ones that
 * were never justified.
 *
 * Grants at users/{patientId}/authorizedDoctors/{doctorUserId} originally had no
 * expiry, so a single booking — even one cancelled minutes later — gave a doctor
 * permanent read access to that patient's profile and medical records. The rules
 * now require an unexpired `expiresAt` and treat a missing one as expired, so
 * every existing grant must be stamped or removed.
 *
 * For each grant this computes the expiry from the pair's real appointment
 * history: 90 days after their most recent non-cancelled appointment. When every
 * appointment between them was cancelled, the grant is deleted outright.
 *
 * RUN THIS BEFORE PUBLISHING THE NEW RULES — unstamped grants fail closed, so
 * publishing first would briefly cut off doctors with legitimate access.
 *
 *   npm run backfill-grant-expiry            # dry run, prints the plan
 *   npm run backfill-grant-expiry -- --apply # write it
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { expiryFromAppointments, RECORD_ACCESS_TTL_DAYS } from '../src/utils/recordAccess';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json';
const resolved = path.resolve(__dirname, '..', serviceAccountPath);
if (!fs.existsSync(resolved)) {
  console.error(`Service account file not found at: ${resolved}`);
  process.exit(1);
}

initializeApp({
  credential: cert(require(resolved)),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore();

const APPLY = process.argv.includes('--apply');

async function main() {
  const [grantsSnap, apptsSnap] = await Promise.all([
    db.collectionGroup('authorizedDoctors').get(),
    db.collection('appointments').get(),
  ]);

  const appointments = apptsSnap.docs.map((d) => d.data() as {
    patientId: string; doctorUserId: string | null; date: string; status: string;
  });

  let stamped = 0;
  let deleted = 0;
  let unchanged = 0;

  console.log(
    `${APPLY ? 'APPLYING' : 'DRY RUN'} — ${grantsSnap.size} grants, ` +
    `${RECORD_ACCESS_TTL_DAYS}-day window\n`,
  );

  for (const grant of grantsSnap.docs) {
    const patientId = grant.ref.parent.parent!.id;
    const doctorUserId = grant.id;
    const between = appointments.filter(
      (a) => a.patientId === patientId && a.doctorUserId === doctorUserId,
    );

    const expiry = expiryFromAppointments(between);
    const label = `${patientId.slice(0, 8)}… → ${doctorUserId.slice(0, 8)}…`;
    const statuses = between.map((a) => a.status).join(',') || 'no appointments';

    if (expiry === null) {
      console.log(`  DELETE  ${label}  [${statuses}]`);
      if (APPLY) await grant.ref.delete();
      deleted += 1;
      continue;
    }

    const current = grant.data().expiresAt as Timestamp | undefined;
    if (current && Math.abs(current.toDate().getTime() - expiry.getTime()) < 1000) {
      unchanged += 1;
      continue;
    }

    console.log(`  STAMP   ${label}  expires ${expiry.toISOString().slice(0, 10)}  [${statuses}]`);
    if (APPLY) await grant.ref.update({ expiresAt: Timestamp.fromDate(expiry) });
    stamped += 1;
  }

  console.log(
    `\n${APPLY ? 'Done' : 'Would'}: ${stamped} stamped, ${deleted} deleted, ${unchanged} already correct.`,
  );
  if (!APPLY) console.log('Re-run with --apply to write.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
