import {
  StudentProfile,
  ApplicationRecord,
  UploadedDocument,
  Scholarship,
  SuspiciousReport,
} from '../types';
import { DEMO_SCHOLARSHIPS } from '../data/scholarships';

const KEYS = {
  PROFILE: 'grantly_student_profile_v1',
  APPLICATIONS: 'grantly_applications_v1',
  DOCUMENTS: 'grantly_documents_v1',
  SAVED: 'grantly_saved_scholarships_v1',
  REPORTS: 'grantly_suspicious_reports_v1',
  AUTH: 'grantly_auth_user_v1',
};

export const BLANK_STUDENT_PROFILE: StudentProfile = {
  id: '',
  fullName: '',
  email: '',
  state: 'Jharkhand',
  city: '',
  dob: '',
  gender: 'Male',
  educationLevel: 'Undergraduate',
  course: '',
  college: '',
  academicYear: 1,
  percentage: 75,
  annualFamilyIncome: 250000,
  financialBackground: '',
  estimatedAnnualEducationCost: 150000,
  confirmedFunding: 0,
  category: 'General',
  disabilityStatus: false,
  isFirstGen: false,
  categoryPreferences: ['Engineering', 'Merit-cum-Means', 'State Domicile'],
  onboardingCompleted: false,
};

export const SAMPLE_EVALUATION_PROFILE: StudentProfile = {
  id: 'student-eval-01',
  fullName: 'Aarav Sharma',
  email: 'aarav.sharma@nitr.ac.in',
  state: 'Jharkhand',
  city: 'Ranchi',
  dob: '2004-08-14',
  gender: 'Male',
  educationLevel: 'Undergraduate',
  course: 'B.Tech Computer Science',
  college: 'National Institute of Technology',
  academicYear: 3,
  percentage: 82,
  annualFamilyIncome: 200000,
  financialBackground: 'Low-to-middle income farming & small business family background in rural/semi-urban Jharkhand.',
  estimatedAnnualEducationCost: 180000,
  confirmedFunding: 30000,
  category: 'OBC',
  disabilityStatus: false,
  isFirstGen: true,
  categoryPreferences: ['Engineering', 'Merit-cum-Means', 'State Domicile', 'Tech & AI'],
  onboardingCompleted: true,
};

export const INITIAL_DEMO_PROFILE = SAMPLE_EVALUATION_PROFILE;

export function isProfileCompleted(profile?: StudentProfile | null): boolean {
  if (!profile) return false;
  return Boolean(profile.onboardingCompleted && profile.fullName && profile.fullName.trim().length > 0);
}

export const INITIAL_DEMO_APPLICATIONS: ApplicationRecord[] = [
  {
    id: 'app-01',
    scholarshipId: 'sch-02', // National Merit-Means
    status: 'Ready to Apply',
    notes: 'Income certificate verified. Bonafide signed by HOD. Waiting for portal registration window to open next Monday.',
    updatedAt: '2026-11-04T10:30:00Z',
    appliedDate: undefined,
    documentsSubmitted: ['Marksheet', 'Income Certificate', 'Bonafide Certificate'],
  },
  {
    id: 'app-02',
    scholarshipId: 'sch-03', // State Excellence Award
    status: 'Preparing',
    notes: 'Need to get latest domicile certificate renewal from Circle Officer.',
    updatedAt: '2026-11-02T15:00:00Z',
    appliedDate: undefined,
    documentsSubmitted: ['Marksheet', 'Bonafide Certificate'],
  },
  {
    id: 'app-03',
    scholarshipId: 'sch-07', // NextGen AI & Data Science
    status: 'Applied',
    notes: 'Submitted GitHub repo and project report on distributed systems. Under screening by CSR committee.',
    updatedAt: '2026-10-28T09:15:00Z',
    appliedDate: '2026-10-28',
    documentsSubmitted: ['Marksheet', 'Bonafide Certificate', 'Identity Proof'],
  },
  {
    id: 'app-04',
    scholarshipId: 'sch-04', // Dr. Kalam Research Grant
    status: 'Saved',
    notes: 'High value (₹1,20,000). Preparing 2-page AI thesis abstract with lab mentor.',
    updatedAt: '2026-11-05T12:00:00Z',
    documentsSubmitted: [],
  },
  {
    id: 'app-05',
    scholarshipId: 'sch-08', // All-India EWS
    status: 'Under Review',
    notes: 'Application submitted on National Portal. Nodal officer approved on Nov 1.',
    updatedAt: '2026-11-01T16:20:00Z',
    appliedDate: '2026-10-20',
    documentsSubmitted: ['Marksheet', 'Income Certificate', 'Bonafide Certificate', 'Identity Proof'],
  },
];

