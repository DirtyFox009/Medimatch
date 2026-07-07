/**
 * Deploy Firestore (and optionally Storage) security rules via the Firebase
 * Rules REST API, authenticating with the service account directly.
 *
 * This exists because firebase-tools' interactive `firebase login` is broken on
 * this machine (Google rejects the OAuth token exchange), and the CLI refuses
 * to authenticate via GOOGLE_APPLICATION_CREDENTIALS. The REST API works fine
 * with the service account, so we use it directly.
 *
 * Usage:
 *   npm run deploy:rules              # firestore.rules only
 *   npm run deploy:rules -- --storage <bucket>   # also deploy storage.rules
 */
import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

const SA_PATH = path.resolve(
  __dirname,
  '..',
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json',
);
const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
const PROJECT_ID: string = sa.project_id;
const BASE = 'https://firebaserules.googleapis.com/v1';

const auth = new GoogleAuth({
  keyFile: SA_PATH,
  scopes: ['https://www.googleapis.com/auth/firebase'],
});

async function deployOne(ruleFile: string, releaseId: string): Promise<void> {
  const filePath = path.resolve(__dirname, '..', ruleFile);
  const content = fs.readFileSync(filePath, 'utf8');
  const client = await auth.getClient();

  // 1. Upload a new ruleset.
  const rs = await client.request<{ name: string }>({
    url: `${BASE}/projects/${PROJECT_ID}/rulesets`,
    method: 'POST',
    data: { source: { files: [{ name: ruleFile, content }] } },
  });
  const rulesetName = rs.data.name;
  console.log(`  uploaded ruleset for ${ruleFile}: ${rulesetName}`);

  // 2. Point the release at the new ruleset (create, or update if it exists).
  const releaseName = `projects/${PROJECT_ID}/releases/${releaseId}`;
  try {
    await client.request({
      url: `${BASE}/projects/${PROJECT_ID}/releases`,
      method: 'POST',
      data: { name: releaseName, rulesetName },
    });
    console.log(`  created release ${releaseId}`);
  } catch (err: any) {
    if (err?.response?.status === 409) {
      await client.request({
        url: `${BASE}/${encodeURI(releaseName)}`,
        method: 'PATCH',
        data: { release: { name: releaseName, rulesetName } },
      });
      console.log(`  updated release ${releaseId}`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log(`Deploying rules to project "${PROJECT_ID}"`);

  console.log('Firestore rules…');
  await deployOne('firestore.rules', 'cloud.firestore');

  const storageFlag = process.argv.indexOf('--storage');
  if (storageFlag !== -1) {
    const bucket = process.argv[storageFlag + 1];
    if (!bucket) {
      console.error('  --storage requires a bucket name, e.g. medimatch43.firebasestorage.app');
      process.exit(1);
    }
    console.log(`Storage rules (bucket ${bucket})…`);
    await deployOne('storage.rules', `firebase.storage/${bucket}`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  const status = err?.response?.status;
  const detail = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message ?? err);
  console.error(`\nDeploy failed${status ? ` (HTTP ${status})` : ''}: ${detail}`);
  process.exit(1);
});
