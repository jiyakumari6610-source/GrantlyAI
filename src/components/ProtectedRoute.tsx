import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireOnboarding = false,
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080D1B] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8065FF] to-[#42D9F5] p-0.5 animate-pulse mb-4">
          <div className="w-full h-full bg-[#080D1B] rounded-[14px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#42D9F5] animate-spin" />
          </div>
        </div>
        <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Verifying Authenticated Session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If page requires completed onboarding, check status
  if (requireOnboarding && profile && !profile.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