export const INITIAL_DEMO_DOCUMENTS: UploadedDocument[] = [
  {
    id: 'doc-01',
    name: 'BTech_Sem4_Official_Transcript.pdf',
    category: 'Marksheet',
    fileType: 'application/pdf',
    fileSize: 1420000,
    uploadDate: '2026-10-15',
    status: 'verified',
    readinessScore: 95,
    aiAnalysis: {
      documentCategory: 'Marksheet',
      readinessScore: 95,
      detectedName: 'Aarav Sharma',
      detectedMarksOrGpa: '8.44 CGPA (82.1% equivalent)',
      detectedIssuingAuthority: 'National Institute of Technology Examination Controller',
      detectedDate: 'July 2024',
      isLegible: true,
      tamperingRisk: 'low',
      missingOrBlurryFields: [],
      verificationNotes: 'Digital signature verified. University watermark and seal clearly visible.',
      recommendation: 'Valid for all current scholarship cycles. Top tier readiness.',
    },
  },
  {
    id: 'doc-02',
    name: 'Tehsildar_Income_Certificate_FY24_25.pdf',
    category: 'Income Certificate',
    fileType: 'application/pdf',
    fileSize: 890000,
    uploadDate: '2026-10-18',
    status: 'verified',
    readinessScore: 90,
    aiAnalysis: {
      documentCategory: 'Income Certificate',
      readinessScore: 90,
      detectedName: 'Aarav Sharma (S/o Rajesh Sharma)',
      detectedAnnualIncome: '₹2,00,000 / year',
      detectedIssuingAuthority: 'Office of the Executive Magistrate / Tehsildar, Ranchi',
      detectedDate: 'May 2024 (Valid for FY 2024-2025)',
      isLegible: true,
      tamperingRisk: 'low',
      missingOrBlurryFields: [],
      verificationNotes: 'Revenue officer barcode present. Validates annual income under ₹2,50,000 cap.',
      recommendation: 'Certified. Valid for all merit-cum-means and state grants.',
    },
  },
  {
    id: 'doc-03',
    name: 'NIT_College_Bonafide_Certificate.pdf',
    category: 'Bonafide Certificate',
    fileType: 'application/pdf',
    fileSize: 650000,
    uploadDate: '2026-10-20',
    status: 'verified',
    readinessScore: 92,
    aiAnalysis: {
      documentCategory: 'Bonafide Certificate',
      readinessScore: 92,
      detectedName: 'Aarav Sharma',
      detectedIssuingAuthority: 'Office of the Dean of Academic Affairs, NIT',
      detectedDate: 'August 2024',
      isLegible: true,
      tamperingRisk: 'low',
      missingOrBlurryFields: [],
      verificationNotes: 'Attests active enrollment in B.Tech Computer Science (3rd Year, Roll #22CS084).',
      recommendation: 'Perfect for institution verification requirements.',
    },
  },
  {
    id: 'doc-04',
    name: 'OBC_Non_Creamy_Layer_Certificate.pdf',
    category: 'Caste Certificate',
    fileType: 'application/pdf',
    fileSize: 920000,
    uploadDate: '2026-10-22',
    status: 'verified',
    readinessScore: 88,
    aiAnalysis: {
      documentCategory: 'Caste Certificate',
      readinessScore: 88,
      detectedName: 'Aarav Sharma',
      detectedIssuingAuthority: 'Sub-Divisional Officer (SDO)',
      detectedDate: 'September 2023',
      isLegible: true,
      tamperingRisk: 'low',
      missingOrBlurryFields: ['Validity period must be re-checked for Central Govt portals'],
      verificationNotes: 'State list OBC certificate. Valid for state grants; check central OBC-NCL validity.',
      recommendation: 'Good for state quota. Consider obtaining an updated central NCL certificate.',
    },
  },
];

// Profile storage
export function getStudentProfile(): StudentProfile {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading profile from localStorage:', e);
  }
  return BLANK_STUDENT_PROFILE;
}

export function saveStudentProfile(profile: StudentProfile): void {
  try {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile to localStorage:', e);
  }
}

// Applications storage
export function getApplications(): ApplicationRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.APPLICATIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading applications:', e);
  }
  return [];
}

export function saveApplications(apps: ApplicationRecord[]): void {
  try {
    localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(apps));
  } catch (e) {
    console.error('Error saving applications:', e);
  }
}

export function updateApplicationStatus(
  scholarshipId: string,
  status: ApplicationRecord['status'],
  notes?: string
): ApplicationRecord[] {
  const current = getApplications();
  const existingIdx = current.findIndex(a => a.scholarshipId === scholarshipId);

  if (existingIdx >= 0) {
    current[existingIdx] = {
      ...current[existingIdx],
      status,
      notes: notes !== undefined ? notes : current[existingIdx].notes,
      updatedAt: new Date().toISOString(),
      appliedDate: status === 'Applied' && !current[existingIdx].appliedDate ? new Date().toISOString().split('T')[0] : current[existingIdx].appliedDate,
    };
  } else {
    current.push({
      id: `app-${Date.now()}`,
      scholarshipId,
      status,
      notes: notes || 'Added to tracker.',
      updatedAt: new Date().toISOString(),
      appliedDate: status === 'Applied' ? new Date().toISOString().split('T')[0] : undefined,
      documentsSubmitted: [],
    });
  }

  saveApplications(current);
  return current;
}

