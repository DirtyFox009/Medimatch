import * as path from 'path';
import * as https from 'https';
import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = 'medimatch-bd';
const SA_PATH = path.resolve(__dirname, '../service-account.json');

const indexes = [
  {
    collectionId: 'doctors',
    fields: [
      { fieldPath: 'isAvailable', order: 'ASCENDING' },
      { fieldPath: 'ratingAvg', order: 'DESCENDING' },
    ],
  },
  {
    collectionId: 'doctors',
    fields: [
      { fieldPath: 'specialty', order: 'ASCENDING' },
      { fieldPath: 'isAvailable', order: 'ASCENDING' },
      { fieldPath: 'ratingAvg', order: 'DESCENDING' },
    ],
  },
  {
    collectionId: 'doctors',
    fields: [
      { fieldPath: 'division', order: 'ASCENDING' },
      { fieldPath: 'isAvailable', order: 'ASCENDING' },
      { fieldPath: 'ratingAvg', order: 'DESCENDING' },
    ],
  },
  {
    collectionId: 'doctors',
    fields: [
      { fieldPath: 'telemedicineAvailable', order: 'ASCENDING' },
      { fieldPath: 'isAvailable', order: 'ASCENDING' },
      { fieldPath: 'ratingAvg', order: 'DESCENDING' },
    ],
  },
  {
    collectionId: 'appointments',
    fields: [
      { fieldPath: 'patientId', order: 'ASCENDING' },
      { fieldPath: 'date', order: 'DESCENDING' },
    ],
  },
  {
    collectionId: 'appointments',
    fields: [
      { fieldPath: 'doctorId', order: 'ASCENDING' },
      { fieldPath: 'date', order: 'ASCENDING' },
      { fieldPath: 'timeSlot', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
    ],
  },
  {
    collectionId: 'appointments',
    fields: [
      { fieldPath: 'doctorId', order: 'ASCENDING' },
      { fieldPath: 'date', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
    ],
  },
];

async function createIndexes() {
  const auth = new GoogleAuth({
    keyFile: SA_PATH,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const token = await auth.getAccessToken();

  for (const idx of indexes) {
    const body = JSON.stringify({
      queryScope: 'COLLECTION',
      fields: idx.fields.map(f => ({ fieldPath: f.fieldPath, order: f.order })),
    });
    const json = await new Promise<any>((resolve) => {
      const req = https.request({
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${PROJECT_ID}/databases/(default)/collectionGroups/${idx.collectionId}/indexes`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.write(body);
      req.end();
    });
    if (json.error) {
      if (json.error.status === 'ALREADY_EXISTS') {
        console.log(`✅ Already exists: ${idx.collectionId} [${idx.fields.map(f => f.fieldPath).join(', ')}]`);
      } else {
        console.error(`❌ Error: ${idx.collectionId}`, json.error.message);
      }
    } else {
      console.log(`🚀 Creating: ${idx.collectionId} [${idx.fields.map(f => f.fieldPath).join(', ')}]`);
    }
  }
  console.log('\nDone! Indexes are building in Firestore (takes 1-2 min).');
}

createIndexes().catch(console.error);
