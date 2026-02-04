import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import {
    LayoutDashboard,
    FileText,
    Users,
    FolderKanban,
    Package,
    Settings,
    Bell,
    Search,
    ChevronDown,
    Filter,
    Download,
    Plus,
    User,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    MoreHorizontal
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { API_URL } from '../config';

// --- COMPONENTS ---

const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

// --- CHART CUSTOMIZATION ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-lg font-bold text-theme-dark">
                    ₹{new Intl.NumberFormat('en-IN').format(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState({
        financials: { revenueYTD: 0, revenueMonth: 0, expensesMonth: 0 },
        pipeline: { pendingCount: 0, pendingValue: 0, wonMonthCount: 0, wonMonthValue: 0 },
        projects: [],
        revenueTrend: [],
        statusDistribution: [],
        topClients: []
    });

    // Date Filters
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    // Theme-aligned colors (Orange, Cream-Dark, etc.)
    const COLORS = ['#EA580C', '#FB923C', '#FED7AA', '#4B5563', '#9CA3AF'];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate('/signin');
                    return;
                }

                const res = await axios.get(`${API_URL}/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { year: selectedYear, month: selectedMonth }
                });

                setData(res.data);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                if (err.response && err.response.status === 401) {
                    navigate('/signin');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, [selectedYear, selectedMonth, navigate]);

    // --- Derived State for Project Health ---
    const projectHealth = useMemo(() => {
        let critical = 0;
        let atRisk = 0;
        let onTrack = 0;
        const now = new Date();

        data.projects.forEach(p => {
            if (p.status !== 'In Progress') return; // Only count active projects

            const spentPct = p.budget > 0 ? (p.total_spent / p.budget) * 100 : 0;
            const isOverBudget = p.total_spent > p.budget;
            const isOverdue = p.end_date && new Date(p.end_date) < now;

            if (isOverBudget || isOverdue) critical++;
            else if (spentPct > 80) atRisk++;
            else onTrack++;
        });

        return { critical, atRisk, onTrack };
    }, [data.projects]);

    const formatCompactCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            notation: "compact",
            maximumFractionDigits: 1
        }).format(amount || 0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Derived Financials
    const netProfit = data.financials.revenueMonth - data.financials.expensesMonth;
    const profitMargin = data.financials.revenueMonth > 0 ? (netProfit / data.financials.revenueMonth) * 100 : 0;

    return (
        <Layout>
            <div className="w-full max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                        <p className="text-gray-500 mt-1">Welcome back, Designer!</p>
                    </div>

                    {/* Date Filters */}
                    <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer py-1.5 pl-3 pr-8"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>
                        <div className="w-px bg-gray-200 my-1"></div>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer py-1.5 pl-3 pr-8"
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </header>


                {/* Dashboard Grid */}
                < div className="grid grid-cols-12 gap-6 mb-8" >

                    {/* LEFT COL: Summary Chart (Revenue Trend) */}
                    < div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col" >
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Summary</h3>
                                <p className="text-sm text-gray-400 mt-1">Track your performance.</p>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                                <span>Weekly</span>
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown className="w-4 h-4 text-orange-500 rotate-45" />
                                    <span className="text-sm text-gray-500 font-medium">Total income</span>
                                </div>
                                {isLoading ? <Skeleton className="h-8 w-32" /> : (
                                    <div className="text-3xl font-bold text-gray-900">{formatCompactCurrency(data.financials.revenueMonth)}</div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-theme-orange" />
                                    <span className="text-sm text-gray-500 font-medium">Total paid</span>
                                </div>
                                {isLoading ? <Skeleton className="h-8 w-32" /> : (
                                    <div className="text-3xl font-bold text-gray-900">{formatCompactCurrency(data.financials.expensesMonth)}</div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 min-h-[250px] w-full">
                            {isLoading ? <Skeleton className="w-full h-full rounded-xl" /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.revenueTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EA580C" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#EA580C"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COL: Activity Cards */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-4" >
                        <div className="mb-2">
                            <h3 className="text-lg font-bold text-gray-900">Activity</h3>
                            <p className="text-sm text-gray-400">Track your activity.</p>
                        </div>

                        {/* Card 1: Net Profit */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col justify-between group hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-theme-orange"></div>
                                    <span className="text-sm font-medium text-gray-600">Net Profit</span>
                                </div>
                                {isLoading ? <Skeleton className="h-7 w-24" /> : (
                                    <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                        {formatCurrency(netProfit)}
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                                Total earnings after expenses
                            </div>
                        </div>

                        {/* Card 2: Net Margin */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col justify-between group hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                    <span className="text-sm font-medium text-gray-600">Net Margin</span>
                                </div>
                                {isLoading ? <Skeleton className="h-7 w-24" /> : (
                                    <div className="text-2xl font-bold text-gray-900">{profitMargin.toFixed(1)}%</div>
                                )}
                            </div>
                            {/* Simple Bar for margin */}
                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-theme-orange h-1.5 rounded-full" style={{ width: `${Math.min(profitMargin, 100)}%` }}></div>
                            </div>
                        </div>

                        {/* Card 3: Pending Quotes (Pipeline) */}
                        <div className="bg-theme-orange p-5 rounded-2xl shadow-lg shadow-orange-200 flex-1 flex flex-col justify-between text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-white/50"></div>
                                    <span className="text-sm font-medium text-orange-100">Pending Quotes</span>
                                </div>
                                {isLoading ? <div className="h-7 w-24 bg-white/20 animate-pulse rounded"></div> : (
                                    <div className="text-2xl font-bold">{formatCurrency(data.pipeline.pendingValue)}</div>
                                )}
                                <div className="mt-1 text-orange-100 text-sm opacity-90">
                                    {data.pipeline.pendingCount} quotes pending
                                </div>
                            </div>
                            <div className="h-16 w-full absolute bottom-0 left-0 opacity-20">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[{ v: 20 }, { v: 15 }, { v: 30 }, { v: 25 }, { v: 35 }, { v: 28 }, { v: 45 }]}>
                                        <Area type="monotone" dataKey="v" stroke="#fff" fill="#fff" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM SECTION */}
                <div className="grid grid-cols-12 gap-6" >

                    {/* Stats & Project Health */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col gap-6" >
                        {/* Weekly Average Card (Status Dist) */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-1" >
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingDown className="w-5 h-5 text-gray-300" />
                                <h4 className="text-gray-500 font-medium">Status Mix</h4>
                            </div>
                            <div className="h-40 relative">
                                {isLoading ? <Skeleton className="w-full h-full rounded-full" /> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.statusDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {data.statusDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-800 pointer-events-none">
                                    {data.statusDistribution.reduce((a, b) => a + b.value, 0)}
                                </div>
                            </div>
                            <div className="mt-2 text-center text-sm text-gray-400">Total Quotes</div>
                        </div>

                        {/* Annual Average Card (Project Health) */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-1" >
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                <h4 className="text-gray-500 font-medium">Health</h4>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="text-4xl font-bold text-gray-900">{projectHealth.onTrack}</div>
                                <div className="text-sm text-gray-500 mb-1">On Track</div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(projectHealth.onTrack / (data.projects.filter(p => p.status === 'In Progress').length || 1)) * 100}%` }}></div>
                            </div>
                            <div className="flex gap-4 mt-3 text-xs font-medium text-gray-400">
                                <span>{projectHealth.critical} Critical</span>
                                <span>{projectHealth.atRisk} At Risk</span>
                            </div>
                        </div>
                    </div>

                    {/* Active Projects Table */}
                    <div className="col-span-12 md:col-span-8 lg:col-span-9 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100" >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Recent Projects</h3>
                                <p className="text-sm text-gray-400">Track your history.</p>
                            </div>
                            <button onClick={() => navigate('/projects')} className="text-sm font-bold text-theme-orange flex items-center gap-1 hover:underline">
                                View All <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="pb-4 font-medium text-gray-400 text-sm">Project Name</th>
                                        <th className="pb-4 font-medium text-gray-400 text-sm">Status</th>
                                        <th className="pb-4 font-medium text-gray-400 text-sm">Spent</th>
                                        <th className="pb-4 font-medium text-gray-400 text-sm text-right">Budget</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {isLoading ? (
                                        Array(3).fill(0).map((_, i) => (
                                            <tr key={i}><td colSpan={4} className="py-4"><Skeleton className="h-6 w-full" /></td></tr>
                                        ))
                                    ) : data.projects.slice(0, 5).map((project) => (
                                        <tr key={project.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                                            <td className="py-4 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                                                        {project.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{project.name}</div>
                                                        <div className="text-xs text-gray-400">#{project.id} • {project.client_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${project.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                                                    project.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td className="py-4 font-medium text-gray-900">
                                                {formatCurrency(project.total_spent)}
                                            </td>
                                            <td className="py-4 text-right font-bold text-gray-900">
                                                {formatCurrency(project.budget)}
                                            </td>
                                        </tr>
                                    ))}
                                    {!isLoading && data.projects.length === 0 && (
                                        <tr><td colSpan={4} className="py-6 text-center text-gray-400 italic">No recent projects</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;