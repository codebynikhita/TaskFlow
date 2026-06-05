import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  CheckSquare,
  User,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, loading, logoutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-brand-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  // Protect route: redirect to login if user not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Task Board', path: '/tasks', icon: CheckSquare },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="h-16 flex items-center px-6 gap-2 border-b border-slate-200 dark:border-slate-800">
          <div className="bg-brand-600 p-1.5 rounded-lg text-white">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
            TaskFlow
          </span>
          {user.role === 'Admin' && (
            <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold px-1.5 py-0.5 rounded uppercase">
              Admin
            </span>
          )}
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={logoutUser}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 text-rose-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-64 bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl animate-slide-in-right">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="bg-brand-600 p-1.5 rounded-lg text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
                  TaskFlow
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logoutUser();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200"
              >
                <LogOut className="w-5 h-5 text-rose-500" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 capitalize">
              {location.pathname.substring(1).replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

            {/* Profile Brief Info */}
            <Link to="/profile" className="flex items-center gap-3 group">
              <span className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {user.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
              </span>

              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
