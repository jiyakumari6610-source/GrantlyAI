import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  IndianRupee,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Dna,
} from 'lucide-react';
import {
  getStudentProfile,
  saveStudentProfile,
  INITIAL_DEMO_PROFILE,
} from '../services/storageService';
import { StudentProfile, EducationLevel, CategoryType } from '../types';
import { useAuth } from '../context/AuthContext';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile, updateProfileData } = useAuth();
  const existing = authProfile || getStudentProfile();

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<StudentProfile>({
    ...existing,
    id: user?.uid || existing.id || '',
    fullName: user?.displayName || authProfile?.fullName || existing.fullName || '',
    email: user?.email || authProfile?.email || existing.email || '',
    state: existing.state || 'Jharkhand',
    city: existing.city || '',
    dob: existing.dob || '2004-01-01',
    gender: existing.gender || 'Male',
    educationLevel: existing.educationLevel || 'Undergraduate',
    course: existing.course || '',
    college: existing.college || '',
    academicYear: existing.academicYear || 1,
    percentage: existing.percentage || 78,
    annualFamilyIncome: existing.annualFamilyIncome || 220000,
    financialBackground: existing.financialBackground || '',
    estimatedAnnualEducationCost: existing.estimatedAnnualEducationCost || 150000,
    confirmedFunding: existing.confirmedFunding || 0,
    category: existing.category || 'General',
    disabilityStatus: existing.disabilityStatus || false,
    isFirstGen: existing.isFirstGen || false,
    categoryPreferences: existing.categoryPreferences || ['Engineering', 'Merit-cum-Means'],
    onboardingCompleted: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number): boolean => {
    const err: Record<string, string> = {};
    if (currentStep === 1) {
      if (!profile.fullName.trim()) err.fullName = 'Full legal name is required';
      if (!profile.state.trim()) err.state = 'State domicile is required';
      if (!profile.city.trim()) err.city = 'City of residence is required';
    } else if (currentStep === 2) {
      if (!profile.course.trim()) err.course = 'Degree/course title is required';
      if (!profile.college.trim()) err.college = 'College/Institution name is required';
      if (profile.percentage <= 0 || profile.percentage > 100) {
        err.percentage = 'Enter a valid percentage between 1 and 100';
      }
    } else if (currentStep === 3) {
      if (profile.annualFamilyIncome < 0) {
        err.annualFamilyIncome = 'Enter valid annual family income';
      }
      if (profile.estimatedAnnualEducationCost <= 0) {
        err.estimatedAnnualEducationCost = 'Enter estimated annual education cost';
      }
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(4, prev + 1));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleComplete = async () => {
    if (validateStep(step)) {
      const finalProfile: StudentProfile = {
        ...profile,
        id: user?.uid || profile.id,
        email: user?.email || profile.email,
        onboardingCompleted: true,
      };
      saveStudentProfile(finalProfile);
      await updateProfileData(finalProfile);
      navigate('/dashboard');
    }
  };

  const handleFillTemplate = () => {
    setProfile(INITIAL_DEMO_PROFILE);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#080D1B] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#8065FF]/10 via-[#42D9F5]/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 mb-3">
            <Dna className="w-3.5 h-3.5 text-[#8065FF]" />
            <span>Eligibility DNA Profile Setup</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            Build Your Scholarship DNA
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            4 quick steps to calibrate deterministic matching, income cutoffs, and AI document validation.
          </p>

          <button
            type="button"
            onClick={handleFillTemplate}
            className="mt-3 text-xs text-[#42D9F5] hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Sample Profile Template
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className={step >= 1 ? 'text-[#8065FF]' : 'text-slate-500'}>1. Personal</span>
            <span className={step >= 2 ? 'text-[#8065FF]' : 'text-slate-500'}>2. Academic</span>
            <span className={step >= 3 ? 'text-[#8065FF]' : 'text-slate-500'}>3. Financial</span>
            <span className={step >= 4 ? 'text-[#8065FF]' : 'text-slate-500'}>4. Cohort & Goals</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8065FF] to-[#42D9F5] transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Form */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          {/* STEP 1: PERSONAL */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <User className="w-5 h-5 text-[#8065FF]" />
                <h2 className="font-heading text-base font-bold text-white">Personal Identity</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Legal Name (as on Aadhaar / Marksheet)
                </label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  placeholder="e.g. Priya Patel"
                  className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
                />
                {errors.fullName && <p className="text-[11px] text-rose-400 mt-1">{errors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    State of Domicile
                  </label>
                  <select
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8065FF]"
                  >
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Other">Other State</option>
                  </select>
                  {errors.state && <p className="text-[11px] text-rose-400 mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City / District
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="e.g. Ranchi"
                    className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
                  />
                  {errors.city && <p className="text-[11px] text-rose-400 mt-1">{errors.city}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profile.dob}
                    onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                    className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8065FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gender Identity
                  </label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                    className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8065FF]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMIC */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <GraduationCap className="w-5 h-5 text-[#42D9F5]" />
                <h2 className="font-heading text-base font-bold text-white">Academic Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Education Level
                  </label>
                  <select
                    value={profile.educationLevel}
                    onChange={(e) =>
                      setProfile({ ...profile, educationLevel: e.target.value as EducationLevel })
                    }
                    className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8065FF]"
                  >
                    <option value="Undergraduate">Undergraduate (B.Tech, B.Sc, B.Com, etc.)</option>
                    <option value="Postgraduate">Postgraduate (M.Tech, M.Sc, MCA, etc.)</option>
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
                    className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8065FF]"
                  >
                    <option value={1}>1st Year / Freshman</option>
                    <option value={2}>2nd Year / Sophomore</option>
                    <option value={3}>3rd Year / Pre-final</option>
                    <option value={4}>4th Year / Final</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Degree / Course Name
                </label>
                <input
                  type="text"
                  value={profile.course}
                  onChange={(e) => setProfile({ ...profile, course: e.target.value })}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
                />
                {errors.course && <p className="text-[11px] text-rose-400 mt-1">{errors.course}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  College / Institution Name
                </label>
                <input
                  type="text"
                  value={profile.college}
                  onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
                />
                {errors.college && <p className="text-[11px] text-rose-400 mt-1">{errors.college}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Qualifying Marks Percentage (%) or CGPA Equivalent
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={profile.percentage}
                    onChange={(e) =>
                      setProfile({ ...profile, percentage: parseFloat(e.target.value) || 0 })
                    }
                    className="w-32 bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#8065FF]"
                  />
                  <span className="text-xs text-slate-400">
                    Used for minimum cut-off validation in DNA engine (82% = 8.2+ CGPA).
                  </span>
                </div>
                {errors.percentage && <p className="text-[11px] text-rose-400 mt-1">{errors.percentage}</p>}
              </div>
            </div>
          )}

          {/* STEP 3: FINANCIAL */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <IndianRupee className="w-5 h-5 text-[#27C995]" />
                <h2 className="font-heading text-base font-bold text-white">Financial Baseline (INR)</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Annual Family Income (₹ INR)
                </label>
                <div className="relative">
                  <span className="text-xs text-slate-400 absolute left-3.5 top-2.5 font-bold">₹</span>
                  <input
                    type="number"
                    step="10000"
                    value={profile.annualFamilyIncome}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        annualFamilyIncome: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#080D1B] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#8065FF]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Current format: ₹{Number(profile.annualFamilyIncome).toLocaleString('en-IN')} / year. (Must match official income certificate).
                </p>
                {errors.annualFamilyIncome && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.annualFamilyIncome}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estimated Annual College Cost (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={profile.estimatedAnnualEducationCost}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        estimatedAnnualEducationCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#8065FF]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Tuition + Hostel + Books
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirmed Secured Funding (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={profile.confirmedFunding}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        confirmedFunding: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#8065FF]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Family contribution or confirmed aid
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Family Financial Background Notes
                </label>
                <textarea
                  rows={2}
                  value={profile.financialBackground}
                  onChange={(e) => setProfile({ ...profile, financialBackground: e.target.value })}
                  placeholder="e.g. Small landholder farming background; sole earner parent..."
                  className="w-full bg-[#080D1B] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8065FF]"
                />
              </div>
            </div>
          )}

          {/* STEP 4: COHORT & SPECIAL CRITERIA */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="font-heading text-base font-bold text-white">Cohort Preferences & Quotas</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Social / Economic Category
                </label>
                <select
                  value={profile.category}
                  onChange={(e) => setProfile({ ...profile, category: e.target.value as CategoryType })}
                  className="w-full bg-[#080D1B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8065FF]"
                >
                  <option value="General">General / Unreserved</option>
                  <option value="OBC">OBC (Other Backward Class - NCL/State)</option>
                  <option value="EWS">EWS (Economically Weaker Section)</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Unlocks dedicated affirmative action government grants and minority welfare quotas.
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition">
                  <input
                    type="checkbox"
                    checked={profile.isFirstGen}
                    onChange={(e) => setProfile({ ...profile, isFirstGen: e.target.checked })}
                    className="mt-0.5 rounded border-white/20 text-[#8065FF] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      First-Generation College Learner
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Check if you are the first member in your immediate family to attend university. Unlocks special corporate CSR fellowships.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition">
                  <input
                    type="checkbox"
                    checked={profile.disabilityStatus}
                    onChange={(e) => setProfile({ ...profile, disabilityStatus: e.target.checked })}
                    className="mt-0.5 rounded border-white/20 text-[#8065FF] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Person with Benchmark Disability (PwD / Divyangjan)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Unlocks assistive technology stipends and accessible education endowments.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Step
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8065FF] to-[#6744ff] hover:brightness-110 shadow-lg shadow-[#8065FF]/25 transition flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#27C995] to-emerald-600 hover:brightness-110 shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save DNA & Launch Dashboard</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#27C995]" />
          <span>Profile data is saved locally on your device with zero telemetry.</span>
        </div>
      </div>
    </div>
  );
};
