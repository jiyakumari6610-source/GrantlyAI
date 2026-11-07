import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Kanban,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Plus,
  Trash2,
  ExternalLink,
  Edit3,
  Bookmark,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  getApplications,
  updateApplicationStatus,
  removeApplication,
} from '../services/storageService';
import { DEMO_SCHOLARSHIPS } from '../data/scholarships';
import { ApplicationRecord, ApplicationStatus, Scholarship } from '../types';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { useAuth } from '../context/AuthContext';
import {
  fetchUserApplications,
  persistUserApplication,
  deleteUserApplication,
} from '../services/firebase';

const STATUS_COLUMNS: { status: ApplicationStatus; title: string; color: string; badge: string }[] = [
  { status: 'Saved', title: 'Saved for Later', color: 'border-slate-500/40 text-slate-300', badge: 'bg-white/5 text-slate-400' },
  { status: 'Preparing', title: 'Preparing Documents', color: 'border-[#8065FF]/40 text-violet-300', badge: 'bg-[#8065FF]/20 text-violet-300' },
  { status: 'Ready to Apply', title: 'Ready to Apply', color: 'border-[#42D9F5]/40 text-[#42D9F5]', badge: 'bg-[#42D9F5]/20 text-[#42D9F5]' },
  { status: 'Applied', title: 'Applied / Submitted', color: 'border-blue-500/40 text-blue-300', badge: 'bg-blue-500/20 text-blue-300' },
  { status: 'Under Review', title: 'Under Review', color: 'border-amber-500/40 text-amber-300', badge: 'bg-amber-500/20 text-amber-300' },
  { status: 'Approved', title: 'Approved / Awarded', color: 'border-[#27C995]/40 text-[#27C995]', badge: 'bg-[#27C995]/20 text-[#27C995]' },
];

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationRecord[]>(getApplications());
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<string>('');

  // Fetch applications from Firestore when authenticated
  React.useEffect(() => {
    if (user) {
      fetchUserApplications(user.uid)
        .then((remoteApps) => {
          if (remoteApps && remoteApps.length > 0) {
            setApplications(remoteApps);
          }
        })
        .catch((e) => console.warn('Could not fetch applications from Firestore:', e));
    }
  }, [user]);

  const getScholarship = (scholarshipId: string): Scholarship | undefined => {
    return DEMO_SCHOLARSHIPS.find((s) => s.id === scholarshipId);
  };

  const handleStatusChange = (scholarshipId: string, newStatus: ApplicationStatus) => {
    const updated = updateApplicationStatus(scholarshipId, newStatus);
    setApplications([...updated]);
    if (user) {
      const target = updated.find((a) => a.scholarshipId === scholarshipId);
      if (target) {
        persistUserApplication(user.uid, target).catch((e) => console.warn('Firestore application persist error:', e));
      }
    }
  };

  const handleRemove = (scholarshipId: string) => {
    if (window.confirm('Remove this application from tracker?')) {
      const updated = removeApplication(scholarshipId);
      setApplications([...updated]);
      if (user) {
        deleteUserApplication(user.uid, scholarshipId).catch((e) => console.warn('Firestore application delete error:', e));
      }
    }
  };

  const handleSaveNotes = (scholarshipId: string) => {
    const app = applications.find((a) => a.scholarshipId === scholarshipId);
    if (app) {
      const updated = updateApplicationStatus(scholarshipId, app.status, notesInput);
      setApplications([...updated]);
      setEditingNotesId(null);
      if (user) {
        const target = updated.find((a) => a.scholarshipId === scholarshipId);
        if (target) {
          persistUserApplication(user.uid, target).catch((e) => console.warn('Firestore application persist error:', e));
        }
      }
    }
  };

  const totalSaved = applications.length;
  const inProgress = applications.filter(
    (a) => a.status === 'Preparing' || a.status === 'Ready to Apply'
  ).length;
  const submitted = applications.filter(
    (a) => a.status === 'Applied' || a.status === 'Under Review'
  ).length;
  const approved = applications.filter((a) => a.status === 'Approved').length;

  const completionRatio = totalSaved > 0 ? Math.round(((submitted + approved) / totalSaved) * 100) : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
              <Kanban className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Application Tracker
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            Application Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage preparation cycles, deadline milestones, and status progressions.
          </p>
        </div>

        {/* View toggle & Action button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="p-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-[#8065FF] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'timeline'
                  ? 'bg-[#8065FF] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Timeline View
            </button>
          </div>

          <Link
            to="/scholarships"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8065FF] hover:bg-[#6c48ff] text-white text-xs font-bold transition shadow-md shadow-[#8065FF]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add More</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Counters + Progress Bar Banner */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#080D1B]/80 border border-white/5">
            <span className="text-[11px] text-slate-400 block">Total In Tracker</span>
            <span className="text-2xl font-bold font-heading text-white mt-0.5 block">
              <AnimatedCounter value={totalSaved} />
            </span>
            <span className="text-[10px] text-slate-500">Saved Opportunities</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#080D1B]/80 border border-white/5">
            <span className="text-[11px] text-violet-300 block">Preparing / Ready</span>
            <span className="text-2xl font-bold font-heading text-[#8065FF] mt-0.5 block">
              <AnimatedCounter value={inProgress} />
            </span>
            <span className="text-[10px] text-slate-500">Document Assembly</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#080D1B]/80 border border-white/5">
            <span className="text-[11px] text-[#42D9F5] block">Submitted / Review</span>
            <span className="text-2xl font-bold font-heading text-[#42D9F5] mt-0.5 block">
              <AnimatedCounter value={submitted} />
            </span>
            <span className="text-[10px] text-slate-500">Active Committee Review</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#080D1B]/80 border border-white/5">
            <span className="text-[11px] text-[#27C995] block">Approved / Awarded</span>
            <span className="text-2xl font-bold font-heading text-[#27C995] mt-0.5 block">
              <AnimatedCounter value={approved} />
            </span>
            <span className="text-[10px] text-slate-500">Secured Funding</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-[#27C995]" />
              Submission Pipeline Progress ({submitted + approved} of {totalSaved} completed)
            </span>
            <span className="font-mono font-bold text-[#42D9F5]">{completionRatio}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#8065FF] to-[#27C995] rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${completionRatio}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {STATUS_COLUMNS.map((col) => {
            const colApps = applications.filter((a) => a.status === col.status);
            return (
              <div
                key={col.status}
                className="glass-card rounded-3xl p-4 border border-white/10 flex flex-col min-h-[400px] shadow-lg"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full border ${col.color}`} />
                    <h3 className="font-heading text-xs font-bold text-white uppercase tracking-wider">
                      {col.title}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {colApps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {colApps.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-center p-4 rounded-2xl border border-dashed border-white/10">
                      <p className="text-[11px] text-slate-500">No applications in this stage</p>
                    </div>
                  ) : (
                    colApps.map((app) => {
                      const scholarship = getScholarship(app.scholarshipId);
                      if (!scholarship) return null;

                      const isEditing = editingNotesId === app.scholarshipId;

                      return (
                        <div
                          key={app.scholarshipId}
                          className="p-4 rounded-2xl bg-[#080D1B]/95 border border-white/10 hover:border-[#8065FF]/40 transition-all space-y-3 shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-semibold text-[#8065FF] truncate block max-w-[170px]">
                              {scholarship.provider}
                            </span>
                            <button
                              onClick={() => handleRemove(app.scholarshipId)}
                              title="Remove application"
                              className="text-slate-500 hover:text-rose-400 p-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <Link to={`/scholarships/${scholarship.id}`}>
                            <h4 className="text-xs font-bold text-white hover:text-[#42D9F5] transition leading-snug">
                              {scholarship.name}
                            </h4>
                          </Link>

                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="font-semibold text-white flex items-center gap-0.5">
                              <IndianRupee className="w-3 h-3 text-[#27C995]" />
                              ₹{scholarship.awardAmount.toLocaleString('en-IN')}
                            </span>
                            <span
                              className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                                scholarship.daysLeft <= 15
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'text-slate-400 bg-white/5'
                              }`}
                            >
                              {scholarship.daysLeft}d left
                            </span>
                          </div>

                          {/* Notes */}
                          <div className="pt-2 border-t border-white/5">
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  rows={2}
                                  value={notesInput}
                                  onChange={(e) => setNotesInput(e.target.value)}
                                  className="w-full bg-[#111A2D] border border-white/10 rounded-lg p-2 text-[11px] text-white focus:outline-none focus:border-[#8065FF]"
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingNotesId(null)}
                                    className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveNotes(app.scholarshipId)}
                                    className="px-2 py-0.5 rounded text-[10px] bg-[#8065FF] text-white font-semibold"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setEditingNotesId(app.scholarshipId);
                                  setNotesInput(app.notes);
                                }}
                                className="group cursor-pointer flex items-start justify-between gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                              >
                                <p className="italic line-clamp-2">
                                  {app.notes || 'Click to add notes...'}
                                </p>
                                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition shrink-0 mt-0.5 text-[#42D9F5]" />
                              </div>
                            )}
                          </div>

                          {/* Move Status Dropdown */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                              Status:
                            </span>
                            <select
                              value={app.status}
                              onChange={(e) =>
                                handleStatusChange(app.scholarshipId, e.target.value as ApplicationStatus)
                              }
                              className="bg-[#111A2D] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[#8065FF]"
                            >
                              <option value="Saved">Saved</option>
                              <option value="Preparing">Preparing</option>
                              <option value="Ready to Apply">Ready to Apply</option>
                              <option value="Applied">Applied</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8065FF]" />
              Application Deadlines & Milestones
            </h3>
            <span className="text-xs text-slate-400 font-mono">Sorted by Upcoming Closure</span>
          </div>

          <div className="relative border-l-2 border-white/10 ml-4 space-y-6 py-2">
            {applications
              .map((app) => ({ app, s: getScholarship(app.scholarshipId) }))
              .filter((item): item is { app: ApplicationRecord; s: Scholarship } => !!item.s)
              .sort((a, b) => a.s.daysLeft - b.s.daysLeft)
              .map(({ app, s }) => (
                <div key={app.scholarshipId} className="relative pl-6">
                  {/* Timeline dot */}
                  <span
                    className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-[#080D1B] ${
                      s.daysLeft <= 15
                        ? 'bg-rose-500 animate-ping'
                        : s.daysLeft <= 30
                        ? 'bg-amber-500'
                        : 'bg-[#27C995]'
                    }`}
                  />

                  <div className="p-4 rounded-2xl bg-[#080D1B]/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{s.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#42D9F5] border border-white/10 font-semibold">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Provider: {s.provider}</p>
                      <p className="text-xs text-slate-300 italic">{app.notes}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          ₹{s.awardAmount.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            s.daysLeft <= 15 ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          {s.deadline} ({s.daysLeft}d left)
                        </span>
                      </div>

                      <Link
                        to={`/scholarships/${s.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
