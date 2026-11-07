import { Scholarship, StudentProfile, MatchResult, MatchBreakdown } from '../types';
import { evaluateScholarshipEligibility } from '../services/eligibilityEngine';

/**
 * Grantly Scholarship Eligibility Deterministic Matching Engine
 * Backed by Phase 3E deterministic evaluation architecture
 */
export function calculateMatchScore(student: StudentProfile, scholarship: Scholarship): MatchResult {
  const evaluation = evaluateScholarshipEligibility(student, scholarship);

  const breakdown: MatchBreakdown = {
    academic: evaluation.breakdown?.academic ?? 0,
    income: evaluation.breakdown?.income ?? 0,
    course: evaluation.breakdown?.course ?? 0,
    location: evaluation.breakdown?.location ?? 0,
    category: evaluation.breakdown?.educationLevel ?? 0,
  };

  const status: 'Eligible' | 'Borderline' | 'Ineligible' =
    evaluation.eligibilityStatus === 'ELIGIBLE'
      ? 'Eligible'
      : evaluation.eligibilityStatus === 'NEEDS_REVIEW'
      ? 'Borderline'
      : 'Ineligible';

  return {
    scholarship,
    score: evaluation.matchScore ?? 0,
    status,
    eligibilityStatus: evaluation.eligibilityStatus,
    breakdown,
    explanations: [evaluation.explanation, ...evaluation.matchedCriteria],
    missingCriteria: evaluation.missingInformation,
    failedCriteria: evaluation.failedCriteria,
    missingInformation: evaluation.missingInformation,
    mandatoryFailed: evaluation.eligibilityStatus === 'INELIGIBLE',
    mandatoryFailureReason: evaluation.failedCriteria[0],
  };
}

/**
 * Run matching engine over scholarship dataset with deterministic priority sorting
 */
export function rankScholarshipsForStudent(
  student: StudentProfile,
  scholarships: Scholarship[]
): MatchResult[] {
  return scholarships
    .map((s) => calculateMatchScore(student, s))
    .sort((a, b) => {
      // 1. Sort priority: ELIGIBLE first, then NEEDS_REVIEW, then INELIGIBLE
      const rankVal = (item: MatchResult) => {
        if (item.eligibilityStatus === 'ELIGIBLE' || item.status === 'Eligible') return 3;
        if (item.eligibilityStatus === 'NEEDS_REVIEW' || item.status === 'Borderline') return 2;
        return 1;
      };
      const diff = rankVal(b) - rankVal(a);
      if (diff !== 0) return diff;

      // 2. Highest score next
      if (a.score !== b.score) return b.score - a.score;

      // 3. Days left
      return a.scholarship.daysLeft - b.scholarship.daysLeft;
    });
}
