/**
 * Grantly AI Deterministic Scholarship Eligibility Engine
 * Phase 3E Specification
 * 
 * Compares authenticated student profile against official scholarship criteria
 * purely deterministically (No LLM / AI decisions).
 */

import {
  EligibilityStatus,
  EligibilityEvaluation,
  MatchScoreBreakdown,
  StudentProfileInput,
  ScholarshipInput,
} from '../types/eligibility';
import {
  isStateEligible,
  isCourseEligible,
  isEducationLevelEligible,
  isAcademicMarksEligible,
  isIncomeEligible,
  isDeadlineAndStatusEligible,
} from '../utils/normalization';

/**
 * Evaluates a single scholarship against a student profile
 */
export function evaluateScholarshipEligibility(
  student: StudentProfileInput,
  scholarship: ScholarshipInput
): EligibilityEvaluation {
  const matchedCriteria: string[] = [];
  const failedCriteria: string[] = [];
  const missingInformation: string[] = [];

  // Extract fields with fallbacks to alternate property names in existing models
  const scholarshipId = scholarship.id;
  const scholarshipName = scholarship.name;
  const provider = scholarship.provider;
  const officialSourceUrl = scholarship.officialSourceUrl || '';
  const verificationStatus = scholarship.verificationStatus || 'VERIFIED';
  const deadline = scholarship.deadline || '';
  const daysLeft = scholarship.daysLeft !== undefined ? scholarship.daysLeft : 30;

  const minMarks = scholarship.minimumMarks !== undefined ? scholarship.minimumMarks : scholarship.minMarks;
  const maxIncome = scholarship.maximumFamilyIncome !== undefined ? scholarship.maximumFamilyIncome : scholarship.maxIncome;
  const eligibleCourses = scholarship.eligibleCourses || [];
  const eligibleStates = scholarship.eligibleStates || [];
  const educationLevels = scholarship.educationLevels || (typeof scholarship.educationLevel === 'string' ? [scholarship.educationLevel] : scholarship.educationLevel) || [];

  const studentMarks = student.academicPercentage !== undefined ? student.academicPercentage : student.percentage;
  const studentIncome = student.annualFamilyIncome;
  const studentState = student.state;
  const studentCourse = student.course;
  const studentLevel = student.educationLevel;

  // -------------------------------------------------------------
  // 1. Mandatory Rule: Verification Status & Deadline
  // -------------------------------------------------------------
  const statusCheck = isDeadlineAndStatusEligible(deadline, verificationStatus, daysLeft);
  if (statusCheck.passed) {
    matchedCriteria.push('Application Status: Verified scheme with open application window.');
  } else if (statusCheck.isExpired) {
    failedCriteria.push(`Deadline Closed: ${statusCheck.reason}`);
  } else if (statusCheck.isPending) {
    missingInformation.push(`Official Circular Verification: ${statusCheck.reason}`);
  } else if (statusCheck.isMissing) {
    missingInformation.push(`Application Deadline: ${statusCheck.reason}`);
  }

  // -------------------------------------------------------------
  // 2. Mandatory Rule: Academic Percentage Cut-off
  // -------------------------------------------------------------
  const marksCheck = isAcademicMarksEligible(studentMarks, minMarks);
  if (marksCheck.passed) {
    matchedCriteria.push(`Academics: Marks (${studentMarks}%) meet or exceed minimum threshold (${minMarks || 0}%).`);
  } else if (marksCheck.isMissing) {
    missingInformation.push('Academic Marks: Percentage is missing from student profile.');
  } else {
    failedCriteria.push(`Academic Marks: ${marksCheck.reason}`);
  }

  // -------------------------------------------------------------
  // 3. Mandatory Rule: Annual Family Income Ceiling
  // -------------------------------------------------------------
  const incomeCheck = isIncomeEligible(studentIncome, maxIncome);
  if (incomeCheck.passed) {
    if (maxIncome && maxIncome > 0) {
      matchedCriteria.push(`Income Ceiling: Family income (₹${Number(studentIncome).toLocaleString('en-IN')}) satisfies maximum cap of ₹${Number(maxIncome).toLocaleString('en-IN')}.`);
    } else {
      matchedCriteria.push('Income Ceiling: No family income limit applies to this scheme.');
    }
  } else if (incomeCheck.isMissing) {
    missingInformation.push('Family Income: Annual family income is missing from student profile.');
  } else {
    failedCriteria.push(`Family Income: ${incomeCheck.reason}`);
  }

  // -------------------------------------------------------------
  // 4. Mandatory Rule: Education Level
  // -------------------------------------------------------------
  const levelCheck = isEducationLevelEligible(studentLevel, educationLevels);
  if (levelCheck.passed) {
    matchedCriteria.push(`Education Level: ${studentLevel} matches target cohorts (${educationLevels.join(', ')}).`);
  } else if (levelCheck.isMissing) {
    missingInformation.push('Education Level: Student education level is missing from profile.');
  } else {
    failedCriteria.push(`Education Level: ${levelCheck.reason}`);
  }

  // -------------------------------------------------------------
  // 5. Mandatory Rule: Course Stream
  // -------------------------------------------------------------
  const courseCheck = isCourseEligible(studentCourse, eligibleCourses);
  if (courseCheck.passed) {
    matchedCriteria.push(`Degree Stream: Course (${studentCourse}) qualifies for eligible courses list.`);
  } else if (courseCheck.isMissing) {
    missingInformation.push('Course / Stream: Degree course is missing from student profile.');
  } else {
    failedCriteria.push(`Course / Stream: ${courseCheck.reason}`);
  }

  // -------------------------------------------------------------
  // 6. Mandatory Rule: State Domicile
  // -------------------------------------------------------------
  const stateCheck = isStateEligible(studentState, eligibleStates);
  if (stateCheck.passed) {
    matchedCriteria.push(`State Quota: ${stateCheck.reason}`);
  } else if (stateCheck.isMissing) {
    missingInformation.push('State Domicile: Permanent residence state is missing from student profile.');
  } else {
    failedCriteria.push(`State Domicile: ${stateCheck.reason}`);
  }

  // -------------------------------------------------------------
  // 7. Decision Priority Determination
  // -------------------------------------------------------------
  let eligibilityStatus: EligibilityStatus;

  // Strict priority: Any confirmed failure = INELIGIBLE (even if another field is missing)
  if (failedCriteria.length > 0) {
    eligibilityStatus = 'INELIGIBLE';
  } else if (missingInformation.length > 0) {
    // No confirmed failure, but required data is missing or unverified
    eligibilityStatus = 'NEEDS_REVIEW';
  } else {
    // Every mandatory condition confirmed satisfied
    eligibilityStatus = 'ELIGIBLE';
  }

  // -------------------------------------------------------------
  // 8. Match Score Calculation (0-100)
  // -------------------------------------------------------------
  const { score, breakdown } = computeDeterministicMatchScore(
    student,
    scholarship,
    eligibilityStatus,
    missingInformation.length > 0
  );

  // -------------------------------------------------------------
  // 9. Structured Human-Friendly Explanation Synthesis
  // -------------------------------------------------------------
  const explanation = synthesizeExplanation(
    eligibilityStatus,
    matchedCriteria,
    failedCriteria,
    missingInformation,
    student,
    scholarship
  );

  return {
    scholarshipId,
    scholarshipName,
    provider,
    eligibilityStatus,
    matchScore: score,
    matchedCriteria,
    failedCriteria,
    missingInformation,
    explanation,
    officialSourceUrl,
    verificationStatus,
    deadline,
    daysLeft,
    breakdown,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Computes transparent weighted match score (0-100)
 * Factors:
 * - Academic percentage: 25 pts
 * - Income need: 25 pts
 * - Course relevance: 20 pts
 * - Location match: 15 pts
 * - Education level fit: 15 pts
 */
function computeDeterministicMatchScore(
  student: StudentProfileInput,
  scholarship: ScholarshipInput,
  status: EligibilityStatus,
  hasMissingData: boolean
): { score: number | null; breakdown: MatchScoreBreakdown } {
  // If crucial data is missing, an exact score is misleading
  if (hasMissingData && status === 'NEEDS_REVIEW') {
    return {
      score: null,
      breakdown: { academic: 0, income: 0, course: 0, location: 0, educationLevel: 0, total: 0 },
    };
  }

  let academic = 0;
  let income = 0;
  let course = 0;
  let location = 0;
  let educationLevel = 0;

  const studentMarks = student.academicPercentage !== undefined ? student.academicPercentage : student.percentage;
  const minMarks = scholarship.minimumMarks !== undefined ? scholarship.minimumMarks : scholarship.minMarks || 0;

  if (studentMarks !== undefined && studentMarks !== null && !isNaN(Number(studentMarks))) {
    const marks = Number(studentMarks);
    if (marks >= minMarks) {
      const surplus = marks - minMarks;
      if (surplus >= 20) academic = 25;
      else if (surplus >= 10) academic = 22;
      else if (surplus >= 5) academic = 19;
      else academic = 16;
    } else {
      academic = 0;
    }
  }

  const studentIncome = student.annualFamilyIncome;
  const maxIncome = scholarship.maximumFamilyIncome !== undefined ? scholarship.maximumFamilyIncome : scholarship.maxIncome || 0;

  if (maxIncome <= 0) {
    income = 20; // No financial limit
  } else if (studentIncome !== undefined && studentIncome !== null && !isNaN(Number(studentIncome))) {
    const inc = Number(studentIncome);
    if (inc <= maxIncome) {
      const ratio = inc / maxIncome;
      if (ratio <= 0.5) income = 25;
      else if (ratio <= 0.75) income = 22;
      else income = 18;
    } else {
      income = 0;
    }
  }

  // Course Fit (20 pts)
  const eligibleCourses = scholarship.eligibleCourses || [];
  if (eligibleCourses.length > 0) {
    const isAll = eligibleCourses.some((c) => c.toLowerCase() === 'all' || c.toLowerCase() === 'all courses');
    if (isAll) {
      course = 16;
    } else {
      const check = isCourseEligible(student.course, eligibleCourses);
      course = check.passed ? 20 : 0;
    }
  }

  // Location Fit (15 pts)
  const eligibleStates = scholarship.eligibleStates || [];
  if (eligibleStates.length > 0) {
    const stateCheck = isStateEligible(student.state, eligibleStates);
    if (stateCheck.passed) {
      const isSpecific = !eligibleStates.some((s) => s.toLowerCase().includes('all') || s.toLowerCase().includes('india'));
      location = isSpecific ? 15 : 12;
    } else {
      location = 0;
    }
  }

  // Education Level (15 pts)
  const educationLevels = scholarship.educationLevels || (typeof scholarship.educationLevel === 'string' ? [scholarship.educationLevel] : scholarship.educationLevel) || [];
  if (educationLevels.length > 0) {
    const levelCheck = isEducationLevelEligible(student.educationLevel, educationLevels);
    educationLevel = levelCheck.passed ? 15 : 0;
  }

  const total = academic + income + course + location + educationLevel;

  // Match score cannot override INELIGIBLE status
  if (status === 'INELIGIBLE') {
    return {
      score: null, // Null score prevents misleading match ranking
      breakdown: { academic, income, course, location, educationLevel, total },
    };
  }

  return {
    score: Math.min(100, Math.max(0, total)),
    breakdown: { academic, income, course, location, educationLevel, total },
  };
}

/**
 * Synthesizes clear, plain-language explanation for students
 */
function synthesizeExplanation(
  status: EligibilityStatus,
  matched: string[],
  failed: string[],
  missing: string[],
  student: StudentProfileInput,
  scholarship: ScholarshipInput
): string {
  if (status === 'ELIGIBLE') {
    const marksText = student.percentage ? `${student.percentage}% marks` : 'qualifying marks';
    const incomeText = student.annualFamilyIncome ? `annual family income of ₹${student.annualFamilyIncome.toLocaleString('en-IN')}` : 'income';
    return `Eligible: Your profile meets all mandatory requirements for this scheme. Your ${marksText} and ${incomeText} comfortably satisfy the official guidelines.`;
  }

  if (status === 'INELIGIBLE') {
    const reasons = failed.slice(0, 2).join('; ');
    return `Not eligible: ${reasons}`;
  }

  // NEEDS_REVIEW
  if (missing.length > 0) {
    const fields = missing.slice(0, 2).join('; ');
    return `Further review required: ${fields}. Complete your student profile to finalize your eligibility determination.`;
  }

  return 'Further review required: Please review the official circular for specific prerequisites.';
}

/**
 * Evaluates and sorts a list of scholarships deterministically
 */
export function evaluateAndRankScholarships(
  student: StudentProfileInput,
  scholarships: ScholarshipInput[]
): EligibilityEvaluation[] {
  return scholarships
    .map((s) => evaluateScholarshipEligibility(student, s))
    .sort((a, b) => {
      // 1. Sort priority: ELIGIBLE first, then NEEDS_REVIEW, then INELIGIBLE
      const statusWeight: Record<EligibilityStatus, number> = {
        ELIGIBLE: 3,
        NEEDS_REVIEW: 2,
        INELIGIBLE: 1,
      };

      const diff = statusWeight[b.eligibilityStatus] - statusWeight[a.eligibilityStatus];
      if (diff !== 0) return diff;

      // 2. Highest match score next (treating null scores as 0 for sorting)
      const scoreA = a.matchScore !== null ? a.matchScore : 0;
      const scoreB = b.matchScore !== null ? b.matchScore : 0;
      if (scoreA !== scoreB) return scoreB - scoreA;

      // 3. Closing soonest deadline
      return a.daysLeft - b.daysLeft;
    });
}
