import React from 'react';

const Dashboard = () => {

    const stats = [
        { label: 'Total Quotations', value: 25 },
        { label: 'Materials in Stock', value: 150 },
        { label: 'Pending Approvals', value: 3 },
    ];

    const recentQuotations = [
        { id: 'Q1024', title: 'Project Alpha - Phase 1', status: 'Approved' },
        { id: 'Q1023', title: 'New Office Setup', status: 'Pending' },
        { id: 'Q1022', title: 'Client Beta Renovation', status: 'Draft' },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white p-5 hidden md:block">
                <h1 className="text-2xl font-bold mb-8">Management</h1>
                <nav>
                    <ul className="space-y-3">
                        <li>
                            <a href="/dashboard" className="block py-2 px-4 rounded bg-gray-700 font-semibold">Dashboard</a>
                        </li>
                        <li>
                            <a href="/quotations" className="block py-2 px-4 rounded hover:bg-gray-700 transition">Quotations</a>
                        </li>
                        <li>
                            <a href="/materials" className="block py-2 px-4 rounded hover:bg-gray-700 transition">Materials</a>
                        </li>
                    </ul>
                </nav>
                <div className="absolute bottom-5 w-56">
                    <a href="/signin"
                        onClick={() => localStorage.removeItem('token')} // Basic logout
                        className="block py-2 px-4 rounded hover:bg-red-700 bg-red-600 text-center transition">
                        Logout
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8">
                    <h2 className="text-3xl font-semibold text-gray-800">Dashboard</h2>
                    <p className="text-gray-600">Welcome back!</p>
                </header>

                {/* Stats Section */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">{stat.label}</h3>
                            <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </section>

                {/* Recent Quotations Table */}
                <section className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Quotations</h3>
                    <div className="overflow-x-auto">
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quote.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${quote.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                quote.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {quote.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* You can add more sections here (e.g., charts, quick actions) */}

            </main>
        </div>
    );
};

export default Dashboard;