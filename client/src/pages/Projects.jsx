import React, { useEffect, useState } from 'react';
import axios from "axios";
import Navbar from '../components/Navbar';
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
    Users
} from 'lucide-react';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_URL}/projects`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(res.data);
                setFilteredProjects(res.data);
            } catch (err) {
                console.error(err);
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

    const getStatusConfig = (status) => {
        const configs = {
            'Completed': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
            'In Progress': { bg: 'bg-amber-100', text: 'text-amber-700', icon: PlayCircle },
            'On Hold': { bg: 'bg-rose-100', text: 'text-rose-700', icon: PauseCircle },
            'Not Started': { bg: 'bg-stone-100', text: 'text-stone-600', icon: Clock }
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
        onHold: projects.filter(p => p.status === 'On Hold').length
    };

    const statusTabs = [
        { value: 'all', label: 'All', count: stats.total },
        { value: 'In Progress', label: 'In Progress', count: stats.inProgress },
        { value: 'Completed', label: 'Completed', count: stats.completed },
        { value: 'On Hold', label: 'On Hold', count: stats.onHold }
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-orange-600 flex items-center justify-center">
                                <FolderKanban className="w-5 h-5 text-white" />
                            </div>
                            Projects
                        </h1>
                        <p className="text-[var(--color-text-muted)] mt-1">Manage and track all your design projects</p>
                    </div>
                    <button
                        onClick={() => navigate('/quotations')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
                    {[
                        { label: 'Total Projects', value: stats.total, icon: FolderKanban, color: 'orange' },
                        { label: 'In Progress', value: stats.inProgress, icon: PlayCircle, color: 'amber' },
                        { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'emerald' },
                        { label: 'On Hold', value: stats.onHold, icon: PauseCircle, color: 'rose' }
                    ].map((stat, index) => (
                        <div
                            key={stat.label}
                            className="card p-5 hover:shadow-md transition-all"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-[var(--color-text-muted)]">{stat.label}</span>
                                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 animate-fade-in-up">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-11"
                        />
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl border border-[var(--color-border)]">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setStatusFilter(tab.value)}
                                className={`
                                    px-4 py-2 rounded-xl text-sm font-medium transition-all
                                    ${statusFilter === tab.value
                                        ? 'bg-[var(--color-accent)] text-white'
                                        : 'text-[var(--color-text-secondary)] hover:bg-stone-100'}
                                `}
                            >
                                {tab.label}
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${statusFilter === tab.value
                                        ? 'bg-white/20'
                                        : 'bg-stone-100'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-[var(--color-border)]">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)] hover:bg-stone-100'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)] hover:bg-stone-100'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Projects Grid/List */}
                {filteredProjects.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in-up">
                            {filteredProjects.map((project, index) => {
                                const statusConfig = getStatusConfig(project.status);
                                const StatusIcon = statusConfig.icon;
                                const totalExpenses = project.expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
                                const budgetUsage = project.budget ? Math.round((totalExpenses / project.budget) * 100) : 0;

                                return (
                                    <div
                                        key={project.id}
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                        className="card p-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                                        style={{ animationDelay: `${index * 30}ms` }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <FolderKanban className="w-6 h-6 text-[var(--color-accent)]" />
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} flex items-center gap-1`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {project.status}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-accent)] transition-colors">
                                            {project.name}
                                        </h3>

                                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-4">
                                            <Users className="w-3.5 h-3.5" />
                                            {project.client_name || 'No client'}
                                        </div>

                                        {/* Budget Progress */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-[var(--color-text-muted)]">Budget</span>
                                                <span className="font-medium text-[var(--color-text-primary)]">{formatCurrency(project.budget)}</span>
                                            </div>
                                            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${budgetUsage > 90 ? 'bg-rose-500' : 'bg-[var(--color-accent)]'}`}
                                                    style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-[var(--color-text-muted)] mt-1">{budgetUsage}% used</p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                                            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No deadline'}
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card overflow-hidden animate-fade-in-up">
                            <table className="w-full">
                                <thead className="bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Project</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Client</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Budget</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Due Date</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {filteredProjects.map((project) => {
                                        const statusConfig = getStatusConfig(project.status);
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <tr
                                                key={project.id}
                                                onClick={() => navigate(`/projects/${project.id}`)}
                                                className="hover:bg-[var(--color-bg-subtle)] cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                                                            <FolderKanban className="w-5 h-5 text-[var(--color-accent)]" />
                                                        </div>
                                                        <span className="font-medium text-[var(--color-text-primary)]">{project.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                                                    {project.client_name || 'No client'}
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
                                                <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">
                                                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="card p-12 text-center animate-fade-in-up">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-subtle)] flex items-center justify-center">
                            <FolderKanban className="w-8 h-8 text-[var(--color-text-muted)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No projects found</h3>
                        <p className="text-[var(--color-text-muted)]">
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Create your first project to get started'}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Projects;
