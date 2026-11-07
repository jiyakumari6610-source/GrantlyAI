import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Compass,
  FileCheck,
  Bot,
  Kanban,
  Calendar,
  AlertCircle,
  IndianRupee,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Bookmark,
  CheckCircle2,
  Cpu,
  UserPlus,
  Dna,
} from 'lucide-react';
import {
  getStudentProfile,
  getApplications,
  getDocuments,
  getSavedScholarshipIds,
  toggleSaveScholarship,
  calculateDocumentReadiness,
  isProfileCompleted,
} from '../services/storageService';
import { DEMO_SCHOLARSHIPS } from '../data/scholarships';
import { rankScholarshipsForStudent } from '../utils/matchingEngine';
import { computeFundingGap } from '../utils/fundingCalculator';
import { MatchScoreIndicator } from '../components/MatchScoreIndicator';
import { FundingGapChart } from '../components/FundingGapChart';
import { TrustGuardModal } from '../components/TrustGuardModal';
import { AiMatchScanModal } from '../components/AiMatchScanModal';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { Scholarship, ApplicationRecord, UploadedDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  readApplicationHistory,
  readDocumentMetadataList,
  readSavedScholarshipsForUser,
  saveScholarshipForUser,
  removeSavedScholarshipForUser,
  fetchScholarships,
} from '../services/firestoreService';
import { scholarshipDocumentToModel } from '../types/firestore';

