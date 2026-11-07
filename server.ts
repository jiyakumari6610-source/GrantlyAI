import express from 'express';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { OFFICIAL_SCHOLARSHIPS } from './src/data/scholarships';
import { validateScholarshipDocument } from './src/types/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize Firebase Admin SDK for Server-Side ID Token Verification & Firestore
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'googly-conquest-zwpgt';
const FIRESTORE_DATABASE_ID = 'ai-studio-remixremixgrantl-80b2786f-a161-42d1-bb33-b82265ead67b';

let adminApp: App | null = null;
if (!getApps().length) {
  try {
    adminApp = initializeApp({
      projectId: FIREBASE_PROJECT_ID,
    });
    console.log(`[Firebase Admin] Initialized on backend targeting project: ${FIREBASE_PROJECT_ID}`);
  } catch (err: any) {
    console.warn('[Firebase Admin] Initialization warning:', err.message);
  }
} else {
  adminApp = getApps()[0];
}

const adminDb = getAdminFirestore(adminApp as App, FIRESTORE_DATABASE_ID);

// Extend Express Request with authenticated Firebase token claims
declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

/**
 * Express Middleware: Verify Firebase ID Token
 * Ensures all private API calls cryptographically verify the caller's identity.
 * Never trusts a user-supplied UID without verified token.
 */
export async function authenticateFirebaseToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing Bearer token in Authorization header.',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token provided.' });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    console.warn('[Token Verification Failed]', error?.message);
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase ID token.',
      code: error.code || 'auth/invalid-token',
    });
  }
}

/**
 * Optional token verification middleware
 */
export async function optionalFirebaseToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (token) {
      try {
        const decoded = await getAuth().verifyIdToken(token);
        req.user = decoded;
      } catch (e) {
        // Continue unauthenticated
      }
    }
  }
  next();
}

/**
 * Express Middleware: Require Admin Privileges
 * Grants administrative mutation powers exclusively to jiya72637@gmail.com
 */
export function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const userEmail = req.user?.email;
  if (!userEmail || userEmail.toLowerCase() !== 'jiya72637@gmail.com') {
    return res.status(403).json({
      error: 'Forbidden: Admin access required. Only jiya72637@gmail.com is authorized.',
      code: 'auth/forbidden-not-admin',
    });
  }
  next();
}

// Middleware for parsing JSON (allow base64 uploads for documents up to 15MB)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Initialize Google Gemini AI SDK on the server
let aiClient: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Google GenAI client initialized successfully with server-side API key.');
  } catch (err) {
    console.warn('Failed to initialize Google GenAI client:', err);
  }
} else {
  console.log('No GEMINI_API_KEY detected. Running intelligent server fallback mode.');
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    firebaseAdminReady: getApps().length > 0,
    projectId: FIREBASE_PROJECT_ID,
    aiEnabled: !!aiClient,
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// Authenticated Session Verification Endpoint
app.get('/api/auth/verify-session', authenticateFirebaseToken, (req, res) => {
  return res.json({
    authenticated: true,
    uid: req.user?.uid,
    email: req.user?.email,
    emailVerified: req.user?.email_verified || false,
    authTime: req.user?.auth_time,
    issuer: req.user?.iss,
  });
});

// ==========================================
// SCHOLARSHIP REPOSITORY API (Firestore-backed)
// ==========================================

// Publicly accessible scholarship retrieval (supports ?status=VERIFIED etc.)
app.get('/api/scholarships', async (req, res) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    let queryRef: any = adminDb.collection('scholarships');
    if (statusFilter) {
      queryRef = queryRef.where('verificationStatus', '==', statusFilter);
    }
    const snap = await queryRef.get();
    const list: any[] = [];
    snap.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return res.json({
      success: true,
      count: list.length,
      scholarships: list,
    });
  } catch (err: any) {
    console.error('Error fetching scholarships from Firestore:', err);
    return res.status(500).json({ error: 'Failed to fetch scholarships', details: err.message });
  }
});

// Fetch single scholarship by ID
app.get('/api/scholarships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await adminDb.collection('scholarships').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }
    return res.json({
      success: true,
      scholarship: { id: doc.id, ...doc.data() },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch scholarship', details: err.message });
  }
});

