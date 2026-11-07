/**
 * Types & Contracts for Grantly AI Deterministic Scholarship Eligibility Engine
 * Phase 3E Specification
 */

export type EligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW';

export interface CriterionResult {
  name: string;
  category: 'VERIFICATION' | 'DEADLINE' | 'ACADEMIC' | 'INCOME' | 'EDUCATION_LEVEL' | 'COURSE' | 'STATE';
  passed: boolean;
  isMissing: boolean;
  requiredValue?: string | number | string[];
  actualValue?: string | number | null;
  detail: string;
}

export interface MatchScoreBreakdown {
  academic: number;       // max 25
  income: number;         // max 25
  course: number;         // max 20
  location: number;       // max 15
  educationLevel: number; // max 15
  total: number;          // max 100
}

export interface EligibilityEvaluation {
  scholarshipId: string;
  scholarshipName: string;
  provider: string;
  eligibilityStatus: EligibilityStatus;
  matchScore: number | null;
  matchedCriteria: string[];
  failedCriteria: string[];
  missingInformation: string[];
  explanation: string;
  officialSourceUrl: string;
  verificationStatus: string;
  deadline: string;
  daysLeft: number;
  breakdown?: MatchScoreBreakdown;
  evaluatedAt: string;
}

export interface StudentProfileInput {
  id?: string;
  fullName?: string;
  email?: string;
  state?: string | null;
  city?: string | null;
  educationLevel?: string | null;
  course?: string | null;
  institution?: string | null;
  college?: string | null;
  academicPercentage?: number | null;
  percentage?: number | null;
  annualFamilyIncome?: number | null;
  gender?: string | null;
  category?: string | null;
  isFirstGen?: boolean;
  disabilityStatus?: boolean;
}

export interface ScholarshipInput {
  id: string;
  name: string;
  provider: string;
  educationLevel?: string | string[];
  educationLevels?: string[];
  eligibleCourses?: string[];
  eligibleStates?: string[];
  minimumMarks?: number;
  minMarks?: number;
  maximumFamilyIncome?: number;
  maxIncome?: number;
  deadline?: string;
  officialSourceUrl?: string;
  verificationStatus?: string;
  awardAmount?: number;
  currency?: string;
  daysLeft?: number;
  description?: string;
  tags?: string[];
  requiredDocuments?: string[];
}
