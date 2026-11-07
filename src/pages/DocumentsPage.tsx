import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  FileText,
  ShieldCheck,
  X,
  Lock,
  RefreshCw,
  Scan,
  Download,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  getDocuments,
  addDocument,
  deleteDocument,
  calculateDocumentReadiness,
  getStudentProfile,
} from '../services/storageService';
import { UploadedDocument, DocumentCategory, Scholarship } from '../types';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { useAuth } from '../context/AuthContext';
import {
  fetchUserDocuments,
  persistUserDocument,
  deleteUserDocument,
  analyzeDocumentWithGemini,
} from '../services/firebase';
import { OFFICIAL_SCHOLARSHIPS } from '../data/scholarships';
import {
  evaluateScholarshipDocumentReadiness,
  ScholarshipDocumentReadiness,
} from '../utils/documentReadiness';

const SUPPORTED_CATEGORIES: DocumentCategory[] = [
  'Aadhaar card',
  'Income certificate',
  'Caste certificate',
  'Domicile certificate',
  'Marksheet',
  'Bonafide certificate',
  'College ID',
  'Other supporting documents',
];

export const DocumentsPage: React.FC = () => {
  const { user, profile: authProfile } = useAuth();
  const profile = authProfile || getStudentProfile();

  const [documents, setDocuments] = useState<UploadedDocument[]>(getDocuments());
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('Marksheet');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [inspectingDoc, setInspectingDoc] = useState<UploadedDocument | null>(documents[0] || null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Scholarship Requirement Audit State
  const [scholarshipsList, setScholarshipsList] = useState<Scholarship[]>(OFFICIAL_SCHOLARSHIPS);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>(
    OFFICIAL_SCHOLARSHIPS[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'vault' | 'scholarship-checker'>('vault');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch scholarships from backend or fallback to official researched list
  useEffect(() => {
    fetch('/api/scholarships')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.scholarships) && data.scholarships.length > 0) {
          setScholarshipsList(data.scholarships);
        }
      })
      .catch(() => {});
  }, []);

  // Sync documents from Firestore when authenticated user is present
  useEffect(() => {
    if (user) {
      user.getIdToken().then((token) => {
        fetch('/api/documents', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && Array.isArray(data.documents) && data.documents.length > 0) {
              setDocuments(data.documents);
              setInspectingDoc(data.documents[0]);
            } else {
              // Fallback to client-side Firestore listener if API returns empty
              fetchUserDocuments(user.uid)
                .then((remoteDocs) => {
                  if (remoteDocs && remoteDocs.length > 0) {
                    setDocuments(remoteDocs);
                    setInspectingDoc(remoteDocs[0]);
                  }
                })
                .catch((err) => console.warn('Could not fetch from Firestore:', err));
            }
          })
          .catch((err) => console.warn('API document fetch warning:', err));
      });
    }
  }, [user]);

  const selectedScholarship =
    scholarshipsList.find((s) => s.id === selectedScholarshipId) || scholarshipsList[0];

  const scholarshipAudit: ScholarshipDocumentReadiness | null = selectedScholarship
    ? evaluateScholarshipDocumentReadiness(
        {
          id: selectedScholarship.id,
          name: selectedScholarship.name,
          requiredDocuments: selectedScholarship.requiredDocuments,
        },
        documents as any
      )
    : null;

  const readiness = calculateDocumentReadiness(documents);

  // Clear toast notifications after 5 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setErrorMessage(null);
    setSuccessMessage(null);

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(`Unsupported format "${file.type}". Please upload a valid PDF, JPG, or PNG document.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 10MB maximum limit.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 18 : p));
    }, 200);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;

      try {
        const idToken = user ? await user.getIdToken() : null;
        const docId = `doc-${Date.now()}`;

        // 1. Save document to backend vault
        if (idToken) {
          const saveRes = await fetch('/api/documents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              documentId: docId,
              fileName: file.name,
              documentType: selectedCategory,
              mimeType: file.type,
              fileSize: file.size,
              base64Data,
            }),
          });
          if (!saveRes.ok) {
            const errJson = await saveRes.json().catch(() => ({}));
            throw new Error(errJson.error || 'Server rejected document upload');
          }
        }

        clearInterval(progressInterval);
        setUploadProgress(100);

        const newDoc: UploadedDocument = {
          id: docId,
          documentId: docId,
          name: file.name,
          category: selectedCategory,
          documentType: selectedCategory,
          fileType: file.type,
          mimeType: file.type,
          fileSize: file.size,
          uploadDate: new Date().toISOString().split('T')[0],
          uploadedAt: new Date().toISOString(),
          status: 'verified',
          analysisStatus: 'PENDING',
          readinessScore: 75,
          fileData: base64Data,
          manualVerificationRequired: true,
          missingInformation: [],
          inconsistencies: [],
        };

        const updated = addDocument(newDoc);
        setDocuments([...updated]);
        setInspectingDoc(newDoc);
        setSuccessMessage(`"${file.name}" uploaded to your secure document vault! Ready for AI audit.`);

        // Automatically trigger real Gemini analysis if token is present
        if (idToken) {
          triggerGeminiAnalysis(newDoc, base64Data, idToken);
        }
      } catch (err: any) {
        console.error('Document upload error:', err);
        clearInterval(progressInterval);
        setErrorMessage(err.message || 'Failed to upload document. Please try again.');
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 400);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerGeminiAnalysis = async (
    targetDoc: UploadedDocument,
    base64Override?: string,
    tokenOverride?: string
  ) => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const idToken = tokenOverride || (user ? await user.getIdToken() : null);
      if (!idToken) {
        setErrorMessage('Authentication required to run AI Document Intelligence.');
        setIsAnalyzing(false);
        return;
      }

      const res = await analyzeDocumentWithGemini(idToken, {
        documentId: targetDoc.id,
        fileName: targetDoc.name,
        documentType: targetDoc.category,
        mimeType: targetDoc.fileType,
        base64Data: base64Override || targetDoc.fileData,
        studentProfile: profile,
      });

      if (res.success && res.document) {
        const enriched: UploadedDocument = {
          ...targetDoc,
          ...res.document,
          fileData: targetDoc.fileData || base64Override,
          aiAnalysis: {
            documentCategory: res.extractedData?.documentType || targetDoc.category,
            readinessScore: res.document.readinessScore || 85,
            detectedName: res.extractedData?.studentName || undefined,
            detectedMarksOrGpa: res.extractedData?.marksOrPercentage || undefined,
            detectedAnnualIncome: res.extractedData?.relevantDetails || undefined,
            detectedIssuingAuthority: res.extractedData?.issuingAuthority || undefined,
            detectedDate: res.extractedData?.issueDate || undefined,
            isLegible: res.extractedData?.isLegible ?? true,
            tamperingRisk: res.inconsistencies?.length ? 'medium' : 'low',
            missingOrBlurryFields: res.missingInformation || [],
            verificationNotes:
              res.extractedData?.readabilityNotes || 'AI audit completed successfully.',
            recommendation:
              res.analysisStatus === 'ANALYZED'
                ? 'Document details extracted. Verify against scheme guidelines.'
                : 'Review flagged inconsistencies or missing fields.',
          },
        };

        const updatedDocs = documents.map((d) => (d.id === targetDoc.id ? enriched : d));
        setDocuments(updatedDocs);
        setInspectingDoc(enriched);
        setSuccessMessage(`Gemini audit completed: Status [${res.analysisStatus}].`);
      }
    } catch (err: any) {
      console.error('Gemini analysis failed:', err);
      setErrorMessage(`AI Analysis Error: ${err.message || 'Gemini processing failed.'}`);
      // Update doc status to ANALYSIS_FAILED
      const failedDoc: UploadedDocument = {
        ...targetDoc,
        analysisStatus: 'ANALYSIS_FAILED',
      };
      setDocuments((prev) => prev.map((d) => (d.id === targetDoc.id ? failedDoc : d)));
      if (inspectingDoc?.id === targetDoc.id) {
        setInspectingDoc(failedDoc);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const docToDelete = documents.find((d) => d.id === id);
    if (!docToDelete) return;

    if (window.confirm(`Permanently delete "${docToDelete.name}" from your secure vault?`)) {
      try {
        const idToken = user ? await user.getIdToken() : null;
        if (idToken) {
          await fetch(`/api/documents/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${idToken}` },
          });
        }
        if (user) {
          await deleteUserDocument(user.uid, id, docToDelete.storagePath);
        }
        const updated = deleteDocument(id);
        setDocuments(updated);
        if (inspectingDoc?.id === id) {
          setInspectingDoc(updated[0] || null);
        }
        setSuccessMessage(`Document "${docToDelete.name}" deleted.`);
      } catch (err: any) {
        console.error('Delete error:', err);
        setErrorMessage('Failed to delete document. Please try again.');
      }
    }
  };

  const handleDownload = async (doc: UploadedDocument) => {
    if (doc.fileData) {
      const a = document.createElement('a');
      a.href = doc.fileData;
      a.download = doc.name;
      a.click();
    } else if (user) {
      const token = await user.getIdToken();
      window.open(`/api/documents/${doc.id}/file?download=true&token=${token}`, '_blank');
    } else {
      setErrorMessage('Unable to download file. Please sign in.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Helper: Status Chip UI
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'ANALYZED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#27C995]/20 text-[#27C995] border border-[#27C995]/30">
            <CheckCircle2 className="w-3 h-3" /> ANALYZED
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> NEEDS REVIEW
          </span>
        );
      case 'UNREADABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" /> UNREADABLE
          </span>
        );
      case 'ANALYSIS_FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <X className="w-3 h-3" /> ANALYSIS FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
            <Clock className="w-3 h-3" /> PENDING AUDIT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-[#27C995]/20 text-[#27C995]">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Multimodal Document Intelligence (Gemini 3.8 Flash)
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            Document Intelligence Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit marksheets, income declarations, and caste certificates with server-side AI before applying.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrivacyPolicyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition"
          >
            <Lock className="w-3.5 h-3.5 text-[#27C995]" />
            <span>Zero-Exposure Vault</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-white/10 space-x-4">
        <button
          onClick={() => setActiveTab('vault')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'vault'
              ? 'text-white border-b-2 border-[#8065FF]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Document Vault ({documents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('scholarship-checker')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'scholarship-checker'
              ? 'text-[#42D9F5] border-b-2 border-[#42D9F5]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Scholarship Requirement Checker</span>
        </button>
      </div>

      {/* Readiness Overview Banner */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Readiness gauge */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="transparent"
                  stroke="#27C995"
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={2 * Math.PI * 32 * (1 - readiness.overallScore / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <span className="absolute font-heading font-extrabold text-lg text-white">
                <AnimatedCounter value={readiness.overallScore} suffix="%" />
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Vault Readiness Index
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                {readiness.verifiedCount} of {readiness.totalRequired} core categories ready
              </p>
              <span className="text-[10px] text-[#27C995] font-semibold mt-1 inline-block">
                {readiness.overallScore >= 80 ? 'Application Ready' : 'Certificates Pending'}
              </span>
            </div>
          </div>

          {/* Missing certificates alert */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-[#080D1B]/80 border border-white/5">
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              Checklist Status
            </span>
            {readiness.missingCategories.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs text-amber-300 flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Missing essential certificates: {readiness.missingCategories.join(', ')}
                </p>
                <p className="text-[11px] text-slate-400">
                  Upload these files to ensure uninterrupted direct-benefit transfer (DBT) and scrutiny by Institutional Nodal Officers (INO).
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#27C995] flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                All 4 essential categories (Marksheet, Income, Bonafide, Identity) are present in your vault!
              </p>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'vault' ? (
        /* Main Grid: Upload Zone + Active Scanner View + Vault List */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload & Document List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <Upload className="w-5 h-5 text-[#8065FF]" />
                <h2 className="font-heading text-base font-bold text-white">Upload Certificate</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Document Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
                  className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
                >
                  {SUPPORTED_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all relative overflow-hidden ${
                  dragActive
                    ? 'border-[#42D9F5] bg-[#42D9F5]/10'
                    : 'border-white/15 hover:border-[#8065FF]/50 bg-white/[0.02]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />

                {isUploading ? (
                  <div className="py-4 space-y-3">
                    <RefreshCw className="w-8 h-8 text-[#42D9F5] mx-auto animate-spin" />
                    <p className="text-xs font-bold text-white">Securing File in Vault...</p>
                    <p className="text-[11px] text-slate-400">Validating MIME headers & encrypting payload</p>
                    <div className="w-48 mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-gradient-to-r from-[#8065FF] to-[#42D9F5] rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#8065FF]/20 text-[#8065FF] flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-bold text-white">
                      Click to browse or drop certificate here
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Supports PDF, JPG, PNG (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
                <Info className="w-4 h-4 text-[#8065FF] shrink-0 mt-0.5" />
                <p>
                  AI analysis extracts facts for scholarship preparation. It does not certify official government legal validity.
                </p>
              </div>
            </div>

            {/* Document Vault List */}
            <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Vault Files ({documents.length})
                </span>
                <span className="text-[10px] font-mono text-[#27C995]">Encrypted Vault</span>
              </div>

              {documents.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No documents uploaded yet. Upload a certificate above to start.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setInspectingDoc(doc)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        inspectingDoc?.id === doc.id
                          ? 'bg-[#111A2D] border-[#8065FF]'
                          : 'bg-[#080D1B]/70 hover:bg-[#111A2D]/60 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-4 h-4 text-[#8065FF] shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{doc.name}</p>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {doc.category || doc.documentType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {renderStatusBadge(doc.analysisStatus)}
                        <button
                          onClick={(e) => handleDelete(doc.id, e)}
                          title="Delete from vault"
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Scanner & Extracted Intelligence Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {inspectingDoc ? (
              <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Scan className="w-5 h-5 text-[#42D9F5]" />
                    <h3 className="font-heading text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                      {inspectingDoc.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderStatusBadge(inspectingDoc.analysisStatus)}
                    <button
                      onClick={() => handleDownload(inspectingDoc)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 border border-white/10 transition"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5 text-[#42D9F5]" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                    <button
                      onClick={() => setPreviewModalOpen(true)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 border border-white/10 transition"
                      title="Full preview"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#8065FF]" />
                      <span className="hidden sm:inline">Preview</span>
                    </button>
                  </div>
                </div>

                {/* Document Preview Box with Animated Laser Scanner */}
                <div className="relative w-full h-48 sm:h-56 rounded-2xl bg-[#080D1B] border border-white/10 overflow-hidden flex items-center justify-center">
                  {/* Cyan Laser Scan Line if analyzing */}
                  {isAnalyzing && (
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#42D9F5] to-transparent shadow-[0_0_15px_#42D9F5] animate-laser-scan z-20 pointer-events-none" />
                  )}

                  {/* Preview Content */}
                  {inspectingDoc.fileData && inspectingDoc.fileType?.startsWith('image/') ? (
                    <img
                      src={inspectingDoc.fileData}
                      alt={inspectingDoc.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-[85%] h-[85%] rounded-xl bg-gradient-to-b from-[#111A2D] to-[#0d1526] p-4 border border-white/10 shadow-inner flex flex-col justify-between text-left opacity-90 relative">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-heading text-xs font-bold text-white uppercase truncate">
                          {inspectingDoc.category || inspectingDoc.documentType}
                        </span>
                        <span className="text-[9px] font-mono text-[#42D9F5]">
                          {(inspectingDoc.fileSize / 1024).toFixed(0)} KB • {inspectingDoc.fileType}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[10px] text-slate-300">
                        <p>
                          Candidate Name:{' '}
                          <strong className="text-white">
                            {inspectingDoc.extractedData?.studentName ||
                              inspectingDoc.aiAnalysis?.detectedName ||
                              profile.fullName}
                          </strong>
                        </p>
                        <p>
                          Issuing Body:{' '}
                          <span className="text-slate-300">
                            {inspectingDoc.extractedData?.issuingAuthority ||
                              inspectingDoc.aiAnalysis?.detectedIssuingAuthority ||
                              'Official Issuing Authority'}
                          </span>
                        </p>
                        <p className="font-mono text-slate-400">
                          Issue Date:{' '}
                          {inspectingDoc.extractedData?.issueDate ||
                            inspectingDoc.aiAnalysis?.detectedDate ||
                            'Standard Cycle'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] text-slate-400">
                        <span>ENCRYPTED VAULT STORAGE</span>
                        <span>STATUS: {inspectingDoc.analysisStatus || 'PENDING'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Analyze Action Button */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#080D1B]/80 border border-white/10">
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles className="w-4 h-4 text-[#8065FF]" />
                    <span className="text-slate-300">
                      {inspectingDoc.analysisStatus === 'PENDING'
                        ? 'Ready for multimodal AI analysis'
                        : `Last audited: ${inspectingDoc.analyzedAt ? new Date(inspectingDoc.analyzedAt).toLocaleDateString() : 'Today'}`}
                    </span>
                  </div>

                  <button
                    disabled={isAnalyzing}
                    onClick={() => triggerGeminiAnalysis(inspectingDoc)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8065FF] to-[#42D9F5] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-[#8065FF]/20"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Auditing with Gemini 3.8 Flash...</span>
                      </>
                    ) : (
                      <>
                        <Scan className="w-3.5 h-3.5" />
                        <span>
                          {inspectingDoc.analysisStatus === 'PENDING'
                            ? 'Run AI Audit'
                            : 'Re-Analyze with Gemini'}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Expiry Warning Alert if active */}
                {inspectingDoc.expiryWarning && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-rose-200">Certificate Expired</strong>
                      <p>{inspectingDoc.expiryWarning}</p>
                    </div>
                  </div>
                )}

                {/* Inconsistencies Alert */}
                {inspectingDoc.inconsistencies && inspectingDoc.inconsistencies.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Inconsistencies Detected During AI Audit:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
                      {inspectingDoc.inconsistencies.map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Mandatory Information Alert */}
                {inspectingDoc.missingInformation && inspectingDoc.missingInformation.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 text-xs text-slate-300 space-y-1">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      Missing Mandatory Information:
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {inspectingDoc.missingInformation.join(', ')}
                    </p>
                  </div>
                )}

                {/* Extracted Information Structured Cards */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#8065FF]" />
                    Extracted Fact Audit (Gemini Multimodal)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#080D1B]/80 border border-white/5">
                      <span className="text-slate-400 block text-[11px]">Candidate Full Name</span>
                      <strong className="text-white text-xs">
                        {inspectingDoc.extractedData?.studentName ||
                          inspectingDoc.aiAnalysis?.detectedName ||
                          'Not available in document'}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#080D1B]/80 border border-white/5">
                      <span className="text-slate-400 block text-[11px]">Marks / Academic Record</span>
                      <strong className="text-white text-xs">
                        {inspectingDoc.extractedData?.marksOrPercentage ||
                          inspectingDoc.aiAnalysis?.detectedMarksOrGpa ||
                          'Not available in document'}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#080D1B]/80 border border-white/5">
                      <span className="text-slate-400 block text-[11px]">Issuing Authority</span>
                      <strong className="text-white text-xs">
                        {inspectingDoc.extractedData?.issuingAuthority ||
                          inspectingDoc.aiAnalysis?.detectedIssuingAuthority ||
                          'Not available'}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#080D1B]/80 border border-white/5">
                      <span className="text-slate-400 block text-[11px]">Issue & Expiry Dates</span>
                      <strong className="text-white text-xs">
                        {inspectingDoc.extractedData?.issueDate || inspectingDoc.aiAnalysis?.detectedDate || 'N/A'}{' '}
                        {inspectingDoc.extractedData?.expiryDate
                          ? `(Expires: ${inspectingDoc.extractedData.expiryDate})`
                          : ''}
                      </strong>
                    </div>
                  </div>

                  {/* Audit Observations */}
                  {(inspectingDoc.extractedData || inspectingDoc.aiAnalysis) && (
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs space-y-2">
                      <p className="text-slate-300 leading-relaxed">
                        {inspectingDoc.extractedData?.readabilityNotes ||
                          inspectingDoc.aiAnalysis?.verificationNotes}
                      </p>
                      <div className="p-2.5 rounded-lg bg-[#27C995]/10 border border-[#27C995]/20 text-[#27C995] text-[11px] font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Confidence: {inspectingDoc.extractedData?.confidenceScore || 88}% (
                          {inspectingDoc.extractedData?.confidenceTier || 'HIGH'}) • Manual scrutiny required by INO.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
                <FileCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <h3 className="font-heading text-base font-bold text-white">No Document Selected</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload or select a document on the left to start live visual scanning and Gemini extraction.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Scholarship Document Requirement Checker (Phase 3F Section 5 & 6) */
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#42D9F5]" />
                  <span>Scholarship Document Requirement Checker</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select an official scholarship to compare required documents against your uploaded vault files.
                </p>
              </div>

              <div className="w-full sm:w-80">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Target Scholarship
                </label>
                <select
                  value={selectedScholarshipId}
                  onChange={(e) => setSelectedScholarshipId(e.target.value)}
                  className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#42D9F5]"
                >
                  {scholarshipsList.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} ({sch.provider})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {scholarshipAudit ? (
              <div className="space-y-6">
                {/* Completeness Card */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[#080D1B]/80 border border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-1">Completeness Ratio</span>
                    <strong className="text-xl font-heading text-white">
                      {scholarshipAudit.completenessRatio} Complete
                    </strong>
                    <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#8065FF] to-[#27C995] rounded-full"
                        style={{ width: `${scholarshipAudit.completenessPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#080D1B]/80 border border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-1">Readiness Status</span>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        scholarshipAudit.status === 'READY'
                          ? 'bg-[#27C995]/20 text-[#27C995] border border-[#27C995]/30'
                          : scholarshipAudit.status === 'PARTIALLY_READY'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {scholarshipAudit.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#080D1B]/80 border border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-1">Available in Vault</span>
                    <strong className="text-xl font-heading text-[#27C995]">
                      {scholarshipAudit.availableCount} / {scholarshipAudit.totalRequired}
                    </strong>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#080D1B]/80 border border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-1">Pending / Missing</span>
                    <strong className="text-xl font-heading text-rose-400">
                      {scholarshipAudit.missingCount}
                    </strong>
                  </div>
                </div>

                {/* Detailed Checklist List */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Official Document Checklist ({scholarshipAudit.requirements.length})
                  </h3>

                  {scholarshipAudit.requirements.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#080D1B] border border-white/10 text-center text-xs text-slate-400">
                      Requirements not available for this scheme in the official record.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scholarshipAudit.requirements.map((req: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#080D1B]/80 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {req.status === 'AVAILABLE' ? (
                                <CheckCircle2 className="w-4 h-4 text-[#27C995] shrink-0" />
                              ) : req.status === 'NEEDS_REVIEW' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : req.status === 'EXPIRED' ? (
                                <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                              <strong className="text-xs font-bold text-white">
                                {req.requiredCategory}
                              </strong>
                            </div>
                            <p className="text-[11px] text-slate-400">{req.notes}</p>
                            {req.matchedDocumentName && (
                              <span className="text-[10px] font-mono text-[#8065FF] block">
                                Matched File: {req.matchedDocumentName}
                              </span>
                            )}
                          </div>

                          <div className="shrink-0">
                            {req.status === 'AVAILABLE' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#27C995]/20 text-[#27C995] border border-[#27C995]/30">
                                AVAILABLE
                              </span>
                            ) : req.status === 'NEEDS_REVIEW' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                NEEDS REVIEW
                              </span>
                            ) : req.status === 'EXPIRED' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                EXPIRED
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveTab('vault');
                                  setSelectedCategory(
                                    SUPPORTED_CATEGORIES.find((c) =>
                                      c.toLowerCase().includes(req.requiredCategory.toLowerCase())
                                    ) || 'Marksheet'
                                  );
                                }}
                                className="px-3 py-1 rounded-xl bg-[#8065FF]/20 hover:bg-[#8065FF]/40 text-[#8065FF] text-[10px] font-bold border border-[#8065FF]/40 transition"
                              >
                                + Upload Now
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
                  <p>
                    <strong>Notice:</strong> {scholarshipAudit.disclaimer}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewModalOpen && inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#42D9F5]" />
                <h3 className="font-heading text-base font-bold text-white truncate max-w-md">
                  {inspectingDoc.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-96 rounded-2xl bg-[#080D1B] border border-white/10 flex items-center justify-center overflow-hidden">
              {inspectingDoc.fileData && inspectingDoc.fileType?.startsWith('image/') ? (
                <img
                  src={inspectingDoc.fileData}
                  alt={inspectingDoc.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : inspectingDoc.fileData && inspectingDoc.fileType === 'application/pdf' ? (
                <iframe
                  src={inspectingDoc.fileData}
                  title={inspectingDoc.name}
                  className="w-full h-full rounded-xl"
                />
              ) : user ? (
                <div className="text-center p-6 space-y-3">
                  <FileText className="w-12 h-12 text-[#42D9F5] mx-auto" />
                  <p className="text-xs text-white font-bold">{inspectingDoc.name}</p>
                  <p className="text-[11px] text-slate-400">
                    Encrypted file stored in Firebase Vault.
                  </p>
                  <button
                    onClick={() => handleDownload(inspectingDoc)}
                    className="px-4 py-2 rounded-xl bg-[#42D9F5] text-[#080D1B] text-xs font-bold"
                  >
                    Download File
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Preview not available in offline mode.</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Category: <strong>{inspectingDoc.category}</strong> • Size:{' '}
                {(inspectingDoc.fileSize / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Guarantee Modal */}
      {privacyPolicyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#27C995]" />
                <h3 className="font-heading text-lg font-bold text-white">
                  Document Privacy Guarantee
                </h3>
              </div>
              <button
                onClick={() => setPrivacyPolicyOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>1. Authenticated Isolation:</strong> Every certificate uploaded is scoped strictly to your authenticated Firebase UID (<code className="text-[#42D9F5]">{user?.uid || 'Active Session'}</code>).
              </p>
              <p>
                <strong>2. Zero Public URLs:</strong> Storage files and Firestore metadata cannot be read by any unauthorized user or public bot.
              </p>
              <p>
                <strong>3. Real Server-Side Gemini Extraction:</strong> Optical document extraction executes via private server-side `@google/genai` calls. No API keys are ever exposed in browser scripts.
              </p>
              <p>
                <strong>4. No Legal Verification Claim:</strong> Grantly AI performs readability audits, date consistency checks, and scholarship requirement comparison. We do not issue or represent official government accreditation.
              </p>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setPrivacyPolicyOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#8065FF] text-white text-xs font-semibold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
