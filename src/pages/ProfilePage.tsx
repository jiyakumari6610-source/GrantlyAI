import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  IndianRupee,
  ShieldCheck,
  RotateCcw,
  Save,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  getStudentProfile,
  saveStudentProfile,
  resetStudentData,
  loadSampleEvaluationData,
  INITIAL_DEMO_PROFILE,
} from '../services/storageService';
import { StudentProfile, EducationLevel, CategoryType } from '../types';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile, updateProfileData } = useAuth();
  const [profile, setProfile] = useState<StudentProfile>(authProfile || getStudentProfile());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveStudentProfile(profile);
    if (updateProfileData) {
      await updateProfileData(profile);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearProfile = () => {
    if (window.confirm('Clear your stored profile data from this device?')) {
      setResetting(true);
      resetStudentData();
      setTimeout(() => {
        setResetting(false);
        navigate('/');
        window.location.reload();
      }, 300);
    }
  };

  const handleLoadSample = () => {
    loadSampleEvaluationData();
    setProfile(getStudentProfile());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-[#8065FF]/20 text-[#8065FF]">
              <User className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
              Student Credentials & Baseline
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            Student Profile & Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Keep your academic scores and financial records updated for deterministic matching.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleClearProfile}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-[#42D9F5]' : ''}`} />
            <span>Clear Profile Data</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 text-[#27C995] text-xs font-semibold border border-emerald-500/30 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>Profile updated! All scholarship match scores have been recalculated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <User className="w-5 h-5 text-[#8065FF]" />
            <h2 className="font-heading text-base font-bold text-white">Personal Identity</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                State Domicile
              </label>
              <select
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              >
                <option value="Jharkhand">Jharkhand</option>
                <option value="Bihar">Bihar</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Delhi">Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Other">Other State</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                City / District
              </label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gender Identity
              </label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={profile.dob}
                onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              />
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <GraduationCap className="w-5 h-5 text-[#42D9F5]" />
            <h2 className="font-heading text-base font-bold text-white">Academic Qualifications</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Education Level
              </label>
              <select
                value={profile.educationLevel}
                onChange={(e) =>
                  setProfile({ ...profile, educationLevel: e.target.value as EducationLevel })
                }
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              >
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Diploma / Polytechnic">Diploma / Polytechnic</option>
                <option value="Class 12 / Higher Secondary">Class 12 / Higher Secondary</option>
                <option value="Doctoral / PhD">Doctoral / PhD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Academic Year
              </label>
              <select
                value={profile.academicYear}
                onChange={(e) => setProfile({ ...profile, academicYear: parseInt(e.target.value, 10) })}
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Course / Major
              </label>
              <input
                type="text"
                required
                value={profile.course}
                onChange={(e) => setProfile({ ...profile, course: e.target.value })}
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                College / Institution
              </label>
              <input
                type="text"
                required
                value={profile.college}
                onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Previous Exam Aggregate (%) or CGPA
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="100"
                required
                value={profile.percentage}
                onChange={(e) =>
                  setProfile({ ...profile, percentage: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#8065FF]"
              />
            </div>
          </div>
        </div>

        {/* Financial & Cost Settings */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <IndianRupee className="w-5 h-5 text-[#27C995]" />
            <h2 className="font-heading text-base font-bold text-white">Financial Details (INR)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Annual Family Income (₹)
              </label>
              <input
                type="number"
                step="10000"
                required
                value={profile.annualFamilyIncome}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    annualFamilyIncome: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#8065FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estimated Annual College Cost (₹)
              </label>
              <input
                type="number"
                step="10000"
                required
                value={profile.estimatedAnnualEducationCost}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    estimatedAnnualEducationCost: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#8065FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirmed Secured Funding (₹)
              </label>
              <input
                type="number"
                step="5000"
                required
                value={profile.confirmedFunding}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    confirmedFunding: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#8065FF]"
              />
            </div>
          </div>
        </div>

        {/* Quotas & Cohorts */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-heading text-base font-bold text-white">Social Category & Special Quotas</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Designated Category
              </label>
              <select
                value={profile.category}
                onChange={(e) => setProfile({ ...profile, category: e.target.value as CategoryType })}
                className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8065FF]"
              >
                <option value="OBC">OBC (Other Backward Class)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
                <option value="General">General / Open</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex flex-col justify-center space-y-2 pt-2">
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isFirstGen}
                  onChange={(e) => setProfile({ ...profile, isFirstGen: e.target.checked })}
                  className="rounded border-white/20 text-[#8065FF]"
                />
                <span>First-Generation College Student in immediate family</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.disabilityStatus}
                  onChange={(e) => setProfile({ ...profile, disabilityStatus: e.target.checked })}
                  className="rounded border-white/20 text-[#8065FF]"
                />
                <span>Benchmark Disability (PwD / Divyangjan)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#8065FF] to-[#603bfa] hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-[#8065FF]/30 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Recalculate Matches</span>
          </button>
        </div>
      </form>
    </div>
  );
};