export const DashboardPage: React.FC = () => {
  const { user, profile: authProfile } = useAuth();
  const profile = authProfile || getStudentProfile();
  const [applications, setApplications] = useState<ApplicationRecord[]>(getApplications());
  const [docs, setDocs] = useState<UploadedDocument[]>(getDocuments());
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set(getSavedScholarshipIds()));
  const [dbError, setDbError] = useState<string | null>(null);
  const hasProfile = isProfileCompleted(profile);

  const [scholarshipsList, setScholarshipsList] = useState<Scholarship[]>([]);

  // Sync live Firestore records as primary source of truth
  React.useEffect(() => {
    // Load live scholarships from Firestore
    fetchScholarships()
      .then((docs) => {
        if (docs && docs.length > 0) {
          const models = docs.map(scholarshipDocumentToModel);
          // Strictly only include VERIFIED scholarships in verified recommendations
          setScholarshipsList(models.filter((s) => s.verificationStatus === 'VERIFIED'));
        } else {
          setScholarshipsList([]);
        }
      })
      .catch((err) => {
        console.warn('[Dashboard Scholarships Fetch Warning]', err);
        setScholarshipsList([]);
      });

    if (user) {
      Promise.all([
        readApplicationHistory(user.uid),
        readDocumentMetadataList(user.uid),
        readSavedScholarshipsForUser(user.uid),
      ])
        .then(([apps, remoteDocs, remoteSavedIds]) => {
          if (apps && apps.length > 0) setApplications(apps as any);
          if (remoteDocs && remoteDocs.length > 0) setDocs(remoteDocs as any);
          if (remoteSavedIds) setSavedSet(new Set(remoteSavedIds));
        })
        .catch((err) => {
          console.warn('[Dashboard Firestore Sync]', err);
          setDbError('Notice: Live cloud records could not be synchronized.');
        });
    }
  }, [user]);

  // Run Eligibility DNA Matcher strictly on verified schemes
  const matchResults = rankScholarshipsForStudent(profile, scholarshipsList);
  const eligibleMatches = hasProfile
    ? matchResults.filter((m) => m.status === 'Eligible' && !m.mandatoryFailed)
    : [];
  const funding = computeFundingGap(profile, matchResults);
  const readiness = calculateDocumentReadiness(docs);

  // Calculate catalog-wide metrics dynamically from actual scholarship records
  const totalCatalogFunding = scholarshipsList.reduce(
    (sum, s) => sum + s.awardAmount,
    0
  );

  // Modals state
  const [activeTrustGuardModal, setActiveTrustGuardModal] = useState<Scholarship | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = new Set(savedSet);
    const willSave = !next.has(id);
    if (willSave) next.add(id);
    else next.delete(id);
    setSavedSet(next);

    toggleSaveScholarship(id);
    if (user) {
      if (willSave) {
        saveScholarshipForUser(user.uid, id).catch(console.warn);
      } else {
        removeSavedScholarshipForUser(user.uid, id).catch(console.warn);
      }
    }
  };

  const applicationsInProgress = applications.filter(
    (a) => a.status !== 'Approved' && a.status !== 'Rejected'
  );

  const upcomingDeadlines = matchResults
    .filter((m) => m.scholarship.daysLeft <= 40 && m.status !== 'Ineligible')
    .sort((a, b) => a.scholarship.daysLeft - b.scholarship.daysLeft)
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-16">
      {dbError && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dbError}</span>
          </div>
          <button
            onClick={() => setDbError(null)}
            className="text-[11px] underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      {hasProfile ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-gradient-to-br from-[#8065FF]/25 via-[#42D9F5]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8065FF]/20 border border-[#8065FF]/30 text-xs font-semibold text-violet-300">
                <Sparkles className="w-3.5 h-3.5 text-[#42D9F5] animate-pulse" />
                <span>Eligibility DNA Calibrated • 2026 Cycle</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
                Welcome back, {profile.fullName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Enrolled in <span className="text-[#42D9F5] font-semibold">{profile.course}</span> (Year {profile.academicYear}) at{' '}
                <span className="text-white font-medium">{profile.college}</span>, {profile.state}. Your current profile qualifies you for{' '}
                <strong className="text-[#27C995]">{eligibleMatches.length} pre-screened scholarship opportunities</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setScanModalOpen(true)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#8065FF] via-[#7455ff] to-[#603bfa] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-[#8065FF]/30 transition flex items-center gap-2 animate-shimmer"
              >
                <Cpu className="w-4 h-4 text-[#42D9F5]" />
                <span>Run Live AI Match Scan</span>
              </button>
              <Link
                to="/scholarships"
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition flex items-center gap-1.5"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-gradient-to-br from-[#8065FF]/25 via-[#42D9F5]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8065FF]/20 border border-[#8065FF]/30 text-xs font-semibold text-violet-300">
                <Sparkles className="w-3.5 h-3.5 text-[#42D9F5] animate-pulse" />
                <span>Unified Scholarship Discovery & Management Platform</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
                Your Future Deserves Funding.
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Complete your student profile to calibrate your personalized Eligibility DNA, evaluate minimum cut-offs, audit certificates, and discover verified government and corporate funding without double-counting.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/onboarding"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#8065FF] via-[#7455ff] to-[#603bfa] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-[#8065FF]/30 transition flex items-center gap-2 animate-shimmer"
              >
                <UserPlus className="w-4 h-4 text-[#42D9F5]" />
                <span>Set Up Student Profile</span>
              </Link>
              <Link
                to="/scholarships"
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition flex items-center gap-1.5"
              >
                <span>Browse All Opportunities ({DEMO_SCHOLARSHIPS.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4 Animated Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Matched / Available Schemes */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-panel glass-panel-hover p-4 sm:p-5 rounded-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              {hasProfile ? 'Scholarships Matched' : 'Catalog Opportunities'}
            </span>
            <div className="p-2 rounded-xl bg-[#8065FF]/20 text-[#8065FF]">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-white">
              <AnimatedCounter value={hasProfile ? eligibleMatches.length : DEMO_SCHOLARSHIPS.length} />
            </span>
            <span className="text-[11px] font-semibold text-[#27C995] bg-[#27C995]/10 px-1.5 py-0.5 rounded">
              {hasProfile ? 'High Fit' : 'Available'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {hasProfile
              ? 'Surpassing 75% weighted eligibility threshold.'
              : `${DEMO_SCHOLARSHIPS.length} verified schemes currently cataloged.`}
          </p>
        </motion.div>

        {/* Potential Funding */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass-panel glass-panel-hover p-4 sm:p-5 rounded-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              {hasProfile ? 'Potential Funding' : 'Total Funding Pool'}
            </span>
            <div className="p-2 rounded-xl bg-[#42D9F5]/20 text-[#42D9F5]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-[#42D9F5]">
              <AnimatedCounter
                value={hasProfile ? funding.potentialScholarshipFunding : totalCatalogFunding}
                prefix="₹"
                formatIndian={true}
              />
            </span>
            <span className="text-[10px] text-violet-300 font-mono">
              {hasProfile ? 'Max Pool' : 'Indexed'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {hasProfile
              ? `Combined sum across all ${eligibleMatches.length} matched grants.`
              : 'Cumulative award pool across all verified scholarship schemes.'}
          </p>
        </motion.div>

        {/* In Progress Applications */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-panel glass-panel-hover p-4 sm:p-5 rounded-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Active Tracker</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Kanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-white">
              <AnimatedCounter value={applicationsInProgress.length} />
            </span>
            <span className="text-[10px] text-amber-400 font-semibold">
              {applicationsInProgress.length > 0 ? 'In Progress' : 'Empty'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {applicationsInProgress.length > 0
              ? 'Applications actively preparing or submitted.'
              : 'Save opportunities to track application milestones.'}
          </p>
        </motion.div>

        {/* Document Readiness */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="glass-panel glass-panel-hover p-4 sm:p-5 rounded-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Document Readiness</span>
            <div className="p-2 rounded-xl bg-[#27C995]/20 text-[#27C995]">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-[#27C995]">
              <AnimatedCounter value={readiness.overallScore} suffix="%" />
            </span>
            <span className="text-[10px] text-slate-400">
              {readiness.verifiedCount}/{readiness.totalRequired}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {docs.length === 0
              ? 'No certificates uploaded yet.'
              : readiness.missingCategories.length > 0
              ? `Missing: ${readiness.missingCategories[0]}`
              : 'All core certificates verified!'}
          </p>
        </motion.div>
      </div>
      {/* Main Grid: Left 2 Cols (Opportunities + Funding Gap) / Right 1 Col (Deadlines + Copilot Shortcut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Scholarship Recommendations */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div>
                <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8065FF]" />
                  {hasProfile ? 'Top Recommended Opportunities' : 'Featured Verified Opportunities'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {hasProfile
                    ? `Algorithmically ranked for your ${profile.percentage}% score and income bracket`
                    : 'Curated accredited schemes from government portals and trusted philanthropic foundations'}
                </p>
              </div>
              <Link
                to="/scholarships"
                className="text-xs text-[#8065FF] hover:text-[#42D9F5] font-semibold flex items-center gap-1 transition"
              >
                <span>View All ({DEMO_SCHOLARSHIPS.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchResults.slice(0, 4).map((match) => (
                <ScholarshipCard
                  key={match.scholarship.id}
                  matchResult={match}
                  isSaved={savedSet.has(match.scholarship.id)}
                  onToggleSave={handleToggleSave}
                  onInspectTrustGuard={(s) => setActiveTrustGuardModal(s)}
                />
              ))}
            </div>
          </div>

          {/* Funding Gap Intelligence Visualization */}
          <FundingGapChart funding={funding} />
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Grantly Copilot Shortcut Card */}
          <div className="glass-card rounded-3xl p-5 border border-[#8065FF]/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8065FF]/15 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-[#8065FF] to-[#42D9F5] text-white shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-white">Grantly Copilot</h3>
                <span className="text-[10px] text-[#42D9F5] flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#27C995] animate-ping" />
                  Gemini 3.8 Flash • Multilingual
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Ask questions in <strong>Hindi or English</strong> about application circulars, document renewals, or interview preparation.
            </p>

            <div className="space-y-1.5 mb-4">
              <Link
                to="/copilot?q=Which%20scholarships%20am%20I%20eligible%20for?"
                className="block p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-[11px] text-slate-300 transition border border-white/5 truncate"
              >
                💬 "Which scholarships am I eligible for?"
              </Link>
              <Link
                to="/copilot?q=Explain%20required%20documents%20in%20simple%20Hindi"
                className="block p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-[11px] text-slate-300 transition border border-white/5 truncate"
              >
                🇮🇳 "Explain required documents in simple Hindi"
              </Link>
            </div>

            <Link
              to="/copilot"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8065FF] to-[#6c48ff] hover:brightness-110 text-white font-bold text-xs shadow-md shadow-[#8065FF]/20 transition flex items-center justify-center gap-1.5"
            >
              <span>Open AI Copilot Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Upcoming Deadlines Radar */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="font-heading text-sm font-bold text-white">Upcoming Deadlines</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Next 40 Days</span>
            </div>

            <div className="space-y-2.5">
              {upcomingDeadlines.map((match) => (
                <Link
                  key={match.scholarship.id}
                  to={`/scholarships/${match.scholarship.id}`}
                  className="block p-3 rounded-xl bg-[#080D1B]/80 hover:bg-white/5 border border-white/5 transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-[#8065FF] truncate max-w-[140px]">
                      {match.scholarship.provider}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        match.scholarship.daysLeft <= 15
                          ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {match.scholarship.daysLeft} days left
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white line-clamp-1">
                    {match.scholarship.name}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Award: ₹{match.scholarship.awardAmount.toLocaleString('en-IN')}</span>
                    <span className="text-[#27C995] font-semibold">{match.score}% Match</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Document Readiness Quick Card */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#27C995]" />
                <h3 className="font-heading text-sm font-bold text-white">Document Audit</h3>
              </div>
              <span className="text-xs font-bold text-[#27C995]">{readiness.overallScore}%</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {docs.length} certificates audited by Gemini Document Intelligence.
            </p>

            <div className="space-y-1.5 text-xs">
              {docs.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] text-[11px]"
                >
                  <span className="text-slate-300 truncate max-w-[150px]">{d.category}</span>
                  <span className="text-[#27C995] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {d.readinessScore}%
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/documents"
              className="mt-3 block text-center py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition"
            >
              Manage Document Vault
            </Link>
          </div>
        </div>
      </div>

      {/* TrustGuard Modal */}
      {activeTrustGuardModal && (
        <TrustGuardModal
          scholarship={activeTrustGuardModal}
          isOpen={!!activeTrustGuardModal}
          onClose={() => setActiveTrustGuardModal(null)}
        />
      )}

      {/* Signature AI Match Scan Modal */}
      <AiMatchScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
      />
    </div>
  );
};
