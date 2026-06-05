import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Field Validations
    if (!name || !email || !password) {
      setValidationError('All fields are required');
      return;
    }

    if (name.length < 3) {
      setValidationError('Name must be at least 3 characters long');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await registerUser(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setValidationError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-3xl shadow-xl transition-all duration-300 w-full animate-slide-up bg-white/95 dark:bg-slate-900/95">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-brand-600 p-2 rounded-xl text-white mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Get Started</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Create an account to manage your workflows
        </p>
      </div>

      {validationError && (
        <div className="mb-6 p-4 text-sm bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/30">
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
            placeholder="name@domain.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
