import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  IndianRupee,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  ListOrdered,
  Sparkles,
  Bookmark,
  Share2,
  Info,
  Flag,
} from 'lucide-react';
import { DEMO_SCHOLARSHIPS } from '../data/scholarships';
import {
  getStudentProfile,
  getApplications,
  updateApplicationStatus,
  getSavedScholarshipIds,
  toggleSaveScholarship,
  getDocuments,
} from '../services/storageService';
import { calculateMatchScore } from '../utils/matchingEngine';
import { MatchScoreIndicator } from '../components/MatchScoreIndicator';
import { TrustGuardModal } from '../components/TrustGuardModal';
import { ApplicationStatus, Scholarship } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  saveScholarshipForUser,
  removeSavedScholarshipForUser,
  fetchScholarshipById,
} from '../services/firestoreService';
import { scholarshipDocumentToModel } from '../types/firestore';
import { persistUserApplication } from '../services/firebase';

export const ScholarshipDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const profile = authProfile || getStudentProfile();
  const applications = getApplications();
  const userDocs = getDocuments();
  const savedIds = getSavedScholarshipIds();

  const [scholarship, setScholarship] = useState<Scholarship | null>(
    () => DEMO_SCHOLARSHIPS.find((s) => s.id === id) || null
  );
  const [loading, setLoading] = useState(!scholarship);

  React.useEffect(() => {
    if (id) {
      fetchScholarshipById(id)
        .then((doc) => {
          if (doc) {
            setScholarship(scholarshipDocumentToModel(doc));
          }
        })
        .catch(console.warn)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (!scholarship) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white font-heading">Scholarship Not Found</h2>
        <p className="text-xs text-slate-400">The requested opportunity ID could not be located.</p>
        <Link
          to="/scholarships"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8065FF] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explorer
        </Link>
      </div>
    );
  }

  // Calculate Match DNA specifically for this scholarship
  const matchResult = calculateMatchScore(profile, scholarship);
  const currentApp = applications.find((a) => a.scholarshipId === scholarship.id);
  const [appStatus, setAppStatus] = useState<ApplicationStatus>(currentApp ? currentApp.status : 'Saved');
  const [appNotes, setAppNotes] = useState<string>(currentApp ? currentApp.notes : '');
  const [isSaved, setIsSaved] = useState(savedIds.includes(scholarship.id));
  const [statusUpdatedToast, setStatusUpdatedToast] = useState(false);
  const [trustGuardOpen, setTrustGuardOpen] = useState(false);

  const handleSaveStatus = (newStatus: ApplicationStatus) => {
    setAppStatus(newStatus);
    const updatedApps = updateApplicationStatus(scholarship.id, newStatus, appNotes);
    setStatusUpdatedToast(true);
    setTimeout(() => setStatusUpdatedToast(false), 2500);

    if (user) {
      const target = updatedApps.find((a) => a.scholarshipId === scholarship.id);
      if (target) {
        persistUserApplication(user.uid, target).catch(console.warn);
      }
    }
  };

  const handleToggleBookmark = () => {
    const newState = toggleSaveScholarship(scholarship.id);
    setIsSaved(newState);
    if (user) {
      if (newState) {
        saveScholarshipForUser(user.uid, scholarship.id).catch(console.warn);
      } else {
        removeSavedScholarshipForUser(user.uid, scholarship.id).catch(console.warn);
      }
    }
  };

  // Check document availability
  const userCategories = new Set(userDocs.map((d) => d.category));
  const isSuspicious = scholarship.verificationStatus === 'Flagged Suspicious' || scholarship.isSuspiciousWarning;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/scholarships"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scholarships</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTrustGuardOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isSuspicious
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-[#27C995]/10 text-[#27C995] border-[#27C995]/20 hover:bg-[#27C995]/20'
            }`}
          >
            {isSuspicious ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>TrustGuard Audit</span>
          </button>

          <button
            onClick={handleToggleBookmark}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isSaved
                ? 'bg-[#8065FF]/20 text-[#8065FF] border-[#8065FF]/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        {isSuspicious && (
          <div className="p-3 mb-6 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-200">
                Warning: Suspicious / Unverified Listing Flagged
              </h4>
              <p className="text-xs text-rose-300/90 leading-relaxed mt-0.5">
                This listing requests upfront application fees. Real scholarships NEVER charge fees. Please do not send money or banking credentials.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300">
                {scholarship.providerType}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                📅 Deadline: {scholarship.deadline} ({scholarship.daysLeft} days remaining)
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#27C995]/20 text-[#27C995] border border-[#27C995]/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Accredited Grant
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {scholarship.name}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {scholarship.description}
            </p>
            <p className="text-xs text-slate-400">
              Offered by: <strong className="text-white">{scholarship.provider}</strong>
            </p>
          </div>

          {/* Award + Match Score Pill */}
          <div className="p-5 rounded-2xl bg-[#080D1B]/80 border border-white/10 flex flex-col items-center text-center shrink-0 min-w-[220px]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
              Grant Amount
            </span>
            <div className="flex items-center gap-1 text-2xl sm:text-3xl font-heading font-extrabold text-[#27C995] mb-1">
              <IndianRupee className="w-6 h-6" />
              <span>₹{scholarship.awardAmount.toLocaleString('en-IN')}</span>
            </div>
            <span className="text-xs text-slate-400 mb-4 font-mono">{scholarship.awardFrequency} Aid</span>

            <MatchScoreIndicator matchResult={matchResult} size="md" />
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Application Status Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Eligibility, Documents & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Eligibility Breakdown */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Sparkles className="w-5 h-5 text-[#8065FF]" />
              <h2 className="font-heading text-base font-bold text-white">
                Detailed Eligibility Criteria
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#080D1B]/70 border border-white/5">
                <span className="text-slate-400 block mb-1">Minimum Marks Required</span>
                <span className="text-sm font-bold text-white">{scholarship.minMarks}%</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Your profile: <strong className={profile.percentage >= scholarship.minMarks ? 'text-[#27C995]' : 'text-rose-400'}>{profile.percentage}%</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#080D1B]/70 border border-white/5">
                <span className="text-slate-400 block mb-1">Maximum Annual Family Income</span>
                <span className="text-sm font-bold text-white">
                  ₹{Number(scholarship.maxIncome).toLocaleString('en-IN')} / year
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Your family income: <strong className={profile.annualFamilyIncome <= scholarship.maxIncome ? 'text-[#27C995]' : 'text-rose-400'}>₹{Number(profile.annualFamilyIncome).toLocaleString('en-IN')}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#080D1B]/70 border border-white/5">
                <span className="text-slate-400 block mb-1">Target Education Cohorts</span>
                <span className="text-sm font-bold text-white">
                  {scholarship.educationLevels.join(', ')}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Your level: <strong className="text-white">{profile.educationLevel}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#080D1B]/70 border border-white/5">
                <span className="text-slate-400 block mb-1">Eligible State Domiciles</span>
                <span className="text-sm font-bold text-white">
                  {scholarship.eligibleStates.join(', ')}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Your state: <strong className="text-white">{profile.state}</strong>
                </p>
              </div>
            </div>

            {/* AI Explanation Accordion */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#42D9F5]" />
                DNA Engine Match Explanations:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {matchResult.explanations.map((exp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#8065FF] font-bold">•</span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Required Documents Checklist */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#42D9F5]" />
                <h2 className="font-heading text-base font-bold text-white">
                  Required Documents Checklist
                </h2>
              </div>
              <Link to="/documents" className="text-xs text-[#42D9F5] hover:underline font-semibold">
                Open Document Center
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              {(scholarship.requiredDocuments || []).map((docName: string) => {
                const isReady = userCategories.has(docName as any);
                return (
                  <div
                    key={docName}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#080D1B]/70 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      {isReady ? (
                        <CheckCircle2 className="w-4 h-4 text-[#27C995] shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-white font-semibold block">{docName}</span>
                        <span className="text-[10px] text-slate-400">
                          {isReady ? 'Uploaded & verified in vault' : 'Action needed: Upload to vault'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isReady
                          ? 'bg-[#27C995]/20 text-[#27C995]'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {isReady ? 'Ready' : 'Missing'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Application Steps */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <ListOrdered className="w-5 h-5 text-[#27C995]" />
              <h2 className="font-heading text-base font-bold text-white">
                Step-by-Step Application Process
              </h2>
            </div>

            <ol className="space-y-3 text-xs">
              {(scholarship.applicationSteps || []).map((step: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#080D1B]/70 border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-[#8065FF]/20 text-[#8065FF] border border-[#8065FF]/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-slate-300 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            {/* Official Link */}
            <div className="pt-2">
              <a
                href={scholarship.officialSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8065FF] to-[#6c48ff] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-[#8065FF]/25 transition flex items-center justify-center gap-2"
              >
                <span>Visit Official Foundation / Portal Link</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                * Official Portal Verification: Always review latest circulars and submit applications directly through the authorized provider portal.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Application Tracker Management */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-xl space-y-4">
            <h3 className="font-heading text-sm font-bold text-white">
              Application Tracker
            </h3>

            {statusUpdatedToast && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-[#27C995] text-xs font-semibold border border-emerald-500/30 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Tracker updated successfully!
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Current Tracker Status
              </label>
              <select
                value={appStatus}
                onChange={(e) => handleSaveStatus(e.target.value as ApplicationStatus)}
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              >
                <option value="Saved">Saved for Later</option>
                <option value="Preparing">Preparing Documents</option>
                <option value="Ready to Apply">Ready to Apply</option>
                <option value="Applied">Applied / Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved / Awarded</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Private Application Notes
              </label>
              <textarea
                rows={3}
                value={appNotes}
                onChange={(e) => setAppNotes(e.target.value)}
                placeholder="Add submission date, reference roll numbers, or counselor feedback..."
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
              />
            </div>

            <button
              onClick={() => handleSaveStatus(appStatus)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition flex items-center justify-center gap-1.5"
            >
              Save Tracker Notes
            </button>

            <Link
              to="/applications"
              className="block text-center text-xs text-[#8065FF] hover:underline font-semibold pt-1"
            >
              Open Full Kanban Command Center →
            </Link>
          </div>

          {/* Ask Copilot About This Scholarship */}
          <div className="glass-card rounded-3xl p-5 border border-[#8065FF]/30 shadow-xl space-y-3">
            <span className="text-[10px] font-bold text-[#8065FF] uppercase tracking-wider block">
              AI Assistance
            </span>
            <h4 className="text-xs font-bold text-white">Have questions about this grant?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask Grantly Copilot to decode tricky clauses or verify your documents against this scheme.
            </p>
            <Link
              to={`/copilot?q=Explain%20how%20I%20can%20win%20the%20${encodeURIComponent(scholarship.name)}`}
              className="w-full py-2 rounded-xl bg-[#8065FF]/20 hover:bg-[#8065FF]/30 text-[#8065FF] text-xs font-bold border border-[#8065FF]/30 transition block text-center"
            >
              Ask Copilot About This Scheme
            </Link>
          </div>
        </div>
      </div>

      {/* TrustGuard Modal */}
      {trustGuardOpen && (
        <TrustGuardModal
          scholarship={scholarship}
          isOpen={trustGuardOpen}
          onClose={() => setTrustGuardOpen(false)}
        />
      )}
    </div>
  );
};
