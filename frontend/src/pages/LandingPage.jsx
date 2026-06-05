import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles,
  CheckCircle2,
  Kanban,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      title: 'Interactive Kanban Board',
      description: 'Easily track and adjust progress by dragging cards between Todo, In Progress, and Completed columns.',
      icon: Kanban,
      color: 'text-brand-500 bg-brand-50 dark:bg-brand-950/30'
    },
    {
      title: 'Real-Time Insights',
      description: 'Review task completion metrics and priority distribution ratios dynamically on a unified dashboard.',
      icon: TrendingUp,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
    },
    {
      title: 'Exports & Reporting',
      description: 'Download your task logs as standard CSV worksheets or print-friendly PDF summaries instantly.',
      icon: FileSpreadsheet,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
    },
    {
      title: 'Enterprise Security',
      description: 'Safeguard sessions with HTTP-only refresh tokens, rate limit defenses, and Helmet headers.',
      icon: ShieldCheck,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 transition-colors duration-300 hero-gradient overflow-hidden">
      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-1.5 rounded-lg text-white">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>

          {user ? (
            <Link
              to="/dashboard"
              className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-brand-500/10 transition-all duration-200 flex items-center gap-2"
            >
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-brand-500/10 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 mb-6 border border-brand-200/30">
          ⚡ Unleash Your Productivity
        </span>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          Streamline Your Workflows with{' '}
          <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
          A secure, high-performance task management ecosystem engineered with drag-and-drop boards, detailed metrics, activity audits, and automated reminders.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={user ? '/dashboard' : '/register'}
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 flex items-center justify-center"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Everything you need to orchestrate projects
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            A carefully curated feature set designed to bring architecture-level scalability and simplicity to your task lists.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="glass-panel p-6 rounded-2xl hover:translate-y-[-4px] hover:shadow-md transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${feature.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200">{feature.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-white/40 dark:bg-slate-900/10 rounded-3xl border border-slate-200/40 dark:border-slate-800/20 mb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10">What developers are saying</h2>
          <blockquote className="text-xl sm:text-2xl font-medium italic text-slate-800 dark:text-slate-200 mb-8 leading-relaxed">
            "TaskFlow combines aesthetic excellence with top-tier security structure. The token rotation flows, automated email cron runs, and custom NoSQL filters make it a resume-defining build for developers."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-md">
              JD
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">Jordan Davis</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Lead Devops Architect at StackScale</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer */}
      <section className="text-center py-24 border-t border-slate-200/50 dark:border-slate-800/40 relative">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Ready to flow?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
          Start organising task pipelines within minutes. Experience zero credit-card entry and instantaneous setup.
        </p>
        <Link
          to="/register"
          className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-brand-500/20 inline-flex items-center gap-2 hover:scale-[1.01] transition-transform"
        >
          Sign Up Now <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
