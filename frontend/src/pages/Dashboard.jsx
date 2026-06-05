import React, { useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import {
  ListTodo,
  CheckCircle,
  PlayCircle,
  AlertCircle,
  Activity,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { dashboardStats, fetchDashboardStats, statsLoading } = useTasks();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (statsLoading || !dashboardStats) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-80 lg:col-span-2 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const {
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    highPriorityTasks,
    recentActivity
  } = dashboardStats;

  // Calculate completion percentage
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const inProgressPercentage = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const pendingPercentage = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

  // SVG parameters for the circular progress donut
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  const cards = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      subtext: 'Created task items',
      icon: ListTodo,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'Completed',
      value: completedTasks,
      subtext: `${completionPercentage}% completion rate`,
      icon: CheckCircle,
      color: 'from-emerald-400 to-teal-500',
      textColor: 'text-emerald-500'
    },
    {
      title: 'In Progress',
      value: inProgressTasks,
      subtext: `${inProgressPercentage}% focus rate`,
      icon: PlayCircle,
      color: 'from-amber-400 to-orange-500',
      textColor: 'text-amber-500'
    },
    {
      title: 'Pending (Todo)',
      value: pendingTasks,
      subtext: `${pendingPercentage}% waiting queue`,
      icon: AlertCircle,
      color: 'from-slate-400 to-slate-600',
      textColor: 'text-slate-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Welcome back, {user.name} <Sparkles className="w-6 h-6 text-brand-500 animate-pulse" />
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's a snapshot of your workspace stats and latest updates.
          </p>
        </div>
        <Link
          to="/tasks"
          className="self-start md:self-center bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-brand-500/10 active:scale-98 transition-all flex items-center gap-2"
        >
          View Task Board <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="glass-panel p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {card.title}
                  </p>
                  <h3 className="text-3xl font-bold mt-2 text-slate-800 dark:text-slate-100">
                    {card.value}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 ${card.textColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium">
                {card.subtext}
              </p>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`}></div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts & Activity Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SVG Circle Graph (Task Distribution) */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Task Performance Metrics</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Visual breakdown of current statuses and priorities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around py-8 gap-8">
            {/* Interactive SVG Progress Ring */}
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-slate-100 dark:stroke-slate-800 fill-transparent"
                  strokeWidth="10"
                />
                {totalTasks > 0 && (
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="stroke-brand-500 transition-all duration-500 ease-in-out fill-transparent"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                  {completionPercentage}%
                </span>
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  Done
                </p>
              </div>
            </div>

            {/* Distribution Legend */}
            <div className="flex-1 max-w-xs space-y-4">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Completed
                  </span>
                  <span>{completedTasks} / {totalTasks}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${completionPercentage}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span> In Progress
                  </span>
                  <span>{inProgressTasks} / {totalTasks}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${inProgressPercentage}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-600"></span> Pending
                  </span>
                  <span>{pendingTasks} / {totalTasks}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-400 dark:bg-slate-600 h-full rounded-full" style={{ width: `${pendingPercentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              High priority tasks active: <strong className="text-red-500">{highPriorityTasks}</strong>
            </span>
          </div>
        </div>

        {/* Activity Logs Timeline */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Audit & Session Logs</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Your recent workspace activities.
            </p>
          </div>

          <div className="my-6 space-y-4 overflow-y-auto max-h-60 pr-1">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((log, index) => (
                <div key={log._id || index} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0 z-10 border border-slate-200/50 dark:border-slate-800">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    {index !== recentActivity.length - 1 && (
                      <div className="w-0.5 bg-slate-200 dark:bg-slate-800 flex-1 my-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {log.action}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                No recent activity logs.
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Realtime updates active
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
