// Document Intelligence & Vault Type Definitions (Phase 3F)

export type SupportedDocumentMimeType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/jpg';

export type DocumentTypeCategory =
  | 'Aadhaar card'
  | 'Income certificate'
  | 'Caste certificate'
  | 'Domicile certificate'
  | 'Marksheet'
  | 'Bonafide certificate'
  | 'College ID'
  | 'Other supporting documents';

export type DocumentAnalysisStatus =
  | 'PENDING'
  | 'ANALYZED'
  | 'NEEDS_REVIEW'
  | 'UNREADABLE'
  | 'ANALYSIS_FAILED';

export interface DocumentExtractedData {
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
  confidenceScore: number; // 0 to 100
  confidenceTier: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface UserDocumentRecord {
  id: string;
  documentId: string;
  ownerUid: string;
  fileName: string;
  documentType: DocumentTypeCategory | string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  fileData?: string; // Base64 data for local preview when available
  analysisStatus: DocumentAnalysisStatus;
  extractedData?: DocumentExtractedData;
  missingInformation: string[];
  inconsistencies: string[];
  expiryWarning?: string | null;
  manualVerificationRequired: boolean;
  uploadedAt: string; // ISO
  analyzedAt?: string; // ISO
  selectedScholarshipIds?: string[];
  readinessScore?: number; // 0-100 derived score
}

export interface DocumentAnalysisResponse {
  success: boolean;
  documentId: string;
  analysisStatus: DocumentAnalysisStatus;
  extractedData: DocumentExtractedData;
  missingInformation: string[];
  inconsistencies: string[];
  expiryWarning: string | null;
  manualVerificationRequired: boolean;
  analyzedAt: string;
  error?: string;
}

export interface ScholarshipDocumentItemRequirement {
  requiredCategory: string;
  matchedDocumentId?: string;
  matchedDocumentName?: string;
  status: 'AVAILABLE' | 'MISSING' | 'NEEDS_REVIEW' | 'EXPIRED' | 'UNREADABLE';
  notes: string;
}

export interface ScholarshipDocumentReadiness {
  scholarshipId: string;
  scholarshipName: string;
  totalRequired: number;
  availableCount: number;
  missingCount: number;
  needsReviewCount: number;
  expiredCount: number;
  completenessRatio: string; // e.g. "3/4"
  completenessPercentage: number; // 0 to 100
  status: 'READY' | 'PARTIALLY_READY' | 'NOT_READY' | 'NO_REQUIREMENTS';
  hasUnavailableRequirements: boolean;
  requirements: ScholarshipDocumentItemRequirement[];
  disclaimer: string;
}
