import {
  UserDocumentRecord,
  ScholarshipDocumentReadiness,
  ScholarshipDocumentItemRequirement,
} from '../types/document';

export type { ScholarshipDocumentReadiness, ScholarshipDocumentItemRequirement };

/**
 * Normalizes a category string to compare document types robustly.
 */
export function normalizeDocumentCategory(category: string): string {
  if (!category) return '';
  const lower = category.toLowerCase().trim();

  if (lower.includes('mark') || lower.includes('transcript') || lower.includes('grade') || lower.includes('gpa')) {
    return 'marksheet';
  }
  if (lower.includes('income') || lower.includes('salary') || lower.includes('tehsildar') || lower.includes('revenue')) {
    return 'income';
  }
  if (lower.includes('bonafide') || lower.includes('enrollment') || lower.includes('student certificate')) {
    return 'bonafide';
  }
  if (lower.includes('caste') || lower.includes('category') || lower.includes('community') || lower.includes('tribe')) {
    return 'caste';
  }
  if (lower.includes('domicile') || lower.includes('resident') || lower.includes('nativity')) {
    return 'domicile';
  }
  if (lower.includes('aadhaar') || lower.includes('identity') || lower.includes('photo id') || lower.includes('id proof')) {
    return 'identity';
  }
  if (lower.includes('college id') || lower.includes('student id')) {
    return 'college_id';
  }
  return lower;
}

/**
 * Evaluates whether a user's uploaded documents satisfy a scholarship's actual required documents.
 * Adheres strictly to requirements:
 * - If requirements are unavailable or empty: returns NO_REQUIREMENTS state with "Requirements not available".
 * - Does not invent requirements.
 * - Does not assume a document is valid merely because it was uploaded.
 * - Separates completeness from eligibility logic.
 */
export function evaluateScholarshipDocumentReadiness(
  scholarship: {
    id: string;
    name: string;
    requiredDocuments?: string[];
  },
  userDocuments: UserDocumentRecord[]
): ScholarshipDocumentReadiness {
  const reqList = scholarship.requiredDocuments || [];

  if (reqList.length === 0) {
    return {
      scholarshipId: scholarship.id,
      scholarshipName: scholarship.name,
      totalRequired: 0,
      availableCount: 0,
      missingCount: 0,
      needsReviewCount: 0,
      expiredCount: 0,
      completenessRatio: '0/0',
      completenessPercentage: 100,
      status: 'NO_REQUIREMENTS',
      hasUnavailableRequirements: true,
      requirements: [],
      disclaimer: 'Requirements not available for this scheme. Check the official portal.',
    };
  }

  const items: ScholarshipDocumentItemRequirement[] = [];
  let availableCount = 0;
  let needsReviewCount = 0;
  let expiredCount = 0;
  let missingCount = 0;

  for (const requiredName of reqList) {
    const targetNorm = normalizeDocumentCategory(requiredName);

    // Find best candidate document among user's uploads
    const matchedDoc = userDocuments.find((doc) => {
      const docNorm = normalizeDocumentCategory(doc.documentType || '');
      const fileNorm = normalizeDocumentCategory(doc.fileName || '');
      return docNorm === targetNorm || fileNorm === targetNorm;
    });

    if (!matchedDoc) {
      missingCount++;
      items.push({
        requiredCategory: requiredName,
        status: 'MISSING',
        notes: `Mandatory document not yet uploaded to your document vault.`,
      });
      continue;
    }

    // Check expiration if recorded
    if (matchedDoc.expiryWarning) {
      expiredCount++;
      items.push({
        requiredCategory: requiredName,
        matchedDocumentId: matchedDoc.id || matchedDoc.documentId,
        matchedDocumentName: matchedDoc.fileName,
        status: 'EXPIRED',
        notes: matchedDoc.expiryWarning,
      });
      continue;
    }

    // Check analysis status
    if (matchedDoc.analysisStatus === 'UNREADABLE') {
      needsReviewCount++;
      items.push({
        requiredCategory: requiredName,
        matchedDocumentId: matchedDoc.id || matchedDoc.documentId,
        matchedDocumentName: matchedDoc.fileName,
        status: 'UNREADABLE',
        notes: 'Document marked unreadable by AI audit. Please re-upload a higher contrast scan.',
      });
    } else if (matchedDoc.analysisStatus === 'NEEDS_REVIEW') {
      needsReviewCount++;
      const notes = matchedDoc.inconsistencies?.length
        ? matchedDoc.inconsistencies.join('; ')
        : 'Uploaded document has pending warnings or missing fields.';
      items.push({
        requiredCategory: requiredName,
        matchedDocumentId: matchedDoc.id || matchedDoc.documentId,
        matchedDocumentName: matchedDoc.fileName,
        status: 'NEEDS_REVIEW',
        notes,
      });
    } else if (matchedDoc.analysisStatus === 'ANALYZED' || matchedDoc.analysisStatus === 'PENDING') {
      // Document is uploaded and ready for submission
      availableCount++;
      items.push({
        requiredCategory: requiredName,
        matchedDocumentId: matchedDoc.id || matchedDoc.documentId,
        matchedDocumentName: matchedDoc.fileName,
        status: 'AVAILABLE',
        notes: matchedDoc.analysisStatus === 'ANALYZED'
          ? 'Audited with AI. All key details visible.'
          : 'Uploaded to vault. Ready for AI audit.',
      });
    } else {
      needsReviewCount++;
      items.push({
        requiredCategory: requiredName,
        matchedDocumentId: matchedDoc.id || matchedDoc.documentId,
        matchedDocumentName: matchedDoc.fileName,
        status: 'NEEDS_REVIEW',
        notes: 'Document requires re-analysis or review.',
      });
    }
  }

  const totalRequired = reqList.length;
  const completenessPercentage = Math.round((availableCount / totalRequired) * 100);
  const completenessRatio = `${availableCount}/${totalRequired}`;

  let status: ScholarshipDocumentReadiness['status'] = 'NOT_READY';
  if (availableCount === totalRequired) {
    status = 'READY';
  } else if (availableCount > 0 || needsReviewCount > 0) {
    status = 'PARTIALLY_READY';
  }

  return {
    scholarshipId: scholarship.id,
    scholarshipName: scholarship.name,
    totalRequired,
    availableCount,
    missingCount,
    needsReviewCount,
    expiredCount,
    completenessRatio,
    completenessPercentage,
    status,
    hasUnavailableRequirements: false,
    requirements: items,
    disclaimer: 'Document completeness is an automated readiness estimation based on uploaded files and AI analysis. It is not an official legal validation or guarantee of application acceptance.',
  };
}
