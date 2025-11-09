import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useParams, useNavigate } from 'react-router-dom';

const ClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [clientData, setClientData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClientDetails = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) { navigate('/signin'); return; }

            const res = await axios.get(`http://localhost:3001/api/v1/clients/${id}/details`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setClientData(res.data);
        } catch (err) {
            console.error("Error fetching client details:", err);
            setError("Failed to load client details.");
        } finally {
            setIsLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchClientDetails();
    }, [fetchClientDetails]);

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase();
        if (s === 'approved' || s === 'completed') return 'bg-green-100 text-green-800';
        if (s === 'pending' || s === 'in progress') return 'bg-yellow-100 text-yellow-800';
        if (s === 'rejected' || s === 'on hold') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    };

    if (isLoading) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p>Loading client details...</p></div>;
    if (error) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p className="text-red-500">{error}</p></div>;
    if (!clientData) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p>Client not found.</p></div>;

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-4">
                    <h2 className="text-3xl font-semibold text-gray-800">Client Hub: {clientData.name}</h2>
                    <button onClick={() => navigate('/clients')} className="bg-gray-600 text-white px-5 py-2 rounded-lg shadow hover:bg-gray-700 transition">
                        Back to Clients List
                    </button>
                </header>

                {/* Client Contact Info */}
                <section className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
                    <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <p><strong>Email:</strong> {clientData.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {clientData.phone || 'N/A'}</p>
                        <p className="md:col-span-2"><strong>Address:</strong> {clientData.address || 'N/A'}</p>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quotations Section */}
                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4">Quotations</h3>
                        <div className="overflow-x-auto max-h-96">
                            {clientData.quotations && clientData.quotations.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {clientData.quotations.map(q => (
                                            <tr key={q.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/quotations/${q.id}`)}>
                                                <td className="px-4 py-3 font-medium text-indigo-600">{q.title}</td>
                                                <td className="px-4 py-3"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(q.status)}`}>{q.status}</span></td>
                                                <td className="px-4 py-3 text-right">{q.total_amount ? formatCurrency(q.total_amount) : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-center text-gray-400 italic py-4">No quotations found for this client.</p>
                            )}
                        </div>
                    </section>

                    {/* Projects Section */}
                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4">Projects</h3>
                        <div className="overflow-x-auto max-h-96">
                            {clientData.projects && clientData.projects.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Budget</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {clientData.projects.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                                                <td className="px-4 py-3 font-medium text-indigo-600">{p.name}</td>
                                                <td className="px-4 py-3"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                                                <td className="px-4 py-3 text-right">{p.budget ? formatCurrency(p.budget) : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-center text-gray-400 italic py-4">No projects found for this client.</p>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ClientDetail;