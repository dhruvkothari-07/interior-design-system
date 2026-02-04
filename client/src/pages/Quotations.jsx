import React, { useEffect, useState } from 'react';
import axios from "axios";
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Plus, Search, FileText, User, Trash2, ArrowRight, X } from 'lucide-react';

const Quotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newQuotation, setNewQuotation] = useState({
        title: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: ''
    });
    const [clients, setClients] = useState([]);
    const [useExistingClient, setUseExistingClient] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState('staff');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role || 'staff');
            } catch (e) {
                console.error("Token decode error", e);
            }
        }
    }, []);

    const fetchQuotations = async (search = '') => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.get(`${API_URL}/quotations`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search }
            });
            setQuotations(res.data);
        } catch (err) {
            console.error("Error fetching Quotations:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.get(`${API_URL}/clients`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setClients(res.data);
        } catch (err) {
            console.error("Error fetching clients:", err);
        }
    };

    useEffect(() => {
        const debounceFetch = setTimeout(() => {
            fetchQuotations(searchTerm);
        }, 300);
        return () => clearTimeout(debounceFetch);
    }, [searchTerm]);

    useEffect(() => {
        fetchQuotations('');
    }, []);

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'pending':
                return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'rejected':
                return 'bg-red-50 text-red-700 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-600 border border-gray-200';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewQuotation(prev => ({ ...prev, [name]: value }));
    };

    const handleAddModalOpen = () => {
        setIsAddModalOpen(true);
        fetchClients();
    };

    const handleAddModalClose = () => {
        setIsAddModalOpen(false);
        setUseExistingClient(false);
        setSelectedClientId('');
        setNewQuotation({ title: '', client_name: '', client_email: '', client_phone: '', client_address: '' });
    };

    const handleAddQuotation = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const postData = {
                title: newQuotation.title,
                ...(useExistingClient && selectedClientId ? { client_id: selectedClientId } : {
                    client_name: newQuotation.client_name,
                    client_email: newQuotation.client_email,
                    client_phone: newQuotation.client_phone,
                    client_address: newQuotation.client_address,
                })
            };

            const res = await axios.post(`${API_URL}/quotations`, postData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setQuotations([res.data, ...quotations]);
            handleAddModalClose();
        } catch (err) {
            console.error("Error adding quotation: ", err);
            alert("Failed to add quotation. Please check the console for details.");
        }
    };

    const handleViewEdit = (quotationId) => {
        navigate(`/quotations/${quotationId}`);
    };

    const handleDeleteQuotation = async (quotationId, quotationTitle) => {
        if (!window.confirm(`Are you sure you want to delete the quotation "${quotationTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            await axios.delete(`${API_URL}/quotations/${quotationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setQuotations(currentQuotations => currentQuotations.filter(q => q.id !== quotationId));
        } catch (err) {
            console.error("Error deleting quotation:", err);
            alert("Failed to delete quotation. It might be associated with other data.");
        }
    };

    return (
        <Layout>
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Quotations</h1>
                    <p className="text-gray-500 mt-1">Create and manage client quotations.</p>
                </div>
                <button
                    onClick={handleAddModalOpen}
                    className="flex items-center gap-2 px-6 py-2.5 bg-theme-orange hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-orange-200"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Quotation</span>
                </button>
            </header>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by title or client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange transition"
                    />
                </div>
            </div>

            {/* Quotations Grid - Card Layout */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading quotations...</p>
                </div>
            ) : quotations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quotations.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-100 transition-all duration-300 overflow-hidden group"
                        >
                            {/* Card Header with Status */}
                            <div className="p-6 pb-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-theme-orange transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                            <User className="w-4 h-4" />
                                            <span className="truncate">{item.client_name || 'No client'}</span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyles(item.status)}`}>
                                        {item.status || 'Draft'}
                                    </span>
                                </div>

                                {/* Amount Display - simplified without dollar icon */}
                                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                                    <p className="text-xs text-gray-500 font-medium mb-1">Total Amount</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {item.total_amount ? formatCurrency(item.total_amount) : '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                {/* Delete Button (Admin Only) */}
                                {userRole === 'admin' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteQuotation(item.id, item.title);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleViewEdit(item.id)}
                                    className="flex items-center gap-2 px-4 py-2 text-theme-orange hover:bg-orange-50 rounded-lg font-medium text-sm transition"
                                >
                                    <FileText className="w-4 h-4" />
                                    View Details
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100">
                    <FileText className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 italic">No quotations found.</p>
                    <button
                        onClick={handleAddModalOpen}
                        className="mt-4 text-theme-orange hover:text-orange-700 font-medium text-sm"
                    >
                        + Create your first quotation
                    </button>
                </div>
            )}

            {/* Add Quotation Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-fadeInUp max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={handleAddModalClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">New Quotation</h3>
                        <form onSubmit={handleAddQuotation} className="space-y-5">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    id="title"
                                    value={newQuotation.title}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange transition"
                                    placeholder="e.g., Living Room Renovation"
                                />
                            </div>

                            {/* Client Selection Toggle */}
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-sm font-medium text-gray-700">Client:</span>
                                <div className="flex gap-4">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            className="form-radio text-theme-orange focus:ring-theme-orange"
                                            name="clientOption"
                                            value="new"
                                            checked={!useExistingClient}
                                            onChange={() => { setUseExistingClient(false); setSelectedClientId(''); }}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">New</span>
                                    </label>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            className="form-radio text-theme-orange focus:ring-theme-orange"
                                            name="clientOption"
                                            value="existing"
                                            checked={useExistingClient}
                                            onChange={() => setUseExistingClient(true)}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Existing</span>
                                    </label>
                                </div>
                            </div>

                            {/* Conditional Client Fields */}
                            {useExistingClient ? (
                                <div>
                                    <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
                                    <select
                                        name="client_id"
                                        id="client_id"
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange transition bg-white"
                                    >
                                        <option value="" disabled>Select an existing client</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                                        <input
                                            type="text"
                                            name="client_name"
                                            id="client_name"
                                            value={newQuotation.client_name}
                                            onChange={handleInputChange}
                                            required={!useExistingClient}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange transition"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="client_email" className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                                        <input
                                            type="email"
                                            name="client_email"
                                            id="client_email"
                                            value={newQuotation.client_email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange transition"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="client_phone" className="block text-sm font-medium text-gray-700 mb-1">Client Phone</label>
                                        <input
                                            type="tel"
                                            name="client_phone"
                                            id="client_phone"
                                            value={newQuotation.client_phone}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange transition"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="client_address" className="block text-sm font-medium text-gray-700 mb-1">Client Address</label>
                                        <textarea
                                            name="client_address"
                                            id="client_address"
                                            value={newQuotation.client_address}
                                            onChange={handleInputChange}
                                            rows="2"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange transition resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleAddModalClose}
                                    className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-theme-orange text-white rounded-lg font-medium hover:bg-orange-700 transition shadow-lg shadow-orange-200"
                                >
                                    Create Quotation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Quotations;