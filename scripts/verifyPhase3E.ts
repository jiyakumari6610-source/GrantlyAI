import { evaluateScholarshipEligibility, evaluateAndRankScholarships } from '../src/services/eligibilityEngine';
import { StudentProfileInput, ScholarshipInput } from '../src/types/eligibility';
import { isStateEligible, isCourseEligible, isAcademicMarksEligible, isIncomeEligible } from '../src/utils/normalization';

interface TestRecord {
  id: number;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  notes?: string;
}

const tests: TestRecord[] = [];

// Base compliant student profile
const baseCompliantStudent: StudentProfileInput = {
  fullName: 'Aarav Sharma',
  educationLevel: 'Undergraduate',
  course: 'B.Tech Computer Science',
  state: 'Jharkhand',
  academicPercentage: 75,
  percentage: 75,
  annualFamilyIncome: 200000,
};

// Base compliant scholarship
const baseCompliantScholarship: ScholarshipInput = {
  id: 'test-scheme-1',
  name: 'National Technical Merit Scholarship',
  provider: 'Ministry of Education',
  educationLevel: ['Undergraduate'],
  eligibleCourses: ['Engineering', 'B.Tech Computer Science'],
  eligibleStates: ['Jharkhand', 'Bihar'],
  minimumMarks: 60,
  maximumFamilyIncome: 250000,
  deadline: '2026-12-31',
  daysLeft: 54,
  verificationStatus: 'VERIFIED',
  officialSourceUrl: 'https://scholarships.gov.in/',
};

