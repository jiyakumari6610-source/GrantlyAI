import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

console.log('Testing Firebase Storage configuration...');
console.log('Bucket:', firebaseConfig.storageBucket);

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
console.log('Storage initialized successfully:', Boolean(storage));
