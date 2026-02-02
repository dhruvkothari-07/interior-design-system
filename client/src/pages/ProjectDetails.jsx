import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Navbar from '../components/Navbar';
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
    Check
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
        } catch (err) { alert("Failed to update status"); }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/projects/${id}/tasks`, newTaskData, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({ ...prev, tasks: [res.data, ...prev.tasks] }));
            setIsTaskModalOpen(false);
            setNewTaskData({ description: "", due_date: "", priority: "Medium", trade_category: "General" });
        } catch (err) { alert("Failed"); }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/projects/${id}/expenses`, newExpense, { headers: { Authorization: `Bearer ${token}` } });
            setProject(prev => ({ ...prev, expenses: [res.data, ...prev.expenses] }));
            setNewExpense({ description: "", amount: "", category: "", expense_date: new Date().toISOString().split('T')[0] });
        } catch (err) { alert("Failed"); }
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
        } catch (err) { }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neutral-800 to-black flex items-center justify-center animate-pulse">
                    <FolderOpen className="w-6 h-6 text-white" />
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

    const getStatusConfig = (status) => {
        const configs = {
            'Completed': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500' },
            'In Progress': { bg: 'bg-neutral-100', text: 'text-neutral-700', icon: PlayCircle, gradient: 'from-neutral-600 to-neutral-800' },
            'On Hold': { bg: 'bg-red-100', text: 'text-red-700', icon: PauseCircle, gradient: 'from-red-500 to-red-600' },
            'Not Started': { bg: 'bg-neutral-100', text: 'text-neutral-600', icon: Clock, gradient: 'from-neutral-400 to-neutral-500' }
        };
        return configs[status] || configs['Not Started'];
    };

    const statusConfig = getStatusConfig(project.status);
    const StatusIcon = statusConfig.icon;
    const remainingBudget = project.budget - totalExpenses;

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="relative mb-8 animate-fade-in">
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 rounded-3xl opacity-60" />

                    <div className="relative p-6 lg:p-8">
                        <button
                            onClick={() => navigate('/projects')}
                            className="group flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-black transition-colors mb-6"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Back to Projects
                        </button>

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            {/* Left: Title & Status */}
                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center shadow-lg`}>
                                        <FolderOpen className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm border">
                                        <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.text}`} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                            {project.name}
                                        </h1>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} flex items-center gap-1.5`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {project.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                                        <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-lg">
                                            <Users className="w-4 h-4" />
                                            {project.client_name || 'No client'}
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-lg">
                                            <Calendar className="w-4 h-4" />
                                            {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No deadline'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-3">
                                <select
                                    value={project.status}
                                    onChange={handleProjectStatusChange}
                                    className="input py-2.5 pr-10 bg-white/80 backdrop-blur-sm"
                                >
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Completed">Completed</option>
                                </select>
                                <button className="p-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-[var(--color-border)] hover:bg-white hover:shadow-md transition-all">
                                    <Edit3 className="w-5 h-5 text-[var(--color-text-muted)]" />
                                </button>
                                <button className="p-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-[var(--color-border)] hover:bg-white hover:shadow-md transition-all">
                                    <MoreHorizontal className="w-5 h-5 text-[var(--color-text-muted)]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
                    {[
                        { label: 'Budget', value: formatCurrency(project.budget), sub: `${budgetUsage}% used`, icon: IndianRupee, color: 'neutral', warning: false },
                        { label: 'Spent', value: formatCurrency(totalExpenses), sub: `${project.expenses?.length || 0} transactions`, icon: TrendingUp, color: 'neutral', warning: budgetUsage > 90 },
                        { label: 'Tasks', value: `${tasksCompleted}/${totalTasks}`, sub: `${taskProgress}% complete`, icon: CheckSquare, color: 'emerald', warning: false },
                        { label: 'Remaining', value: formatCurrency(remainingBudget), sub: 'of budget', icon: Target, color: remainingBudget < 0 ? 'red' : 'emerald', warning: remainingBudget < 0 }
                    ].map((stat, index) => (
                        <div
                            key={stat.label}
                            className="group card p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-70 transition-opacity`} />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-[var(--color-text-muted)]">{stat.label}</span>
                                    <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                                    </div>
                                </div>
                                <p className={`text-2xl font-bold ${stat.warning ? 'text-red-600' : 'text-[var(--color-text-primary)]'} flex items-center gap-2`}>
                                    {stat.value}
                                    {stat.warning && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">{stat.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Tabs */}
                <div className="flex justify-center mb-8 animate-fade-in-up">
                    <div className="inline-flex bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-[var(--color-border)]">
                        {[
                            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                            { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: totalTasks },
                            { id: 'financials', label: 'Financials', icon: DollarSign },
                            { id: 'files', label: 'Files', icon: FolderOpen }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id
                                        ? 'bg-black text-white shadow-md'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-neutral-100'}
                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {tab.badge > 0 && activeTab !== tab.id && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-neutral-200 text-neutral-600 rounded text-[10px] font-semibold">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="animate-fade-in-up">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Project Description Card */}
                            <div className="lg:col-span-2 card p-6">
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-neutral-600" />
                                    Project Details
                                </h3>
                                <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                                    {project.description || "No description provided for this project. Add a description to help team members understand the project scope."}
                                </p>

                                {/* Budget & Task Progress */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[var(--color-bg-subtle)] rounded-xl p-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-[var(--color-text-muted)]">Budget Usage</span>
                                            <span className={`font-semibold ${budgetUsage > 90 ? 'text-red-600' : 'text-[var(--color-text-primary)]'}`}>{budgetUsage}%</span>
                                        </div>
                                        <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${budgetUsage > 90 ? 'bg-red-500' : 'bg-black'}`}
                                                style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-[var(--color-bg-subtle)] rounded-xl p-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-[var(--color-text-muted)]">Task Progress</span>
                                            <span className="font-semibold text-[var(--color-text-primary)]">{taskProgress}%</span>
                                        </div>
                                        <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${taskProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="card p-6 bg-gradient-to-br from-neutral-900 to-black text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-5 h-5" />
                                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setIsTaskModalOpen(true)}
                                            className="w-full flex items-center justify-between p-3.5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all group"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Plus className="w-4 h-4" />
                                                Add Task
                                            </span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('financials')}
                                            className="w-full flex items-center justify-between p-3.5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all group"
                                        >
                                            <span className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4" />
                                                Log Expense
                                            </span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('files')}
                                            className="w-full flex items-center justify-between p-3.5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all group"
                                        >
                                            <span className="flex items-center gap-2">
                                                <FolderOpen className="w-4 h-4" />
                                                Upload Files
                                            </span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Tasks */}
                            <div className="lg:col-span-3 card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                        <CheckSquare className="w-5 h-5 text-neutral-600" />
                                        Recent Tasks
                                    </h3>
                                    <button onClick={() => setIsTaskModalOpen(true)} className="btn-primary text-sm py-2 flex items-center gap-1.5">
                                        <Plus className="w-4 h-4" /> Add Task
                                    </button>
                                </div>

                                {project.tasks && project.tasks.length > 0 ? (
                                    <div className="grid gap-3">
                                        {project.tasks.slice(0, 5).map((task, index) => (
                                            <div
                                                key={task.id}
                                                onClick={() => handleTaskToggle(task.id, task.status)}
                                                className="group flex items-start gap-4 p-4 bg-[var(--color-bg-subtle)] rounded-xl hover:bg-neutral-100 cursor-pointer transition-all hover:shadow-sm"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'Done'
                                                    ? 'bg-emerald-500 border-emerald-500'
                                                    : 'border-neutral-300 group-hover:border-black group-hover:scale-110'
                                                    }`}>
                                                    {task.status === 'Done' && <Check className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium ${task.status === 'Done' ? 'text-neutral-400 line-through' : 'text-[var(--color-text-primary)]'}`}>
                                                        {task.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <span className="text-[10px] px-2 py-0.5 bg-white text-neutral-600 rounded-md font-medium border border-neutral-200">
                                                            {task.trade_category}
                                                        </span>
                                                        {task.priority === 'High' && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-md font-medium flex items-center gap-1">
                                                                <AlertTriangle className="w-2.5 h-2.5" />
                                                                High Priority
                                                            </span>
                                                        )}
                                                        {task.due_date && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-md font-medium flex items-center gap-1">
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
                                                className="text-sm text-black font-medium py-2 hover:underline flex items-center gap-1 justify-center"
                                            >
                                                View all {project.tasks.length} tasks
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-[var(--color-bg-subtle)] rounded-xl border-2 border-dashed border-neutral-200">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
                                            <CheckSquare className="w-6 h-6 text-neutral-400" />
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
                                    <Plus className="w-4 h-4" /> Add Task
                                </button>
                            </div>

                            {project.tasks && project.tasks.length > 0 ? (
                                <div className="grid gap-3">
                                    {project.tasks.map((task, index) => (
                                        <div
                                            key={task.id}
                                            onClick={() => handleTaskToggle(task.id, task.status)}
                                            className="group flex items-start gap-4 p-4 bg-[var(--color-bg-subtle)] rounded-xl hover:bg-neutral-100 cursor-pointer transition-all"
                                            style={{ animationDelay: `${index * 30}ms` }}
                                        >
                                            <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'Done'
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : 'border-neutral-300 group-hover:border-black'
                                                }`}>
                                                {task.status === 'Done' && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium ${task.status === 'Done' ? 'text-neutral-400 line-through' : 'text-[var(--color-text-primary)]'}`}>
                                                    {task.description}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] px-2 py-0.5 bg-white text-neutral-600 rounded-md font-medium border border-neutral-200">
                                                        {task.trade_category}
                                                    </span>
                                                    {task.priority === 'High' && (
                                                        <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-md font-medium">High Priority</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-[var(--color-bg-subtle)] rounded-xl border-2 border-dashed border-neutral-200">
                                    <p className="text-[var(--color-text-muted)]">No tasks yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'financials' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Budget Card */}
                                <div className="card p-6">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Budget Overview</h3>
                                    <div className="h-4 bg-neutral-100 rounded-full overflow-hidden mb-4">
                                        <div
                                            className={`h-full rounded-full ${budgetUsage > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-neutral-600 to-black'}`}
                                            style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                                        />
                                    </div>
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
                                            <p className={`text-lg font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
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
                                                <div key={expense.id} className="py-4 flex items-center justify-between group hover:bg-neutral-50 -mx-2 px-2 rounded-lg transition-colors">
                                                    <div>
                                                        <p className="font-medium text-[var(--color-text-primary)]">{expense.description}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">
                                                            {new Date(expense.expense_date).toLocaleDateString()} • {expense.category}
                                                        </p>
                                                    </div>
                                                    <span className="font-mono font-semibold text-red-600">-{formatCurrency(expense.amount)}</span>
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
                                    <Plus className="w-5 h-5 text-neutral-600" />
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
                        <div className="card p-12 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-neutral-100 to-neutral-50 flex items-center justify-center">
                                <FolderOpen className="w-10 h-10 text-neutral-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No files yet</h3>
                            <p className="text-[var(--color-text-muted)] mb-6">Upload project files to keep everything organized</p>
                            <button className="btn-primary inline-flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Upload Files
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] bg-gradient-to-r from-neutral-50 to-neutral-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                <Plus className="w-5 h-5 text-neutral-600" />
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
