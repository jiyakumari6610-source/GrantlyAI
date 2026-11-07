import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ExternalLink, X, Flag, CheckCircle2 } from 'lucide-react';
import { Scholarship } from '../types';
import { reportSuspiciousScholarship } from '../services/storageService';
import { createTrustGuardReport } from '../services/firebase';

interface TrustGuardModalProps {
  scholarship: Scholarship;
  isOpen: boolean;
  onClose: () => void;
}

export const TrustGuardModal: React.FC<TrustGuardModalProps> = ({ scholarship, isOpen, onClose }) => {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('advance_fee');
  const [details, setDetails] = useState('');
  const [reportedSuccess, setReportedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const reportData = reportSuspiciousScholarship({
      scholarshipId: scholarship.id,
      scholarshipName: scholarship.name,
      reason,
      details,
    });

    try {
      await createTrustGuardReport(reportData);
    } catch (firestoreErr) {
      console.warn('Could not save report to Firestore:', firestoreErr);
    }

    try {
      await fetch('/api/trustguard/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scholarshipId: scholarship.id,
          scholarshipName: scholarship.name,
          reason,
          details,
        }),
      });
    } catch (err) {
      // Handled gracefully
    }

    setReportedSuccess(true);
    setTimeout(() => {
      setReportedSuccess(false);
      setReporting(false);
      onClose();
    }, 2000);
  };

  const isSuspicious = scholarship.verificationStatus === 'Flagged Suspicious' || scholarship.isSuspiciousWarning;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isSuspicious ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-[#27C995]/20 text-[#27C995] border border-[#27C995]/30'}`}>
              {isSuspicious ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                TrustGuard™ Transparency
              </h3>
              <p className="text-xs text-slate-400">Independent Scholarship Verification Audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!reporting ? (
          <div className="mt-4 space-y-4">
            <div className="bg-[#080D1B]/70 p-3.5 rounded-xl border border-white/5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Opportunity Name
              </span>
              <p className="text-sm font-semibold text-white">{scholarship.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">Provider: {scholarship.provider} ({scholarship.providerType})</p>
            </div>

            {/* Verification Status Details */}
            <div className={`p-4 rounded-xl border ${isSuspicious ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'}`}>
              <div className="flex items-start gap-2.5">
                {isSuspicious ? <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" /> : <ShieldCheck className="w-5 h-5 text-[#27C995] shrink-0 mt-0.5" />}
                <div>
                  <h4 className="text-sm font-semibold mb-1">
                    {isSuspicious ? 'High Risk Warning: Suspicious Activity Detected' : 'Audited Educational Opportunity'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isSuspicious
                      ? 'This listing was flagged for requesting fees or using unverified communication channels. Genuine scholarships NEVER charge an application or registration fee.'
                      : 'This opportunity structure has been verified against accredited educational frameworks. All application links lead to simulated official portals.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03]">
                <span className="text-slate-400">Zero Application Fee Rule</span>
                <span className={`font-semibold ${isSuspicious ? 'text-rose-400 flex items-center gap-1' : 'text-[#27C995] flex items-center gap-1'}`}>
                  {isSuspicious ? 'Failed: Demands Payment' : 'Passed: 100% Free'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03]">
                <span className="text-slate-400">Official Portal Domain</span>
                <a
                  href={scholarship.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#42D9F5] hover:underline flex items-center gap-1 font-mono"
                >
                  {new URL(scholarship.officialSourceUrl).hostname}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03]">
                <span className="text-slate-400">Audit Status</span>
                <span className="text-slate-300 font-semibold">{scholarship.verificationStatus}</span>
              </div>
            </div>

            {/* Disclaimer Callout */}
            <p className="text-[11px] text-slate-400 bg-[#080D1B]/50 p-2.5 rounded-lg border border-white/5">
              Verification Notice: Criteria and timelines reflect published educational circulars. Grantly AI does not charge fees or guarantee government funding decisions. Always verify criteria on the official provider portal.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setReporting(true)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition py-1.5 px-3 rounded-lg hover:bg-rose-500/10"
              >
                <Flag className="w-3.5 h-3.5" />
                Report Suspicious Listing
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold bg-[#8065FF] hover:bg-[#6c4fff] text-white rounded-xl transition shadow-lg shadow-[#8065FF]/20"
              >
                Close Audit
              </button>
            </div>
          </div>
        ) : (
          /* Report Form */
          <form onSubmit={handleReport} className="mt-4 space-y-4">
            {reportedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#27C995] mx-auto animate-bounce" />
                <h4 className="text-sm font-semibold text-white">Report Submitted to TrustGuard</h4>
                <p className="text-xs text-slate-400">Thank you for protecting the student community.</p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                  Help keep GRANTLY safe. We investigate any scheme asking for upfront fees, private passwords, or fake guaranteed awards.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Reason for Reporting
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
                  >
                    <option value="advance_fee">Demands upfront "Registration" or "Processing" fee</option>
                    <option value="fake_link">Unofficial or phishing external link</option>
                    <option value="misleading_criteria">Misleading or false eligibility criteria</option>
                    <option value="impersonation">Impersonating government or college body</option>
                    <option value="other">Other suspicious activity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Additional Details
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide any context, WhatsApp link, or payment request URL..."
                    className="w-full bg-[#080D1B] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReporting(false)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