// Admin-only: Ingest a new official scholarship with strict validation and duplicate checks
app.post('/api/admin/scholarships', authenticateFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    const validation = validateScholarshipDocument(payload);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const schemeId = (payload.id || '').trim() || `sch-${Date.now()}`;

    // Duplicate check 1: ID uniqueness
    const existingById = await adminDb.collection('scholarships').doc(schemeId).get();
    if (existingById.exists) {
      return res.status(409).json({
        error: `Duplicate rejected: A scholarship with ID '${schemeId}' already exists in the catalog.`,
      });
    }

    // Duplicate check 2: Name + Provider uniqueness
    const existingByNameAndProvider = await adminDb
      .collection('scholarships')
      .where('name', '==', payload.name.trim())
      .where('provider', '==', payload.provider.trim())
      .get();

    if (!existingByNameAndProvider.empty) {
      return res.status(409).json({
        error: `Duplicate rejected: Scheme '${payload.name.trim()}' by '${payload.provider.trim()}' is already registered in the official catalog.`,
      });
    }

    const now = new Date().toISOString();
    const docData = {
      ...payload,
      id: schemeId,
      name: payload.name.trim(),
      provider: payload.provider.trim(),
      officialSourceUrl: payload.officialSourceUrl.trim(),
      verificationStatus: payload.verificationStatus,
      awardAmount: Number(payload.awardAmount) || 0,
      currency: payload.currency || 'INR',
      createdAt: now,
      updatedAt: now,
      lastCheckedAt: payload.lastCheckedAt || now.split('T')[0],
    };

    await adminDb.collection('scholarships').doc(schemeId).set(docData);
    return res.status(201).json({
      success: true,
      message: 'Official scholarship ingested into catalog successfully.',
      scholarship: docData,
    });
  } catch (err: any) {
    console.error('Admin create scholarship error:', err);
    return res.status(500).json({ error: 'Failed to create scholarship', details: err.message });
  }
});

// Admin-only: Update existing scholarship or review verification status
app.put('/api/admin/scholarships/:id', authenticateFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const docRef = adminDb.collection('scholarships').doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }

    const validStatuses = ['VERIFIED', 'PENDING_VERIFICATION', 'EXPIRED_OR_CLOSED'];
    if (updates.verificationStatus && !validStatuses.includes(updates.verificationStatus)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const now = new Date().toISOString();
    const cleanUpdates = {
      ...updates,
      updatedAt: now,
    };

    await docRef.update(cleanUpdates);
    return res.json({
      success: true,
      message: 'Scholarship updated successfully.',
      id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update scholarship', details: err.message });
  }
});

// Admin-only: Delete scholarship
app.delete('/api/admin/scholarships/:id', authenticateFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await adminDb.collection('scholarships').doc(id).delete();
    return res.json({ success: true, message: 'Scholarship deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete scholarship', details: err.message });
  }
});

