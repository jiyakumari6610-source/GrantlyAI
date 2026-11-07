import { StudentProfile, MatchResult } from '../types';

export interface FundingAnalysis {
  educationCost: number;
  confirmedFunding: number;
  netFundingRequirement: number;
  potentialScholarshipFunding: number;
  bestEligibleSum: number;
  projectedRemainingGap: number;
  coverageRatio: number; // 0 to 100%
  eligibleMatchesCount: number;
}

export function computeFundingGap(
  student: StudentProfile,
  matches: MatchResult[]
): FundingAnalysis {
  const educationCost = student.estimatedAnnualEducationCost || 180000;
  const confirmedFunding = student.confirmedFunding || 0;

  // Real unfunded gap before any unawarded scholarships
  const netFundingRequirement = Math.max(0, educationCost - confirmedFunding);

  // Filter scholarships where student is strictly 'Eligible'
  const eligibleMatches = matches.filter(m => m.status === 'Eligible' && !m.mandatoryFailed);
  const potentialScholarshipFunding = eligibleMatches.reduce(
    (sum, m) => sum + (m.scholarship.awardAmount || 0),
    0
  );

  // Take the realistic top 2 scholarships (since students typically win 1-2 overlapping awards)
  const topEligible = [...eligibleMatches]
    .sort((a, b) => b.scholarship.awardAmount - a.scholarship.awardAmount)
    .slice(0, 2);

  const bestEligibleSum = topEligible.reduce((sum, m) => sum + m.scholarship.awardAmount, 0);

  // Projected remaining gap if top potential awards are won
  const projectedRemainingGap = Math.max(0, netFundingRequirement - bestEligibleSum);

  const totalPossible = confirmedFunding + bestEligibleSum;
  const coverageRatio = Math.min(100, Math.round((totalPossible / (educationCost || 1)) * 100));

  return {
    educationCost,
    confirmedFunding,
    netFundingRequirement,
    potentialScholarshipFunding,
    bestEligibleSum,
    projectedRemainingGap,
    coverageRatio,
    eligibleMatchesCount: eligibleMatches.length,
  };
}
