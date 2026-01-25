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
    ArrowRight
} from 'lucide-react';
import { API_URL } from '../config';

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

    // --- Derived State for Project Health ---
    const projectHealth = useMemo(() => {
        let critical = 0;
        let atRisk = 0;
        let onTrack = 0;

        data.projects.forEach(p => {
            if (p.status !== 'In Progress') return; // Only count active projects
            const spentPct = (p.total_spent / p.budget) * 100;
            
            if (spentPct > 100) critical++;
            else if (spentPct > 80) atRisk++;
            else onTrack++;
        });

        return { critical, atRisk, onTrack };
    }, [data.projects]);

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
                <header className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-serif font-medium text-gray-900 tracking-tight">Command Center</h1>
                    <p className="text-sm text-gray-500 mt-1">Overview of Financials, Operations, and Sales.</p>
                </header>

                {/* --- TIER 1: FINANCIAL CARDS --- */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                    {/* Card 1: Revenue YTD */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-2 md:mb-4 gap-2">
                            <div className="p-1.5 md:p-2 bg-gray-50 rounded-lg text-gray-600 w-fit">
                                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">YTD</span>
                        </div>
                        <h3 className="text-lg md:text-2xl font-bold text-gray-900">{formatCompactCurrency(data.financials.revenueYTD)}</h3>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Total Revenue</p>
                    </div>

                    {/* Card 2: Booked Revenue (Month) */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-2 md:mb-4 gap-2">
                            <div className="p-1.5 md:p-2 bg-gray-50 rounded-lg text-gray-600 w-fit">
                                <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Month</span>
                        </div>
                        <h3 className="text-lg md:text-2xl font-bold text-gray-900">{formatCompactCurrency(data.financials.revenueMonth)}</h3>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Booked Rev.</p>
                    </div>

                    {/* Card 3: Operational Expense */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-2 md:mb-4 gap-2">
                            <div className="p-1.5 md:p-2 bg-gray-50 rounded-lg text-gray-600 w-fit">
                                <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Expenses</span>
                        </div>
                        <h3 className="text-lg md:text-2xl font-bold text-gray-900">{formatCompactCurrency(data.financials.expensesMonth)}</h3>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Operational</p>
                    </div>

                    {/* Card 4: Net Cash Flow */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-2 md:mb-4 gap-2">
                            <div className="p-1.5 md:p-2 bg-gray-50 rounded-lg text-gray-600 w-fit">
                                <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Net Flow</span>
                        </div>
                        <h3 className={`text-lg md:text-2xl font-bold ${data.financials.revenueMonth - data.financials.expensesMonth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCompactCurrency(data.financials.revenueMonth - data.financials.expensesMonth)}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Bottom Line</p>
                    </div>
                </section>

                {/* --- TIER 1.5: REVENUE TREND CHART --- */}
                <section className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 mb-6 md:mb-8">
                    <h3 className="font-semibold text-gray-800 mb-6">Revenue Trend (Last 6 Months)</h3>
                    <div className="flex items-end justify-between gap-2 h-48 md:h-64 pt-8 pb-2">
                        {data.revenueTrend && data.revenueTrend.length > 0 ? (
                            data.revenueTrend.map((item, index) => {
                                const maxVal = Math.max(...data.revenueTrend.map(d => d.total), 1);
                                const heightPct = (item.total / maxVal) * 100;
                                return (
                                    <div key={index} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                                        <div className="relative w-full flex justify-center items-end h-full rounded-t-lg overflow-visible">
                                            <div 
                                                className="w-full max-w-[40px] bg-indigo-500 rounded-t-md transition-all duration-500 group-hover:bg-indigo-600 relative"
                                                style={{ height: `${heightPct}%`, minHeight: '4px' }}
                                            >
                                                {/* Tooltip */}
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                    {formatCompactCurrency(item.total)}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] md:text-xs text-gray-500 font-medium">{item.month}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="w-full text-center text-gray-400 italic self-center">No revenue data available yet.</p>
                        )}
                    </div>
                </section>

                {/* --- TIER 2: THE ENGINE ROOM --- */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                    
                    {/* Left Widget: Sales Pipeline */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                        {/* Pending Half */}
                        <div className="flex-1 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <h3 className="font-semibold text-gray-800">Pending Client Action</h3>
                            </div>
                            <div className="mt-2">
                                <p className="text-4xl font-bold text-gray-900">{data.pipeline.pendingCount}</p>
                                <p className="text-sm text-gray-500 mt-1">Quotes Sent</p>
                                <div className="mt-4 pt-4 border-t border-gray-50">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Potential Value</p>
                                    <p className="text-lg font-medium text-indigo-600">{formatCompactCurrency(data.pipeline.pendingValue)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Won Half */}
                        <div className="flex-1 p-4 md:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="w-5 h-5 text-gray-400" />
                                <h3 className="font-semibold text-gray-800">Won This Month</h3>
                            </div>
                            <div className="mt-2">
                                <p className="text-4xl font-bold text-gray-900">{data.pipeline.wonMonthCount}</p>
                                <p className="text-sm text-gray-500 mt-1">Approved Quotes</p>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">New Booked Revenue</p>
                                    <p className="text-lg font-medium text-emerald-600">{formatCompactCurrency(data.pipeline.wonMonthValue)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Widget: Active Project Health */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-4 md:mb-6">Active Project Health</h3>
                        <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                                <p className="text-3xl font-bold text-rose-600">{projectHealth.critical}</p>
                                <p className="text-xs font-medium text-rose-800 mt-1 uppercase tracking-wide">Critical</p>
                            </div>
                            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                                <p className="text-3xl font-bold text-orange-600">{projectHealth.atRisk}</p>
                                <p className="text-xs font-medium text-orange-800 mt-1 uppercase tracking-wide">At Risk</p>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                <p className="text-3xl font-bold text-emerald-600">{projectHealth.onTrack}</p>
                                <p className="text-xs font-medium text-emerald-800 mt-1 uppercase tracking-wide">On Track</p>
                            </div>
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-4">Based on Budget vs. Spent metrics</p>
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
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget Health</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
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
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                    project.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                                                    project.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                <div className="w-full max-w-xs">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-gray-500">{formatCompactCurrency(project.total_spent)} spent</span>
                                                        <span className="text-gray-400">of {formatCompactCurrency(project.budget)}</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${isOverBudget ? 'bg-rose-500' : percentSpent > 80 ? 'bg-orange-400' : 'bg-emerald-500'}`} 
                                                            style={{ width: `${Math.min(percentSpent, 100)}%` }}
                                                        />
                                                    </div>
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
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden p-4 space-y-4">
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
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                            project.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                                            project.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500">{formatCompactCurrency(project.total_spent)} spent</span>
                                            <span className="text-gray-400">of {formatCompactCurrency(project.budget)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${isOverBudget ? 'bg-rose-500' : percentSpent > 80 ? 'bg-orange-400' : 'bg-emerald-500'}`} 
                                                style={{ width: `${Math.min(percentSpent, 100)}%` }}
                                            />
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
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;