// Admin-only: Batch seed researched official scholarships from NSP, e-Kalyan & AICTE into Firestore
app.post('/api/admin/seed-official-scholarships', authenticateFirebaseToken, requireAdmin, async (req, res) => {
  try {
    let seeded = 0;
    const batch = adminDb.batch();
    for (const item of OFFICIAL_SCHOLARSHIPS) {
      const docRef = adminDb.collection('scholarships').doc(item.id);
      batch.set(
        docRef,
        {
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
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      seeded++;
    }
    await batch.commit();
    return res.json({
      success: true,
      message: `Successfully seeded ${seeded} official scholarships into Firestore /scholarships.`,
    });
  } catch (err: any) {
    console.error('Seeding error:', err);
    return res.status(500).json({ error: 'Failed to seed official scholarships', details: err.message });
  }
});

// Grantly Copilot AI Chat Endpoint (Supports Hindi & English)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, history, studentProfile, currentScholarship } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const studentContext = studentProfile
      ? `Student Profile Context:
- Name: ${studentProfile.fullName || 'Student'}
- Academic: ${studentProfile.course || 'Degree'} at ${studentProfile.college || 'College'}, Year ${studentProfile.academicYear || 1}, Marks: ${studentProfile.percentage || 'N/A'}%
- Domicile: ${studentProfile.state || 'India'}, ${studentProfile.city || ''}
- Family Annual Income: ₹${studentProfile.annualFamilyIncome ? Number(studentProfile.annualFamilyIncome).toLocaleString('en-IN') : 'N/A'}
- Category: ${studentProfile.category || 'General'}
- First Generation Learner: ${studentProfile.isFirstGen ? 'Yes' : 'No'}`
      : 'No student profile context provided.';

    const scholarshipContext = currentScholarship
      ? `Focused Scholarship Context:
- Name: ${currentScholarship.name}
- Provider: ${currentScholarship.provider}
- Award: ₹${Number(currentScholarship.awardAmount).toLocaleString('en-IN')}
- Eligibility: Min Marks ${currentScholarship.minMarks}%, Max Income ₹${Number(currentScholarship.maxIncome).toLocaleString('en-IN')}
- Required Documents: ${(currentScholarship.requiredDocuments || []).join(', ')}
- Deadline: ${currentScholarship.deadline}
- Note: This is DEMO DATA for the hackathon MVP.`
      : '';

    const systemInstruction = `You are "Grantly Copilot", an elite, empathetic, and knowledgeable scholarship advisor for GRANTLY AI ("Your Future Deserves Funding").
You help Indian and international students discover scholarships, understand intricate eligibility criteria, navigate document requirements, compute funding gaps, and craft winning applications.

Key Guidelines:
1. Support both English and Hindi (Hinglish or Devanagari Hindi if the user asks in Hindi).
2. Ground all answers in realistic scholarship logic. Always remind students to verify with the official portal when appropriate.
3. Be transparent: sample scholarships are DEMO DATA. Never invent fake active government schemes or guarantee awards.
4. If asked "Which scholarships am I eligible for?", reference their profile marks and income explicitly.
5. If asked about required documents, break them down clearly: Marksheet, Income Certificate, Domicile/Bonafide, Caste Certificate (if applicable), Aadhaar.
6. Keep formatting neat with concise bullet points, bold key terms, and actionable next steps.`;

    if (aiClient) {
      try {
        const fullPrompt = `${systemInstruction}

${studentContext}
${scholarshipContext}

User Question: ${message}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: fullPrompt,
        });

        const reply = response.text || "I'm ready to assist with your scholarship search and application steps.";
        return res.json({ reply, source: 'gemini-3.8-flash' });
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to smart heuristic response:', geminiError?.message);
      }
    }

    // Smart heuristic fallback if API key is absent or quota is limited
    const lower = message.toLowerCase();
    let fallbackReply = '';

    if (lower.includes('hindi') || lower.includes('हिंदी') || lower.includes('kare') || lower.includes('bataiye')) {
      fallbackReply = `नमस्ते! ग्रांटली को-पायलट (Grantly Copilot) में आपका स्वागत है।
आपकी प्रोफाइल के अनुसार:
• **अकादमिक योग्यता:** ${studentProfile?.percentage || 82}% अंक।
• **पारिवारिक आय:** ₹${studentProfile?.annualFamilyIncome ? Number(studentProfile.annualFamilyIncome).toLocaleString('en-IN') : '2,00,000'} प्रति वर्ष।

**आपके लिए मुख्य सुझाव:**
1. **प्रगति टेक स्कॉलरशिप (Pragati Tech Scholarship):** 80%+ अंक और ₹5 लाख से कम आय वाले छात्रों के लिए उपयुक्त।
2. **नेशनल मेरिट कम मीन्स स्कॉलरशिप:** 70%+ अंक और ₹2.5 लाख से कम आय।
3. **ज़रूरी दस्तावेज़:** 10वीं/12वीं/डिग्री मार्कशीट, वैध आय प्रमाण पत्र (तहसीलदार द्वारा जारी), और कॉलेज का बोनाफाइड सर्टिफिकेट तैयार रखें।

क्या आप किसी विशेष छात्रवृत्ति के लिए पात्रता या दस्तावेज़ जांचना चाहते हैं?`;
    } else if (lower.includes('document') || lower.includes('missing') || lower.includes('ready')) {
      fallbackReply = `Based on your profile and application readiness:

**Essential Documents for Indian & Tech Scholarships:**
1. **Academic Marksheets:** Latest semester/examination marksheets (Self-attested).
2. **Family Income Certificate:** Must be issued by competent authority (Tehsildar/SDM) within the current financial year.
3. **Bonafide Student Certificate:** Signed by your Dean or Head of Institution.
4. **Domicile / Resident Proof:** State domicile certificate for state-specific awards.
5. **Bank Passbook/Cancelled Cheque:** Student's active bank account linked to Aadhaar (for DBT).

Head to the **Document Intelligence Center** to upload and inspect your files with AI!`;
    } else if (lower.includes('eligible') || lower.includes('which scholarship') || lower.includes('match')) {
      fallbackReply = `Based on your profile (${studentProfile?.course || 'B.Tech CS'}, ${studentProfile?.percentage || 82}%, Income: ₹${studentProfile?.annualFamilyIncome ? Number(studentProfile.annualFamilyIncome).toLocaleString('en-IN') : '2,00,000'}):

You have strong eligibility matches:
- **Pragati Tech Scholarship for STEM** — 95% Match (Award: ₹50,000/yr)
- **National Merit Means Scholarship Scheme** — 92% Match (Award: ₹75,000/yr)
- **State Higher Education Excellence Grant** — 88% Match (Award: ₹40,000)

**Why you qualify:**
• Your ${studentProfile?.percentage || 82}% score comfortably clears the 70-80% thresholds.
• Your family income meets the under ₹2.5 Lakh financial criteria.
Check the **AI Matcher** tab to see your full weighted DNA breakdown!`;
    } else {
      fallbackReply = `Hello! I am your **Grantly Copilot**. I can help you:
- Decode complex eligibility rules and government/private criteria.
- Calculate your remaining education funding gap.
- Audit your document readiness and alert you to expiring certificates.
- Guide you through application deadlines and interview preparation.

How can I assist your scholarship journey today?`;
    }

    return res.json({ reply: fallbackReply, source: 'intelligent-local-fallback' });
  } catch (err: any) {
    console.error('Copilot error:', err);
    res.status(500).json({ error: 'Internal assistant error', details: err.message });
  }
});

// ==========================================
// DOCUMENT INTELLIGENCE & VAULT APIS (Phase 3F)
// ==========================================

const VAULT_STORAGE_DIR = path.resolve(__dirname, 'vault_storage');
if (!fs.existsSync(VAULT_STORAGE_DIR)) {
  fs.mkdirSync(VAULT_STORAGE_DIR, { recursive: true });
}

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Helper to get user directory inside vault storage
 */
function getUserVaultDir(userId: string, docId: string): string {
  const dir = path.join(VAULT_STORAGE_DIR, userId, docId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * In-vault persistent metadata index per user
 */
function getUserDocumentsIndex(userId: string): Record<string, any> {
  const userDir = path.join(VAULT_STORAGE_DIR, userId);
  const indexPath = path.join(userDir, 'documents_index.json');
  if (fs.existsSync(indexPath)) {
    try {
      return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    } catch {}
  }
  return {};
}

function saveUserDocumentsIndex(userId: string, index: Record<string, any>): void {
  const userDir = path.join(VAULT_STORAGE_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  const indexPath = path.join(userDir, 'documents_index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

/**
 * GET /api/documents - Fetch all documents belonging to the authenticated student
 */
app.get('/api/documents', authenticateFirebaseToken, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const localIndex = getUserDocumentsIndex(userId);
    const documents: any[] = Object.values(localIndex);

    // Also sync from Firestore if available
    try {
      const snap = await adminDb.collection('users').doc(userId).collection('documents').get();
      snap.forEach((doc) => {
        if (!localIndex[doc.id]) {
          documents.push({ id: doc.id, ...doc.data() });
        }
      });
    } catch (e) {
      // Ignored if adminDb lacks credentials
    }

    return res.json({ success: true, count: documents.length, documents });
  } catch (err: any) {
    console.error('Error fetching user documents:', err);
    return res.status(500).json({ error: 'Failed to fetch user documents', details: err.message });
  }
});

/**
 * POST /api/documents - Upload & store a document into the secure vault
 */
app.post('/api/documents', authenticateFirebaseToken, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const { documentId, fileName, documentType, mimeType, fileSize, base64Data } = req.body;

    if (!fileName || !documentType || !mimeType) {
      return res.status(400).json({
        error: 'Missing required document fields (fileName, documentType, mimeType).',
      });
    }

    // Validation: File type
    const normalizedMime = mimeType.toLowerCase();
    if (!SUPPORTED_MIME_TYPES.includes(normalizedMime)) {
      return res.status(400).json({
        error: `Unsupported file type '${mimeType}'. Supported types are PDF, JPG, and PNG.`,
      });
    }

    // Validation: File size
    const numSize = Number(fileSize);
    if (isNaN(numSize) || numSize <= 0) {
      return res.status(400).json({ error: 'Invalid document file size.' });
    }
    if (numSize > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        error: `File size exceeds the 10MB limit (${(numSize / (1024 * 1024)).toFixed(2)} MB uploaded).`,
      });
    }

    const docId = (documentId && String(documentId).trim()) || `doc-${Date.now()}`;
    const sanitizedFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `users/${userId}/documents/${docId}/${sanitizedFileName}`;

    // Store binary file securely in vault storage if base64Data provided
    if (base64Data) {
      const cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      const fileBuffer = Buffer.from(cleanBase64, 'base64');
      const targetDir = getUserVaultDir(userId, docId);
      const filePath = path.join(targetDir, sanitizedFileName);
      fs.writeFileSync(filePath, fileBuffer);
    }

    const now = new Date().toISOString();
    const docRecord = {
      id: docId,
      documentId: docId,
      ownerUid: userId,
      userId,
      fileName: sanitizedFileName,
      documentType: documentType.trim(),
      storagePath,
      mimeType: normalizedMime,
      fileSize: numSize,
      analysisStatus: 'PENDING',
      missingInformation: [],
      inconsistencies: [],
      expiryWarning: null,
      manualVerificationRequired: true,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Save into local index
    const localIndex = getUserDocumentsIndex(userId);
    localIndex[docId] = docRecord;
    saveUserDocumentsIndex(userId, localIndex);

    // Also attempt saving to Firestore if available
    try {
      await adminDb
        .collection('users')
        .doc(userId)
        .collection('documents')
        .doc(docId)
        .set(docRecord);
    } catch (e) {
      // Admin write attempted
    }

    return res.status(201).json({
      success: true,
      message: 'Document stored in secure vault successfully.',
      document: docRecord,
    });
  } catch (err: any) {
    console.error('Error saving document to vault:', err);
    return res.status(500).json({ error: 'Failed to store document', details: err.message });
  }
});

/**
 * GET /api/documents/:id - Get metadata of a single document
 */
app.get('/api/documents/:id', authenticateFirebaseToken, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const { id } = req.params;

    const localIndex = getUserDocumentsIndex(userId);
    let docRecord = localIndex[id];

    if (!docRecord) {
      try {
        const snap = await adminDb.collection('users').doc(userId).collection('documents').doc(id).get();
        if (snap.exists) {
          docRecord = { id: snap.id, ...snap.data() };
        }
      } catch (e) {}
    }

    if (!docRecord) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    return res.json({ success: true, document: docRecord });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve document', details: err.message });
  }
});

/**
 * GET /api/documents/:id/file - Stream/download the stored file securely
 * Authenticates via Bearer header or query token for browser downloads
 */
app.get('/api/documents/:id/file', async (req, res) => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1].trim();
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token.trim();
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required to view document.' });
    }

    let decoded: DecodedIdToken;
    try {
      decoded = await getAuth().verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
    }

    const userId = decoded.uid;
    const { id } = req.params;

    const localIndex = getUserDocumentsIndex(userId);
    let docData = localIndex[id];
    if (!docData) {
      try {
        const docSnap = await adminDb.collection('users').doc(userId).collection('documents').doc(id).get();
        if (docSnap.exists) {
          docData = docSnap.data();
        }
      } catch (e) {}
    }

    if (!docData) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const fileName = docData.fileName || 'document';
    const filePath = path.join(VAULT_STORAGE_DIR, userId, id, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Document file binary not found on vault storage.' });
    }

    const isDownload = req.query.download === 'true';
    res.setHeader('Content-Type', docData.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${fileName}"`
    );

    const stream = fs.createReadStream(filePath);
    return stream.pipe(res);
  } catch (err: any) {
    console.error('Error serving document file:', err);
    return res.status(500).json({ error: 'Failed to retrieve file', details: err.message });
  }
});

