import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Dna,
  FileSearch,
  Bot,
  Kanban,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  Zap,
  IndianRupee,
  Calendar,
  Lock,
} from 'lucide-react';
import { DEMO_SCHOLARSHIPS } from '../data/scholarships';
import { Footer } from '../components/Footer';
import { AiMatchScanModal } from '../components/AiMatchScanModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [scanModalOpen, setScanModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080D1B] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Ambient Particles & Light Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#8065FF]/25 via-[#42D9F5]/15 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-[#8065FF]/10 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[65%] left-[-10%] w-[500px] h-[500px] bg-[#42D9F5]/10 blur-[140px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 mb-8 backdrop-blur-md shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-[#27C995] animate-pulse" />
            <span className="font-medium">GRANTLY AI • Unified Scholarship Intelligence</span>
            <span className="text-[#8065FF] font-semibold flex items-center gap-1">
              Deterministic Matching <Sparkles className="w-3 h-3 text-[#42D9F5]" />
            </span>
          </motion.div>

          {/* Headline Reveal */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.08] mb-6"
          >
            Your Potential Deserves More Than{' '}
            <span className="bg-gradient-to-r from-[#42D9F5] via-[#8065FF] to-violet-300 bg-clip-text text-transparent">
              Financial Barriers.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Discover scholarships that match your dreams. Let AI handle the complexity while you focus on your future.
          </motion.p>

          {/* Staggered Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-20"
          >
            <button
              onClick={() => setScanModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#8065FF] via-[#7557ff] to-[#603bfa] hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-[#8065FF]/30 transition-all flex items-center justify-center gap-2.5 group animate-shimmer"
            >
              <Sparkles className="w-4 h-4 text-[#42D9F5] group-hover:rotate-12 transition-transform" />
              <span>Find My Scholarships</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              to="/scholarships"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel text-white hover:bg-white/10 font-semibold text-sm border border-white/10 transition flex items-center justify-center gap-2"
            >
              <span>Explore Opportunities</span>
            </Link>
          </motion.div>

          {/* Central Visual: Glowing 3D-inspired Orbital Structure with Floating Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative max-w-5xl mx-auto pt-4"
          >
            {/* Ambient Back Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#8065FF]/20 via-[#42D9F5]/20 to-emerald-500/10 rounded-full blur-3xl opacity-60 pointer-events-none -z-10" />

            {/* Orbital Rings Container */}
            <div className="relative w-full h-[420px] sm:h-[480px] flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#0c1426]/75 backdrop-blur-2xl shadow-2xl">
              {/* Outer Ring 1 */}
              <div className="absolute w-[360px] h-[360px] sm:w-[500px] sm:h-[500px] rounded-full border border-[#8065FF]/25 border-dashed animate-spin-slow pointer-events-none" />
              
              {/* Inner Elliptical Ring 2 */}
              <div
                className="absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full border border-[#42D9F5]/30 animate-spin-reverse-slow pointer-events-none"
                style={{ transform: 'rotateX(60deg)' }}
              />

              {/* Glowing Core Reactor */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-3xl bg-[#080D1B]/90 border border-white/15 shadow-2xl max-w-sm backdrop-blur-xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8065FF] to-[#42D9F5] p-0.5 shadow-xl shadow-[#8065FF]/40 mb-3 animate-pulse">
                  <div className="w-full h-full bg-[#080D1B] rounded-[14px] flex items-center justify-center">
                    <Dna className="w-8 h-8 text-[#42D9F5]" />
                  </div>
                </div>
                <h3 className="font-heading font-extrabold text-lg text-white">
                  Deterministic DNA Engine
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                  5-factor weighted algorithm guaranteeing zero hallucinated eligibility.
                </p>
                <button
                  onClick={() => setScanModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8065FF] to-[#603bfa] text-white text-xs font-bold hover:brightness-110 transition shadow-md shadow-[#8065FF]/30 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#42D9F5]" />
                  <span>Launch Live Scan</span>
                </button>
              </div>

              {/* Floating Opportunity Card 1 (Top Left) */}
              <div className="absolute top-6 left-4 sm:left-10 z-20 animate-float-gentle max-w-[240px] text-left">
                <div className="glass-card p-3.5 rounded-2xl border border-white/15 shadow-xl hover:border-[#8065FF]/50 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#8065FF]/20 text-violet-300">
                      STEM Corporate
                    </span>
                    <span className="text-[10px] font-bold text-[#27C995]">95% Match</span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">Pragati Tech Fellowship</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1 font-mono">
                    <span>₹50,000/yr</span>
                    <span className="text-slate-400">Engineering</span>
                  </div>
                </div>
              </div>

              {/* Floating Opportunity Card 2 (Bottom Right) */}
              <div className="absolute bottom-6 right-4 sm:right-10 z-20 animate-float-delayed max-w-[240px] text-left">
                <div className="glass-card p-3.5 rounded-2xl border border-white/15 shadow-xl hover:border-[#42D9F5]/50 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-[#27C995]">
                      Government
                    </span>
                    <span className="text-[10px] font-bold text-[#27C995]">92% Match</span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">National Merit-Means</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1 font-mono">
                    <span>₹75,000/yr</span>
                    <span className="text-slate-400">All India</span>
                  </div>
                </div>
              </div>

              {/* Floating Opportunity Card 3 (Bottom Left) */}
              <div className="absolute bottom-6 left-6 z-20 hidden md:block animate-float-delayed max-w-[200px] text-left">
                <div className="glass-card p-3 rounded-xl border border-white/10 shadow-lg">
                  <span className="text-[10px] text-[#42D9F5] font-semibold block">Document Readiness</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-white">4/4 Audited</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#27C995]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 border-t border-white/[0.08] bg-[#0c1326] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#8065FF] uppercase tracking-wider block mb-2">
              Architecture & Execution
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
              How GRANTLY AI Works
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              A high-precision intelligence pipeline from student academic DNA to verified application submission.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-[#8065FF]/40 transition duration-300 relative group">
              <span className="text-3xl font-extrabold font-mono text-[#8065FF]/20 absolute top-4 right-4 group-hover:text-[#8065FF]/40 transition">
                01
              </span>
              <div className="w-11 h-11 rounded-xl bg-[#8065FF]/20 text-[#8065FF] flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-white mb-2">Build Profile</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your academic percentage, state domicile, degree stream, and family income ceiling.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-[#42D9F5]/40 transition duration-300 relative group">
              <span className="text-3xl font-extrabold font-mono text-[#42D9F5]/20 absolute top-4 right-4 group-hover:text-[#42D9F5]/40 transition">
                02
              </span>
              <div className="w-11 h-11 rounded-xl bg-[#42D9F5]/20 text-[#42D9F5] flex items-center justify-center mb-4">
                <Dna className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-white mb-2">DNA Matching</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deterministic 5-factor weighted engine matches you without false claims or probability guesses.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-[#27C995]/40 transition duration-300 relative group">
              <span className="text-3xl font-extrabold font-mono text-[#27C995]/20 absolute top-4 right-4 group-hover:text-[#27C995]/40 transition">
                03
              </span>
              <div className="w-11 h-11 rounded-xl bg-[#27C995]/20 text-[#27C995] flex items-center justify-center mb-4">
                <FileSearch className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-white mb-2">Audit Documents</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gemini-powered Document Intelligence verifies clarity, marksheet roll numbers, and income certificates.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-amber-400/40 transition duration-300 relative group">
              <span className="text-3xl font-extrabold font-mono text-amber-500/20 absolute top-4 right-4 group-hover:text-amber-500/40 transition">
                04
              </span>
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Kanban className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-white mb-2">Command Center</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track statuses from Saved to Applied and Under Review with deadline notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Platform Features */}
      <section className="py-24 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#8065FF] uppercase tracking-wider block mb-2">
              Next-Gen Capabilities
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
              Intelligent Tools for Real Student Needs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#8065FF]/50 transition group">
              <div className="p-3 rounded-xl bg-[#8065FF]/20 text-[#8065FF] w-fit mb-4 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-2">Funding Gap Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Real financial separation between confirmed student resources and potential grants. Calculates exact deficit to eliminate dropout risk.
              </p>
              <Link to="/dashboard" className="text-xs text-[#42D9F5] font-semibold hover:underline flex items-center gap-1">
                View Gap Breakdown <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#42D9F5]/50 transition group">
              <div className="p-3 rounded-xl bg-[#42D9F5]/20 text-[#42D9F5] w-fit mb-4 group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-2">Grantly Copilot (Hindi & English)</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Ask in plain Hindi or English: "Which scholarships am I eligible for?", "What documents are missing?", or decode tricky criteria instantly.
              </p>
              <Link to="/copilot" className="text-xs text-[#42D9F5] font-semibold hover:underline flex items-center gap-1">
                Open AI Assistant <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#27C995]/50 transition group">
              <div className="p-3 rounded-xl bg-[#27C995]/20 text-[#27C995] w-fit mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-2">TrustGuard™ Transparency</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Zero tolerance for fraudulent upfront "application fee" scams. Verified official domains, clear disclaimers, and community suspicious listing reporting.
              </p>
              <Link to="/scholarships" className="text-xs text-[#27C995] font-semibold hover:underline flex items-center gap-1">
                Learn Safety Standards <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section className="py-20 border-t border-white/[0.08] bg-[#0c1326]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-6 relative overflow-hidden">
            <div className="inline-flex p-3.5 rounded-2xl bg-[#27C995]/20 text-[#27C995] mx-auto border border-[#27C995]/30">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              TrustGuard™ Transparency Promise
            </h3>

            <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Genuine scholarships never charge an application fee. Grantly AI provides transparent eligibility formulas, links exclusively to official domains, and flags suspicious schemes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-left">
              <div className="p-4 rounded-xl bg-[#080D1B]/80 border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#27C995] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white block">100% Free Access</strong>
                  Never pay any fee to discover or apply for opportunities.
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#080D1B]/80 border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#27C995] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white block">Official URLs</strong>
                  Direct links to accredited educational portals and government portals.
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#080D1B]/80 border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#27C995] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white block">Zero Hallucinations</strong>
                  Eligibility decisions driven by explicit rules, not probabilistic guesses.
                </span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/scholarships"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#8065FF] hover:bg-[#6e4ef8] text-white text-xs font-bold transition shadow-lg shadow-[#8065FF]/30"
              >
                <span>Explore Verified Scholarships</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Signature AI Match Scan Modal */}
      <AiMatchScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
      />

      <Footer />
    </div>
  );
};
