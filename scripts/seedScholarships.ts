import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { OFFICIAL_SCHOLARSHIPS } from '../src/data/scholarships';
import dotenv from 'dotenv';

dotenv.config();

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'googly-conquest-zwpgt';
const FIRESTORE_DATABASE_ID = 'ai-studio-remixremixgrantl-80b2786f-a161-42d1-bb33-b82265ead67b';

if (!getApps().length) {
  initializeApp({
    projectId: FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore(getApps()[0], FIRESTORE_DATABASE_ID);

async function seed() {
  console.log(`[Seed] Ingesting official scholarships into Firestore database: ${FIRESTORE_DATABASE_ID}`);
  let count = 0;
  for (const item of OFFICIAL_SCHOLARSHIPS) {
    const docRef = db.collection('scholarships').doc(item.id);
    const docData = {
      id: item.id,
      name: item.name,
      provider: item.provider,
      description: item.description,
      awardAmount: item.awardAmount,
      currency: item.currency || 'INR',
      educationLevel: item.educationLevels,
      eligibleCourses: item.eligibleCourses,
      eligibleStates: item.eligibleStates,
      minimumMarks: item.minMarks,
      maximumFamilyIncome: item.maxIncome,
      requiredDocuments: item.requiredDocuments,
      deadline: item.deadline,
      officialSourceUrl: item.officialSourceUrl,
      verificationStatus: item.verificationStatus,
      academicYear: item.academicYear || '2025-26',
      lastCheckedAt: item.lastCheckedAt || '2026-11-06',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await docRef.set(docData, { merge: true });
    console.log(` -> Seeded [${item.verificationStatus}] ${item.id}: ${item.name}`);
    count++;
  }
  console.log(`[Seed Complete] Successfully ingested ${count} official Indian scholarships.`);
}

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
