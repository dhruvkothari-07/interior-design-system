import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    FolderKanban,
    Users,
    FileText,
    Calendar,
    Clock,
    CheckCircle2,
    PlayCircle,
    PauseCircle,
    IndianRupee,
    Sparkles,
    BarChart3,
    Activity,
    Target,
    AlertTriangle,
    Wallet,
    Package
} from 'lucide-react';
import { API_URL } from '../config';

// Simple Skeleton Component
const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-stone-200 rounded ${className}`}></div>
);

// Mini Area Chart Component  
const AreaChart = ({ data, color = "var(--color-accent)", height = 60 }) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 80;
        return { x, y };
    });

    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
    const areaD = `${pathD} L 100,100 L 0,100 Z`;

    return (
        <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-3">
            <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaD} fill="url(#areaGradient)" />
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

// Progress Ring Component
const ProgressRing = ({ value, size = 60, strokeWidth = 6, color = "var(--color-accent)" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-stone-100" />
            <circle
                cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" className="transition-all duration-500"
            />
        </svg>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [greeting, setGreeting] = useState('Good morning');
    const [data, setData] = useState({
        financials: { revenueYTD: 0, revenueMonth: 0, expensesMonth: 0 },
        pipeline: { pendingCount: 0, pendingValue: 0, wonMonthCount: 0, wonMonthValue: 0 },
        projects: [],
        revenueTrend: []
    });

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting('Good morning');
        else if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                if (!token) return;
                const res = await axios.get(`${API_URL}/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setData(res.data);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const stats = useMemo(() => {
        const projects = data.projects || [];
        const inProgress = projects.filter(p => p.status === 'In Progress').length;
        const completed = projects.filter(p => p.status === 'Completed').length;
        const onHold = projects.filter(p => p.status === 'On Hold').length;
        const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
        const totalSpent = projects.reduce((sum, p) => sum + Number(p.total_spent || 0), 0);

        let critical = 0, atRisk = 0, onTrack = 0;
        projects.forEach(p => {
            if (p.status !== 'In Progress') return;
            const spentPct = (p.total_spent / p.budget) * 100;
            if (spentPct > 100) critical++;
            else if (spentPct > 80) atRisk++;
            else onTrack++;
        });

        return {
            total: projects.length,
            inProgress,
            completed,
            onHold,
            totalBudget,
            totalSpent,
            projectHealth: { critical, atRisk, onTrack }
        };
    }, [data.projects]);

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount);

    const formatCompact = (amount) => new Intl.NumberFormat('en-IN', {
        notation: "compact", maximumFractionDigits: 1
    }).format(amount);

    const getStatusConfig = (status) => {
        const configs = {
            'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
            'In Progress': { bg: 'bg-amber-50', text: 'text-amber-700', icon: PlayCircle },
            'On Hold': { bg: 'bg-rose-50', text: 'text-rose-700', icon: PauseCircle },
            'Not Started': { bg: 'bg-stone-50', text: 'text-stone-600', icon: Clock }
        };
        return configs[status] || configs['Not Started'];
    };

    const netFlow = data.financials.revenueMonth - data.financials.expensesMonth;
    const budgetUtilization = stats.totalBudget > 0 ? Math.round((stats.totalSpent / stats.totalBudget) * 100) : 0;

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Header */}
                <div className="relative mb-10 animate-fade-in">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/5 via-transparent to-amber-500/5 rounded-3xl" />

                    <div className="relative p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                        {greeting}, Designer!
                                    </h1>
                                    <p className="text-[var(--color-text-muted)] mt-1">
                                        Here's your business at a glance • {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate('/quotations')}
                                    className="btn-primary flex items-center gap-2 shadow-lg shadow-[var(--color-accent)]/25"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Project
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-12 gap-4 lg:gap-6 mb-8">

                    {/* Revenue Card - Large */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-4 card p-6 relative overflow-hidden group hover:shadow-xl transition-all animate-fade-in-up">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-500" />

                        <div className="relative">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center">
                                        <IndianRupee className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--color-text-muted)]">Total Revenue</p>
                                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                            <ArrowUpRight className="w-3 h-3" /> +12.5% vs last month
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-4xl font-bold text-[var(--color-text-primary)] mb-1">
                                {isLoading ? <Skeleton className="h-10 w-36" /> : formatCompact(data.financials.revenueYTD)}
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)]">Year to date</p>

                            <AreaChart data={data.revenueTrend.map(r => r.total)} color="var(--color-accent)" />
                        </div>
                    </div>

                    {/* Monthly Income/Expense Stack */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-4 grid grid-rows-2 gap-4">
                        {/* Monthly Income */}
                        <div className="card p-5 hover:shadow-lg transition-all group animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Monthly Income</p>
                                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                        {isLoading ? <Skeleton className="h-8 w-28" /> : formatCompact(data.financials.revenueMonth)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                            <div className="mt-3 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full w-3/4" />
                            </div>
                        </div>

                        {/* Monthly Expenses */}
                        <div className="card p-5 hover:shadow-lg transition-all group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Monthly Expenses</p>
                                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                        {isLoading ? <Skeleton className="h-8 w-28" /> : formatCompact(data.financials.expensesMonth)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <TrendingDown className="w-6 h-6 text-rose-600" />
                                </div>
                            </div>
                            <div className="mt-3 h-1.5 bg-rose-100 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 rounded-full w-1/2" />
                            </div>
                        </div>
                    </div>

                    {/* Net Flow Card - Accent */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-4 card p-6 bg-gradient-to-br from-[var(--color-accent)] to-amber-700 text-white relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <div className="relative">
                            <div className="flex items-center gap-2 mb-4">
                                <Wallet className="w-5 h-5 text-white/80" />
                                <span className="text-sm text-white/80">Net Cash Flow</span>
                            </div>

                            <div className="flex items-center gap-3 mb-2">
                                {netFlow >= 0 ? (
                                    <ArrowUpRight className="w-6 h-6 text-emerald-300" />
                                ) : (
                                    <ArrowDownRight className="w-6 h-6 text-rose-300" />
                                )}
                                <p className="text-3xl font-bold">
                                    {isLoading ? '...' : formatCurrency(netFlow)}
                                </p>
                            </div>

                            <p className="text-sm text-white/70">
                                {netFlow >= 0 ? 'Positive flow this month 🎉' : 'Monitor your expenses'}
                            </p>

                            <AreaChart data={[60, 50, 70, 55, 75, 65, 80]} color="rgba(255,255,255,0.5)" height={50} />
                        </div>
                    </div>

                    {/* Projects Overview */}
                    <div className="col-span-12 lg:col-span-8 card p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Project Overview</h3>
                                <p className="text-sm text-[var(--color-text-muted)]">Track all your active and completed projects</p>
                            </div>
                            <button
                                onClick={() => navigate('/projects')}
                                className="text-sm text-[var(--color-accent)] font-medium hover:underline flex items-center gap-1"
                            >
                                View All <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Project Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-[var(--color-bg-subtle)] rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.total}</p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">Total Projects</p>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold text-amber-700">{stats.inProgress}</p>
                                <p className="text-xs text-amber-600 mt-1">In Progress</p>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold text-emerald-700">{stats.completed}</p>
                                <p className="text-xs text-emerald-600 mt-1">Completed</p>
                            </div>
                            <div className="bg-rose-50 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold text-rose-700">{stats.onHold}</p>
                                <p className="text-xs text-rose-600 mt-1">On Hold</p>
                            </div>
                        </div>

                        {/* Recent Projects List */}
                        <div className="divide-y divide-[var(--color-border)]">
                            {data.projects.slice(0, 4).map((project, idx) => {
                                const statusConfig = getStatusConfig(project.status);
                                const StatusIcon = statusConfig.icon;
                                const spentPct = project.budget ? Math.round((project.total_spent / project.budget) * 100) : 0;

                                return (
                                    <div
                                        key={project.id || idx}
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                        className="flex items-center justify-between py-4 hover:bg-stone-50 -mx-2 px-2 rounded-lg cursor-pointer transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center text-[var(--color-accent)] font-bold group-hover:scale-110 transition-transform">
                                                {project.name?.charAt(0) || 'P'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{project.name}</p>
                                                <p className="text-xs text-[var(--color-text-muted)]">{project.client_name || 'No client'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="hidden sm:block w-24">
                                                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${spentPct > 90 ? 'bg-rose-500' : 'bg-[var(--color-accent)]'}`}
                                                        style={{ width: `${Math.min(spentPct, 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{spentPct}% spent</p>
                                            </div>

                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.text} flex items-center gap-1`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {project.status}
                                            </span>

                                            <p className="font-semibold text-[var(--color-text-primary)] hidden md:block">
                                                {formatCurrency(project.budget)}
                                            </p>

                                            <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                );
                            })}
                            {data.projects.length === 0 && (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-subtle)] flex items-center justify-center">
                                        <FolderKanban className="w-8 h-8 text-[var(--color-text-muted)]" />
                                    </div>
                                    <p className="text-[var(--color-text-muted)]">No projects yet</p>
                                    <button onClick={() => navigate('/quotations')} className="btn-primary mt-4 text-sm">
                                        Create First Project
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pipeline & Health */}
                    <div className="col-span-12 lg:col-span-4 space-y-4">
                        {/* Pipeline Card */}
                        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-[var(--color-text-primary)]">Sales Pipeline</h3>
                                <button onClick={() => navigate('/quotations')} className="text-xs text-[var(--color-accent)] hover:underline">View</button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">Pending Quotes</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">{data.pipeline.pendingCount} awaiting</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-[var(--color-text-primary)]">{formatCompact(data.pipeline.pendingValue)}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">Won This Month</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">{data.pipeline.wonMonthCount} converted</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-emerald-600">{formatCompact(data.pipeline.wonMonthValue)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Project Health */}
                        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Project Health</h3>

                            <div className="flex items-center justify-center mb-4">
                                <div className="relative">
                                    <ProgressRing
                                        value={stats.inProgress > 0 ? Math.round((stats.projectHealth.onTrack / stats.inProgress) * 100) : 100}
                                        size={100}
                                        strokeWidth={8}
                                        color="var(--color-accent)"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.projectHealth.onTrack}</p>
                                            <p className="text-[10px] text-[var(--color-text-muted)]">On Track</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-emerald-50 rounded-lg p-2">
                                    <p className="text-lg font-bold text-emerald-700">{stats.projectHealth.onTrack}</p>
                                    <p className="text-[10px] text-emerald-600">Healthy</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-2">
                                    <p className="text-lg font-bold text-amber-700">{stats.projectHealth.atRisk}</p>
                                    <p className="text-[10px] text-amber-600">At Risk</p>
                                </div>
                                <div className="bg-rose-50 rounded-lg p-2">
                                    <p className="text-lg font-bold text-rose-700">{stats.projectHealth.critical}</p>
                                    <p className="text-[10px] text-rose-600">Critical</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="card p-5 bg-gradient-to-br from-stone-50 to-white animate-fade-in-up" style={{ animationDelay: '350ms' }}>
                            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => navigate('/quotations')}
                                    className="p-3 rounded-xl bg-white border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:shadow-md transition-all text-center group"
                                >
                                    <FileText className="w-5 h-5 text-[var(--color-accent)] mx-auto mb-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">New Quote</span>
                                </button>
                                <button
                                    onClick={() => navigate('/clients')}
                                    className="p-3 rounded-xl bg-white border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:shadow-md transition-all text-center group"
                                >
                                    <Users className="w-5 h-5 text-[var(--color-accent)] mx-auto mb-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Add Client</span>
                                </button>
                                <button
                                    onClick={() => navigate('/materials')}
                                    className="p-3 rounded-xl bg-white border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:shadow-md transition-all text-center group"
                                >
                                    <Package className="w-5 h-5 text-[var(--color-accent)] mx-auto mb-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Materials</span>
                                </button>
                                <button
                                    onClick={() => navigate('/projects')}
                                    className="p-3 rounded-xl bg-white border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:shadow-md transition-all text-center group"
                                >
                                    <FolderKanban className="w-5 h-5 text-[var(--color-accent)] mx-auto mb-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Projects</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;