import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Briefcase,
    AlertCircle,
    CheckCircle,
    Clock,
    User,
    ArrowRight,
    Filter,
    FileText,
    UserPlus
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from 'recharts';
import { API_URL } from '../config';

// Simple Skeleton Component
const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

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

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                if (!token) return;

                const res = await axios.get(`${API_URL}/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { year: selectedYear, month: selectedMonth }
                });

                setData(res.data);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, [selectedYear, selectedMonth]);

    // --- Derived State for Project Health ---
    const projectHealth = useMemo(() => {
        let critical = 0;
        let atRisk = 0;
        let onTrack = 0;
        const now = new Date();

        data.projects.forEach(p => {
            if (p.status !== 'In Progress') return; // Only count active projects

            const spentPct = p.budget > 0 ? (p.total_spent / p.budget) * 100 : 0;
            const isOverBudget = p.total_spent > p.budget; // Strict over budget check (even if budget is 0 and spent > 0)
            const isOverdue = p.end_date && new Date(p.end_date) < now;

            if (isOverBudget || isOverdue) critical++;
            else if (spentPct > 80) atRisk++;
            else onTrack++;
        });

        return { critical, atRisk, onTrack };
    }, [data.projects]);

    // ... (keep helper functions)

    const getProjectIssue = (p) => {
        const issues = [];
        const isOverBudget = p.total_spent > p.budget;
        const isOverdue = p.end_date && new Date(p.end_date) < new Date();

        if (isOverBudget) {
            if (p.budget === 0) issues.push("Unbudgeted");
            else issues.push("Over Budget");
        }
        if (isOverdue) issues.push("Overdue");

        return issues.join(" & ");
    };

    // ... (render)



    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatCompactCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            notation: "compact",
            maximumFractionDigits: 1
        }).format(amount);
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-800">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8">
                <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-serif font-medium text-gray-900 tracking-tight">Command Center</h1>
                        <p className="text-sm text-gray-500 mt-1">Overview of Financials, Operations, and Sales.</p>
                    </div>

                    {/* Date Filters */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-100">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filter</span>
                        </div>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-transparent text-sm font-medium text-gray-700 py-1 px-2 focus:outline-none cursor-pointer hover:bg-gray-50 rounded"
                        >
                            <option value={0}>All Year</option>
                            {[...Array(12)].map((_, i) => {
                                const month = i + 1;
                                const isFuture = selectedYear === new Date().getFullYear() && month > new Date().getMonth() + 1;
                                if (isFuture) return null;
                                return (
                                    <option key={month} value={month}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                );
                            })}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => {
                                const newYear = Number(e.target.value);
                                setSelectedYear(newYear);
                                // Reset month if switching to current year and selected month is in future
                                if (newYear === new Date().getFullYear() && selectedMonth > new Date().getMonth() + 1) {
                                    setSelectedMonth(new Date().getMonth() + 1);
                                }
                            }}
                            className="bg-transparent text-sm font-medium text-gray-700 py-1 px-2 focus:outline-none cursor-pointer hover:bg-gray-50 rounded"
                        >
                            {[0, 1, 2, 3, 4].map(offset => {
                                const year = new Date().getFullYear() - offset;
                                return <option key={year} value={year}>{year}</option>
                            })}
                        </select>
                    </div>
                </header>

                {/* --- TIER 1: FINANCIAL CARDS --- */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                    {/* Card 1: Revenue (Filtered) */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-2 md:mb-4 gap-2">
                            <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg text-gray-600 w-fit">
                                <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Gross</span>
                        </div>
                        {isLoading ? (
                            <Skeleton className="h-8 w-24 mb-1" />
                        ) : (
                            <h3 className="text-lg md:text-2xl font-bold text-gray-900">{formatCompactCurrency(data.financials.revenueMonth)}</h3>
                        )}
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Total Revenue</p>
                    </div>

                    {/* Card 2: Expenses (Filtered) */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-2 md:mb-4 gap-2">
                            <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg text-gray-600 w-fit">
                                <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Costs</span>
                        </div>
                        {isLoading ? (
                            <Skeleton className="h-8 w-24 mb-1" />
                        ) : (
                            <h3 className="text-lg md:text-2xl font-bold text-gray-900">{formatCompactCurrency(data.financials.expensesMonth)}</h3>
                        )}
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Total Expenses</p>
                    </div>

                    {/* Card 3: Net Profit */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-2 md:mb-4 gap-2">
                            <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg text-gray-600 w-fit">
                                <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Net</span>
                        </div>
                        {isLoading ? (
                            <Skeleton className="h-8 w-24 mb-1" />
                        ) : (
                            <h3 className={`text-lg md:text-2xl font-bold ${data.financials.revenueMonth - data.financials.expensesMonth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCompactCurrency(data.financials.revenueMonth - data.financials.expensesMonth)}
                            </h3>
                        )}
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Net Profit</p>
                    </div>

                    {/* Card 4: Profit Margin */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-2 md:mb-4 gap-2">
                            <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg text-gray-600 w-fit">
                                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Margin</span>
                        </div>
                        {isLoading ? (
                            <Skeleton className="h-8 w-24 mb-1" />
                        ) : (
                            <h3 className="text-lg md:text-2xl font-bold text-gray-900">
                                {data.financials.revenueMonth > 0
                                    ? ((data.financials.revenueMonth - data.financials.expensesMonth) / data.financials.revenueMonth * 100).toFixed(1) + '%'
                                    : '0%'}
                            </h3>
                        )}
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Net Margin</p>
                    </div>
                </section>

                {/* --- TIER 1.5: REVENUE TREND CHART --- */}
                {/* --- TIER 1.5: CHARTS ROW --- */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Revenue Trend Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-6">Revenue Trend (Last 6 Months)</h3>
                        <div className="h-64 w-full">
                            {isLoading ? (
                                <Skeleton className="w-full h-full rounded-lg" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.revenueTrend}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            tickFormatter={(value) => `₹${value / 1000}k`}
                                        />
                                        <Tooltip
                                            formatter={(value) => [formatCurrency(value), "Revenue"]}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorTotal)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Status Distribution Pie Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-6">Quotation Status</h3>
                        <div className="h-64 w-full">
                            {isLoading ? (
                                <Skeleton className="w-full h-full rounded-full" />
                            ) : data.statusDistribution && data.statusDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.statusDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data.statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [value, "Quotations"]} itemStyle={{ color: '#374151' }} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            formatter={(value, entry) => (
                                                <span className="text-sm text-gray-600 ml-1">
                                                    {value} <span className="text-gray-400 font-normal">({entry.payload.value})</span>
                                                </span>
                                            )}
                                        />
                                        {/* Center Text for Total */}
                                        <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle">
                                            <tspan x="50%" dy="0" className="text-2xl font-bold fill-gray-900" style={{ fontSize: '24px', fontWeight: 'bold', fill: '#111827' }}>
                                                {data.statusDistribution.reduce((acc, curr) => acc + curr.value, 0)}
                                            </tspan>
                                            <tspan x="50%" dy="1.5em" className="text-xs fill-gray-500" style={{ fontSize: '12px', fill: '#6B7280' }}>
                                                Quotations
                                            </tspan>
                                        </text>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No data</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* --- TIER 3: TOP CLIENTS (List) --- */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <h3 className="font-semibold text-gray-800 mb-6">Top Clients by Revenue</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                    <th className="pb-3 pl-2 font-medium">Rank</th>
                                    <th className="pb-3 font-medium">Client</th>
                                    <th className="pb-3 font-medium text-center">Deals Closed</th>
                                    <th className="pb-3 pr-2 font-medium text-right">Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {isLoading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <tr key={i} className="border-b border-gray-50 last:border-0">
                                            <td className="py-4 pl-2"><Skeleton className="w-6 h-6 rounded-full" /></td>
                                            <td className="py-4"><Skeleton className="w-32 h-4 mb-1" /><Skeleton className="w-20 h-3" /></td>
                                            <td className="py-4 text-center"><Skeleton className="w-8 h-4 mx-auto" /></td>
                                            <td className="py-4 pr-2 text-right"><Skeleton className="w-20 h-4 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : data.topClients && data.topClients.length > 0 ? (
                                    data.topClients.map((client, index) => (
                                        <tr
                                            key={index}
                                            onClick={() => navigate(`/clients/${client.id}`)}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group"
                                        >
                                            <td className="py-4 pl-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{client.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium border border-gray-200">
                                                    {client.deal_count}
                                                </span>
                                            </td>
                                            <td className="py-4 pr-2 text-right font-semibold text-gray-900">
                                                {formatCurrency(client.total_revenue)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-gray-400 italic">
                                            No client revenue data available yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* --- TIER 2: THE ENGINE ROOM --- */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">

                    {/* Left Widget: Recent Activity Feed */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-400" />
                                Recent Activity
                            </h3>
                        </div>
                        <div className="p-4 md:p-6 flex-1 overflow-y-auto max-h-[300px]">
                            {isLoading ? (
                                <ul className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <li key={i} className="flex gap-3">
                                            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                                            <div className="w-full">
                                                <Skeleton className="w-3/4 h-4 mb-2" />
                                                <Skeleton className="w-1/2 h-3" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : data.recentActivity && data.recentActivity.length > 0 ? (
                                <ul className="space-y-4">
                                    {data.recentActivity.map((item, index) => {
                                        let Icon = FileText;
                                        let iconColor = "bg-gray-100 text-gray-600";
                                        let actionText = "";

                                        if (item.type === 'Quotation') {
                                            Icon = FileText;
                                            actionText = `New Quote for ${item.client_name || 'Client'}`;
                                        } else if (item.type === 'Project') {
                                            Icon = Briefcase;
                                            actionText = `Project Started: ${item.name}`;
                                        } else if (item.type === 'Client') {
                                            Icon = UserPlus;
                                            actionText = `New Client Added: ${item.name}`;
                                        }

                                        return (
                                            <li key={`${item.type}-${item.id}-${index}`} className="flex gap-3 items-start group">
                                                <div className={`w-8 h-8 rounded-full ${iconColor} flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{actionText}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="text-center py-8 text-gray-400 italic">
                                    No recent activity found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Widget: Active Project Health */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-800">Active Project Health</h3>
                            {/* Health Score Badge - REMOVED as per feedback */}
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row gap-6 items-center">
                            {/* Health Viz (Donut) */}
                            <div className="w-[140px] h-[140px] relative flex-shrink-0">
                                {isLoading ? (
                                    <Skeleton className="w-full h-full rounded-full" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Critical', value: projectHealth.critical, fill: '#ef4444' }, // Red-500
                                                    { name: 'At Risk', value: projectHealth.atRisk, fill: '#f97316' },   // Orange-500
                                                    { name: 'On Track', value: projectHealth.onTrack, fill: '#10b981' }  // Emerald-500
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={60}
                                                startAngle={90}
                                                endAngle={-270}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell key="critical" fill="#ef4444" />
                                                <Cell key="atRisk" fill="#f97316" />
                                                <Cell key="onTrack" fill="#10b981" />
                                            </Pie>
                                            <Tooltip formatter={(value) => [value, "Projects"]} itemStyle={{ color: '#374151' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                                {/* Center Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold text-gray-800">
                                        {projectHealth.critical + projectHealth.atRisk + projectHealth.onTrack}
                                    </span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Active</span>
                                </div>
                            </div>

                            {/* Legend / Stats */}
                            <div className="flex-1 w-full grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm font-medium text-gray-600">On Track</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{projectHealth.onTrack}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                        <span className="text-sm font-medium text-gray-600">At Risk</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{projectHealth.atRisk}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                                        <span className="text-sm font-medium text-gray-600">Critical</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{projectHealth.critical}</span>
                                </div>
                            </div>
                        </div>

                        {/* Critical Actions (Bottom) */}
                        {projectHealth.critical > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Attention Required</h4>
                                </div>
                                <div className="space-y-2">
                                    {data.projects
                                        .filter(p => {
                                            if (p.status !== 'In Progress') return false;
                                            const isOverBudget = p.total_spent > p.budget;
                                            const isOverdue = p.end_date && new Date(p.end_date) < new Date();
                                            return isOverBudget || isOverdue;
                                        })
                                        .slice(0, 2)
                                        .map(p => (
                                            <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="group cursor-pointer p-2.5 rounded-lg border border-rose-100 bg-rose-50 hover:bg-rose-100 transition-colors flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-rose-700 truncate max-w-[150px]">{p.name}</p>
                                                    <p className="text-xs text-rose-600 font-medium">{getProjectIssue(p)}</p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* --- TIER 3: PROJECT SUMMARY TABLE --- */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Active Projects</h3>
                        <button onClick={() => navigate('/projects')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                {isLoading ? (
                                    // Skeleton Header
                                    <tr>
                                        <th className="px-6 py-3"><Skeleton className="h-4 w-24" /></th>
                                        <th className="px-6 py-3"><Skeleton className="h-4 w-20" /></th>
                                        <th className="px-6 py-3"><Skeleton className="h-4 w-16" /></th>
                                        <th className="px-6 py-3"><Skeleton className="h-4 w-32" /></th>
                                        <th className="px-6 py-3"><Skeleton className="h-4 w-12" /></th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financials</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {isLoading ? (
                                    // Skeleton Rows
                                    Array(3).fill(0).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><Skeleton className="h-5 w-32 mb-1" /><Skeleton className="h-3 w-16" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-full max-w-xs mb-1" /><Skeleton className="h-2 w-full max-w-xs rounded-full" /></td>
                                            <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    <>
                                        {data.projects.map((project) => {
                                            const percentSpent = project.budget > 0 ? (project.total_spent / project.budget) * 100 : 0;
                                            const isOverBudget = percentSpent > 100;

                                            return (
                                                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-gray-900">{project.name}</div>
                                                        <div className="text-xs text-gray-400">ID: #{project.id}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.client_name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${project.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                                                            project.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {project.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                        <div className="flex flex-col text-sm">
                                                            <span className="font-semibold text-gray-900">{formatCompactCurrency(project.total_spent)}</span>
                                                            <span className="text-xs text-gray-400">of {formatCompactCurrency(project.budget)} budget</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                        <button onClick={() => navigate(`/projects/${project.id}`)} className="text-indigo-600 hover:text-indigo-900 font-medium">
                                                            Manage
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {data.projects.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-gray-400 italic">
                                                    No active projects found.
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden p-4 space-y-4">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <Skeleton className="h-5 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2 mb-4" />
                                    <Skeleton className="h-8 w-full rounded" />
                                </div>
                            ))
                        ) : (
                            <>
                                {data.projects.map((project) => {
                                    const percentSpent = project.budget > 0 ? (project.total_spent / project.budget) * 100 : 0;
                                    const isOverBudget = percentSpent > 100;

                                    return (
                                        <div key={project.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                                                    <p className="text-xs text-gray-500">{project.client_name}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${project.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                                                    project.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {project.status}
                                                </span>
                                            </div>

                                            <div className="mb-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 font-medium uppercase">Spent</span>
                                                    <span className="font-semibold text-gray-900">{formatCompactCurrency(project.total_spent)}</span>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-xs text-gray-400 font-medium uppercase">Budget</span>
                                                    <span className="font-semibold text-gray-900">{formatCompactCurrency(project.budget)}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => navigate(`/projects/${project.id}`)}
                                                className="w-full py-2 text-xs font-medium text-indigo-600 bg-white border border-indigo-100 rounded hover:bg-indigo-50 transition-colors"
                                            >
                                                Manage Project
                                            </button>
                                        </div>
                                    );
                                })}
                                {data.projects.length === 0 && (
                                    <p className="text-center text-gray-400 italic py-4">No active projects found.</p>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;