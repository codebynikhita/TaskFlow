import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-4 border-brand-200 dark:border-brand-950 border-t-brand-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect them to the dashboard directly
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 hero-gradient">
      <div className="w-full max-w-md p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