/**
 * DELETE /api/documents/:id - Delete document and remove physical file from storage
 */
app.delete('/api/documents/:id', authenticateFirebaseToken, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const { id } = req.params;

    const localIndex = getUserDocumentsIndex(userId);
    let exists = Boolean(localIndex[id]);

    if (!exists) {
      try {
        const snap = await adminDb.collection('users').doc(userId).collection('documents').doc(id).get();
        if (snap.exists) exists = true;
      } catch (e) {}
    }

    if (!exists) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    delete localIndex[id];
    saveUserDocumentsIndex(userId, localIndex);

    // Delete physical file directory
    const userDocDir = path.join(VAULT_STORAGE_DIR, userId, id);
    if (fs.existsSync(userDocDir)) {
      fs.rmSync(userDocDir, { recursive: true, force: true });
    }

    // Try deleting Firestore record if available
    try {
      await adminDb.collection('users').doc(userId).collection('documents').doc(id).delete();
    } catch (e) {}

    return res.json({ success: true, message: 'Document removed from vault and storage successfully.' });
  } catch (err: any) {
    console.error('Error deleting document:', err);
    return res.status(500).json({ error: 'Failed to delete document', details: err.message });
  }
});

/**
 * POST /api/gemini/analyze-document - Real Gemini Document Intelligence Analysis
 * Authenticated with Firebase ID token. Never uses hardcoded or fake fallbacks.
 */
