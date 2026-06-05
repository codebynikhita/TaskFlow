import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({
    totalTasks: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filter conditions state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    priority: '',
    status: '',
    search: '',
    sortBy: 'createdAt',
    order: 'desc'
  });

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Build query params
      const params = {};
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.priority) params.priority = filters.priority;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.order) params.order = filters.order;

      const response = await api.get('/tasks', { params });
      setTasks(response.data.data.tasks);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const response = await api.get('/dashboard');
      setDashboardStats(response.data.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  // Trigger tasks fetch when filters change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Sync dashboard stats when tasks count changes
  useEffect(() => {
    fetchDashboardStats();
  }, [tasks, fetchDashboardStats]);

  const createTask = async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      const newTask = response.data.data.task;
      
      // Prepend to tasks list or refetch
      setTasks(prev => [newTask, ...prev]);
      fetchDashboardStats();
      return newTask;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to create task';
      throw new Error(errMsg);
    }
  };

  const updateTask = async (id, updateData) => {
    try {
      const response = await api.put(`/tasks/${id}`, updateData);
      const updated = response.data.data.task;

      setTasks(prev => prev.map(t => (t._id === id ? updated : t)));
      fetchDashboardStats();
      return updated;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update task';
      throw new Error(errMsg);
    }
  };

  // Optimistic UI status update for smooth Kanban Drag & Drop
  const moveTaskStatus = async (id, newStatus) => {
    const originalTasks = [...tasks];
    
    // Update local state immediately for micro-interactions responsiveness
    setTasks(prev =>
      prev.map(t => (t._id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
    );

    try {
      await api.put(`/tasks/${id}`, { status: newStatus });
      fetchDashboardStats();
    } catch (err) {
      // Revert if API fails
      setTasks(originalTasks);
      console.error('Failed to update drag-and-drop task status:', err);
      throw new Error('Could not sync status change with server');
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      fetchDashboardStats();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to delete task';
      throw new Error(errMsg);
    }
  };

  const exportCsv = async () => {
    try {
      const response = await api.get('/tasks/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'taskflow_tasks.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      throw new Error('Export CSV failed');
    }
  };

  const exportPdf = async () => {
    try {
      const response = await api.get('/tasks/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'taskflow_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      throw new Error('Export PDF failed');
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        pagination,
        loading,
        filters,
        setFilters,
        dashboardStats,
        statsLoading,
        fetchTasks,
        fetchDashboardStats,
        createTask,
        updateTask,
        moveTaskStatus,
        deleteTask,
        exportCsv,
        exportPdf
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
