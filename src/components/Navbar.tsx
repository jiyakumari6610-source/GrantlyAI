import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Menu,
  X,
  Compass,
  FileCheck,
  Bot,
  Kanban,
  Dna,
  User,
  ArrowRight,
  LogOut,
  MailCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout, emailVerified, resendEmailVerification } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [verificationNotified, setVerificationNotified] = useState(false);

  // Compute initials from real authenticated profile or fallback
  const displayName = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || '';
  const initials = displayName
    ? displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'ST';

  const navLinks = [
    { label: 'DNA Matcher', path: '/matcher', icon: Dna },
    { label: 'Scholarships', path: '/scholarships', icon: Compass },
    { label: 'Documents', path: '/documents', icon: FileCheck },
    { label: 'Applications', path: '/applications', icon: Kanban },
    { label: 'Copilot AI', path: '/copilot', icon: Bot },
  ];

  const isLandingPage = location.pathname === '/';

  const handleMobileToggle = () => {
    if (!isLandingPage && onToggleSidebar) {
      onToggleSidebar();
    } else {
      setMobileMenuOpen(!mobileMenuOpen);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const handleResendVerification = async () => {
    try {
      await resendEmailVerification();
      setVerificationNotified(true);
      setTimeout(() => setVerificationNotified(false), 4000);
    } catch (e) {
      console.warn('Could not resend email:', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#080D1B]/90 backdrop-blur-md">
      {/* Email Verification Banner */}
      {user && !emailVerified && (
        <div className="bg-[#8065FF]/20 border-b border-[#8065FF]/30 px-4 py-1.5 text-center text-xs text-slate-200 flex items-center justify-center gap-2">
          <MailCheck className="w-3.5 h-3.5 text-[#42D9F5]" />
          <span>Please verify your email address (<strong>{user.email}</strong>) to secure your account.</span>
          <button
            onClick={handleResendVerification}
            className="text-xs font-bold text-[#42D9F5] hover:underline ml-1"
          >
            {verificationNotified ? 'Verification email sent!' : 'Resend link'}
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger toggle + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleMobileToggle}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen && isLandingPage ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8065FF] to-[#42D9F5] p-0.5 shadow-lg shadow-[#8065FF]/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-[#080D1B] rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-[#42D9F5]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-lg tracking-tight text-white group-hover:text-[#42D9F5] transition">
                  GRANTLY<span className="text-[#8065FF]">.AI</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Your Future Deserves Funding.</p>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation links */}
        {!isLandingPage && (
          <nav className="hidden lg:flex items-center gap-1 bg-[#111A2D]/80 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-[#8065FF] text-white shadow-md shadow-[#8065FF]/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#42D9F5] animate-pulse ml-0.5" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8065FF] to-[#42D9F5] flex items-center justify-center text-[11px] font-bold text-white shadow">
                  {initials}
                </div>
                <div className="hidden sm:block text-left max-w-[130px]">
                  <span className="text-xs font-semibold text-white block leading-tight truncate">
                    {displayName || 'Student'}
                  </span>
                  <span className="text-[10px] text-[#42D9F5] block leading-tight font-mono truncate">
                    {profile?.course || user.email?.split('@')[0]}
                  </span>
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign out from Firebase"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 border border-transparent hover:border-rose-500/20 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : isLandingPage ? (
            <div className="flex items-center gap-2">
              <Link
                to="/scholarships"
                className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                Catalog
              </Link>
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8065FF] to-[#6344f6] hover:brightness-110 transition shadow-lg shadow-[#8065FF]/25 animate-shimmer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#42D9F5]" />
                <span>Get Started</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8065FF] to-[#6344f6] hover:brightness-110 shadow-md shadow-[#8065FF]/20 transition"
              >
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer (active on landing page or when open) */}
      {mobileMenuOpen && isLandingPage && (
        <div className="lg:hidden bg-[#080D1B] border-b border-white/10 px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/5"
          >
            <Sparkles className="w-4 h-4 text-[#8065FF]" />
            Dashboard
          </Link>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5"
              >
                <Icon className="w-4 h-4 text-[#42D9F5]" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full py-2 text-center text-xs text-rose-300 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 font-medium"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs text-slate-300 bg-white/5 rounded-xl hover:bg-white/10 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs font-bold text-white bg-[#8065FF] rounded-xl hover:bg-[#6c4fff]"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
