import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalQuotations: 0,
        totalMaterials: 0,
        totalClients: 0, // This will be replaced by total revenue
        pendingApprovals: 0,
    });
    const [recentQuotations, setRecentQuotations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                if (!token) return;

                const res = await axios.get("http://localhost:3001/api/v1/dashboard/stats", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const pending = res.data.quotationStatusCounts.find(s => s.status === 'Pending')?.count || 0;

                setStats({
                    totalQuotations: res.data.totalQuotations,
                    totalMaterials: res.data.totalMaterials,
                    approvedRevenue: res.data.approvedRevenue,
                    pendingApprovals: pending,
                });
                setRecentQuotations(res.data.recentQuotations);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8">
                    <h2 className="text-3xl font-semibold text-gray-800">Dashboard</h2>
                    <p className="text-gray-600">Welcome back!</p>
                </header>

                {/* Stats Section */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Total Quotations</h3>
                        <p className="text-3xl font-semibold text-gray-900">{isLoading ? '...' : stats.totalQuotations}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Pending Quotations</h3>
                        <p className="text-3xl font-semibold text-gray-900">{isLoading ? '...' : stats.pendingApprovals}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Total Revenue (Approved)</h3>
                        <p className="text-3xl font-semibold text-gray-900">{isLoading ? '...' : formatCurrency(stats.approvedRevenue)}</p>
                    </div>
                </section>

                {/* Recent Quotations Table */}
                <section className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Quotations</h3>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <p className="text-center text-gray-500 py-8">Loading recent quotations...</p>
                        ) : recentQuotations.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                    {recentQuotations.map((quote) => (
                                        <tr key={quote.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">QT-{quote.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    {
                                                        Approved: 'bg-green-100 text-green-800',
                                                        Pending: 'bg-yellow-100 text-yellow-800',
                                                        Rejected: 'bg-red-100 text-red-800',
                                                        Draft: 'bg-gray-100 text-gray-800'
                                                    }[quote.status] || 'bg-gray-100 text-gray-800'
                                                }`}>{quote.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                            </table>
                        ) : <p className="text-center text-gray-500 py-8 italic">No recent quotations.</p>}
                    </div>
                </section>

                {/* You can add more sections here (e.g., charts, quick actions) */}

            </main>
        </div>
    );
};

export default Dashboard;