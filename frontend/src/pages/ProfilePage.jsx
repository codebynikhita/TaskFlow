import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Upload,
  CheckCircle,
  Clock,
  Sparkles,
  Loader2
} from 'lucide-react';

const ProfilePage = () => {
  const { user, updateAvatar } = useAuth();
  const { dashboardStats, fetchDashboardStats } = useTasks();

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDashboardStats();
    setAvatarPreview(user?.avatar || '');
  }, [user, fetchDashboardStats]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (limit to 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setError('Image must be less than 3MB in size');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setAvatarPreview(base64String); // Show immediate local preview

      try {
        await updateAvatar(base64String);
        setSuccess('Avatar updated successfully!');
      } catch (err) {
        setError(err.message || 'Failed to upload image. Please try again.');
        setAvatarPreview(user?.avatar || ''); // Revert preview on failure
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file.');
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Profile Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account information and view usage activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="relative group cursor-pointer" onClick={triggerFileInput}>
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user?.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md group-hover:opacity-85 transition-opacity"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-4xl shadow-md group-hover:scale-98 transition-transform">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Upload className="w-6 h-6" />
            </div>

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={triggerFileInput}
            disabled={uploading}
            className="mt-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
          >
            Change Photo
          </button>
          
          <p className="text-[10px] text-slate-400 mt-2">
            Supports JPG, PNG (Max 3MB)
          </p>

          {(error || success) && (
            <div className="w-full mt-4">
              {error && <span className="text-xs text-rose-500 font-semibold">{error}</span>}
              {success && <span className="text-xs text-emerald-500 font-semibold">{success}</span>}
            </div>
          )}
        </div>

        {/* User Details Details Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl md:col-span-2 space-y-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            Account Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Name</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Member Since</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Role Access</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                  {user?.role}
                  {user?.role === 'Admin' && (
                    <span className="text-[9px] bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold px-1 rounded uppercase">
                      Admin privileges
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Summary Stats */}
      {dashboardStats && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            Workspace Summary <Sparkles className="w-5 h-5 text-brand-500" />
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
            <div className="p-5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/40 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Tasks</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {dashboardStats.totalTasks - dashboardStats.completedTasks}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/40 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tasks Completed</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {dashboardStats.completedTasks}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/40 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">High Priority</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {dashboardStats.highPriorityTasks}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
