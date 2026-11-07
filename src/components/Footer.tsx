import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#070B16] text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand */}
        <div className="space-y-3 md:col-span-1">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8065FF] to-[#42D9F5] p-0.5">
              <div className="w-full h-full bg-[#080D1B] rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-[#42D9F5]" />
              </div>
            </div>
            <span className="font-heading font-extrabold text-base text-white">
              GRANTLY<span className="text-[#8065FF]">.AI</span>
            </span>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unified intelligent platform helping ambitious students discover scholarships, analyze documents, and secure their future education.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#27C995]">
            <ShieldCheck className="w-4 h-4" />
            <span>TrustGuard™ Audited Platform</span>
          </div>
        </div>

        {/* Product routes */}
        <div>
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white mb-3">
            Core Modules
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/matcher" className="hover:text-white transition">
                Eligibility DNA Engine
              </Link>
            </li>
            <li>
              <Link to="/scholarships" className="hover:text-white transition">
                AI Scholarship Explorer
              </Link>
            </li>
            <li>
              <Link to="/documents" className="hover:text-white transition">
                Document Intelligence Center
              </Link>
            </li>
            <li>
              <Link to="/copilot" className="hover:text-white transition">
                Grantly Copilot (Hindi & English)
              </Link>
            </li>
            <li>
              <Link to="/applications" className="hover:text-white transition">
                Application Command Center
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white mb-3">
            Trust & Transparency
          </h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#27C995]" />
              Zero Fee Policy Guarantee
            </li>
            <li>Official Portal Cross-Referencing</li>
            <li>Multi-Factor Match Explanation</li>
            <li>Privacy First Document Vault</li>
            <li>Demographic Quota Guidance</li>
          </ul>
        </div>

        {/* Security & Compliance */}
        <div className="space-y-2">
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white mb-3">
            Security & Trust
          </h4>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] leading-relaxed text-slate-400">
            Grantly AI indexes fee-free accredited scholarships. Student data is processed securely with local device encryption and zero unauthorized tracking.
          </div>
          <p className="text-[10px] text-slate-500">
            GRANTLY AI • Your Future Deserves Funding.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p className="text-slate-500">
          © 2026 Grantly AI. Tagline: "Your Future Deserves Funding."
        </p>
        <p className="flex items-center gap-1 text-slate-400">
          Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for ambitious learners worldwide.
        </p>
      </div>
    </footer>
  );
};
