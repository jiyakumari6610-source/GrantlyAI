export type EducationLevel =
  | 'Undergraduate'
  | 'Postgraduate'
  | 'Class 12 / Higher Secondary'
  | 'Diploma / Polytechnic'
  | 'Doctoral / PhD';

export type CategoryType = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  state: string;
  city: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';
  educationLevel: EducationLevel;
  course: string;
  college: string;
  academicYear: number | string;
  percentage: number;
  annualFamilyIncome: number;
  financialBackground: string;
  estimatedAnnualEducationCost: number;
  confirmedFunding: number;
  category: CategoryType;
  disabilityStatus: boolean;
  isFirstGen: boolean;
  categoryPreferences: string[];
  onboardingCompleted: boolean;
}

export type ProviderType = 'Government' | 'Corporate CSR' | 'Non-Profit / NGO' | 'University' | 'Flagged Suspicious';

export type VerificationStatus =
  | 'VERIFIED'
  | 'PENDING_VERIFICATION'
  | 'EXPIRED_OR_CLOSED'
  | 'Official Verified'
  | 'Provisional Review'
  | 'Flagged Suspicious';

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  providerType: ProviderType;
  description: string;
  educationLevels: string[];
  eligibleCourses: string[];
  eligibleStates: string[];
  minMarks: number;
  maxIncome: number;
  categories: string[];
  genderCriteria: 'All' | 'Female' | 'Male';
  awardAmount: number;
  awardFrequency: 'Annual' | 'One-Time' | 'Per Semester' | 'Tuition Waiver';
  currency?: string;
  requiredDocuments: string[];
  deadline: string;
  daysLeft: number;
  officialSourceUrl: string;
  verificationStatus: VerificationStatus;
  academicYear?: string;
  lastCheckedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  minimumMarks?: number;
  maximumFamilyIncome?: number;
  applicationSteps: string[];
  disclaimer: string;
  isDemoData?: boolean;
  tags: string[];
  trustRating: number;
  isSuspiciousWarning?: boolean;
}

export type ApplicationStatus =
  | 'Saved'
  | 'Preparing'
  | 'Ready to Apply'
  | 'Applied'
  | 'Under Review'
  | 'Approved'
  | 'Rejected';

export interface ApplicationRecord {
  id: string;
  scholarshipId: string;
  status: ApplicationStatus;
  notes: string;
  updatedAt: string;
  appliedDate?: string;
  documentsSubmitted: string[];
}

export type DocumentCategory =
  | 'Aadhaar card'
  | 'Income certificate'
  | 'Caste certificate'
  | 'Domicile certificate'
  | 'Marksheet'
  | 'Bonafide certificate'
  | 'College ID'
  | 'Other supporting documents'
  | 'Income Certificate'
  | 'Caste Certificate'
  | 'Bonafide Certificate'
  | 'Identity Proof'
  | 'Other';

export * from './document';

export interface UploadedDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  status: 'verified' | 'analyzing' | 'needs-review';
  readinessScore: number;
  fileData?: string;
  // Phase 3F Rich Attributes
  documentId?: string;
  ownerUid?: string;
  fileName?: string;
  documentType?: string;
  storagePath?: string;
  mimeType?: string;
  analysisStatus?: 'PENDING' | 'ANALYZED' | 'NEEDS_REVIEW' | 'UNREADABLE' | 'ANALYSIS_FAILED';
  extractedData?: {
    documentType: string;
    studentName: string | null;
    institutionName: string | null;
    academicYear: string | null;
    marksOrPercentage: string | null;
    issuingAuthority: string | null;
    issueDate: string | null;
    expiryDate: string | null;
    relevantDetails: string | null;
    isLegible: boolean;
    readabilityNotes: string | null;
    confidenceScore: number;
    confidenceTier?: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  missingInformation?: string[];
  inconsistencies?: string[];
  expiryWarning?: string | null;
  manualVerificationRequired?: boolean;
  uploadedAt?: string;
  analyzedAt?: string;
  selectedScholarshipIds?: string[];
  aiAnalysis?: {
    documentCategory: string;
    readinessScore: number;
    detectedName?: string;
    detectedMarksOrGpa?: string;
    detectedAnnualIncome?: string;
    detectedIssuingAuthority?: string;
    detectedDate?: string;
    isLegible: boolean;
    tamperingRisk: string;
    missingOrBlurryFields: string[];
    verificationNotes: string;
    recommendation: string;
  };
}

export interface MatchBreakdown {
  academic: number; // max 25
  income: number; // max 25
  course: number; // max 20
  location: number; // max 15
  category: number; // max 15
}

export interface MatchResult {
  scholarship: Scholarship;
  score: number;
  status: 'Eligible' | 'Borderline' | 'Ineligible';
  eligibilityStatus?: 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW';
  breakdown: MatchBreakdown;
  explanations: string[];
  missingCriteria: string[];
  failedCriteria?: string[];
  missingInformation?: string[];
  mandatoryFailed: boolean;
  mandatoryFailureReason?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
  source?: string;
}

export interface SuspiciousReport {
  id: string;
  scholarshipId: string;
  scholarshipName: string;
  reason: string;
  details: string;
  reportedAt: string;
}
