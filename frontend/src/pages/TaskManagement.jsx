import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import {
  Search,
  Plus,
  Grid,
  List,
  Calendar,
  AlertTriangle,
  Tag,
  Edit2,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  FileDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

const TaskManagement = () => {
  const {
    tasks,
    pagination,
    loading,
    filters,
    setFilters,
    createTask,
    updateTask,
    moveTaskStatus,
    deleteTask,
    exportCsv,
    exportPdf
  } = useTasks();

  const [viewMode, setViewMode] = useState('kanban'); // 'list' or 'kanban'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Todo');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Drag and Drop active feedback state
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Search input local state to debounce changes
  const [searchVal, setSearchVal] = useState(filters.search);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchVal, page: 1 }));
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchVal, setFilters]);

  // Open modal for task creation
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setStatus('Todo');
    
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDueDate(tomorrow.toISOString().split('T')[0]);
    
    setTagsInput('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for task editing
  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setTagsInput(task.tags ? task.tags.join(', ') : '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Form submit handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (!dueDate) {
      setFormError('Due date is required');
      return;
    }

    setFormLoading(true);

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    const taskPayload = {
      title,
      description,
      priority,
      status,
      dueDate: new Date(dueDate).toISOString(),
      tags
    };

    try {
      if (editingTask) {
        await updateTask(editingTask._id, taskPayload);
      } else {
        await createTask(taskPayload);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Action failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Drag-and-drop triggers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnStatus) => {
    e.preventDefault();
    setDragOverColumn(columnStatus);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');

    if (!taskId) return;

    try {
      await moveTaskStatus(taskId, targetStatus);
      
      // Wow/Confetti trigger when task completes
      if (targetStatus === 'Completed') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#8b5cf6', '#3b82f6', '#10b981']
        });
      }
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const getPriorityStyle = (p) => {
    switch (p) {
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
    }
  };

  const getStatusStyle = (s) => {
    switch (s) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value, page: 1 }))}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none text-sm dark:text-white"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none text-sm dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }))}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none text-sm dark:text-white"
          >
            <option value="createdAt">Date Created</option>
            <option value="dueDate">Due Date</option>
            <option value="title">Title</option>
            <option value="priority">Priority</option>
          </select>

          <button
            onClick={() => setFilters(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }))}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-white"
          >
            {filters.order === 'asc' ? '▲ ASC' : '▼ DESC'}
          </button>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          {/* Export Options */}
          <button
            onClick={exportCsv}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 flex items-center justify-center"
            title="Export CSV"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={exportPdf}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 flex items-center justify-center"
            title="Export PDF"
          >
            <FileDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* View Switcher and Add Task Button */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'kanban'
                ? 'bg-white text-slate-800 dark:bg-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Grid className="w-4 h-4" /> Kanban Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-slate-800 dark:bg-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <List className="w-4 h-4" /> List View
          </button>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 shadow-md shadow-brand-500/10 active:scale-98 transition-transform"
        >
          <Plus className="w-5 h-5" /> New Task
        </button>
      </div>

      {/* Main Board/List Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
          <span className="text-slate-500 dark:text-slate-400 text-sm">Loading tasks...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center max-w-xl mx-auto my-12 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">No Tasks Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              We couldn't find any tasks matching your filters. Try adjusting search queries or add a new task.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md"
          >
            Add Task Item
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-200/60 dark:border-slate-800/60">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-1 max-w-md">
                            {task.description}
                          </div>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.map((tag, i) => (
                              <span key={i} className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Tag className="w-2.5 h-2.5" /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getPriorityStyle(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusStyle(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this task?')) {
                              deleteTask(task._id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalTasks} total tasks)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Todo', 'In Progress', 'Completed'].map((column) => {
            const columnTasks = tasks.filter(t => t.status === column);
            const isOver = dragOverColumn === column;

            return (
              <div
                key={column}
                onDragOver={(e) => handleDragOver(e, column)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column)}
                className={`flex flex-col bg-slate-100/60 dark:bg-slate-900/40 p-4 rounded-2xl border-2 border-transparent transition-all min-h-[500px] ${
                  isOver ? 'drag-hovering' : ''
                }`}
              >
                {/* Column Title */}
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-sm tracking-wide text-slate-600 dark:text-slate-400 uppercase">
                    {column}
                  </span>
                  <span className="bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {columnTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-5 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:shadow transition-all group duration-200"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight">
                          {task.title}
                        </h4>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          <button
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this task?')) {
                                deleteTask(task._id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {task.tags.map((tag, i) => (
                            <span key={i} className="text-[9px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium">
                              <Tag className="w-2.5 h-2.5 text-slate-400" /> {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-850">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getPriorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200/50 dark:border-slate-800/40 rounded-xl text-xs text-slate-400 dark:text-slate-500 font-semibold select-none">
                      Drag tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation & Editing Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200">
                {editingTask ? 'Edit Task Details' : 'Create New Task'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
                  placeholder="Task title..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
                  placeholder="Provide details about the task..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm dark:text-white"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    Tags <span className="text-[10px] text-slate-400 lowercase font-medium">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm dark:text-white"
                    placeholder="project, feature, bug"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-brand-500/10 active:scale-98 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
