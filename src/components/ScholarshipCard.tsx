import React from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  Calendar,
  Bookmark,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { MatchScoreIndicator } from './MatchScoreIndicator';
import { Scholarship, MatchResult } from '../types';

interface ScholarshipCardProps {
  matchResult: MatchResult;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onInspectTrustGuard?: (scholarship: Scholarship) => void;
}

export const ScholarshipCard: React.FC<ScholarshipCardProps> = ({
  matchResult,
  isSaved,
  onToggleSave,
  onInspectTrustGuard,
}) => {
  const s = matchResult.scholarship;
  const isSuspicious = s.verificationStatus === 'Flagged Suspicious' || s.isSuspiciousWarning;

  return (
    <div
      className={`glass-card glass-card-hover rounded-3xl p-5 sm:p-6 border flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
        isSuspicious
          ? 'border-rose-500/40 bg-rose-950/20'
          : 'border-white/10 hover:border-[#8065FF]/50'
      }`}
    >
      {/* Top Bar with Provider, TrustGuard Tag & Save Button */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
              {s.providerType}
            </span>

            {isSuspicious ? (
              <button
                onClick={() => onInspectTrustGuard && onInspectTrustGuard(s)}
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                Suspicious Flagged
              </button>
            ) : s.verificationStatus === 'VERIFIED' ? (
              <button
                onClick={() => onInspectTrustGuard && onInspectTrustGuard(s)}
                className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#27C995]/15 text-[#27C995] border border-[#27C995]/30 hover:bg-[#27C995]/25 transition flex items-center gap-1"
                title="Verified against official government portal circulars"
              >
                <ShieldCheck className="w-3 h-3" />
                Official Verified
              </button>
            ) : s.verificationStatus === 'PENDING_VERIFICATION' ? (
              <button
                onClick={() => onInspectTrustGuard && onInspectTrustGuard(s)}
                className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition flex items-center gap-1"
                title="Source identified. Awaiting portal circular verification."
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                Pending Verification
              </button>
            ) : (
              <span
                className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30 flex items-center gap-1"
                title="Concluded application cycle; retained for audit"
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                Cycle Closed
              </span>
            )}
          </div>

          <button
            onClick={(e) => onToggleSave(s.id, e)}
            title={isSaved ? 'Saved in Tracker' : 'Save opportunity'}
            className={`p-2 rounded-xl border transition-all duration-200 ${
              isSaved
                ? 'bg-[#8065FF]/20 text-[#8065FF] border-[#8065FF]/40 scale-105'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title & Provider */}
        <Link to={`/scholarships/${s.id}`} className="block group/title">
          <h3 className="font-heading text-base sm:text-lg font-bold text-white group-hover/title:text-[#42D9F5] transition leading-snug mb-1">
            {s.name}
          </h3>
        </Link>
        <p className="text-xs text-slate-400 font-medium mb-3">
          Offered by <span className="text-slate-300">{s.provider}</span>
        </p>

        {/* Description snippet */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
          {s.description}
        </p>

        {/* Deterministic Eligibility Decision Insight */}
        {matchResult.mandatoryFailed ? (
          <div className="mb-3.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-300 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <span>
              <strong>Not Eligible:</strong> {matchResult.failedCriteria?.[0] || matchResult.mandatoryFailureReason || 'Mandatory criteria not met.'}
            </span>
          </div>
        ) : matchResult.eligibilityStatus === 'NEEDS_REVIEW' || matchResult.status === 'Borderline' ? (
          <div className="mb-3.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Review Required:</strong> {matchResult.missingInformation?.[0] || matchResult.missingCriteria?.[0] || 'Additional verification required.'}
            </span>
          </div>
        ) : (
          <div className="mb-3.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-[#27C995] flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#27C995] shrink-0 mt-0.5" />
            <span>
              <strong>Eligible:</strong> Meets all academic, income, stream, and domicile prerequisites.
            </span>
          </div>
        )}

        {/* Tags & Deadline Pill */}
        <div className="flex flex-wrap items-center gap-1.5 mb-5">
          {s.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/5"
            >
              #{tag}
            </span>
          ))}
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 ${
              s.daysLeft <= 15
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                : 'bg-white/[0.04] text-slate-300 border border-white/5'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {s.deadline} ({s.daysLeft}d left)
          </span>

          {s.officialSourceUrl && (
            <a
              href={s.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-violet-300 hover:text-white bg-violet-500/10 hover:bg-violet-500/20 px-2 py-0.5 rounded-md border border-violet-500/20 flex items-center gap-1 transition ml-auto"
              title={`Open official portal: ${s.officialSourceUrl}`}
            >
              <span>Official Portal</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Card Footer with Award & Interactive Gauge */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Funding Award
          </span>
          <span className="text-base sm:text-lg font-bold text-white flex items-center gap-0.5">
            <IndianRupee className="w-4 h-4 text-[#27C995]" />
            ₹{s.awardAmount.toLocaleString('en-IN')}{' '}
            <span className="text-[10px] text-slate-400 font-normal ml-1">
              /{s.awardFrequency}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <MatchScoreIndicator matchResult={matchResult} size="sm" />
          <Link
            to={`/scholarships/${s.id}`}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8065FF] to-[#6c48ff] text-white text-xs font-semibold hover:brightness-110 transition shadow-md shadow-[#8065FF]/20 flex items-center gap-1"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
