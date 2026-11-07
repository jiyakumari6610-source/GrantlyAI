import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  UserProfileDocument,
  ScholarshipDocument,
  ApplicationHistoryRecord,
  DocumentMetadataRecord,
  ReportRecord,
  validateUserProfile,
  validateApplication,
} from '../types/firestore';

const COLLECTIONS = {
  USERS: 'users',
  SCHOLARSHIPS: 'scholarships',
  APPLICATIONS: 'applications',
  SAVED_SCHOLARSHIPS: 'savedScholarships',
  DOCUMENTS: 'documents',
  REPORTS: 'reports',
};

// ==========================================
// 1. STUDENT PROFILE SERVICES (users/{uid})
// ==========================================

export async function createStudentProfile(
  uid: string,
  profileData: UserProfileDocument
): Promise<void> {
  if (!uid || typeof uid !== 'string') {
    throw new Error('Valid authenticated UID is required to create student profile.');
  }

  const validation = validateUserProfile(profileData);
  if (!validation.isValid) {
    const errorMsg = Object.values(validation.errors).join(' ');
    throw new Error(`Profile validation failed: ${errorMsg}`);
  }

  const path = `${COLLECTIONS.USERS}/${uid}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    const now = new Date().toISOString();
    await setDoc(docRef, {
      ...profileData,
      createdAt: profileData.createdAt || now,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function readStudentProfile(uid: string): Promise<UserProfileDocument | null> {
  if (!uid) return null;
  const path = `${COLLECTIONS.USERS}/${uid}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    return snap.data() as UserProfileDocument;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateStudentProfile(
  uid: string,
  updates: Partial<UserProfileDocument>
): Promise<void> {
  if (!uid) {
    throw new Error('Valid authenticated UID is required to update student profile.');
  }

  const validation = validateUserProfile(updates);
  if (!validation.isValid) {
    const errorMsg = Object.values(validation.errors).join(' ');
    throw new Error(`Profile update validation failed: ${errorMsg}`);
  }

  const path = `${COLLECTIONS.USERS}/${uid}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    await setDoc(
      docRef,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==========================================
// 2. SCHOLARSHIP SERVICES (scholarships/{scholarshipId})
// ==========================================

export async function fetchScholarships(filterStatus?: string): Promise<ScholarshipDocument[]> {
  const path = COLLECTIONS.SCHOLARSHIPS;
  try {
    const colRef = collection(db, COLLECTIONS.SCHOLARSHIPS);
    const snap = await getDocs(colRef);
    const list: ScholarshipDocument[] = [];
    snap.forEach((d) => {
      const data = { id: d.id, ...d.data() } as ScholarshipDocument;
      if (!filterStatus || data.verificationStatus === filterStatus) {
        list.push(data);
      }
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchScholarshipById(scholarshipId: string): Promise<ScholarshipDocument | null> {
  if (!scholarshipId) return null;
  const path = `${COLLECTIONS.SCHOLARSHIPS}/${scholarshipId}`;
  try {
    const docRef = doc(db, COLLECTIONS.SCHOLARSHIPS, scholarshipId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ScholarshipDocument;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createScholarshipRecord(
  scholarshipData: ScholarshipDocument
): Promise<void> {
  const schemeId = (scholarshipData.id || '').trim();
  if (!schemeId) {
    throw new Error('Valid scheme ID is required to create a scholarship.');
  }
  const path = `${COLLECTIONS.SCHOLARSHIPS}/${schemeId}`;
  try {
    const docRef = doc(db, COLLECTIONS.SCHOLARSHIPS, schemeId);
    const now = new Date().toISOString();
    await setDoc(docRef, {
      ...scholarshipData,
      id: schemeId,
      createdAt: scholarshipData.createdAt || now,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateScholarshipRecord(
  scholarshipId: string,
  updates: Partial<ScholarshipDocument>
): Promise<void> {
  if (!scholarshipId) {
    throw new Error('Valid scholarship ID is required to update.');
  }
  const path = `${COLLECTIONS.SCHOLARSHIPS}/${scholarshipId}`;
  try {
    const docRef = doc(db, COLLECTIONS.SCHOLARSHIPS, scholarshipId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteScholarshipRecord(scholarshipId: string): Promise<void> {
  if (!scholarshipId) {
    throw new Error('Valid scholarship ID is required to delete.');
  }
  const path = `${COLLECTIONS.SCHOLARSHIPS}/${scholarshipId}`;
  try {
    const docRef = doc(db, COLLECTIONS.SCHOLARSHIPS, scholarshipId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// 3. SAVED SCHOLARSHIPS (users/{uid}/savedScholarships/{scholarshipId})
// ==========================================

export async function saveScholarshipForUser(uid: string, scholarshipId: string): Promise<void> {
  if (!uid || !scholarshipId) {
    throw new Error('Both UID and scholarshipId are required to bookmark a scholarship.');
  }
  const path = `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.SAVED_SCHOLARSHIPS}/${scholarshipId}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid, COLLECTIONS.SAVED_SCHOLARSHIPS, scholarshipId);
    await setDoc(docRef, {
      scholarshipId,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeSavedScholarshipForUser(uid: string, scholarshipId: string): Promise<void> {
  if (!uid || !scholarshipId) {
    throw new Error('Both UID and scholarshipId are required to remove a bookmarked scholarship.');
  }
  const path = `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.SAVED_SCHOLARSHIPS}/${scholarshipId}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid, COLLECTIONS.SAVED_SCHOLARSHIPS, scholarshipId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function readSavedScholarshipsForUser(uid: string): Promise<string[]> {
  if (!uid) return [];
  const path = `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.SAVED_SCHOLARSHIPS}`;
  try {
    const colRef = collection(db, COLLECTIONS.USERS, uid, COLLECTIONS.SAVED_SCHOLARSHIPS);
    const snap = await getDocs(colRef);
    const savedIds: string[] = [];
    snap.forEach((d) => savedIds.push(d.id));
    return savedIds;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ==========================================
// 4. APPLICATION TRACKING (users/{uid}/applications/{applicationId})
// ==========================================

export async function createApplicationRecord(
  uid: string,
  applicationData: Omit<ApplicationHistoryRecord, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<ApplicationHistoryRecord> {
  if (!uid) throw new Error('Authenticated UID is required to create an application record.');

  const validation = validateApplication(applicationData);
  if (!validation.isValid) {
    throw new Error(`Application validation failed: ${Object.values(validation.errors).join(' ')}`);
  }

  const appId = applicationData.id || `app-${Date.now()}`;
  const path = `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.APPLICATIONS}/${appId}`;
  const now = new Date().toISOString();

  const record: ApplicationHistoryRecord = {
    ...applicationData,
    id: appId,
    userId: uid,
    createdAt: now,
    updatedAt: now,
    documentsSubmitted: applicationData.documentsSubmitted || [],
  };

  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid, COLLECTIONS.APPLICATIONS, appId);
    await setDoc(docRef, record);
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateApplicationStatusRecord(
  uid: string,
  applicationId: string,
  status: ApplicationHistoryRecord['status'],
  notes?: string
): Promise<void> {
  if (!uid || !applicationId) {
    throw new Error('UID and applicationId are required to update application status.');
  }
  const path = `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.APPLICATIONS}/${applicationId}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid, COLLECTIONS.APPLICATIONS, applicationId);
    const updates: any = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (notes !== undefined) {
      updates.notes = notes;
    }
    if (status === 'Applied') {
      updates.appliedDate = new Date().toISOString().split('T')[0];
    }
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function readApplicationHistory(uid: string): Promise<ApplicationHistoryRecord[]> {
  if (!uid) return [];
  const path = `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.APPLICATIONS}`;
  try {
    const colRef = collection(db, COLLECTIONS.USERS, uid, COLLECTIONS.APPLICATIONS);
    const snap = await getDocs(colRef);
    const records: ApplicationHistoryRecord[] = [];
    snap.forEach((d) => {
      records.push(d.data() as ApplicationHistoryRecord);
    });
    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteApplicationRecord(uid: string, applicationId: string): Promise<void> {
  if (!uid || !applicationId) throw new Error('UID and applicationId are required to delete.');
  const path = `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.APPLICATIONS}/${applicationId}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid, COLLECTIONS.APPLICATIONS, applicationId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// 5. DOCUMENT METADATA (users/{uid}/documents/{documentId})
// ==========================================

export async function saveDocumentMetadata(
  uid: string,
  docData: Omit<DocumentMetadataRecord, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<DocumentMetadataRecord> {
  if (!uid) throw new Error('Authenticated UID is required to save document metadata.');
  if (!docData.name || !docData.category) {
    throw new Error('Document name and category are required.');
  }

  const docId = docData.id || `doc-${Date.now()}`;
  const path = `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.DOCUMENTS}/${docId}`;
  const now = new Date().toISOString();

  // Crucial rule: Never store raw file data in Firestore metadata record
  const cleanRecord: DocumentMetadataRecord = {
    ...docData,
    id: docId,
    userId: uid,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid, COLLECTIONS.DOCUMENTS, docId);
    await setDoc(docRef, cleanRecord);
    return cleanRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function readDocumentMetadataList(uid: string): Promise<DocumentMetadataRecord[]> {
  if (!uid) return [];
  const path = `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.DOCUMENTS}`;
  try {
    const colRef = collection(db, COLLECTIONS.USERS, uid, COLLECTIONS.DOCUMENTS);
    const snap = await getDocs(colRef);
    const list: DocumentMetadataRecord[] = [];
    snap.forEach((d) => {
      list.push(d.data() as DocumentMetadataRecord);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteDocumentMetadata(uid: string, documentId: string): Promise<void> {
  if (!uid || !documentId) throw new Error('UID and documentId are required to delete.');
  const path = `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.DOCUMENTS}/${documentId}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid, COLLECTIONS.DOCUMENTS, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// 6. TRUSTGUARD REPORTS (reports/{reportId})
// ==========================================

export async function submitTrustReport(
  reportData: Omit<ReportRecord, 'id' | 'reportedAt'>
): Promise<ReportRecord> {
  if (!reportData.scholarshipId || !reportData.reason) {
    throw new Error('Scholarship ID and report reason are required.');
  }

  const reportId = `rep-${Date.now()}`;
  const path = `${COLLECTIONS.REPORTS}/${reportId}`;
  const now = new Date().toISOString();

  const record: ReportRecord = {
    ...reportData,
    id: reportId,
    reportedAt: now,
  };

  try {
    const docRef = doc(db, COLLECTIONS.REPORTS, reportId);
    await setDoc(docRef, record);
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
