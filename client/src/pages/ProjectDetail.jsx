import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    CheckSquare,
    DollarSign,
    FolderOpen,
    Clock,
    Plus,
    X,
    Calendar,
    ArrowLeft,
    MoreHorizontal,
    TrendingUp,
    Users,
    IndianRupee,
    PlayCircle,
    CheckCircle2,
    PauseCircle,
    FileText,
    Target,
    ArrowRight,
    Sparkles,
    AlertTriangle,
    Edit3,
    Trash2,
    Check,
    FolderKanban,
    Wallet,
    ListChecks,
    TrendingDown,
    PieChart
} from "lucide-react";
import { API_URL } from '../config';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTaskData, setNewTaskData] = useState({ description: "", due_date: "", priority: "Medium", trade_category: "General" });
    const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "", expense_date: new Date().toISOString().split('T')[0] });

    const fetchProjectDetails = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setProject(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load project details");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchProjectDetails(); }, [fetchProjectDetails]);

    const handleProjectStatusChange = async (e) => {
        const newStatus = e.target.value;
        const token = localStorage.getItem("token");
        try {
            await axios.put(`${API_URL}/projects/${id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({ ...prev, status: newStatus }));
            toast.success("Project status updated");
        } catch (err) { toast.error("Failed to update status"); }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/projects/${id}/tasks`, newTaskData, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({ ...prev, tasks: [res.data, ...prev.tasks] }));
            setIsTaskModalOpen(false);
            setNewTaskData({ description: "", due_date: "", priority: "Medium", trade_category: "General" });
            toast.success("Task added successfully");
        } catch (err) { toast.error("Failed to add task"); }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/projects/${id}/expenses`, newExpense, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({ ...prev, expenses: [res.data, ...prev.expenses] }));
            setNewExpense({ description: "", amount: "", category: "", expense_date: new Date().toISOString().split('T')[0] });
            toast.success("Expense logged successfully");
        } catch (err) { toast.error("Failed to log expense"); }
    };

    const handleTaskToggle = async (taskId, currentStatus) => {
        const nextStatus = currentStatus === 'Done' ? 'To Do' : 'Done';
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/tasks/${taskId}`, { status: nextStatus }, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t)
            }));
            toast.success(`Task marked as ${nextStatus}`);
        } catch (err) { toast.error("Failed to update task"); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const toastId = toast.loading("Uploading file...");

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/projects/${id}/files`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setProject(prev => ({
                ...prev,
                files: [res.data, ...(prev.files || [])]
            }));
            toast.success("File uploaded successfully", { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload file", { id: toastId });
        }
    };

    const handleFileDelete = async (fileId) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;

        const toastId = toast.loading("Deleting file...");
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/files/${fileId}`, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({
                ...prev,
                files: prev.files.filter(f => f.id !== fileId)
            }));
            toast.success("File deleted successfully", { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete file", { id: toastId });
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center animate-pulse">
                    <FolderKanban className="w-7 h-7 text-white" />
                </div>
                <p className="text-[var(--color-text-muted)]">Loading project...</p>
            </div>
        </div>
    );
    if (!project) return null;

    const totalExpenses = project.expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const budgetUsage = project.budget ? Math.round((totalExpenses / project.budget) * 100) : 0;
    const tasksCompleted = project.tasks?.filter(t => t.status === 'Done').length || 0;
    const totalTasks = project.tasks?.length || 0;
    const taskProgress = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);
    const remainingBudget = project.budget - totalExpenses;

    const getStatusConfig = (status) => {
        const configs = {
            'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500' },
            'In Progress': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: PlayCircle, gradient: 'from-[var(--color-accent)] to-amber-600' },
            'On Hold': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: PauseCircle, gradient: 'from-rose-500 to-rose-600' },
            'Not Started': { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200', icon: Clock, gradient: 'from-stone-400 to-stone-500' }
        };
        return configs[status] || configs['Not Started'];
    };

    const statusConfig = getStatusConfig(project.status);
    const StatusIcon = statusConfig.icon;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'tasks', label: 'Tasks', icon: ListChecks, badge: totalTasks },
        { id: 'financials', label: 'Financials', icon: Wallet },
        { id: 'files', label: 'Files', icon: FolderOpen }
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/projects')}
                    className="group flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors mb-6 animate-fade-in"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Projects
                </button>

                {/* Hero Header */}
                <div className="relative mb-8 animate-fade-in">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/5 via-transparent to-amber-500/5 rounded-3xl" />

                    <div className="relative card p-6 lg:p-8 border-none shadow-lg">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            {/* Left: Project Info */}
                            <div className="flex items-start gap-4">

                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                            {project.name}
                                        </h1>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-muted)]">

                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            {project.end_date ? new Date(project.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-3">
                                <select
                                    value={project.status}
                                    onChange={handleProjectStatusChange}
                                    className="input py-2.5 pr-10 bg-white/80 backdrop-blur-sm text-sm"
                                >
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Bento Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
                    {/* Budget Card */}
                    <div className="card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
                        <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-[var(--color-text-muted)]">Budget</span>
                                <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                                    <IndianRupee className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">{formatCurrency(project.budget)}</p>
                        </div>
                    </div>

                    {/* Spent Card */}
                    <div className="card p-5 group hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-[var(--color-text-muted)]">Spent</span>
                            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalExpenses)}</p>
                    </div>

                    {/* Tasks Progress */}
                    <div className="card p-5 group hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-[var(--color-text-muted)]">Tasks</span>
                            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ListChecks className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)]">{tasksCompleted}/{totalTasks}</p>
                    </div>

                    {/* Remaining */}
                    <div className="card p-5 group hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-[var(--color-text-muted)]">Remaining</span>
                            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <PieChart className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className={`text-2xl font-bold flex items-center gap-2 ${remainingBudget < 0 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>
                            {formatCurrency(remainingBudget)}
                            {remainingBudget < 0 && <AlertTriangle className="w-4 h-4" />}
                        </p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex justify-center mb-8 animate-fade-in-up">
                    <div className="inline-flex bg-white p-1.5 rounded-2xl shadow-sm border border-[var(--color-border)]">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                    ${activeTab === tab.id
                                        ? 'bg-[var(--color-accent)] text-white shadow-md'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-stone-50'}
                                `}
                            >
                                {tab.label}
                                {tab.badge > 0 && activeTab !== tab.id && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-[10px] font-semibold">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="animate-fade-in-up">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Project Description */}
                            <div className="lg:col-span-2 card p-6">
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                    Project Details
                                </h3>
                                <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                                    {project.description || "No description provided for this project. Add a description to help team members understand the project scope."}
                                </p>

                                {/* Progress Bars */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[var(--color-bg-subtle)] rounded-xl p-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-[var(--color-text-muted)]">Budget Usage</span>
                                            <span className={`font-semibold ${budgetUsage > 90 ? 'text-rose-600' : 'text-[var(--color-text-primary)]'}`}>{budgetUsage}%</span>
                                        </div>
                                        <div className="h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${budgetUsage > 90 ? 'bg-rose-500' : budgetUsage > 70 ? 'bg-amber-500' : 'bg-[var(--color-accent)]'}`}
                                                style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-[var(--color-bg-subtle)] rounded-xl p-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-[var(--color-text-muted)]">Task Progress</span>
                                            <span className="font-semibold text-[var(--color-text-primary)]">{taskProgress}%</span>
                                        </div>
                                        <div className="h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${taskProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="card p-6 bg-white">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Quick Actions</h3>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setIsTaskModalOpen(true)}
                                        className="w-full flex items-center justify-between p-3.5 bg-[var(--color-bg-subtle)] rounded-xl hover:bg-stone-100 transition-all group text-[var(--color-text-primary)]"
                                    >
                                        <span className="flex items-center gap-2 font-medium">
                                            Add Task
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('financials')}
                                        className="w-full flex items-center justify-between p-3.5 bg-[var(--color-bg-subtle)] rounded-xl hover:bg-stone-100 transition-all group text-[var(--color-text-primary)]"
                                    >
                                        <span className="flex items-center gap-2 font-medium">
                                            Log Expense
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('files')}
                                        className="w-full flex items-center justify-between p-3.5 bg-[var(--color-bg-subtle)] rounded-xl hover:bg-stone-100 transition-all group text-[var(--color-text-primary)]"
                                    >
                                        <span className="flex items-center gap-2 font-medium">
                                            Upload Files
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            {/* Recent Tasks */}
                            <div className="lg:col-span-3 card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                        Recent Tasks
                                    </h3>
                                    <button onClick={() => setIsTaskModalOpen(true)} className="btn-primary text-sm py-2 flex items-center gap-1.5">
                                        Add Task
                                    </button>
                                </div>

                                {project.tasks && project.tasks.length > 0 ? (
                                    <div className="grid gap-3">
                                        {project.tasks.slice(0, 5).map((task, index) => (
                                            <div
                                                key={task.id}
                                                onClick={() => handleTaskToggle(task.id, task.status)}
                                                className="group flex items-start gap-4 p-4 bg-[var(--color-bg-subtle)] rounded-xl hover:bg-stone-100 cursor-pointer transition-all hover:shadow-sm"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'Done'
                                                    ? 'bg-emerald-500 border-emerald-500'
                                                    : 'border-stone-300 group-hover:border-[var(--color-accent)] group-hover:scale-110'
                                                    }`}>
                                                    {task.status === 'Done' && <Check className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium ${task.status === 'Done' ? 'text-stone-400 line-through' : 'text-[var(--color-text-primary)]'}`}>
                                                        {task.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <span className="text-[10px] px-2 py-0.5 bg-white text-stone-600 rounded-md font-medium border border-stone-200">
                                                            {task.trade_category}
                                                        </span>
                                                        {task.priority === 'High' && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-600 rounded-md font-medium flex items-center gap-1">
                                                                <AlertTriangle className="w-2.5 h-2.5" />
                                                                High Priority
                                                            </span>
                                                        )}
                                                        {task.due_date && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-500 rounded-md font-medium flex items-center gap-1">
                                                                <Calendar className="w-2.5 h-2.5" />
                                                                {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {project.tasks.length > 5 && (
                                            <button
                                                onClick={() => setActiveTab('tasks')}
                                                className="text-sm text-[var(--color-accent)] font-medium py-2 hover:underline flex items-center gap-1 justify-center"
                                            >
                                                View all {project.tasks.length} tasks
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-[var(--color-bg-subtle)] rounded-xl border-2 border-dashed border-[var(--color-accent)]/20">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                                            <ListChecks className="w-6 h-6 text-[var(--color-accent)]" />
                                        </div>
                                        <p className="text-[var(--color-text-muted)]">No tasks yet. Add your first task to get started.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">All Tasks</h3>
                                <button onClick={() => setIsTaskModalOpen(true)} className="btn-primary flex items-center gap-2">
                                    Add Task
                                </button>
                            </div>

                            {project.tasks && project.tasks.length > 0 ? (
                                <div className="grid gap-3">
                                    {project.tasks.map((task, index) => (
                                        <div
                                            key={task.id}
                                            onClick={() => handleTaskToggle(task.id, task.status)}
                                            className="group flex items-start gap-4 p-4 bg-[var(--color-bg-subtle)] rounded-xl hover:bg-stone-100 cursor-pointer transition-all"
                                            style={{ animationDelay: `${index * 30}ms` }}
                                        >
                                            <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'Done'
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : 'border-stone-300 group-hover:border-[var(--color-accent)]'
                                                }`}>
                                                {task.status === 'Done' && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium ${task.status === 'Done' ? 'text-stone-400 line-through' : 'text-[var(--color-text-primary)]'}`}>
                                                    {task.description}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] px-2 py-0.5 bg-white text-stone-600 rounded-md font-medium border border-stone-200">
                                                        {task.trade_category}
                                                    </span>
                                                    {task.priority === 'High' && (
                                                        <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-600 rounded-md font-medium">High Priority</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-[var(--color-bg-subtle)] rounded-xl border-2 border-dashed border-[var(--color-accent)]/20">
                                    <p className="text-[var(--color-text-muted)]">No tasks yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'financials' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Budget Overview */}
                                <div className="card p-6">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Budget Overview</h3>

                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="bg-[var(--color-bg-subtle)] rounded-xl p-4">
                                            <p className="text-xs text-[var(--color-text-muted)] uppercase mb-1">Budget</p>
                                            <p className="text-lg font-bold text-[var(--color-text-primary)]">{formatCurrency(project.budget)}</p>
                                        </div>
                                        <div className="bg-[var(--color-bg-subtle)] rounded-xl p-4">
                                            <p className="text-xs text-[var(--color-text-muted)] uppercase mb-1">Spent</p>
                                            <p className="text-lg font-bold text-[var(--color-text-primary)]">{formatCurrency(totalExpenses)}</p>
                                        </div>
                                        <div className="bg-[var(--color-bg-subtle)] rounded-xl p-4">
                                            <p className="text-xs text-[var(--color-text-muted)] uppercase mb-1">Remaining</p>
                                            <p className={`text-lg font-bold ${remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {formatCurrency(remainingBudget)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Transactions */}
                                <div className="card p-6">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Transactions</h3>
                                    {project.expenses && project.expenses.length > 0 ? (
                                        <div className="divide-y divide-[var(--color-border)]">
                                            {project.expenses.map(expense => (
                                                <div key={expense.id} className="py-4 flex items-center justify-between group hover:bg-stone-50 -mx-2 px-2 rounded-lg transition-colors">
                                                    <div>
                                                        <p className="font-medium text-[var(--color-text-primary)]">{expense.description}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">
                                                            {new Date(expense.expense_date).toLocaleDateString()} • {expense.category}
                                                        </p>
                                                    </div>
                                                    <span className="font-mono font-semibold text-rose-600">-{formatCurrency(expense.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center py-8 text-[var(--color-text-muted)]">No expenses recorded</p>
                                    )}
                                </div>
                            </div>

                            {/* Add Expense Form */}
                            <div className="card p-6 h-fit sticky top-24">
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                    Add Expense
                                </h3>
                                <form onSubmit={handleAddExpense} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Description</label>
                                        <input
                                            type="text"
                                            value={newExpense.description}
                                            onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                            className="input"
                                            placeholder="e.g. Paint supplies"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Amount</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                                            <input
                                                type="number"
                                                value={newExpense.amount}
                                                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                                className="input pl-10"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Category</label>
                                        <select
                                            value={newExpense.category}
                                            onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                            className="input"
                                            required
                                        >
                                            <option value="">Select category...</option>
                                            <option value="Material Purchase">Material Purchase</option>
                                            <option value="Labor">Labor</option>
                                            <option value="Fees">Fees</option>
                                            <option value="Transport">Transport</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn-primary w-full">Log Expense</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Project Files</h3>
                                <div>
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="btn-primary flex items-center gap-2 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Upload File
                                    </label>

                                </div>
                            </div>

                            {project.files && project.files.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {project.files.map((file) => {
                                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.file_name);
                                        const fileUrl = `${API_URL.replace('/api/v1', '')}/${file.file_path}`;

                                        return (
                                            <div key={file.id} className="group relative bg-[var(--color-bg-subtle)] rounded-xl border border-[var(--color-border)] hover:shadow-md transition-all overflow-hidden">
                                                {isImage ? (
                                                    <div className="aspect-video w-full overflow-hidden bg-white border-b border-[var(--color-border)]">
                                                        <img
                                                            src={fileUrl}
                                                            alt={file.file_name}
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://via.placeholder.com/150?text=Error'; // Or hide/fallback
                                                                e.target.parentElement.classList.add('hidden');
                                                                e.target.parentElement.nextSibling.classList.remove('hidden'); // Show icon fallback if image fails
                                                            }}
                                                        />
                                                    </div>
                                                ) : null}

                                                <div className={`p-4 flex items-start justify-between ${isImage ? '' : ''}`}>
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 text-[var(--color-accent)] ${isImage ? 'hidden' : ''}`}>
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <a
                                                                href={fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block font-medium text-[var(--color-text-primary)] truncate hover:text-[var(--color-accent)] hover:underline"
                                                            >
                                                                {file.file_name}
                                                            </a>
                                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                                {new Date(file.uploaded_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleFileDelete(file.id)}
                                                        className="p-1.5 text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Delete file"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-[var(--color-bg-subtle)] rounded-xl border-2 border-dashed border-[var(--color-accent)]/20">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                                        <FolderOpen className="w-8 h-8 text-[var(--color-accent)]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">No files uploaded</h3>
                                    <p className="text-[var(--color-text-muted)] mb-6">Upload documents, images, or plans for this project.</p>
                                    <label
                                        htmlFor="file-upload"
                                        className="btn-primary inline-flex items-center gap-2 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Upload First File
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-accent)]/5 to-amber-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                <Plus className="w-5 h-5 text-[var(--color-accent)]" />
                                New Task
                            </h3>
                            <button onClick={() => setIsTaskModalOpen(false)} className="p-1.5 hover:bg-white rounded-lg transition">
                                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                        </div>
                        <form onSubmit={handleAddTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Description</label>
                                <input
                                    className="input"
                                    placeholder="What needs to be done?"
                                    value={newTaskData.description}
                                    onChange={e => setNewTaskData({ ...newTaskData, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Category</label>
                                    <select
                                        className="input"
                                        value={newTaskData.trade_category}
                                        onChange={e => setNewTaskData({ ...newTaskData, trade_category: e.target.value })}
                                    >
                                        <option value="General">General</option>
                                        <option value="Carpentry">Carpentry</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Painting">Painting</option>
                                        <option value="Flooring">Flooring</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Priority</label>
                                    <select
                                        className="input"
                                        value={newTaskData.priority}
                                        onChange={e => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Due Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={newTaskData.due_date}
                                    onChange={e => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;