export function removeApplication(scholarshipId: string): ApplicationRecord[] {
  const current = getApplications().filter(a => a.scholarshipId !== scholarshipId);
  saveApplications(current);
  return current;
}

// Documents storage
export function getDocuments(): UploadedDocument[] {
  try {
    const raw = localStorage.getItem(KEYS.DOCUMENTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading documents:', e);
  }
  return [];
}

export function saveDocuments(docs: UploadedDocument[]): void {
  try {
    // Strip heavy and sensitive binary/base64 strings from client storage
    const sanitizedDocs = docs.map(d => ({
      ...d,
      fileData: undefined,
    }));
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(sanitizedDocs));
  } catch (e) {
    console.error('Error saving documents:', e);
  }
}

export function addDocument(doc: UploadedDocument): UploadedDocument[] {
  const docs = getDocuments();
  const safeDoc: UploadedDocument = {
    ...doc,
    fileData: undefined,
  };
  docs.unshift(safeDoc);
  saveDocuments(docs);
  return docs;
}

export function deleteDocument(id: string): UploadedDocument[] {
  const docs = getDocuments().filter(d => d.id !== id);
  saveDocuments(docs);
  return docs;
}

// Calculate Document Readiness Score across required categories
export function calculateDocumentReadiness(docs: UploadedDocument[]): {
  overallScore: number;
  verifiedCount: number;
  totalRequired: number;
  missingCategories: string[];
} {
  const essentialCategories = ['Marksheet', 'Income Certificate', 'Bonafide Certificate', 'Identity Proof'];
  const presentCategories = new Set(docs.map(d => d.category));

  const missingCategories = essentialCategories.filter(cat => !presentCategories.has(cat as any));
  const verifiedDocs = docs.filter(d => d.status === 'verified');

  let avgScore = 0;
  if (docs.length > 0) {
    const sum = docs.reduce((acc, d) => acc + (d.readinessScore || 80), 0);
    avgScore = Math.round(sum / docs.length);
  }

  // Penalty for missing essential categories
  const coverageRatio = (essentialCategories.length - missingCategories.length) / essentialCategories.length;
  const overallScore = Math.round(avgScore * 0.6 + coverageRatio * 40);

  return {
    overallScore: Math.min(100, overallScore),
    verifiedCount: verifiedDocs.length,
    totalRequired: essentialCategories.length,
    missingCategories,
  };
}

// Saved / Favorited scholarships
export function getSavedScholarshipIds(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.SAVED);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading saved ids:', e);
  }
  return [];
}

export function toggleSaveScholarship(id: string): boolean {
  const saved = getSavedScholarshipIds();
  const index = saved.indexOf(id);
  let isSavedNow = false;

  if (index >= 0) {
    saved.splice(index, 1);
    isSavedNow = false;
  } else {
    saved.push(id);
    isSavedNow = true;
  }

  try {
    localStorage.setItem(KEYS.SAVED, JSON.stringify(saved));
  } catch (e) {
    console.error('Error saving:', e);
  }
  return isSavedNow;
}

// TrustGuard Suspicious Reports
export function reportSuspiciousScholarship(report: Omit<SuspiciousReport, 'id' | 'reportedAt'>): SuspiciousReport {
  const newReport: SuspiciousReport = {
    ...report,
    id: `rep-${Date.now()}`,
    reportedAt: new Date().toISOString(),
  };

  try {
    const existing: SuspiciousReport[] = JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]');
    existing.unshift(newReport);
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving report:', e);
  }

  return newReport;
}

// Reset student profile data to clean state
export function resetStudentData(): void {
  localStorage.removeItem(KEYS.PROFILE);
  localStorage.removeItem(KEYS.APPLICATIONS);
  localStorage.removeItem(KEYS.DOCUMENTS);
  localStorage.removeItem(KEYS.SAVED);
  localStorage.removeItem(KEYS.REPORTS);
  window.dispatchEvent(new Event('grantly_data_reset'));
}

// Internal evaluation dataset loader for testing environments
export function loadSampleEvaluationData(): void {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(SAMPLE_EVALUATION_PROFILE));
  localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(INITIAL_DEMO_APPLICATIONS));
  localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(INITIAL_DEMO_DOCUMENTS));
  localStorage.setItem(KEYS.SAVED, JSON.stringify(['sch-02', 'sch-03', 'sch-04', 'sch-07']));
  window.dispatchEvent(new Event('grantly_data_reset'));
}

export const resetDemoData = resetStudentData;
