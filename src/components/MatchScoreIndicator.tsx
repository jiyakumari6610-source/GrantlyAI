import React, { useState } from 'react';
import { MatchResult } from '../types';
import { Info, Check, AlertCircle, XCircle } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface MatchScoreIndicatorProps {
  matchResult: MatchResult;
  size?: 'sm' | 'md' | 'lg';
  showBreakdownOnHover?: boolean;
}

export const MatchScoreIndicator: React.FC<MatchScoreIndicatorProps> = ({
  matchResult,
  size = 'md',
  showBreakdownOnHover = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { score, status, breakdown, mandatoryFailed, mandatoryFailureReason, eligibilityStatus } = matchResult;

  const currentStatus = eligibilityStatus || (status === 'Eligible' ? 'ELIGIBLE' : status === 'Borderline' ? 'NEEDS_REVIEW' : 'INELIGIBLE');
  const isEligible = currentStatus === 'ELIGIBLE' && !mandatoryFailed;
  const isNeedsReview = currentStatus === 'NEEDS_REVIEW';
  const isIneligible = currentStatus === 'INELIGIBLE' || mandatoryFailed;

  const strokeColor = isEligible ? '#27C995' : isNeedsReview ? '#F59E0B' : '#EF4444';

  const badgeBg = isEligible
    ? 'bg-[#27C995]/15 text-[#27C995] border-[#27C995]/30'
    : isNeedsReview
    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

  const circleSize = size === 'sm' ? 46 : size === 'lg' ? 88 : 66;
  const strokeWidth = size === 'sm' ? 3.5 : size === 'lg' ? 6 : 5;
  const radius = (circleSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const hasValidScore = score !== null && score !== undefined && score > 0;
  const strokeDashoffset = hasValidScore
    ? circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference
    : circumference;

  return (
    <div
      className="relative inline-flex items-center gap-3 cursor-pointer select-none group"
      onMouseEnter={() => showBreakdownOnHover && setShowTooltip(true)}
      onMouseLeave={() => showBreakdownOnHover && setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      {/* Radial Score Gauge with SVG glow */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={circleSize}
          height={circleSize}
          className="transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(128,101,255,0.2)]"
        >
          {/* Background track */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Animated active score stroke */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-heading font-extrabold ${
              size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-2xl' : 'text-sm'
            } text-white`}
          >
            {hasValidScore ? <AnimatedCounter value={score} suffix="%" /> : <span className="text-slate-400">--</span>}
          </span>
        </div>
      </div>

      {/* Label and Status */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeBg} flex items-center gap-1`}
          >
            {isEligible && <Check className="w-3 h-3" />}
            {isNeedsReview && <AlertCircle className="w-3 h-3" />}
            {isIneligible && <XCircle className="w-3 h-3" />}
            {isEligible ? 'Eligible' : isNeedsReview ? 'Needs Review' : 'Ineligible'}
          </span>
          <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
        </div>
        <span className="text-[10px] text-slate-400 mt-0.5">Eligibility DNA Match</span>
      </div>

      {/* Interactive Tooltip Breakdown */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-3 z-40 w-72 p-4 glass-card rounded-2xl border border-white/15 shadow-2xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <span className="text-xs font-bold text-white font-heading">
              Eligibility DNA Breakdown
            </span>
            <span className={`text-xs font-bold ${isEligible ? 'text-[#27C995]' : isNeedsReview ? 'text-amber-400' : 'text-rose-400'}`}>
              Total: {hasValidScore ? `${score}/100` : 'Review Required'}
            </span>
          </div>

          {mandatoryFailed && (
            <div className="p-2 mb-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[11px] text-rose-300">
              <span className="font-semibold block">Mandatory Exclusion:</span>
              {mandatoryFailureReason || 'Criteria requirement not met.'}
            </div>
          )}

          <div className="space-y-1.5 text-[11px]">
            <div>
              <div className="flex justify-between text-slate-300">
                <span>Academic Score (25%)</span>
                <span className="font-semibold text-white">{breakdown.academic}/25</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-[#8065FF] rounded-full transition-all duration-500"
                  style={{ width: `${(breakdown.academic / 25) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300">
                <span>Family Income (25%)</span>
                <span className="font-semibold text-white">{breakdown.income}/25</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-[#42D9F5] rounded-full transition-all duration-500"
                  style={{ width: `${(breakdown.income / 25) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300">
                <span>Course & Degree (20%)</span>
                <span className="font-semibold text-white">{breakdown.course}/20</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-[#27C995] rounded-full transition-all duration-500"
                  style={{ width: `${(breakdown.course / 20) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300">
                <span>Location Domicile (15%)</span>
                <span className="font-semibold text-white">{breakdown.location}/15</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-violet-400 rounded-full transition-all duration-500"
                  style={{ width: `${(breakdown.location / 15) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300">
                <span>Category & Bonus (15%)</span>
                <span className="font-semibold text-white">{breakdown.category}/15</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${(breakdown.category / 15) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-400 text-center">
            Weighted matching algorithm guarantees zero hallucinated eligibility.
          </div>
        </div>
      )}
    </div>
  );
};
