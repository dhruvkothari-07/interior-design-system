import React, { useEffect, useState } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import {
    Search,
    FolderKanban,
    ArrowRight,
    Clock,
    CheckCircle2,
    PauseCircle,
    PlayCircle,
    TrendingUp,
    Plus,
    LayoutGrid,
    List,
    Calendar,
    IndianRupee,
    Users,
    Filter,
    SlidersHorizontal,
    Sparkles,
    Target,
    BarChart3,
    Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { handleApiError, confirmAction } from '../utils/errorHandler.jsx';
import { isAdmin } from '../utils/authUtils';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_URL}/projects`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(res.data);
                setFilteredProjects(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        let result = projects;

        if (searchQuery) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(p => p.status === statusFilter);
        }

        setFilteredProjects(result);
    }, [searchQuery, statusFilter, projects]);

    const handleDeleteProject = (projectId, event) => {
        event.stopPropagation();
        if (!isAdmin()) return;

        confirmAction(
            "Are you sure you want to delete this project?",
            async () => {
                const token = localStorage.getItem("token");
                await axios.delete(`${API_URL}/projects/${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(prev => prev.filter(p => p.id !== projectId));
                setFilteredProjects(prev => prev.filter(p => p.id !== projectId));
                toast.success("Project deleted successfully");
            },
            {
                confirmText: "Delete Project",
                description: "This will permanently remove the project and all its related data."
            }
        );
    };

    const getStatusConfig = (status) => {
        const configs = {
            'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500' },
            'In Progress': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: PlayCircle, gradient: 'from-[var(--color-accent)] to-amber-600' },
            'On Hold': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: PauseCircle, gradient: 'from-rose-500 to-rose-600' },
            'Not Started': { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200', icon: Clock, gradient: 'from-stone-400 to-stone-500' }
        };
        return configs[status] || configs['Not Started'];
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const stats = {
        total: projects.length,
        inProgress: projects.filter(p => p.status === 'In Progress').length,
        completed: projects.filter(p => p.status === 'Completed').length,
        onHold: projects.filter(p => p.status === 'On Hold').length,
        totalBudget: projects.reduce((sum, p) => sum + Number(p.budget || 0), 0)
    };

    const statusTabs = [
        { value: 'all', label: 'All Projects', count: stats.total },
        { value: 'In Progress', label: 'Active', count: stats.inProgress },
        { value: 'Completed', label: 'Completed', count: stats.completed },
        { value: 'On Hold', label: 'On Hold', count: stats.onHold }
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Header */}
                <div className="relative mb-10 animate-fade-in">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/5 via-transparent to-amber-500/5 rounded-3xl" />

                    <div className="relative p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-start gap-4">

                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                        Projects
                                    </h1>
                                    <p className="text-[var(--color-text-muted)] mt-1">
                                        {stats.total} projects • {formatCurrency(stats.totalBudget)} total value
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">

                                <button
                                    onClick={() => navigate('/quotations')}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Project
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Filters Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 animate-fade-in-up">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search projects or clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-11 bg-white/80 backdrop-blur-sm"
                        />
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-[var(--color-border)] shadow-sm">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setStatusFilter(tab.value)}
                                className={`
                                    px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                                    ${statusFilter === tab.value
                                        ? 'bg-[var(--color-accent)] text-white shadow-md'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'}
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                </div>

                {/* Projects Grid/List */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="card p-5 animate-pulse">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-stone-200 rounded-xl" />
                                    <div className="w-20 h-6 bg-stone-200 rounded-lg" />
                                </div>
                                <div className="h-5 bg-stone-200 rounded w-3/4 mb-2" />
                                <div className="h-4 bg-stone-100 rounded w-1/2 mb-4" />
                                <div className="h-2 bg-stone-100 rounded-full mb-3" />
                                <div className="flex justify-between">
                                    <div className="h-4 bg-stone-100 rounded w-24" />
                                    <div className="h-4 bg-stone-100 rounded w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredProjects.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in-up">
                            {filteredProjects.map((project, index) => {
                                const statusConfig = getStatusConfig(project.status);
                                const StatusIcon = statusConfig.icon;
                                const totalExpenses = Number(project.total_expenses) || 0;
                                const percentage = project.budget ? (totalExpenses / project.budget) * 100 : 0;
                                const budgetUsage = percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(1);

                                return (
                                    <div
                                        key={project.id}
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                        className="group relative bg-white rounded-2xl border border-stone-200/60 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-stone-200/50 hover:border-[var(--color-accent)]/30"
                                        style={{ animationDelay: `${index * 40}ms` }}
                                    >
                                        <div className="relative pt-2">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-5">
                                                {/* Solid colored icon box - Orange Theme */}

                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border flex items-center gap-1`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {project.status}
                                                </span>
                                            </div>



                                            {/* Title & Client */}
                                            <div className="mb-6">
                                                <h3 className="text-xl font-bold text-stone-800 mb-1 transition-colors line-clamp-1">
                                                    {project.name}
                                                </h3>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 text-stone-500">
                                                        <Users className="w-4 h-4" />
                                                        <span className="text-sm font-medium truncate">{project.client_name || 'No client'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-stone-400">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className="text-sm">{project.end_date ? new Date(project.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No deadline'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Budget Section */}
                                            <div className="bg-[#F8F6F4] rounded-xl p-4 mb-5">
                                                <div className="flex justify-between text-xs mb-2">
                                                    <span className="font-medium text-stone-500">Budget Usage</span>
                                                    <span className="font-bold text-stone-800">{formatCurrency(project.budget)}</span>
                                                </div>
                                                <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${budgetUsage > 90 ? 'bg-rose-500' : budgetUsage > 70 ? 'bg-amber-500' : 'bg-[var(--color-accent)]'}`}
                                                        style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between mt-2 text-xs">
                                                    <span className="text-stone-400">{formatCurrency(totalExpenses)} spent</span>
                                                    <span className={`font-semibold ${budgetUsage > 90 ? 'text-rose-600' : budgetUsage > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {budgetUsage}% used
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-1">
                                                {isAdmin() ? (
                                                    <button
                                                        onClick={(e) => handleDeleteProject(project.id, e)}
                                                        className="flex items-center gap-1.5 text-sm font-medium text-stone-400 hover:text-rose-600 transition-colors p-1 -ml-1 rounded-md hover:bg-rose-50"
                                                        title="Delete Project"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        <span className="transition-opacity">Delete</span>
                                                    </button>
                                                ) : <div></div>}

                                                <div className="flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)] opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer hover:gap-2 duration-300">
                                                    <span>View</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card overflow-hidden animate-fade-in-up">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Project</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Client</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Status</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Budget</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Progress</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Due Date</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {filteredProjects.map((project, index) => {
                                            const statusConfig = getStatusConfig(project.status);
                                            const StatusIcon = statusConfig.icon;
                                            const totalExpenses = project.expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
                                            const budgetUsage = project.budget ? Math.round((totalExpenses / project.budget) * 100) : 0;

                                            return (
                                                <tr
                                                    key={project.id}
                                                    onClick={() => navigate(`/projects/${project.id}`)}
                                                    className="hover:bg-[var(--color-bg-subtle)] cursor-pointer transition-colors"
                                                    style={{ animationDelay: `${index * 30}ms` }}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">

                                                            <span className="font-medium text-[var(--color-text-primary)]">{project.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                                                        {project.client_name || <span className="text-[var(--color-text-muted)] italic">No client</span>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {project.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-[var(--color-text-primary)]">
                                                        {formatCurrency(project.budget)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="w-24">
                                                            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${budgetUsage > 90 ? 'bg-rose-500' : 'bg-[var(--color-accent)]'}`}
                                                                    style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-[var(--color-text-muted)] mt-1">{budgetUsage}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">
                                                        {project.end_date ? new Date(project.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                    </td>
                                                    <td className="px-6 py-4 flex items-center gap-2">
                                                        {isAdmin() && (
                                                            <button
                                                                onClick={(e) => handleDeleteProject(project.id, e)}
                                                                className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Delete Project"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="card p-16 text-center animate-fade-in-up">

                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No projects found</h3>
                        <button
                            onClick={() => navigate('/quotations')}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create First Project
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Projects;
