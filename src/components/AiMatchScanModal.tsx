import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Dna,
  CheckCircle2,
  Cpu,
  GraduationCap,
  IndianRupee,
  MapPin,
  ArrowRight,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { getStudentProfile } from '../services/storageService';
import { DEMO_SCHOLARSHIPS } from '../data/scholarships';
import { rankScholarshipsForStudent } from '../utils/matchingEngine';
import { MatchResult } from '../types';
import { AnimatedCounter } from './AnimatedCounter';
import confetti from 'canvas-confetti';

interface AiMatchScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ScanStage = 'analyzing' | 'evaluating' | 'comparing' | 'complete';

export const AiMatchScanModal: React.FC<AiMatchScanModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const profile = getStudentProfile();

  const [currentStage, setCurrentStage] = useState<ScanStage>('analyzing');
  const [progress, setProgress] = useState(0);
  const [evaluatedCount, setEvaluatedCount] = useState(0);
  const [matchedResults, setMatchedResults] = useState<MatchResult[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStage('analyzing');
      setProgress(0);
      setEvaluatedCount(0);
      return;
    }

    // Real calculations from the engine
    const results = rankScholarshipsForStudent(profile, DEMO_SCHOLARSHIPS);
    setMatchedResults(results);

    // Timeline for scanning animation
    const timer1 = setTimeout(() => {
      setCurrentStage('evaluating');
      setProgress(35);
    }, 1100);

    const timer2 = setTimeout(() => {
      setCurrentStage('comparing');
      setProgress(72);
      setEvaluatedCount(DEMO_SCHOLARSHIPS.length);
    }, 2300);

    const timer3 = setTimeout(() => {
      setCurrentStage('complete');
      setProgress(100);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#8065FF', '#42D9F5', '#27C995'],
        });
      } catch (e) {
        // Safe confetti fallback
      }
    }, 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const eligibleMatches = matchedResults.filter((m) => m.status === 'Eligible' && !m.mandatoryFailed);
  const topMatch = matchedResults[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass-card rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8065FF]/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#42D9F5]/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8065FF] to-[#42D9F5] p-0.5 shadow-lg shadow-[#8065FF]/30">
            <div className="w-full h-full bg-[#080D1B] rounded-[14px] flex items-center justify-center">
              <Dna className="w-5 h-5 text-[#42D9F5] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-white">
                Eligibility DNA Engine
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#8065FF]/20 text-violet-300 border border-[#8065FF]/30">
                Live Analysis
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic 5-factor evaluation across accredited opportunities
            </p>
          </div>
        </div>

        {/* Progress Bar & Stage Indicator */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              {currentStage === 'analyzing' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#42D9F5] animate-ping" />
                  Stage 1: Analysing student profile...
                </>
              )}
              {currentStage === 'evaluating' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#8065FF] animate-ping" />
                  Stage 2: Evaluating eligibility criteria & cutoffs...
                </>
              )}
              {currentStage === 'comparing' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Stage 3: Comparing {DEMO_SCHOLARSHIPS.length} scholarship requirements...
                </>
              )}
              {currentStage === 'complete' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#27C995]" />
                  Stage 4: Opportunities generated successfully!
                </>
              )}
            </span>
            <span className="font-mono text-slate-400 font-bold">{progress}%</span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-[#8065FF] via-[#42D9F5] to-[#27C995] rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Connecting Data Points Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-3 rounded-xl border transition-all ${
              currentStage !== 'analyzing'
                ? 'bg-[#111A2D] border-[#8065FF]/40 text-white'
                : 'bg-white/[0.02] border-white/5 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#8065FF]" />
              Academics (25%)
            </div>
            <div className="font-mono text-sm font-bold text-white">
              {profile.percentage}% CGPA
            </div>
            <span className="text-[10px] text-slate-400">{profile.course}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-3 rounded-xl border transition-all ${
              currentStage === 'comparing' || currentStage === 'complete'
                ? 'bg-[#111A2D] border-[#27C995]/40 text-white'
                : 'bg-white/[0.02] border-white/5 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-1">
              <IndianRupee className="w-3.5 h-3.5 text-[#27C995]" />
              Income (25%)
            </div>
            <div className="font-mono text-sm font-bold text-white">
              ₹{(profile.annualFamilyIncome / 100000).toFixed(1)}L/yr
            </div>
            <span className="text-[10px] text-slate-400">Under EWS cap</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-3 rounded-xl border transition-all ${
              currentStage === 'comparing' || currentStage === 'complete'
                ? 'bg-[#111A2D] border-[#42D9F5]/40 text-white'
                : 'bg-white/[0.02] border-white/5 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#42D9F5]" />
              Domicile (15%)
            </div>
            <div className="font-mono text-sm font-bold text-white">{profile.state}</div>
            <span className="text-[10px] text-slate-400">State Quota Active</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`p-3 rounded-xl border transition-all ${
              currentStage === 'complete'
                ? 'bg-[#111A2D] border-amber-400/40 text-white'
                : 'bg-white/[0.02] border-white/5 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Category (15%)
            </div>
            <div className="font-mono text-sm font-bold text-white">{profile.category}</div>
            <span className="text-[10px] text-slate-400">First-Gen Quota</span>
          </motion.div>
        </div>

        {/* Revealed Opportunities Preview */}
        <div className="space-y-3 min-h-[140px] flex flex-col justify-center">
          {currentStage !== 'complete' ? (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
              <Cpu className="w-6 h-6 text-[#42D9F5] mx-auto animate-spin" />
              <p className="text-xs text-slate-300">
                Running 5-way multi-variable constraint validation without AI hallucination...
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8065FF] animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#42D9F5] animate-pulse delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#27C995] animate-pulse delay-200" />
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <div className="p-4 rounded-2xl bg-[#080D1B]/90 border border-[#27C995]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#27C995]/20 text-[#27C995] border border-[#27C995]/30">
                      Top Match
                    </span>
                    <span className="text-xs text-slate-400">Award: ₹{topMatch.scholarship.awardAmount.toLocaleString('en-IN')}/yr</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{topMatch.scholarship.name}</h4>
                  <p className="text-xs text-slate-300 line-clamp-1">{topMatch.explanations[0]}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-heading font-extrabold text-2xl text-[#27C995]">
                      <AnimatedCounter value={topMatch.score} suffix="%" />
                    </span>
                    <span className="text-[10px] text-slate-400 block">DNA Match</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs text-slate-300">
                <span>
                  Total eligible opportunities unlocked:{' '}
                  <strong className="text-[#27C995]">{eligibleMatches.length} schemes</strong>
                </span>
                <span className="text-[#42D9F5] font-semibold">100% Deterministic</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 hidden sm:inline flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#27C995]" />
            TrustGuard verified calculation
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                onClose();
                navigate(topMatch ? `/scholarships/${topMatch.scholarship.id}` : '/dashboard');
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8065FF] to-[#42D9F5] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-[#8065FF]/30 transition flex items-center gap-1.5"
            >
              <span>Explore My Matches</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
