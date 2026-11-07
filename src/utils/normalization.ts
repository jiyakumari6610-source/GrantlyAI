/**
 * Pure Normalization Utilities for Deterministic Scholarship Eligibility Engine
 * Phase 3E Specification
 */

/**
 * Normalizes a string by trimming, removing excessive whitespace, and lowercasing.
 */
export function normalizeString(str?: string | null): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Strips punctuation and symbols for tokenized degree/course comparisons
 */
export function cleanPunctuation(str: string): string {
  return str.replace(/[().,/\-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Recognizes recognized Pan-India keywords in eligibleStates
 */
export const PAN_INDIA_KEYWORDS = new Set([
  'all india',
  'all',
  'pan india',
  'pan-india',
  'all states',
  'india',
]);

/**
 * Checks if eligible states array contains an explicit pan-India rule
 */
export function isPanIndiaStateList(states?: string[] | null): boolean {
  if (!states || !Array.isArray(states) || states.length === 0) {
    // Explicit rule: An empty array is NOT pan-India.
    return false;
  }
  return states.some((s) => PAN_INDIA_KEYWORDS.has(normalizeString(s)));
}

/**
 * Evaluates whether student's state is eligible according to scholarship's state rules
 */
export function isStateEligible(
  studentState?: string | null,
  eligibleStates?: string[] | null
): { passed: boolean; isMissing: boolean; reason: string } {
  if (!eligibleStates || !Array.isArray(eligibleStates) || eligibleStates.length === 0) {
    return {
      passed: false,
      isMissing: true,
      reason: 'Scholarship has no eligible states specified in criteria.',
    };
  }

  // Check structured pan-India rule
  if (isPanIndiaStateList(eligibleStates)) {
    return {
      passed: true,
      isMissing: false,
      reason: 'Open to residents of all Indian states and Union Territories (Pan-India).',
    };
  }

  if (!studentState || normalizeString(studentState).length === 0) {
    return {
      passed: false,
      isMissing: true,
      reason: 'Student domicile state is missing from profile.',
    };
  }

  const normalizedStudent = normalizeString(studentState);
  const normalizedEligible = eligibleStates.map(normalizeString);

  const matched = normalizedEligible.includes(normalizedStudent);

  if (matched) {
    return {
      passed: true,
      isMissing: false,
      reason: `Student state (${studentState}) matches eligible states quota (${eligibleStates.join(', ')}).`,
    };
  }

  return {
    passed: false,
    isMissing: false,
    reason: `State domicile requirement not met. Required: ${eligibleStates.join(', ')}. Student profile lists: ${studentState}.`,
  };
}

/**
 * Canonical course stream mappings in Indian Higher Education
 */
const COURSE_CANONICAL_STREAMS: Record<string, string[]> = {
  engineering: [
    'engineering',
    'b tech',
    'btech',
    'b e',
    'be',
    'm tech',
    'mtech',
    'computer science',
    'information technology',
    'electronics',
    'mechanical',
    'civil',
    'electrical',
    'bca',
    'mca',
  ],
  medicine: [
    'medicine',
    'mbbs',
    'bds',
    'b pharm',
    'bpharm',
    'pharmacy',
    'nursing',
    'b sc nursing',
  ],
  sciences: [
    'sciences',
    'b sc',
    'bsc',
    'm sc',
    'msc',
    'physics',
    'chemistry',
    'mathematics',
    'biology',
    'biotechnology',
    'agriculture',
  ],
  commerce: [
    'commerce',
    'b com',
    'bcom',
    'm com',
    'mcom',
    'bba',
    'mba',
    'chartered accountancy',
    'finance',
    'economics',
  ],
  arts: [
    'arts',
    'humanities',
    'b a',
    'ba',
    'm a',
    'ma',
    'history',
    'political science',
    'sociology',
    'english literature',
  ],
};

/**
 * Evaluates whether student's course is eligible according to scholarship's course rules.
 * Strictly avoids ambiguous substrings (e.g., 'art' does NOT match 'earth sciences').
 */
export function isCourseEligible(
  studentCourse?: string | null,
  eligibleCourses?: string[] | null
): { passed: boolean; isMissing: boolean; reason: string } {
  if (!eligibleCourses || !Array.isArray(eligibleCourses) || eligibleCourses.length === 0) {
    return {
      passed: false,
      isMissing: true,
      reason: 'Scholarship has no eligible courses specified.',
    };
  }

  const normalizedEligible = eligibleCourses.map(normalizeString);

  // If scholarship allows all courses
  if (normalizedEligible.includes('all') || normalizedEligible.includes('all courses')) {
    return {
      passed: true,
      isMissing: false,
      reason: 'Open to students across all academic courses and degree streams.',
    };
  }

  if (!studentCourse || normalizeString(studentCourse).length === 0) {
    return {
      passed: false,
      isMissing: true,
      reason: 'Student course/degree stream is missing from profile.',
    };
  }

  const cleanStudentCourse = cleanPunctuation(normalizeString(studentCourse));

  // 1. Direct exact or whole-token word matching
  for (const eligible of eligibleCourses) {
    const cleanEligible = cleanPunctuation(normalizeString(eligible));

    if (cleanStudentCourse === cleanEligible) {
      return {
        passed: true,
        isMissing: false,
        reason: `Course matches scholarship requirement exactly: ${eligible}.`,
      };
    }

    // Word boundary check: ensure eligible course appears as distinct word phrase, not partial substring
    const wordBoundaryRegex = new RegExp(`(^|\\s)${escapeRegex(cleanEligible)}(\\s|$)`, 'i');
    if (wordBoundaryRegex.test(cleanStudentCourse)) {
      return {
        passed: true,
        isMissing: false,
        reason: `Course (${studentCourse}) belongs to eligible stream: ${eligible}.`,
      };
    }
  }

  // 2. Canonical stream alignment (e.g. student in 'B.Tech Computer Science' and eligible is 'Engineering')
  for (const [streamKey, streamKeywords] of Object.entries(COURSE_CANONICAL_STREAMS)) {
    const studentBelongsToStream = streamKeywords.some((kw) => {
      const reg = new RegExp(`(^|\\s)${escapeRegex(kw)}(\\s|$)`, 'i');
      return reg.test(cleanStudentCourse);
    });

    if (studentBelongsToStream) {
      const scholarshipAcceptsStream = normalizedEligible.some((e) => {
        const cleanE = cleanPunctuation(e);
        return cleanE === streamKey || streamKeywords.some((kw) => kw === cleanE);
      });

      if (scholarshipAcceptsStream) {
        return {
          passed: true,
          isMissing: false,
          reason: `Student course (${studentCourse}) aligns with target academic stream (${eligibleCourses.join(', ')}).`,
        };
      }
    }
  }

  return {
    passed: false,
    isMissing: false,
    reason: `Course mismatch. Required: ${eligibleCourses.join(', ')}. Student profile lists: ${studentCourse}.`,
  };
}

/**
 * Evaluates education level requirement
 */
export function isEducationLevelEligible(
  studentLevel?: string | null,
  scholarshipLevels?: string | string[] | null
): { passed: boolean; isMissing: boolean; reason: string } {
  let allowed: string[] = [];
  if (Array.isArray(scholarshipLevels)) {
    allowed = scholarshipLevels;
  } else if (typeof scholarshipLevels === 'string' && scholarshipLevels.trim().length > 0) {
    allowed = [scholarshipLevels];
  }

  if (allowed.length === 0) {
    return {
      passed: false,
      isMissing: true,
      reason: 'Scholarship has no education levels specified.',
    };
  }

  const normalizedAllowed = allowed.map(normalizeString);

  if (normalizedAllowed.includes('all') || normalizedAllowed.includes('all education levels')) {
    return {
      passed: true,
      isMissing: false,
      reason: 'Open across all higher education and secondary levels.',
    };
  }

  if (!studentLevel || normalizeString(studentLevel).length === 0) {
    return {
      passed: false,
      isMissing: true,
      reason: 'Student education level is missing from profile.',
    };
  }

  const normalizedStudent = normalizeString(studentLevel);
  const matched = normalizedAllowed.includes(normalizedStudent);

  if (matched) {
    return {
      passed: true,
      isMissing: false,
      reason: `Education level (${studentLevel}) matches required level (${allowed.join(', ')}).`,
    };
  }

  return {
    passed: false,
    isMissing: false,
    reason: `Education level mismatch. Required: ${allowed.join(', ')}. Student profile lists: ${studentLevel}.`,
  };
}

/**
 * Evaluates academic marks percentage against minimum cut-off
 * Boundary: if min is 60, 60.00 is eligible, 59.99 is not.
 */
export function isAcademicMarksEligible(
  studentMarks?: number | null,
  minimumMarks?: number | null
): { passed: boolean; isMissing: boolean; reason: string } {
  const min = minimumMarks !== undefined && minimumMarks !== null ? Number(minimumMarks) : 0;

  if (studentMarks === undefined || studentMarks === null || isNaN(Number(studentMarks))) {
    return {
      passed: false,
      isMissing: true,
      reason: 'Academic percentage is missing from student profile.',
    };
  }

  const marks = Number(studentMarks);

  if (marks >= min) {
    return {
      passed: true,
      isMissing: false,
      reason: `Academic marks (${marks}%) satisfy required minimum cut-off (${min}%).`,
    };
  }

  return {
    passed: false,
    isMissing: false,
    reason: `Academic percentage does not meet minimum cut-off. Required: ${min}%, but student profile has ${marks}%.`,
  };
}

/**
 * Evaluates annual family income against maximum ceiling
 * Boundary: if max is 250000, 250000 is eligible, 250001 is not.
 */
export function isIncomeEligible(
  studentIncome?: number | null,
  maximumIncome?: number | null
): { passed: boolean; isMissing: boolean; reason: string } {
  // If scholarship specifies no limit or 0, it means no income cap applies
  if (maximumIncome === undefined || maximumIncome === null || maximumIncome <= 0) {
    return {
      passed: true,
      isMissing: false,
      reason: 'No family income restriction specified for this scholarship.',
    };
  }

  const max = Number(maximumIncome);

  if (studentIncome === undefined || studentIncome === null || isNaN(Number(studentIncome))) {
    return {
      passed: false,
      isMissing: true,
      reason: 'Annual family income is missing from student profile.',
    };
  }

  const income = Number(studentIncome);

  if (income <= max) {
    return {
      passed: true,
      isMissing: false,
      reason: `Annual family income (₹${income.toLocaleString('en-IN')}) is within the allowable limit of ₹${max.toLocaleString('en-IN')}.`,
    };
  }

  return {
    passed: false,
    isMissing: false,
    reason: `Annual family income exceeds maximum ceiling. Maximum allowed: ₹${max.toLocaleString('en-IN')}, but student income is ₹${income.toLocaleString('en-IN')}.`,
  };
}

/**
 * Evaluates scholarship deadline and application status
 */
export function isDeadlineAndStatusEligible(
  deadline?: string | null,
  verificationStatus?: string | null,
  daysLeft?: number | null
): { passed: boolean; isMissing: boolean; reason: string; isExpired: boolean; isPending: boolean } {
  // Verification check: Only VERIFIED can produce ELIGIBLE
  if (verificationStatus === 'EXPIRED_OR_CLOSED') {
    return {
      passed: false,
      isMissing: false,
      isExpired: true,
      isPending: false,
      reason: 'Application cycle for this scholarship is officially closed.',
    };
  }

  if (verificationStatus === 'PENDING_VERIFICATION') {
    return {
      passed: false,
      isMissing: true,
      isExpired: false,
      isPending: true,
      reason: 'Scholarship is pending official circular verification on government portal.',
    };
  }

  if (verificationStatus !== 'VERIFIED') {
    return {
      passed: false,
      isMissing: true,
      isExpired: false,
      isPending: true,
      reason: `Scholarship has unverified status: ${verificationStatus || 'Unknown'}.`,
    };
  }

  // Check days left
  if (daysLeft !== undefined && daysLeft !== null && daysLeft <= 0) {
    return {
      passed: false,
      isMissing: false,
      isExpired: true,
      isPending: false,
      reason: 'Application deadline has passed (0 days remaining).',
    };
  }

  // Check deadline string format
  if (!deadline || deadline.trim().length === 0) {
    return {
      passed: false,
      isMissing: true,
      isExpired: false,
      isPending: false,
      reason: 'Application deadline is missing from scholarship record.',
    };
  }

  const cleanDeadline = deadline.trim().toLowerCase();
  if (cleanDeadline.includes('closed') || cleanDeadline.includes('concluded') || cleanDeadline.includes('expired')) {
    return {
      passed: false,
      isMissing: false,
      isExpired: true,
      isPending: false,
      reason: 'Application window has concluded.',
    };
  }

  // Parse YYYY-MM-DD
  const dateParts = deadline.split('-');
  if (dateParts.length === 3) {
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);

    const deadlineDate = new Date(Date.UTC(year, month, day, 23, 59, 59));
    const now = new Date();

    if (!isNaN(deadlineDate.getTime()) && deadlineDate.getTime() < now.getTime()) {
      return {
        passed: false,
        isMissing: false,
        isExpired: true,
        isPending: false,
        reason: `Application deadline expired on ${deadline}.`,
      };
    }
  }

  return {
    passed: true,
    isMissing: false,
    isExpired: false,
    isPending: false,
    reason: `Application is open (Deadline: ${deadline}).`,
  };
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