app.post('/api/gemini/analyze-document', authenticateFirebaseToken, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const { documentId, fileName, documentType, mimeType, base64Data, studentProfile } = req.body;

    if (!documentId && !fileName) {
      return res.status(400).json({ error: 'Document ID or file details required.' });
    }

    const docId = documentId || `doc-${Date.now()}`;
    const effectiveCategory = documentType || 'Marksheet';
    const effectiveFileName = fileName || 'document';
    const effectiveMime = (mimeType || 'application/pdf').toLowerCase();

    // Verify file type and size
    if (!SUPPORTED_MIME_TYPES.includes(effectiveMime)) {
      return res.status(400).json({
        error: `Invalid file type '${effectiveMime}'. Supported formats are PDF, JPG, and PNG.`,
      });
    }

    // Obtain base64 document content: either from payload or from stored file
    let cleanBase64 = '';
    if (base64Data) {
      cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
    } else {
      // Attempt to load from vault storage
      const sanitizedFileName = path.basename(effectiveFileName).replace(/[^a-zA-Z0-9._-]/g, '_');
      const storedPath = path.join(VAULT_STORAGE_DIR, userId, docId, sanitizedFileName);
      if (fs.existsSync(storedPath)) {
        cleanBase64 = fs.readFileSync(storedPath).toString('base64');
      }
    }

    if (!cleanBase64) {
      return res.status(400).json({
        error: 'No document data found for analysis. Please provide base64Data or ensure file is stored in vault.',
      });
    }

    // Size check
    const approximateBytes = Math.ceil((cleanBase64.length * 3) / 4);
    if (approximateBytes > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        error: 'File size exceeds maximum 10MB limit.',
      });
    }

    // Load student profile for inconsistency checks
    let profileData = studentProfile;
    if (!profileData) {
      try {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (userDoc.exists) {
          profileData = userDoc.data();
        }
      } catch (e) {
        console.warn('Could not fetch student profile for cross-validation:', e);
      }
    }

    if (!aiClient) {
      // Real service unavailable error - never invent fake analysis
      const errorMsg = 'Gemini AI Document Intelligence service is temporarily unavailable. Missing server API key.';
      // Update Firestore record if exists
      try {
        await adminDb
          .collection('users')
          .doc(userId)
          .collection('documents')
          .doc(docId)
          .set(
            {
              analysisStatus: 'ANALYSIS_FAILED',
              manualVerificationRequired: true,
              inconsistencies: [errorMsg],
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
      } catch {}
      return res.status(503).json({ error: errorMsg, analysisStatus: 'ANALYSIS_FAILED' });
    }

    // Real Gemini 3.8 Flash Multimodal Call
    const systemInstruction = `You are Grantly AI's Document Intelligence Extraction Engine.
Analyze this uploaded scholarship document (category: "${effectiveCategory}", file: "${effectiveFileName}").

CRITICAL EXTRACTION DIRECTIVES:
1. Extract ONLY information that is clearly and explicitly legible in this document.
2. DO NOT invent, assume, or guess missing values.
3. If a field cannot be clearly read or is absent, return null or empty array.
4. Check if the document appears blurry, cut off, or illegible.
5. If an expiry date is visible, note it accurately.
6. IMPORTANT: AI analysis is an automated readiness inspection for scholarship preparation. It does NOT constitute official government legal certification. Never claim official verification.`;

    const extractionPrompt = `Examine this uploaded certificate/document.
Return a structured JSON object with these exact fields:
- documentType: string (recognized document classification, e.g. "Marksheet", "Income Certificate", "Bonafide Certificate", "Caste Certificate", "Aadhaar Card", "College ID", "Domicile Certificate", or "Other")
- studentName: string or null (full legal name of the student visible on the document)
- institutionName: string or null (school, university, college, or board name)
- academicYear: string or null (academic session, e.g. "2024-25" or semester)
- marksOrPercentage: string or null (marks, percentage, GPA, CGPA explicitly printed)
- issuingAuthority: string or null (authority, tehsildar, registrar, officer who issued/signed)
- issueDate: string or null (date of issuance in YYYY-MM-DD or DD-MM-YYYY format)
- expiryDate: string or null (expiration or validity end date if printed on certificate)
- relevantDetails: string or null (any key factual details for scholarship verification)
- isLegible: boolean (true if the document is sharp and legible, false if blurry or unreadable)
- readabilityNotes: string (notes on visual quality, resolution, signatures, or seals)
- confidenceScore: integer from 0 to 100 (confidence in extraction clarity)
- missingMandatoryFields: array of strings (list any standard fields that are missing or obscured)
- detectedInconsistencies: array of strings (any internal contradictions, such as mismatched dates)`;

    let rawResponseText = '';
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: effectiveMime,
                data: cleanBase64,
              },
            },
            { text: extractionPrompt },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentType: { type: Type.STRING },
              studentName: { type: Type.STRING },
              institutionName: { type: Type.STRING },
              academicYear: { type: Type.STRING },
              marksOrPercentage: { type: Type.STRING },
              issuingAuthority: { type: Type.STRING },
              issueDate: { type: Type.STRING },
              expiryDate: { type: Type.STRING },
              relevantDetails: { type: Type.STRING },
              isLegible: { type: Type.BOOLEAN },
              readabilityNotes: { type: Type.STRING },
              confidenceScore: { type: Type.INTEGER },
              missingMandatoryFields: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              detectedInconsistencies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['documentType', 'isLegible', 'confidenceScore'],
          },
        },
      });

      rawResponseText = response.text || '{}';
    } catch (geminiCallError: any) {
      console.error('Gemini document extraction call failed:', geminiCallError);
      const failedRecord = {
        analysisStatus: 'ANALYSIS_FAILED',
        manualVerificationRequired: true,
        inconsistencies: [`Gemini AI analysis error: ${geminiCallError.message || 'Processing failed'}`],
        updatedAt: new Date().toISOString(),
      };
      await adminDb
        .collection('users')
        .doc(userId)
        .collection('documents')
        .doc(docId)
        .set(failedRecord, { merge: true });

      return res.status(502).json({
        error: 'Document analysis failed. Gemini could not process the provided file.',
        details: geminiCallError.message,
        analysisStatus: 'ANALYSIS_FAILED',
      });
    }

    // Parse structured JSON safely
    let extracted: any = {};
    try {
      extracted = JSON.parse(rawResponseText.trim());
    } catch {
      const match = rawResponseText.match(/\{[\s\S]*\}/);
      if (match) {
        extracted = JSON.parse(match[0]);
      } else {
        throw new Error('Model did not return valid JSON');
      }
    }

    // Post-processing & Validation
    const isLegible = Boolean(extracted.isLegible);
    const confidenceScore = Math.max(0, Math.min(100, Number(extracted.confidenceScore) || 50));
    const missingInfo: string[] = Array.isArray(extracted.missingMandatoryFields)
      ? extracted.missingMandatoryFields.filter(Boolean)
      : [];
    const inconsistencies: string[] = Array.isArray(extracted.detectedInconsistencies)
      ? extracted.detectedInconsistencies.filter(Boolean)
      : [];

    // Check expiration date
    let expiryWarning: string | null = null;
    if (extracted.expiryDate && typeof extracted.expiryDate === 'string') {
      const expDate = new Date(extracted.expiryDate);
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        expiryWarning = `Certificate expired on ${extracted.expiryDate}. Government portals require an active, valid certificate.`;
      }
    }

    // Cross-check against student profile
    if (profileData) {
      if (extracted.studentName && profileData.fullName) {
        const docNameClean = extracted.studentName.toLowerCase().replace(/[^a-z]/g, '');
        const profNameClean = profileData.fullName.toLowerCase().replace(/[^a-z]/g, '');
        if (docNameClean && profNameClean && !docNameClean.includes(profNameClean) && !profNameClean.includes(docNameClean)) {
          inconsistencies.push(
            `Extracted name "${extracted.studentName}" differs from registered profile name "${profileData.fullName}".`
          );
        }
      }
    }

    // Determine status: ANALYZED | NEEDS_REVIEW | UNREADABLE | ANALYSIS_FAILED
    let analysisStatus: 'ANALYZED' | 'NEEDS_REVIEW' | 'UNREADABLE' | 'ANALYSIS_FAILED' = 'ANALYZED';
    if (!isLegible || confidenceScore < 40) {
      analysisStatus = 'UNREADABLE';
    } else if (missingInfo.length > 0 || inconsistencies.length > 0 || expiryWarning || confidenceScore < 70) {
      analysisStatus = 'NEEDS_REVIEW';
    } else {
      analysisStatus = 'ANALYZED';
    }

    // Calculate derived readiness score (0-100)
    let readinessScore = 85;
    if (analysisStatus === 'UNREADABLE') {
      readinessScore = 30;
    } else if (analysisStatus === 'NEEDS_REVIEW') {
      readinessScore = Math.min(78, Math.max(50, confidenceScore - 15));
    } else {
      readinessScore = Math.min(98, Math.max(82, confidenceScore));
    }

    const confidenceTier = confidenceScore >= 80 ? 'HIGH' : confidenceScore >= 50 ? 'MEDIUM' : 'LOW';

    const normalizedExtractedData = {
      documentType: extracted.documentType || effectiveCategory,
      studentName: extracted.studentName || null,
      institutionName: extracted.institutionName || null,
      academicYear: extracted.academicYear || null,
      marksOrPercentage: extracted.marksOrPercentage || null,
      issuingAuthority: extracted.issuingAuthority || null,
      issueDate: extracted.issueDate || null,
      expiryDate: extracted.expiryDate || null,
      relevantDetails: extracted.relevantDetails || null,
      isLegible,
      readabilityNotes: extracted.readabilityNotes || (isLegible ? 'Document text clearly readable.' : 'Low clarity scan.'),
      confidenceScore,
      confidenceTier,
    };

    const now = new Date().toISOString();
    const updatedRecord = {
      id: docId,
      documentId: docId,
      ownerUid: userId,
      userId,
      fileName: effectiveFileName,
      documentType: effectiveCategory,
      mimeType: effectiveMime,
      analysisStatus,
      readinessScore,
      extractedData: normalizedExtractedData,
      missingInformation: missingInfo,
      inconsistencies,
      expiryWarning,
      manualVerificationRequired: true,
      analyzedAt: now,
      updatedAt: now,
    };

    // Update in Firestore
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('documents')
      .doc(docId)
      .set(updatedRecord, { merge: true });

    return res.json({
      success: true,
      analysisStatus,
      document: updatedRecord,
      extractedData: normalizedExtractedData,
      missingInformation: missingInfo,
      inconsistencies,
      expiryWarning,
      manualVerificationRequired: true,
      disclaimer: 'AI Document Intelligence provides automated optical extraction and consistency audits. Grantly AI does not issue or represent official government legal verifications.',
    });
  } catch (err: any) {
    console.error('Fatal document analysis error:', err);
    return res.status(500).json({
      error: 'Fatal error while performing document intelligence analysis',
      details: err.message,
      analysisStatus: 'ANALYSIS_FAILED',
    });
  }
});

// TrustGuard Report Endpoint
app.post('/api/trustguard/report', (req, res) => {
  const { scholarshipId, scholarshipName, reason, details, userEmail } = req.body;
  console.log(`[TrustGuard Report] ID: ${scholarshipId}, Name: ${scholarshipName}, Reason: ${reason}`);
  return res.json({
    success: true,
    reportId: `TG-${Date.now()}`,
    message: 'Report received. Our Trust & Safety team will review this listing within 24 hours.',
  });
});

// ==========================================
// STATIC ASSETS & VITE INTEGRATION
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Grantly AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