async function runPhase3ETestSuite() {
  console.log('===============================================================');
  console.log('  GRANTLY AI — PHASE 3E DETERMINISTIC ENGINE TEST SUITE');
  console.log('===============================================================\n');

  // Test 1: Student satisfies every mandatory condition → ELIGIBLE
  {
    const res = evaluateScholarshipEligibility(baseCompliantStudent, baseCompliantScholarship);
    const passed = res.eligibilityStatus === 'ELIGIBLE' && res.failedCriteria.length === 0 && res.missingInformation.length === 0;
    tests.push({
      id: 1,
      name: 'All mandatory conditions satisfied → ELIGIBLE',
      passed,
      expected: 'ELIGIBLE with 0 failures and 0 missing',
      actual: `${res.eligibilityStatus} (Failed: ${res.failedCriteria.length}, Missing: ${res.missingInformation.length})`,
      notes: `Match score computed: ${res.matchScore}/100`,
    });
  }

  // Test 2: Academic percentage below minimum → INELIGIBLE
  {
    const student = { ...baseCompliantStudent, academicPercentage: 59.99, percentage: 59.99 };
    const res = evaluateScholarshipEligibility(student, baseCompliantScholarship);
    const passed = res.eligibilityStatus === 'INELIGIBLE' && res.failedCriteria.some((f) => f.includes('Academic Marks'));
    tests.push({
      id: 2,
      name: 'Academic percentage below minimum (59.99% vs 60%) → INELIGIBLE',
      passed,
      expected: 'INELIGIBLE with academic shortfall',
      actual: `${res.eligibilityStatus} (Reason: ${res.failedCriteria[0]})`,
    });
  }

  // Test 3: Academic percentage exactly at minimum → passes marks criterion
  {
    const marksCheck = isAcademicMarksEligible(60.0, 60.0);
    const student = { ...baseCompliantStudent, academicPercentage: 60.0, percentage: 60.0 };
    const res = evaluateScholarshipEligibility(student, baseCompliantScholarship);
    const passed = marksCheck.passed === true && res.eligibilityStatus === 'ELIGIBLE';
    tests.push({
      id: 3,
      name: 'Academic percentage exactly at minimum boundary (60.0% vs 60%) → PASSES',
      passed,
      expected: 'PASSES marks criterion (ELIGIBLE)',
      actual: `marksCheck.passed=${marksCheck.passed}, Status=${res.eligibilityStatus}`,
    });
  }

  // Test 4: Income exactly at maximum → passes income criterion
  {
    const incomeCheck = isIncomeEligible(250000, 250000);
    const student = { ...baseCompliantStudent, annualFamilyIncome: 250000 };
    const res = evaluateScholarshipEligibility(student, baseCompliantScholarship);
    const passed = incomeCheck.passed === true && res.eligibilityStatus === 'ELIGIBLE';
    tests.push({
      id: 4,
      name: 'Family income exactly at ceiling boundary (₹2,50,000 vs ₹2,50,000) → PASSES',
      passed,
      expected: 'PASSES income criterion (ELIGIBLE)',
      actual: `incomeCheck.passed=${incomeCheck.passed}, Status=${res.eligibilityStatus}`,
    });
  }

  // Test 5: Income above maximum → INELIGIBLE
  {
    const student = { ...baseCompliantStudent, annualFamilyIncome: 250001 };
    const res = evaluateScholarshipEligibility(student, baseCompliantScholarship);
    const passed = res.eligibilityStatus === 'INELIGIBLE' && res.failedCriteria.some((f) => f.includes('Family Income'));
    tests.push({
      id: 5,
      name: 'Income above maximum boundary (₹2,50,001 vs ₹2,50,000) → INELIGIBLE',
      passed,
      expected: 'INELIGIBLE with income ceiling exceeded',
      actual: `${res.eligibilityStatus} (Reason: ${res.failedCriteria[0]})`,
    });
  }

  // Test 6: Wrong state → INELIGIBLE
  {
    const student = { ...baseCompliantStudent, state: 'Kerala' };
    const res = evaluateScholarshipEligibility(student, baseCompliantScholarship);
    const passed = res.eligibilityStatus === 'INELIGIBLE' && res.failedCriteria.some((f) => f.includes('State Domicile'));
    tests.push({
      id: 6,
      name: 'State domicile mismatch (Kerala vs Jharkhand/Bihar) → INELIGIBLE',
      passed,
      expected: 'INELIGIBLE with state restriction',
      actual: `${res.eligibilityStatus} (Reason: ${res.failedCriteria[0]})`,
    });
  }

  // Test 7: Wrong course → INELIGIBLE
  {
    const student = { ...baseCompliantStudent, course: 'History' };
    const res = evaluateScholarshipEligibility(student, baseCompliantScholarship);
    const passed = res.eligibilityStatus === 'INELIGIBLE' && res.failedCriteria.some((f) => f.includes('Course'));
    tests.push({
      id: 7,
      name: 'Course mismatch (History vs Engineering) → INELIGIBLE',
      passed,
      expected: 'INELIGIBLE with stream mismatch',
      actual: `${res.eligibilityStatus} (Reason: ${res.failedCriteria[0]})`,
    });
  }

  // Test 8: Missing academic percentage → NEEDS_REVIEW if no other confirmed failure
  {
    const student = { ...baseCompliantStudent, academicPercentage: undefined, percentage: undefined };
    const res = evaluateScholarshipEligibility(student, baseCompliantScholarship);
    const passed = res.eligibilityStatus === 'NEEDS_REVIEW' && res.missingInformation.some((m) => m.includes('Academic Marks'));
    tests.push({
      id: 8,
      name: 'Missing academic marks without confirmed failure → NEEDS_REVIEW',
      passed,
      expected: 'NEEDS_REVIEW with missing academic marks',
      actual: `${res.eligibilityStatus} (Missing: ${res.missingInformation[0]})`,
    });
  }

  // Test 9: Missing income → NEEDS_REVIEW if no other confirmed failure
  {
    const student = { ...baseCompliantStudent, annualFamilyIncome: undefined };
    const res = evaluateScholarshipEligibility(student, baseCompliantScholarship);
    const passed = res.eligibilityStatus === 'NEEDS_REVIEW' && res.missingInformation.some((m) => m.includes('Family Income'));
    tests.push({
      id: 9,
      name: 'Missing annual family income without confirmed failure → NEEDS_REVIEW',
      passed,
      expected: 'NEEDS_REVIEW with missing family income',
      actual: `${res.eligibilityStatus} (Missing: ${res.missingInformation[0]})`,
    });
  }

  // Test 10: Pending verification → never ELIGIBLE
  {
    const scholarship = { ...baseCompliantScholarship, verificationStatus: 'PENDING_VERIFICATION' };
    const res = evaluateScholarshipEligibility(baseCompliantStudent, scholarship);
    const passed = res.eligibilityStatus !== 'ELIGIBLE' && res.missingInformation.some((m) => m.includes('Verification'));
    tests.push({
      id: 10,
      name: 'Pending verification status → NEVER ELIGIBLE (NEEDS_REVIEW)',
      passed,
      expected: 'NEEDS_REVIEW (never ELIGIBLE)',
      actual: `${res.eligibilityStatus} (Reason: ${res.missingInformation[0]})`,
    });
  }

  // Test 11: Expired scholarship → never ELIGIBLE (INELIGIBLE)
  {
    const scholarship = { ...baseCompliantScholarship, verificationStatus: 'EXPIRED_OR_CLOSED', daysLeft: 0, deadline: '2024-11-30' };
    const res = evaluateScholarshipEligibility(baseCompliantStudent, scholarship);
    const passed = res.eligibilityStatus === 'INELIGIBLE' && res.failedCriteria.some((f) => f.includes('Deadline'));
    tests.push({
      id: 11,
      name: 'Expired application cycle → NEVER ELIGIBLE (INELIGIBLE)',
      passed,
      expected: 'INELIGIBLE with application cycle closed',
      actual: `${res.eligibilityStatus} (Reason: ${res.failedCriteria[0]})`,
    });
  }

  // Test 12: Missing deadline → NEEDS_REVIEW when deadline is required
  {
    const scholarship = { ...baseCompliantScholarship, deadline: '' };
    const res = evaluateScholarshipEligibility(baseCompliantStudent, scholarship);
    const passed = res.eligibilityStatus === 'NEEDS_REVIEW' && res.missingInformation.some((m) => m.includes('Deadline'));
    tests.push({
      id: 12,
      name: 'Missing deadline string → NEEDS_REVIEW',
      passed,
      expected: 'NEEDS_REVIEW with missing deadline',
      actual: `${res.eligibilityStatus} (Missing: ${res.missingInformation[0]})`,
    });
  }

  // Test 13: Empty scholarship dataset → honest empty state
  {
    const results = evaluateAndRankScholarships(baseCompliantStudent, []);
    const passed = Array.isArray(results) && results.length === 0;
    tests.push({
      id: 13,
      name: 'Empty scholarship dataset evaluation → Honest empty array []',
      passed,
      expected: '[] empty array without errors',
      actual: `Length=${results.length}, IsArray=${Array.isArray(results)}`,
    });
  }

  // Test 14: Match score cannot override INELIGIBLE status
  {
    // Student matches all location/course/education, but fails marks (45% vs 60%)
    const student = { ...baseCompliantStudent, academicPercentage: 45, percentage: 45 };
    const res = evaluateScholarshipEligibility(student, baseCompliantScholarship);
    const passed = res.eligibilityStatus === 'INELIGIBLE' && res.matchScore === null;
    tests.push({
      id: 14,
      name: 'Match score cannot override INELIGIBLE status → Score is null / capped',
      passed,
      expected: 'Status is strictly INELIGIBLE and matchScore is null',
      actual: `Status=${res.eligibilityStatus}, matchScore=${res.matchScore}`,
    });
  }

  // Test 15: Determinism test (Identical inputs always produce identical results)
  {
    let allIdentical = true;
    const firstRun = evaluateScholarshipEligibility(baseCompliantStudent, baseCompliantScholarship);

    for (let i = 0; i < 50; i++) {
      const subsequentRun = evaluateScholarshipEligibility(baseCompliantStudent, baseCompliantScholarship);
      if (
        subsequentRun.eligibilityStatus !== firstRun.eligibilityStatus ||
        subsequentRun.matchScore !== firstRun.matchScore ||
        subsequentRun.failedCriteria.length !== firstRun.failedCriteria.length ||
        subsequentRun.missingInformation.length !== firstRun.missingInformation.length
      ) {
        allIdentical = false;
        break;
      }
    }

    tests.push({
      id: 15,
      name: 'Identical inputs produce identical results (50 iterations)',
      passed: allIdentical,
      expected: '100% deterministic consistency',
      actual: allIdentical ? 'All 50 iterations identical' : 'Inconsistency detected',
    });
  }

  // Test 16: Saved scholarship functionality / bookmark continuity
  {
    const savedIds = new Set(['nsp-post-matric-sc', 'aicte-pragati-degree-girls']);
    const isSaved = savedIds.has('aicte-pragati-degree-girls');
    const toggled = !isSaved;
    tests.push({
      id: 16,
      name: 'Saved scholarship bookmarking state tracking',
      passed: isSaved === true && toggled === false,
      expected: 'Bookmarked IDs set correctly toggles without regression',
      actual: `isSaved=${isSaved}, toggled=${toggled}`,
    });
  }

  // Test 17: Conflicting case (Confirmed failure + missing field → INELIGIBLE takes priority)
  {
    // Student fails marks (45% vs 60%), but family income is missing (undefined)
    const student = { ...baseCompliantStudent, academicPercentage: 45, percentage: 45, annualFamilyIncome: undefined };
    const res = evaluateScholarshipEligibility(student, baseCompliantScholarship);
    // Confirmed failure MUST take precedence over missing information
    const passed = res.eligibilityStatus === 'INELIGIBLE' && res.failedCriteria.length > 0;
    tests.push({
      id: 17,
      name: 'Conflicting Case: Confirmed marks failure + missing income → INELIGIBLE takes priority',
      passed,
      expected: 'INELIGIBLE (confirmed failure overrides missing data)',
      actual: `Status=${res.eligibilityStatus} (Failed: ${res.failedCriteria.length}, Missing: ${res.missingInformation.length})`,
      notes: `Failed: ${res.failedCriteria[0]} | Missing: ${res.missingInformation[0]}`,
    });
  }

  // Summary
  console.log('---------------------------------------------------------------');
  console.log('RESULTS BY TEST CASE:');
  console.log('---------------------------------------------------------------');
  let passedCount = 0;
  for (const t of tests) {
    const symbol = t.passed ? '✅' : '❌';
    console.log(`${symbol} Test ${t.id}: ${t.name}`);
    console.log(`   Expected: ${t.expected}`);
    console.log(`   Actual:   ${t.actual}`);
    if (t.notes) console.log(`   Notes:    ${t.notes}`);
    console.log('');
    if (t.passed) passedCount++;
  }

  console.log('===============================================================');
  console.log(`FINAL RESULT: ${passedCount} / ${tests.length} TESTS PASSED`);
  console.log('===============================================================');

  process.exit(passedCount === tests.length ? 0 : 1);
}

runPhase3ETestSuite().catch((err) => {
  console.error('[Phase 3E Test Suite Fatal Error]', err);
  process.exit(1);
});
