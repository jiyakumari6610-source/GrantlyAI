// TypeScript Data Models & Contracts for Firestore Data Layer

export interface UserProfileDocument {
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  state: string;
  city: string;
  educationLevel: string;
  course: string;
  institution: string;
  academicPercentage: number;
  annualFamilyIncome: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScholarshipDocument {
  id: string;
  name: string;
  provider: string;
  description: string;
  awardAmount: number;
  currency: string;
  educationLevel: string | string[];
  eligibleCourses: string[];
  eligibleStates: string[];
  minimumMarks: number;
  maximumFamilyIncome: number;
  requiredDocuments: string[];
  deadline: string;
  officialSourceUrl: string;
  verificationStatus: string;
  academicYear?: string;
  lastCheckedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedScholarshipRecord {
  scholarshipId: string;
  savedAt: string;
}

export type ApplicationTrackingStatus =
  | 'Saved'
  | 'Preparing'
  | 'Ready to Apply'
  | 'Applied'
  | 'Under Review'
  | 'Approved'
  | 'Rejected';

export interface ApplicationHistoryRecord {
  id: string;
  userId: string;
  scholarshipId: string;
  status: ApplicationTrackingStatus;
  notes: string;
  appliedDate?: string;
  documentsSubmitted: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentMetadataRecord {
  id: string;
  documentId?: string;
  ownerUid?: string;
  userId: string;
  name?: string;
  fileName: string;
  category?: string;
  documentType: string;
  fileType?: string;
  mimeType: string;
  fileSize: number;
  uploadDate?: string;
  uploadedAt: string;
  status?: 'verified' | 'analyzing' | 'needs-review';
  analysisStatus: 'PENDING' | 'ANALYZED' | 'NEEDS_REVIEW' | 'UNREADABLE' | 'ANALYSIS_FAILED';
  readinessScore?: number;
  storagePath: string;
  extractedData?: any;
  missingInformation?: string[];
  inconsistencies?: string[];
  expiryWarning?: string | null;
  manualVerificationRequired?: boolean;
  analyzedAt?: string;
  selectedScholarshipIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportRecord {
  id: string;
  scholarshipId: string;
  scholarshipName?: string;
  reason: string;
  details?: string;
  reportedByUid?: string;
  userEmail?: string;
  reportedAt: string;
}

// ==========================================
// VALIDATION HELPERS (Step 6)
// ==========================================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export function validateUserProfile(profile: Partial<UserProfileDocument>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!profile.fullName || profile.fullName.trim().length === 0) {
    errors.fullName = 'Full legal name is required.';
  } else if (profile.fullName.length > 120) {
    errors.fullName = 'Full name must not exceed 120 characters.';
  }

  if (!profile.email || !validateEmail(profile.email)) {
    errors.email = 'A valid email address is required.';
  }

  if (profile.phone && profile.phone.length > 25) {
    errors.phone = 'Phone number is too long.';
  }

  if (profile.academicPercentage !== undefined) {
    const marks = Number(profile.academicPercentage);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      errors.academicPercentage = 'Academic percentage must be a valid number between 0 and 100.';
    }
  }

  if (profile.annualFamilyIncome !== undefined) {
    const income = Number(profile.annualFamilyIncome);
    if (isNaN(income) || income < 0) {
      errors.annualFamilyIncome = 'Annual family income must be a non-negative number.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateApplication(app: Partial<ApplicationHistoryRecord>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!app.scholarshipId || app.scholarshipId.trim().length === 0) {
    errors.scholarshipId = 'Scholarship ID is required.';
  }

  if (!app.status) {
    errors.status = 'Application status is required.';
  }

  if (app.notes && app.notes.length > 1500) {
    errors.notes = 'Notes cannot exceed 1500 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateScholarshipDocument(doc: Partial<ScholarshipDocument>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!doc.name || doc.name.trim().length === 0) {
    errors.name = 'Scholarship scheme name is required.';
  }

  if (!doc.provider || doc.provider.trim().length === 0) {
    errors.provider = 'Official government or institutional provider name is required.';
  }

  if (!doc.officialSourceUrl || doc.officialSourceUrl.trim().length === 0) {
    errors.officialSourceUrl = 'Official government source portal URL is required.';
  } else {
    try {
      const parsed = new URL(doc.officialSourceUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.officialSourceUrl = 'Official source URL must use http or https protocol.';
      }
    } catch {
      errors.officialSourceUrl = 'Invalid official source URL format.';
    }
  }

  const validStatuses = ['VERIFIED', 'PENDING_VERIFICATION', 'EXPIRED_OR_CLOSED'];
  if (!doc.verificationStatus || !validStatuses.includes(doc.verificationStatus)) {
    errors.verificationStatus = `Verification status must be one of: ${validStatuses.join(', ')}`;
  }

  if (doc.awardAmount !== undefined && (isNaN(Number(doc.awardAmount)) || Number(doc.awardAmount) < 0)) {
    errors.awardAmount = 'Award amount must be a valid non-negative number.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Converts a Firestore ScholarshipDocument to the component-friendly Scholarship interface
 */
export function scholarshipDocumentToModel(doc: ScholarshipDocument): import('./index').Scholarship {
  // Calculate days left safely from deadline
  let daysLeft = 30;
  if (doc.deadline) {
    const deadlineDate = new Date(doc.deadline);
    if (!isNaN(deadlineDate.getTime())) {
      const diffMs = deadlineDate.getTime() - Date.now();
      daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  const isExpired = doc.verificationStatus === 'EXPIRED_OR_CLOSED' || daysLeft === 0;

  // Normalize education levels to array
  let educationLevels: string[] = ['Undergraduate'];
  if (Array.isArray(doc.educationLevel)) {
    educationLevels = doc.educationLevel;
  } else if (typeof doc.educationLevel === 'string' && doc.educationLevel.trim().length > 0) {
    educationLevels = [doc.educationLevel];
  }

  return {
    id: doc.id,
    name: doc.name,
    provider: doc.provider,
    providerType: 'Government',
    description: doc.description || 'Government scholarship scheme with official verification portal link.',
    educationLevels,
    eligibleCourses: doc.eligibleCourses || ['All'],
    eligibleStates: doc.eligibleStates || ['All India'],
    minMarks: doc.minimumMarks !== undefined ? doc.minimumMarks : 50,
    maxIncome: doc.maximumFamilyIncome !== undefined ? doc.maximumFamilyIncome : 250000,
    minimumMarks: doc.minimumMarks,
    maximumFamilyIncome: doc.maximumFamilyIncome,
    categories: ['All'],
    genderCriteria: 'All',
    awardAmount: doc.awardAmount || 0,
    currency: doc.currency || 'INR',
    awardFrequency: 'Annual',
    requiredDocuments: doc.requiredDocuments || ['Marksheet', 'Income Certificate', 'Bonafide Certificate'],
    deadline: doc.deadline || (isExpired ? 'Application Closed' : 'Check Official Portal'),
    daysLeft: isExpired ? 0 : daysLeft,
    officialSourceUrl: doc.officialSourceUrl,
    verificationStatus: doc.verificationStatus as any,
    academicYear: doc.academicYear || '2025-26',
    lastCheckedAt: doc.lastCheckedAt || new Date().toISOString().split('T')[0],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    applicationSteps: [
      `Navigate to official portal: ${doc.officialSourceUrl}`,
      'Register with student Aadhaar and institutional AISHE / U-DISE credentials',
      'Submit required certified documents verified by Institute Nodal Officer (INO)',
    ],
    disclaimer: 'Official scheme catalog record. Rules, deadlines, and disbursement quotas are authoritative on the respective government portal.',
    tags: ['Official Government', ...(doc.eligibleStates || []).filter((s) => s !== 'All India')],
    trustRating: doc.verificationStatus === 'VERIFIED' ? 5 : doc.verificationStatus === 'PENDING_VERIFICATION' ? 3 : 2,
    isSuspiciousWarning: false,
  };
}
