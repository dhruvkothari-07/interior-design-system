import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Briefcase,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Download,
    Plus,
    ChevronDown
} from 'lucide-react';
import { API_URL } from '../config';

// Simple Skeleton Component
const Skeleton = ({ className }) => (
    <div className={`skeleton ${className}`}></div>
);

// Mini Sparkline Chart Component  
const Sparkline = ({ data, color = "#B45309", height = 40 }) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState({
        financials: { revenueYTD: 0, revenueMonth: 0, expensesMonth: 0 },
        pipeline: { pendingCount: 0, pendingValue: 0, wonMonthCount: 0, wonMonthValue: 0 },
        projects: [],
        revenueTrend: []
    });

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

    const projectHealth = useMemo(() => {
        let critical = 0, atRisk = 0, onTrack = 0;
        data.projects.forEach(p => {
            if (p.status !== 'In Progress') return;
            const spentPct = (p.total_spent / p.budget) * 100;
            if (spentPct > 100) critical++;
            else if (spentPct > 80) atRisk++;
            else onTrack++;
        });
        return { critical, atRisk, onTrack };
    }, [data.projects]);

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount);

    const formatCompact = (amount) => new Intl.NumberFormat('en-IN', {
        notation: "compact", maximumFractionDigits: 1
    }).format(amount);

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Welcome Header */}
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                            Welcome back, Designer!
                        </h1>
                        <p className="text-[var(--color-text-secondary)] mt-1">
                            Control your projects, income, and expenses.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="btn-secondary flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                        <button className="btn-secondary flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button className="btn-primary flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Project
                        </button>
                    </div>
                </header>

                {/* Summary + Activity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

                    {/* Summary Card (2 cols) */}
                    <div className="lg:col-span-2 card p-6 animate-fade-in-up">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Summary</h3>
                                <p className="text-sm text-[var(--color-text-muted)]">Track your performance.</p>
                            </div>
                            <button className="text-sm text-[var(--color-text-secondary)] flex items-center gap-1 hover:text-[var(--color-text-primary)]">
                                Weekly <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex gap-8 mb-6">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-1">
                                    <ArrowDownRight className="w-4 h-4 text-[var(--color-accent)]" />
                                    Total income
                                </div>
                                <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                                    {isLoading ? <Skeleton className="h-9 w-28" /> : formatCompact(data.financials.revenueMonth)}
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-1">
                                    <ArrowUpRight className="w-4 h-4 text-[var(--color-secondary)]" />
                                    Total paid
                                </div>
                                <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                                    {isLoading ? <Skeleton className="h-9 w-24" /> : formatCompact(data.financials.expensesMonth)}
                                </p>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="flex items-end gap-2 h-32">
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="flex-1 h-full rounded-md" />
                                ))
                            ) : data.revenueTrend.length ? (
                                data.revenueTrend.map((item, index) => {
                                    const maxVal = Math.max(...data.revenueTrend.map(d => d.total), 1);
                                    const heightPct = (item.total / maxVal) * 100;
                                    return (
                                        <div key={index} className="flex flex-col items-center flex-1 gap-1">
                                            <div
                                                className="w-full max-w-[28px] bg-gradient-to-t from-[#B45309] to-[#EA580C] rounded-t-md transition-all duration-300 hover:opacity-80"
                                                style={{ height: `${heightPct}%` }}
                                            />
                                            <span className="text-[10px] text-[var(--color-text-muted)]">{item.month}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-[var(--color-text-muted)] italic w-full text-center">No data yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Activity Cards (3 cols) */}
                    <div className="lg:col-span-3">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Activity</h3>
                                <p className="text-sm text-[var(--color-text-muted)]">Track your activity.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Receipts Card */}
                            <div className="card p-5 animate-fade-in-up animation-delay-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-[var(--color-secondary)]" />
                                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">Receipts</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-emerald-600 mb-1">
                                    <ArrowUpRight className="w-3 h-3" />
                                    +{isLoading ? '...' : '11.5'}%
                                </div>
                                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                    {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(data.financials.revenueYTD)}
                                </p>
                                <Sparkline data={[40, 55, 45, 70, 65, 80]} color="var(--color-secondary)" />
                            </div>

                            {/* Contributions Card */}
                            <div className="card p-5 animate-fade-in-up animation-delay-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">Pipeline</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-emerald-600 mb-1">
                                    <ArrowUpRight className="w-3 h-3" />
                                    +{isLoading ? '...' : data.pipeline.pendingCount} quotes
                                </div>
                                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                    {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(data.pipeline.pendingValue)}
                                </p>
                                <Sparkline data={[30, 40, 35, 50, 45, 60]} color="var(--color-accent)" />
                            </div>

                            {/* Owes Card - Orange Accent */}
                            <div className="card p-5 bg-gradient-to-br from-[var(--color-accent)] to-[#EA580C] text-white animate-fade-in-up animation-delay-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-white/50" />
                                    <span className="text-sm font-medium text-white/80">Net Flow</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/70 mb-1">
                                    {(data.financials.revenueMonth - data.financials.expensesMonth) >= 0 ? (
                                        <><ArrowUpRight className="w-3 h-3" /> Positive</>
                                    ) : (
                                        <><ArrowDownRight className="w-3 h-3" /> Negative</>
                                    )}
                                </div>
                                <p className="text-2xl font-bold">
                                    {isLoading ? '...' : formatCurrency(data.financials.revenueMonth - data.financials.expensesMonth)}
                                </p>
                                <Sparkline data={[60, 50, 70, 55, 75, 65]} color="rgba(255,255,255,0.6)" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Averages + Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Averages */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="card p-5">
                            <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-sm mb-2">
                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                    <TrendingDown className="w-3 h-3" />
                                </div>
                                Weekly average
                            </div>
                            <div className="flex items-center gap-2 text-xs text-rose-500 mb-1">
                                <ArrowDownRight className="w-3 h-3" /> -11.5%
                            </div>
                            <p className="text-xl font-bold text-[var(--color-text-primary)]">
                                {formatCompact(data.financials.expensesMonth * 0.25)}
                            </p>
                        </div>
                        <div className="card p-5">
                            <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-sm mb-2">
                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                    <TrendingUp className="w-3 h-3" />
                                </div>
                                Annual average
                            </div>
                            <div className="flex items-center gap-2 text-xs text-emerald-600 mb-1">
                                <ArrowUpRight className="w-3 h-3" /> +11.5%
                            </div>
                            <p className="text-xl font-bold text-[var(--color-text-primary)]">
                                {formatCompact(data.financials.revenueYTD / 12)}
                            </p>
                        </div>
                    </div>

                    {/* Transactions History */}
                    <div className="lg:col-span-2 card overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-border)]">
                            <div>
                                <h3 className="font-semibold text-[var(--color-text-primary)]">Recent Projects</h3>
                                <p className="text-sm text-[var(--color-text-muted)]">Track your history.</p>
                            </div>
                            <button
                                onClick={() => navigate("/projects")}
                                className="text-sm text-[var(--color-accent)] font-medium hover:underline flex items-center gap-1"
                            >
                                View All <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="divide-y divide-[var(--color-border)]">
                            {data.projects.slice(0, 3).map((project, idx) => (
                                <div key={project.id || idx} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-[var(--color-accent)] font-semibold text-sm">
                                            {project.name?.charAt(0) || 'P'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--color-text-primary)]">{project.name}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">#{project.id}</p>
                                        </div>
                                    </div>
                                    <span className={`badge ${project.status === 'Completed' ? 'badge-success' : project.status === 'In Progress' ? 'badge-warning' : 'badge-neutral'}`}>
                                        {project.status}
                                    </span>
                                    <p className="font-medium text-[var(--color-text-primary)]">{formatCurrency(project.budget)}</p>
                                </div>
                            ))}
                            {data.projects.length === 0 && (
                                <p className="px-6 py-8 text-center text-[var(--color-text-muted)]">No projects found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;