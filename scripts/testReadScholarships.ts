import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testRead() {
  console.log(`[Test] Reading /scholarships from database ${firebaseConfig.firestoreDatabaseId}...`);
  try {
    const snap = await getDocs(collection(db, 'scholarships'));
    console.log(`[Success] Fetched ${snap.size} documents from /scholarships.`);
    snap.forEach((doc) => {
      console.log(` - ${doc.id}: ${doc.data().name} [${doc.data().verificationStatus}]`);
    });
    process.exit(0);
  } catch (err: any) {
    console.error('[Error reading /scholarships]', err);
    process.exit(1);
  }
}

testRead();
