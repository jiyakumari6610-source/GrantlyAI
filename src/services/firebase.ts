import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  StudentProfile,
  ApplicationRecord,
  UploadedDocument,
  SuspiciousReport,
} from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with explicit database ID (Critical for AI Studio multi-database)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Storage
export const storage = getStorage(app, firebaseConfig.storageBucket);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Error Reporting Contract required by Firestore security spec
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('[Firestore Error]', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Quick connection validation to Firestore server
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Attempting a server read to verify network and credentials
    await getDocFromServer(doc(db, '_connection_test', 'status'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('Firestore connection: Client is offline or network restricted.');
      return false;
    }
    // Permissions error or missing document is normal for test path, meaning connection reached server
    return true;
  }
}

// ==========================================
// AUTHENTICATION HELPERS
// ==========================================

export async function registerWithEmail(
  email: string,
  pass: string,
  fullName: string
): Promise<FirebaseUser> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (cred.user && fullName) {
    await updateProfile(cred.user, { displayName: fullName.trim() });
  }
  // Send email verification
  try {
    await sendEmailVerification(cred.user);
  } catch (e) {
    console.warn('Could not send verification email immediately:', e);
  }
  return cred.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

export async function loginWithGoogle(): Promise<FirebaseUser> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendVerification(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ==========================================
// FIRESTORE CRUD — ISOLATED BY AUTHENTICATED UID
// ==========================================

const USERS_COLLECTION = 'users';

export async function fetchUserProfile(uid: string): Promise<StudentProfile | null> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!snap.exists()) return null;
    return snap.data() as StudentProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function persistUserProfile(uid: string, profile: StudentProfile): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const cleanProfile: StudentProfile = {
      ...profile,
      id: uid,
      email: profile.email || auth.currentUser?.email || '',
    };
    await setDoc(doc(db, USERS_COLLECTION, uid), {
      ...cleanProfile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subcollection: Applications (/users/{uid}/applications/{appId})
export async function fetchUserApplications(uid: string): Promise<ApplicationRecord[]> {
  const path = `${USERS_COLLECTION}/${uid}/applications`;
  try {
    const colRef = collection(db, USERS_COLLECTION, uid, 'applications');
    const snap = await getDocs(colRef);
    const list: ApplicationRecord[] = [];
    snap.forEach((d) => {
      list.push(d.data() as ApplicationRecord);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function persistUserApplication(
  uid: string,
  application: ApplicationRecord
): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}/applications/${application.id}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid, 'applications', application.id);
    await setDoc(docRef, {
      ...application,
      userId: uid,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserApplication(uid: string, applicationId: string): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}/applications/${applicationId}`;
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, uid, 'applications', applicationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Subcollection: Saved Scholarships (/users/{uid}/savedScholarships/{schId})
export async function fetchUserSavedScholarships(uid: string): Promise<string[]> {
  const path = `${USERS_COLLECTION}/${uid}/savedScholarships`;
  try {
    const colRef = collection(db, USERS_COLLECTION, uid, 'savedScholarships');
    const snap = await getDocs(colRef);
    const ids: string[] = [];
    snap.forEach((d) => {
      ids.push(d.id);
    });
    return ids;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function toggleUserSavedScholarship(uid: string, scholarshipId: string): Promise<boolean> {
  const path = `${USERS_COLLECTION}/${uid}/savedScholarships/${scholarshipId}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid, 'savedScholarships', scholarshipId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await deleteDoc(docRef);
      return false; // Removed
    } else {
      await setDoc(docRef, {
        id: scholarshipId,
        scholarshipId,
        savedAt: new Date().toISOString(),
      });
      return true; // Added
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subcollection: Documents (/users/{uid}/documents/{docId})
// Note: We store document metadata and AI analysis scores securely in Firestore.
// Sensitive file binary data is not dumped into raw client storage.
export async function fetchUserDocuments(uid: string): Promise<UploadedDocument[]> {
  const path = `${USERS_COLLECTION}/${uid}/documents`;
  try {
    const colRef = collection(db, USERS_COLLECTION, uid, 'documents');
    const snap = await getDocs(colRef);
    const docs: UploadedDocument[] = [];
    snap.forEach((d) => {
      docs.push(d.data() as UploadedDocument);
    });
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function persistUserDocument(uid: string, docData: UploadedDocument): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}/documents/${docData.id}`;
  try {
    // Avoid storing giant base64 payloads directly in Firestore documents to stay within size quotas
    const cleanDoc: UploadedDocument = {
      ...docData,
      fileData: undefined, // Strip raw base64 before saving to Firestore
    };
    const docRef = doc(db, USERS_COLLECTION, uid, 'documents', docData.id);
    await setDoc(docRef, {
      ...cleanDoc,
      userId: uid,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function uploadDocumentFileToStorage(
  uid: string,
  docId: string,
  file: File | Blob,
  fileName: string
): Promise<string> {
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `users/${uid}/documents/${docId}/${cleanName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  return storagePath;
}

export async function deleteDocumentFileFromStorage(storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Storage deletion error (ignored if already deleted):', err);
  }
}

export async function deleteUserDocument(uid: string, documentId: string, storagePath?: string): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}/documents/${documentId}`;
  try {
    if (storagePath) {
      await deleteDocumentFileFromStorage(storagePath);
    }
    await deleteDoc(doc(db, USERS_COLLECTION, uid, 'documents', documentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function analyzeDocumentWithGemini(
  idToken: string,
  payload: {
    documentId: string;
    fileName?: string;
    documentType?: string;
    mimeType?: string;
    base64Data?: string;
    studentProfile?: any;
  }
) {
  const res = await fetch('/api/gemini/analyze-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.details || data.error || 'Failed to analyze document');
  }
  return data;
}

// Reports (/reports/{reportId})
export async function createTrustGuardReport(report: SuspiciousReport): Promise<void> {
  const path = `reports/${report.id}`;
  try {
    const docRef = doc(db, 'reports', report.id);
    await setDoc(docRef, {
      ...report,
      reportedByUid: auth.currentUser?.uid || 'anonymous',
      userEmail: auth.currentUser?.email || 'unauthenticated',
      serverTimestamp: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
