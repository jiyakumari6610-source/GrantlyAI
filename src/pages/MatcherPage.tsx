import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dna,
  Sparkles,
  Sliders,
  IndianRupee,
  GraduationCap,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Bookmark,
  Cpu,
  UserCheck,
  FileText,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getStudentProfile,
  saveStudentProfile,
  getSavedScholarshipIds,
  toggleSaveScholarship,
} from '../services/storageService';
import { calculateMatchScore } from '../utils/matchingEngine';
import { ScholarshipCard } from '../components/ScholarshipCard';
import { TrustGuardModal } from '../components/TrustGuardModal';
import { AiMatchScanModal } from '../components/AiMatchScanModal';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { StudentProfile, CategoryType, MatchResult, Scholarship } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  saveScholarshipForUser,
  removeSavedScholarshipForUser,
  readSavedScholarshipsForUser,
  fetchScholarships,
} from '../services/firestoreService';
import { scholarshipDocumentToModel } from '../types/firestore';

export const MatcherPage: React.FC = () => {
  const { user, profile: authProfile } = useAuth();
  const initialProfile = authProfile || getStudentProfile();
  const [profile, setProfile] = useState<StudentProfile>(initialProfile);
  const [savedIds, setSavedIds] = useState<string[]>(getSavedScholarshipIds());
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set(savedIds));
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [inspectingTrustGuard, setInspectingTrustGuard] = useState<Scholarship | null>(null);

  const [verifiedScholarships, setVerifiedScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status Filter Tab: ALL, ELIGIBLE, NEEDS_REVIEW, INELIGIBLE
  const [statusTab, setStatusTab] = useState<'ALL' | 'ELIGIBLE' | 'NEEDS_REVIEW' | 'INELIGIBLE'>('ALL');

  // Fetch scholarships from Firestore
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchScholarships()
      .then((docs) => {
        if (!isMounted) return;
        if (docs && docs.length > 0) {
          const models = docs.map(scholarshipDocumentToModel);
          // Ingest verified schemes for deterministic evaluation
          setVerifiedScholarships(models);
        } else {
          setVerifiedScholarships([]);
        }
      })
      .catch((err) => {
        console.warn('[MatcherPage Firestore Fetch Warning]', err);
        setVerifiedScholarships([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync saved scholarships from Firestore for authenticated user
  useEffect(() => {
    if (user) {
      readSavedScholarshipsForUser(user.uid)
        .then((remoteIds) => {
          if (remoteIds) {
            setSavedIds(remoteIds);
            setSavedSet(new Set(remoteIds));
          }
        })
        .catch(console.warn);
    }
  }, [user]);

  // Real-time recalculation of matches as sliders change
  const matchResults: MatchResult[] = useMemo(() => {
    return verifiedScholarships.map((s) => calculateMatchScore(profile, s)).sort((a, b) => {
      // Priority 1: ELIGIBLE first, then NEEDS_REVIEW, then INELIGIBLE
      const rankVal = (item: MatchResult) => {
        if (item.eligibilityStatus === 'ELIGIBLE' || item.status === 'Eligible') return 3;
        if (item.eligibilityStatus === 'NEEDS_REVIEW' || item.status === 'Borderline') return 2;
        return 1;
      };
      const diff = rankVal(b) - rankVal(a);
      if (diff !== 0) return diff;
      if (a.score !== b.score) return b.score - a.score;
      return a.scholarship.daysLeft - b.scholarship.daysLeft;
    });
  }, [profile, verifiedScholarships]);

  const eligibleCount = matchResults.filter(
    (m) => m.eligibilityStatus === 'ELIGIBLE' || (m.status === 'Eligible' && !m.mandatoryFailed)
  ).length;

  const needsReviewCount = matchResults.filter(
    (m) => m.eligibilityStatus === 'NEEDS_REVIEW' || (m.status === 'Borderline' && !m.mandatoryFailed)
  ).length;

  const ineligibleCount = matchResults.filter(
    (m) => m.eligibilityStatus === 'INELIGIBLE' || m.mandatoryFailed || m.status === 'Ineligible'
  ).length;

  // Filtered match results by tab
  const displayedMatches = useMemo(() => {
    if (statusTab === 'ELIGIBLE') {
      return matchResults.filter(
        (m) => m.eligibilityStatus === 'ELIGIBLE' || (m.status === 'Eligible' && !m.mandatoryFailed)
      );
    }
    if (statusTab === 'NEEDS_REVIEW') {
      return matchResults.filter(
        (m) => m.eligibilityStatus === 'NEEDS_REVIEW' || (m.status === 'Borderline' && !m.mandatoryFailed)
      );
    }
    if (statusTab === 'INELIGIBLE') {
      return matchResults.filter(
        (m) => m.eligibilityStatus === 'INELIGIBLE' || m.mandatoryFailed || m.status === 'Ineligible'
      );
    }
    return matchResults;
  }, [matchResults, statusTab]);

  const handleSliderChange = (key: keyof StudentProfile, value: any) => {
    const updated = { ...profile, [key]: value };
    setProfile(updated);
    saveStudentProfile(updated);
  };

  const handleCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8065FF', '#42D9F5', '#27C995'],
    });
  };

  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = new Set(savedSet);
    const willSave = !next.has(id);
    if (willSave) next.add(id);
    else next.delete(id);
    setSavedSet(next);
    setSavedIds(Array.from(next));

    toggleSaveScholarship(id);
    if (user) {
      if (willSave) {
        saveScholarshipForUser(user.uid, id).catch(console.warn);
      } else {
        removeSavedScholarshipForUser(user.uid, id).catch(console.warn);
      }
    }
  };

  const handleResetToSavedBaseline = () => {
    const saved = getStudentProfile();
    setProfile(saved);
  };

  // Detect missing student profile fields
  const missingFields: string[] = [];
  if (profile.percentage === undefined || profile.percentage === null || profile.percentage === 0) {
    missingFields.push('Qualifying Academic Marks');
  }
  if (profile.annualFamilyIncome === undefined || profile.annualFamilyIncome === null || profile.annualFamilyIncome === 0) {
    missingFields.push('Annual Family Income');
  }
  if (!profile.course || profile.course.trim().length === 0) {
    missingFields.push('Degree Course Stream');
  }
  if (!profile.state || profile.state.trim().length === 0) {
    missingFields.push('State Domicile');
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Missing Information Profile Completion Callout */}
      {missingFields.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-200">
                Incomplete Profile Information ({missingFields.length} fields missing)
              </h4>
              <p className="text-amber-300/80 mt-0.5 leading-relaxed">
                Missing: <strong className="text-white">{missingFields.join(', ')}</strong>. The deterministic engine requires these fields for verified decisions; incomplete profiles generate "Needs Review".
              </p>
            </div>
          </div>
          <Link
            to="/onboarding"
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold hover:brightness-110 transition whitespace-nowrap self-start sm:self-auto"
          >
            Complete Profile Now →
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-[#8065FF]/20 text-[#8065FF]">
              <Dna className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
              Phase 3E • Deterministic Eligibility Matching Engine
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            Eligibility DNA Decision Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict structured evaluation across Academic Marks, Income Limits, Degree Stream, Domicile, and Deadline status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setScanModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8065FF] to-[#42D9F5] text-xs font-bold text-white shadow-lg shadow-[#8065FF]/25 hover:brightness-110 transition animate-shimmer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Launch Visual AI Scan</span>
          </button>
          <button
            onClick={handleResetToSavedBaseline}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
          <button
            onClick={handleCelebrate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Celebrate</span>
          </button>
        </div>
      </div>

      {/* Interactive Calibration Panel (Sliders & Parameters) */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#42D9F5]" />
            <h2 className="font-heading text-sm font-bold text-white">
              Live Parameter Tuning Sandbox
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Adjust student parameters to evaluate deterministic cut-offs in real time
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Marks Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#8065FF]" />
                Qualifying Marks
              </span>
              <span className="font-mono font-bold text-[#8065FF] text-sm">
                {profile.percentage || 0}%
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="99"
              step="1"
              value={profile.percentage || 50}
              onChange={(e) => handleSliderChange('percentage', parseFloat(e.target.value))}
              className="w-full accent-[#8065FF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>40% (Pass)</span>
              <span>60% (First Div)</span>
              <span>99% (Topper)</span>
            </div>
          </div>

          {/* Family Income Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-[#27C995]" />
                Family Income
              </span>
              <span className="font-mono font-bold text-[#27C995] text-sm">
                ₹{Number(profile.annualFamilyIncome || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="50000"
              max="1000000"
              step="25000"
              value={profile.annualFamilyIncome || 200000}
              onChange={(e) => handleSliderChange('annualFamilyIncome', parseFloat(e.target.value))}
              className="w-full accent-[#27C995] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>₹50k</span>
              <span>₹2.5L (EWS)</span>
              <span>₹10L</span>
            </div>
          </div>

          {/* State Selector */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-violet-400" />
              State Domicile
            </label>
            <select
              value={profile.state || 'Jharkhand'}
              onChange={(e) => handleSliderChange('state', e.target.value)}
              className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
            >
              <option value="Jharkhand">Jharkhand</option>
              <option value="Bihar">Bihar</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Delhi">Delhi</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
            </select>
            <span className="text-[10px] text-slate-500 block">Controls state-specific quotas</span>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Social Category
            </label>
            <select
              value={profile.category || 'OBC'}
              onChange={(e) => handleSliderChange('category', e.target.value as CategoryType)}
              className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
            >
              <option value="OBC">OBC (Other Backward Class)</option>
              <option value="EWS">EWS (Economically Weaker Section)</option>
              <option value="General">General / Unreserved</option>
              <option value="SC">SC (Scheduled Caste)</option>
              <option value="ST">ST (Scheduled Tribe)</option>
            </select>
            <span className="text-[10px] text-slate-500 block">Affirmative action matching</span>
          </div>
        </div>

        {/* Real-time Match Ticker with Animated Counters */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStatusTab('ELIGIBLE')}
              className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg transition ${
                statusTab === 'ELIGIBLE' ? 'bg-[#27C995]/20 text-[#27C995] border border-[#27C995]/30' : 'text-[#27C995] hover:bg-white/5'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <AnimatedCounter value={eligibleCount} /> Strictly Eligible
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => setStatusTab('NEEDS_REVIEW')}
              className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg transition ${
                statusTab === 'NEEDS_REVIEW' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'text-amber-400 hover:bg-white/5'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <AnimatedCounter value={needsReviewCount} /> Needs Review
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => setStatusTab('INELIGIBLE')}
              className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg transition ${
                statusTab === 'INELIGIBLE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-rose-400 hover:bg-white/5'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <AnimatedCounter value={ineligibleCount} /> Ineligible
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Pure Deterministic Logic • Zero LLM Hallucinations
          </span>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusTab === 'ALL'
                ? 'bg-[#8065FF] text-white shadow-md shadow-[#8065FF]/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            All Evaluated ({matchResults.length})
          </button>
          <button
            onClick={() => setStatusTab('ELIGIBLE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusTab === 'ELIGIBLE'
                ? 'bg-[#27C995] text-slate-950 font-bold'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Eligible Only ({eligibleCount})
          </button>
          <button
            onClick={() => setStatusTab('NEEDS_REVIEW')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusTab === 'NEEDS_REVIEW'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Needs Review ({needsReviewCount})
          </button>
          <button
            onClick={() => setStatusTab('INELIGIBLE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusTab === 'INELIGIBLE'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Ineligible ({ineligibleCount})
          </button>
        </div>

        <span className="text-xs text-slate-400">
          Showing <strong className="text-white">{displayedMatches.length}</strong> of {matchResults.length} schemes
        </span>
      </div>

      {/* Recalculated Opportunities Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card rounded-3xl p-6 border border-white/10 animate-pulse space-y-3">
                <div className="h-4 bg-white/10 rounded w-1/4" />
                <div className="h-6 bg-white/10 rounded w-3/4" />
                <div className="h-10 bg-white/5 rounded w-full" />
              </div>
            ))}
          </div>
        ) : displayedMatches.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 text-center border border-white/10">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h4 className="font-heading text-base font-bold text-white">
              No Scholarships in "{statusTab === 'ALL' ? 'Evaluated' : statusTab === 'ELIGIBLE' ? 'Eligible' : statusTab === 'NEEDS_REVIEW' ? 'Needs Review' : 'Ineligible'}"
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              {statusTab === 'ELIGIBLE'
                ? 'Your current qualifying marks or income ceiling do not meet the minimum criteria for any scheme in this category. Try tuning the sandbox sliders or review the Ineligible tab for details.'
                : statusTab === 'NEEDS_REVIEW'
                ? 'No schemes require review; your profile data is complete for the active evaluation.'
                : 'Try clearing the filter tabs to explore the full catalog.'}
            </p>
            <button
              onClick={() => setStatusTab('ALL')}
              className="px-4 py-2 rounded-xl bg-[#8065FF] text-white text-xs font-semibold hover:bg-[#6c48ff] transition"
            >
              Show All Schemes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedMatches.map((match) => (
              <ScholarshipCard
                key={match.scholarship.id}
                matchResult={match}
                isSaved={savedSet.has(match.scholarship.id)}
                onToggleSave={handleToggleSave}
                onInspectTrustGuard={(s) => setInspectingTrustGuard(s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* TrustGuard Modal */}
      {inspectingTrustGuard && (
        <TrustGuardModal
          scholarship={inspectingTrustGuard}
          isOpen={!!inspectingTrustGuard}
          onClose={() => setInspectingTrustGuard(null)}
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
