import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { OFFICIAL_SCHOLARSHIPS } from '../src/data/scholarships';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seedClient() {
  console.log(`[Seed Client] Ingesting official Indian schemes into Firestore database: ${firebaseConfig.firestoreDatabaseId}`);
  let count = 0;
  for (const item of OFFICIAL_SCHOLARSHIPS) {
    const docRef = doc(db, 'scholarships', item.id);
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
    await setDoc(docRef, docData, { merge: true });
    console.log(` -> Seeded [${item.verificationStatus}] ${item.id}: ${item.name}`);
    count++;
  }
  console.log(`[Seed Client Complete] Successfully stored ${count} official Indian scholarships.`);
  process.exit(0);
}

seedClient().catch((err) => {
  console.error('[Seed Client Error]', err);
  process.exit(1);
});
