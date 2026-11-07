import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  X,
  RotateCcw,
  ShieldCheck,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Layers,
  Clock,
  Archive,
  RefreshCw,
} from 'lucide-react';
import {
  getStudentProfile,
  getSavedScholarshipIds,
  toggleSaveScholarship,
} from '../services/storageService';
import { rankScholarshipsForStudent } from '../utils/matchingEngine';
import { TrustGuardModal } from '../components/TrustGuardModal';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { Scholarship, VerificationStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  fetchScholarships,
  createScholarshipRecord,
  updateScholarshipRecord,
  saveScholarshipForUser,
  removeSavedScholarshipForUser,
  readSavedScholarshipsForUser,
} from '../services/firestoreService';
import {
  ScholarshipDocument,
  scholarshipDocumentToModel,
  validateScholarshipDocument,
} from '../types/firestore';
import { OFFICIAL_SCHOLARSHIPS } from '../data/scholarships';

export const ScholarshipsPage: React.FC = () => {
  const { user, profile: authProfile } = useAuth();
  const profile = authProfile || getStudentProfile();
  const isAdmin = user?.email?.toLowerCase() === 'jiya72637@gmail.com';

  const [savedSet, setSavedSet] = useState<Set<string>>(new Set(getSavedScholarshipIds()));
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Filters state
  const [verificationFilterTab, setVerificationFilterTab] = useState<'ALL' | 'VERIFIED' | 'PENDING_VERIFICATION' | 'EXPIRED_OR_CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedFitStatus, setSelectedFitStatus] = useState<string>('All');
  const [maxIncomeFilter, setMaxIncomeFilter] = useState<number>(1000000);
  const [minAwardFilter, setMinAwardFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'award_high' | 'award_low' | 'deadline'>('relevance');

  // Modals state
  const [inspectingTrustGuard, setInspectingTrustGuard] = useState<Scholarship | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminToast, setAdminToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Admin New Scholarship Form State
  const [newScheme, setNewScheme] = useState<Partial<ScholarshipDocument>>({
    id: '',
    name: '',
    provider: '',
    description: '',
    awardAmount: 50000,
    currency: 'INR',
    educationLevel: 'Undergraduate',
    eligibleCourses: ['Engineering', 'All'],
    eligibleStates: ['All India'],
    minimumMarks: 60,
    maximumFamilyIncome: 250000,
    requiredDocuments: ['Marksheet', 'Income Certificate', 'Bonafide Certificate', 'Aadhaar Card'],
    deadline: '2026-12-31',
    officialSourceUrl: 'https://scholarships.gov.in/',
    verificationStatus: 'VERIFIED',
    academicYear: '2025-26',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load scholarships directly from Firestore collection
  const loadScholarshipsFromFirestore = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const docs = await fetchScholarships();
      if (docs && docs.length > 0) {
        const models = docs.map(scholarshipDocumentToModel);
        setScholarships(models);
      } else {
        // If Firestore collection is empty, handle empty state gracefully without crash
        setScholarships([]);
      }
    } catch (err: any) {
      console.warn('[Firestore Fetch Warning]', err);
      setDbError('Notice: Could not sync live scholarship catalog from cloud database. Please verify connection.');
      // Empty state resilience
      setScholarships([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScholarshipsFromFirestore();
  }, []);

  // Sync user bookmarks from Firestore
  useEffect(() => {
    if (user) {
      readSavedScholarshipsForUser(user.uid)
        .then((remoteIds) => {
          if (remoteIds) {
            setSavedSet(new Set(remoteIds));
          }
        })
        .catch(console.warn);
    }
  }, [user]);

  // Run matching engine
  const allMatches = useMemo(() => {
    return rankScholarshipsForStudent(profile, scholarships);
  }, [profile, scholarships]);

  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaveScholarship(id);
    const next = new Set(savedSet);
    const willSave = !next.has(id);
    if (willSave) next.add(id);
    else next.delete(id);
    setSavedSet(next);

    if (user) {
      if (willSave) {
        saveScholarshipForUser(user.uid, id).catch(console.warn);
      } else {
        removeSavedScholarshipForUser(user.uid, id).catch(console.warn);
      }
    }
  };

  // Filtered and sorted matches
  const filteredMatches = useMemo(() => {
    return allMatches.filter((m) => {
      const s = m.scholarship;

      // Verification Tab Filter
      if (verificationFilterTab !== 'ALL' && s.verificationStatus !== verificationFilterTab) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesProvider = s.provider.toLowerCase().includes(q);
        const matchesCourse = s.eligibleCourses.some((c) => c.toLowerCase().includes(q));
        const matchesTag = s.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesProvider && !matchesCourse && !matchesTag) {
          return false;
        }
      }

      // Education Level
      if (selectedLevel !== 'All') {
        if (!s.educationLevels.includes('All') && !s.educationLevels.includes(selectedLevel)) {
          return false;
        }
      }

      // State Domicile
      if (selectedState !== 'All') {
        const isAllIndia = s.eligibleStates.includes('All India') || s.eligibleStates.includes('All');
        if (!isAllIndia && !s.eligibleStates.includes(selectedState)) {
          return false;
        }
      }

      // Fit Status
      if (selectedFitStatus === 'Eligible' && m.status !== 'Eligible') return false;
      if (selectedFitStatus === 'Borderline' && m.status !== 'Borderline') return false;
      if (selectedFitStatus === 'Saved' && !savedSet.has(s.id)) return false;

      // Income limit
      if (s.maxIncome > 0 && s.maxIncome > maxIncomeFilter) return false;

      // Award limit
      if (s.awardAmount < minAwardFilter) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'award_high') {
        return b.scholarship.awardAmount - a.scholarship.awardAmount;
      }
      if (sortBy === 'award_low') {
        return a.scholarship.awardAmount - b.scholarship.awardAmount;
      }
      if (sortBy === 'deadline') {
        return a.scholarship.daysLeft - b.scholarship.daysLeft;
      }
      // Relevance (default)
      if (a.status === 'Eligible' && b.status !== 'Eligible') return -1;
      if (b.status === 'Eligible' && a.status !== 'Eligible') return 1;
      return b.score - a.score;
    });
  }, [
    allMatches,
    verificationFilterTab,
    searchQuery,
    selectedLevel,
    selectedState,
    selectedFitStatus,
    maxIncomeFilter,
    minAwardFilter,
    sortBy,
    savedSet,
  ]);

  const resetFilters = () => {
    setVerificationFilterTab('ALL');
    setSearchQuery('');
    setSelectedLevel('All');
    setSelectedState('All');
    setSelectedFitStatus('All');
    setMaxIncomeFilter(1000000);
    setMinAwardFilter(0);
    setSortBy('relevance');
  };

  // Admin Ingestion Handler with Duplicate Prevention
  const handleAdminIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate using validateScholarshipDocument
    const validation = validateScholarshipDocument(newScheme);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    const schemeId = (newScheme.id || '').trim() || `sch-${Date.now()}`;
    const schemeName = (newScheme.name || '').trim();
    const schemeProvider = (newScheme.provider || '').trim();

    // Duplicate Check: Look for matching ID or (name + provider)
    const duplicate = scholarships.find(
      (s) =>
        s.id.toLowerCase() === schemeId.toLowerCase() ||
        (s.name.trim().toLowerCase() === schemeName.toLowerCase() &&
          s.provider.trim().toLowerCase() === schemeProvider.toLowerCase())
    );

    if (duplicate) {
      setFormErrors({
        name: `Duplicate scheme rejected: "${schemeName}" by "${schemeProvider}" is already registered in the official catalog.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const docToSave: ScholarshipDocument = {
        id: schemeId,
        name: schemeName,
        provider: schemeProvider,
        description: newScheme.description || 'Government scholarship scheme with official verification portal link.',
        awardAmount: Number(newScheme.awardAmount) || 0,
        currency: 'INR',
        educationLevel: newScheme.educationLevel || ['Undergraduate'],
        eligibleCourses: newScheme.eligibleCourses || ['All'],
        eligibleStates: newScheme.eligibleStates || ['All India'],
        minimumMarks: Number(newScheme.minimumMarks) || 50,
        maximumFamilyIncome: Number(newScheme.maximumFamilyIncome) || 250000,
        requiredDocuments: newScheme.requiredDocuments || ['Marksheet', 'Income Certificate'],
        deadline: newScheme.deadline || '2026-12-31',
        officialSourceUrl: (newScheme.officialSourceUrl || '').trim(),
        verificationStatus: newScheme.verificationStatus || 'VERIFIED',
        academicYear: newScheme.academicYear || '2025-26',
        lastCheckedAt: new Date().toISOString().split('T')[0],
      };

      await createScholarshipRecord(docToSave);

      setAdminToast({
        type: 'success',
        message: `Scheme "${schemeName}" successfully ingested into official Firestore catalog.`,
      });
      setAdminModalOpen(false);
      await loadScholarshipsFromFirestore();
    } catch (err: any) {
      console.error('[Admin Ingest Error]', err);
      setFormErrors({ general: err.message || 'Failed to ingest scholarship.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Quick Status Toggle
  const handleAdminUpdateStatus = async (scholarshipId: string, nextStatus: VerificationStatus) => {
    try {
      await updateScholarshipRecord(scholarshipId, { verificationStatus: nextStatus });
      setAdminToast({
        type: 'success',
        message: `Status updated to ${nextStatus} for ${scholarshipId}.`,
      });
      await loadScholarshipsFromFirestore();
    } catch (err: any) {
      setAdminToast({
        type: 'error',
        message: `Failed to update status: ${err.message}`,
      });
    }
  };

  // Counts for verification categories
  const verifiedCount = scholarships.filter((s) => s.verificationStatus === 'VERIFIED').length;
  const pendingCount = scholarships.filter((s) => s.verificationStatus === 'PENDING_VERIFICATION').length;
  const expiredCount = scholarships.filter((s) => s.verificationStatus === 'EXPIRED_OR_CLOSED').length;

  return (
    <div className="space-y-6 pb-20">
      {/* Admin Action Notification Toast */}
      {adminToast && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in ${
            adminToast.type === 'success'
              ? 'bg-emerald-500/15 text-[#27C995] border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {adminToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{adminToast.message}</span>
          </div>
          <button onClick={() => setAdminToast(null)} className="text-[11px] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Database Error Banner */}
      {dbError && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dbError}</span>
          </div>
          <button
            onClick={loadScholarshipsFromFirestore}
            className="text-[11px] underline flex items-center gap-1 font-semibold hover:text-white"
          >
            <RefreshCw className="w-3 h-3" /> Retry Sync
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-[#8065FF]/20 text-[#8065FF]">
              <ShieldCheck className="w-4 h-4 text-[#27C995]" />
            </span>
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Phase 3D • Official Indian Scholarship Verification
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            Official Indian Scholarships Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sourced strictly from the <strong>National Scholarship Portal (scholarships.gov.in)</strong>,{' '}
            <strong>Jharkhand e-Kalyan (ekalyan.cgg.gov.in)</strong>, and <strong>AICTE (aicte-india.org)</strong>.
          </p>
        </div>

        {/* Action Controls & Admin Ingestion Trigger */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {isAdmin && (
            <button
              onClick={() => setAdminModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8065FF] to-[#6c48ff] text-xs font-bold text-white shadow-md shadow-[#8065FF]/25 hover:brightness-110 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Ingest Official Scheme</span>
            </button>
          )}

          <button
            onClick={loadScholarshipsFromFirestore}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Official Government Portal Source Banner */}
      <div className="p-3.5 rounded-2xl bg-[#080D1B] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Authentic Portals:</span>
          <a
            href="https://scholarships.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
          >
            <span>National Scholarship Portal (NSP)</span>
            <ExternalLink className="w-3 h-3 text-[#42D9F5]" />
          </a>
          <a
            href="https://ekalyan.cgg.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
          >
            <span>Jharkhand e-Kalyan</span>
            <ExternalLink className="w-3 h-3 text-[#27C995]" />
          </a>
          <a
            href="https://www.aicte-india.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
          >
            <span>AICTE Portals</span>
            <ExternalLink className="w-3 h-3 text-violet-400" />
          </a>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Catalog Total: <strong className="text-white">{scholarships.length}</strong></span>
        </div>
      </div>

      {/* 4 Verification Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setVerificationFilterTab('ALL')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            verificationFilterTab === 'ALL'
              ? 'bg-[#8065FF] text-white shadow-md shadow-[#8065FF]/20'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Schemes ({scholarships.length})</span>
        </button>

        <button
          onClick={() => setVerificationFilterTab('VERIFIED')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            verificationFilterTab === 'VERIFIED'
              ? 'bg-[#27C995] text-slate-950 font-bold shadow-md shadow-[#27C995]/20'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Official Verified ({verifiedCount})</span>
        </button>

        <button
          onClick={() => setVerificationFilterTab('PENDING_VERIFICATION')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            verificationFilterTab === 'PENDING_VERIFICATION'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Circular Verification ({pendingCount})</span>
        </button>

        <button
          onClick={() => setVerificationFilterTab('EXPIRED_OR_CLOSED')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            verificationFilterTab === 'EXPIRED_OR_CLOSED'
              ? 'bg-slate-700 text-white font-bold'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Closed / Concluded Cycles ({expiredCount})</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-white/10 shadow-xl space-y-4">
        {/* Search & Sort row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scheme name, ministry, engineering course, or keyword..."
              className="w-full bg-[#080D1B] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="sm:col-span-4 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#8065FF]"
            >
              <option value="relevance">Sort by: DNA Match Relevance</option>
              <option value="award_high">Sort by: Highest Award (₹)</option>
              <option value="award_low">Sort by: Lowest Award (₹)</option>
              <option value="deadline">Sort by: Closing Soonest</option>
            </select>
          </div>
        </div>

        {/* Filter Pills row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
          {/* Education Level */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Education Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#8065FF]"
            >
              <option value="All">All Education Levels</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
              <option value="Class 12 / Higher Secondary">Class 12 / Higher Sec</option>
              <option value="Diploma / Polytechnic">Diploma / Polytechnic</option>
              <option value="Doctoral / PhD">Doctoral / PhD</option>
            </select>
          </div>

          {/* State Domicile */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              State Quota
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#8065FF]"
            >
              <option value="All">All Regions / Pan-India</option>
              <option value="Jharkhand">Jharkhand (Home State)</option>
              <option value="Bihar">Bihar</option>
              <option value="Delhi">Delhi</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>

          {/* Eligibility Fit Status */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Student Fit Status
            </label>
            <select
              value={selectedFitStatus}
              onChange={(e) => setSelectedFitStatus(e.target.value)}
              className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#8065FF]"
            >
              <option value="All">All Results</option>
              <option value="Eligible">Eligible Only (≥75%)</option>
              <option value="Borderline">Borderline Fit (50-74%)</option>
              <option value="Saved">Saved in Tracker ({savedSet.size})</option>
            </select>
          </div>

          {/* Min Award */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Min Award Amount
            </label>
            <select
              value={minAwardFilter}
              onChange={(e) => setMinAwardFilter(parseInt(e.target.value, 10))}
              className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#8065FF]"
            >
              <option value={0}>Any Amount</option>
              <option value={30000}>₹30,000+ per year</option>
              <option value={50000}>₹50,000+ per year</option>
              <option value={60000}>₹60,000+ per year</option>
            </select>
          </div>
        </div>

        {/* Active Filter Clear button */}
        {(searchQuery ||
          selectedLevel !== 'All' ||
          selectedState !== 'All' ||
          selectedFitStatus !== 'All' ||
          minAwardFilter > 0 ||
          verificationFilterTab !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
            <span className="text-slate-400">Custom filters applied</span>
            <button
              onClick={resetFilters}
              className="text-[#8065FF] hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-3xl p-6 border border-white/10 animate-pulse space-y-4">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-6 bg-white/10 rounded w-3/4" />
              <div className="h-12 bg-white/5 rounded w-full" />
              <div className="h-8 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        /* Clean Empty State Handling */
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
          <Filter className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-heading text-lg font-bold text-white">No Schemes Found In This Category</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            {verificationFilterTab === 'PENDING_VERIFICATION'
              ? 'There are currently no schemes in pending verification status. All schemes on display have completed verification.'
              : verificationFilterTab === 'EXPIRED_OR_CLOSED'
              ? 'No concluded or archived application cycles match your filter parameters.'
              : 'Try adjusting your search criteria, clearing filters, or switching verification tabs.'}
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-[#8065FF] text-white text-xs font-semibold hover:bg-[#6c48ff] transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Scholarships Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <div key={match.scholarship.id} className="relative group/wrapper">
              <ScholarshipCard
                matchResult={match}
                isSaved={savedSet.has(match.scholarship.id)}
                onToggleSave={handleToggleSave}
                onInspectTrustGuard={(s) => setInspectingTrustGuard(s)}
              />

              {/* Admin Status Review Bar (Only visible to admin jiya72637@gmail.com) */}
              {isAdmin && (
                <div className="mt-2 p-2.5 rounded-2xl bg-[#080D1B] border border-white/15 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Admin Review:</span>
                  <div className="flex items-center gap-1.5">
                    {match.scholarship.verificationStatus !== 'VERIFIED' && (
                      <button
                        onClick={() => handleAdminUpdateStatus(match.scholarship.id, 'VERIFIED')}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 text-[#27C995] font-semibold hover:bg-emerald-500/30 transition"
                      >
                        Approve Verified
                      </button>
                    )}
                    {match.scholarship.verificationStatus !== 'PENDING_VERIFICATION' && (
                      <button
                        onClick={() => handleAdminUpdateStatus(match.scholarship.id, 'PENDING_VERIFICATION')}
                        className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold hover:bg-amber-500/30 transition"
                      >
                        Set Pending
                      </button>
                    )}
                    {match.scholarship.verificationStatus !== 'EXPIRED_OR_CLOSED' && (
                      <button
                        onClick={() => handleAdminUpdateStatus(match.scholarship.id, 'EXPIRED_OR_CLOSED')}
                        className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold hover:bg-slate-600 transition"
                      >
                        Mark Closed
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Ingestion Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card rounded-3xl p-6 sm:p-7 max-w-xl w-full border border-white/20 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#8065FF]" />
                <h3 className="font-heading text-lg font-bold text-white">
                  Ingest Official Indian Scheme
                </h3>
              </div>
              <button
                onClick={() => setAdminModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Admin authorization active (<strong>jiya72637@gmail.com</strong>). Strict URL and duplicate validation enforced.
            </p>

            {formErrors.general && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleAdminIngest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Scheme ID (Unique Slug) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. nsp-post-matric-st"
                  value={newScheme.id || ''}
                  onChange={(e) => setNewScheme({ ...newScheme, id: e.target.value })}
                  className="w-full bg-[#080D1B] border border-white/15 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Scheme Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Fellowship for ST Scholars"
                  value={newScheme.name || ''}
                  onChange={(e) => setNewScheme({ ...newScheme, name: e.target.value })}
                  className="w-full bg-[#080D1B] border border-white/15 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
                />
                {formErrors.name && (
                  <p className="text-rose-400 text-[11px] mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Provider / Ministry *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ministry of Tribal Affairs, Government of India"
                  value={newScheme.provider || ''}
                  onChange={(e) => setNewScheme({ ...newScheme, provider: e.target.value })}
                  className="w-full bg-[#080D1B] border border-white/15 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
                />
                {formErrors.provider && (
                  <p className="text-rose-400 text-[11px] mt-1">{formErrors.provider}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Official Source URL (NSP, e-Kalyan, AICTE) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://scholarships.gov.in/..."
                  value={newScheme.officialSourceUrl || ''}
                  onChange={(e) => setNewScheme({ ...newScheme, officialSourceUrl: e.target.value })}
                  className="w-full bg-[#080D1B] border border-white/15 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
                />
                {formErrors.officialSourceUrl && (
                  <p className="text-rose-400 text-[11px] mt-1">{formErrors.officialSourceUrl}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Annual Award Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newScheme.awardAmount || 50000}
                    onChange={(e) => setNewScheme({ ...newScheme, awardAmount: Number(e.target.value) })}
                    className="w-full bg-[#080D1B] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8065FF]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Verification Status *
                  </label>
                  <select
                    value={newScheme.verificationStatus || 'VERIFIED'}
                    onChange={(e) => setNewScheme({ ...newScheme, verificationStatus: e.target.value as any })}
                    className="w-full bg-[#080D1B] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8065FF]"
                  >
                    <option value="VERIFIED">VERIFIED (Official Scheme)</option>
                    <option value="PENDING_VERIFICATION">PENDING_VERIFICATION (Circular pending)</option>
                    <option value="EXPIRED_OR_CLOSED">EXPIRED_OR_CLOSED (Concluded cycle)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Min Marks Required (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScheme.minimumMarks || 50}
                    onChange={(e) => setNewScheme({ ...newScheme, minimumMarks: Number(e.target.value) })}
                    className="w-full bg-[#080D1B] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8065FF]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Max Annual Income (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newScheme.maximumFamilyIncome || 250000}
                    onChange={(e) => setNewScheme({ ...newScheme, maximumFamilyIncome: Number(e.target.value) })}
                    className="w-full bg-[#080D1B] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8065FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Deadline Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={newScheme.deadline || '2026-12-31'}
                  onChange={(e) => setNewScheme({ ...newScheme, deadline: e.target.value })}
                  className="w-full bg-[#080D1B] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8065FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#8065FF] hover:bg-[#6c48ff] text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Ingesting...' : 'Confirm Ingestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TrustGuard Transparency Modal */}
      {inspectingTrustGuard && (
        <TrustGuardModal
          scholarship={inspectingTrustGuard}
          isOpen={!!inspectingTrustGuard}
          onClose={() => setInspectingTrustGuard(null)}
        />
      )}
    </div>
  );
};
