import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Dna,
  Compass,
  FileCheck,
  Bot,
  Kanban,
  User,
  ShieldCheck,
  Sparkles,
  UserPlus,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import {
  getDocuments,
  calculateDocumentReadiness,
} from '../services/storageService';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, profile, logout, emailVerified, isFirestoreOnline } = useAuth();
  const docs = getDocuments();
  const readiness = calculateDocumentReadiness(docs);

  const displayName = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || '';
  const initials = displayName
    ? displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'ST';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'DNA Matcher', path: '/matcher', icon: Dna, badge: 'AI Engine' },
    { name: 'Scholarship Explorer', path: '/scholarships', icon: Compass },
    { name: 'Document Center', path: '/documents', icon: FileCheck, badge: `${readiness.overallScore}%` },
    { name: 'Grantly Copilot', path: '/copilot', icon: Bot, badge: 'Live AI' },
    { name: 'Application Tracker', path: '/applications', icon: Kanban },
    { name: 'Student Profile', path: '/profile', icon: User },
  ];

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 glass-panel border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 bg-[#080D1B]/95 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className="p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#8065FF] to-[#603bfa] text-white shadow-lg shadow-[#8065FF]/25 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#42D9F5]' : ''}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/10">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Quick Snapshot Card */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#111A2D] to-[#16213a] border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#42D9F5] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  DNA Readiness
                </span>
                <span className="text-xs font-bold text-white">{readiness.overallScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[#8065FF] to-[#42D9F5] rounded-full transition-all duration-500"
                  style={{ width: `${readiness.overallScore}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {readiness.verifiedCount} of 4 core certificates audited.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Profile card */}
        <div className="p-4 border-t border-white/[0.08] bg-[#080D1B]/90">
          {user ? (
            <div className="space-y-2">
              <Link to="/profile" onClick={onClose} className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8065FF] to-[#42D9F5] flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0">
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate group-hover:text-[#42D9F5] transition">
                      {displayName || 'Student User'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate font-mono">
                      {profile?.course || user.email}
                    </p>
                  </div>
                </div>
                <span className="p-1 rounded-lg bg-emerald-500/10 text-[#27C995] border border-emerald-500/20 text-[9px] font-bold px-1.5 py-0.5 shrink-0">
                  {emailVerified ? 'VERIFIED' : 'ACTIVE'}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full mt-2 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 border border-white/5 text-slate-400 text-xs font-medium flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#8065FF]" />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Sign In / Register
                </span>
              </div>
              <span className="text-[10px] text-[#42D9F5] font-semibold">Start →</span>
            </Link>
          )}

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1 text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#27C995]" />
              {isFirestoreOnline ? 'Firestore Online' : 'Connecting...'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Firebase v11</span>
          </div>
        </div>
      </aside>
    </>
  );
};
