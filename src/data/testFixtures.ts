import { Scholarship } from '../types';

/**
 * TEST FIXTURES ONLY — ISOLATED FROM PRODUCTION FEEDS
 * These simulated fixtures are reserved exclusively for offline synthetic unit testing.
 * NEVER display these in production student scholarship feeds.
 */
export const TEST_FIXTURE_SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'test-fixture-01',
    name: '[TEST FIXTURE] Mock STEM Award',
    provider: 'Synthetic Evaluation Test Provider',
    providerType: 'Non-Profit / NGO',
    description: 'Internal testing fixture for matching algorithm boundary condition verification.',
    educationLevels: ['Undergraduate'],
    eligibleCourses: ['Engineering'],
    eligibleStates: ['All India'],
    minMarks: 75,
    maxIncome: 500000,
    categories: ['All'],
    genderCriteria: 'All',
    awardAmount: 50000,
    awardFrequency: 'Annual',
    requiredDocuments: ['Marksheet', 'Income Certificate'],
    deadline: '2026-12-31',
    daysLeft: 45,
    officialSourceUrl: 'https://example.org/test-fixture',
    verificationStatus: 'Provisional Review',
    applicationSteps: ['Synthetic test step.'],
    disclaimer: 'Offline synthetic unit test fixture only.',
    isDemoData: true,
    tags: ['TestFixture'],
    trustRating: 1,
  },
];
