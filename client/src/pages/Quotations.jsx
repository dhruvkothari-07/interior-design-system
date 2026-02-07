import React, { useEffect, useState } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URL } from '../config';
import {
    Search,
    FileText,
    ArrowRight,
    Clock,
    CheckCircle2,
    XCircle,
    FileEdit,
    TrendingUp,
    Plus,

    Calendar,
    IndianRupee,
    Users,
    SlidersHorizontal,
    Trash2,
    Eye
} from 'lucide-react';
import { handleApiError, confirmAction } from '../utils/errorHandler.jsx';
import { isAdmin } from '../utils/authUtils';

const Quotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [filteredQuotations, setFilteredQuotations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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

    const navigate = useNavigate();

    const fetchQuotations = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.get(`${API_URL}/quotations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setQuotations(res.data);
            setFilteredQuotations(res.data);
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
        fetchQuotations();
    }, []);

    useEffect(() => {
        let result = quotations;

        if (searchQuery) {
            result = result.filter(q =>
                q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(q => q.status?.toLowerCase() === statusFilter.toLowerCase());
        }

        setFilteredQuotations(result);
    }, [searchQuery, statusFilter, quotations]);

    const getStatusConfig = (status) => {
        const configs = {
            'approved': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, solidBg: 'bg-emerald-500', solidBorder: 'bg-emerald-500' },
            'pending': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, solidBg: 'bg-amber-500', solidBorder: 'bg-amber-500' },
            'rejected': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle, solidBg: 'bg-rose-500', solidBorder: 'bg-rose-500' },
            'draft': { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200', icon: FileEdit, solidBg: 'bg-[#8B8076]', solidBorder: 'bg-[#8B8076]' }
        };
        return configs[status?.toLowerCase()] || configs['draft'];
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const stats = {
        total: quotations.length,
        pending: quotations.filter(q => q.status?.toLowerCase() === 'pending').length,
        approved: quotations.filter(q => q.status?.toLowerCase() === 'approved').length,
        draft: quotations.filter(q => q.status?.toLowerCase() === 'draft').length,
        totalValue: quotations.reduce((sum, q) => sum + Number(q.total_amount || 0), 0)
    };

    const statusTabs = [
        { value: 'all', label: 'All', count: stats.total },
        { value: 'pending', label: 'Pending', count: stats.pending },
        { value: 'approved', label: 'Approved', count: stats.approved },
        { value: 'draft', label: 'Draft', count: stats.draft }
    ];

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

    const handleDeleteQuotation = (quotationId, event) => {
        event.stopPropagation();
        if (!isAdmin()) return;

        confirmAction(
            "Are you sure you want to delete this quotation?",
            async () => {
                const token = localStorage.getItem("token");
                await axios.delete(`${API_URL}/quotations/${quotationId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setQuotations(prev => prev.filter(q => q.id !== quotationId));
                setFilteredQuotations(prev => prev.filter(q => q.id !== quotationId));
                toast.success("Quotation deleted successfully");
            },
            {
                confirmText: "Delete",
                description: "This action cannot be undone. If a project exists, you must delete the project first."
            }
        );
    };



    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Header */}
                <div className="relative mb-10 animate-fade-in">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/5 via-transparent to-amber-500/5 rounded-3xl" />

                    <div className="relative p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center shadow-none">
                                    <FileText className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                        Quotations
                                    </h1>
                                    <p className="text-[var(--color-text-muted)] mt-1">
                                        {stats.total} quotations • {formatCurrency(stats.totalValue)} total value
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleAddModalOpen}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Quotation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Filters Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 animate-fade-in-up">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search quotations or clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-11 bg-white/80 backdrop-blur-sm"
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-[var(--color-border)] shadow-sm">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setStatusFilter(tab.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                                    ${statusFilter === tab.value
                                        ? 'bg-[var(--color-accent)] text-white shadow-md'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'}`}
                            >
                                {tab.label}
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs font-semibold ${statusFilter === tab.value ? 'bg-white/20' : 'bg-stone-100'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-[var(--color-text-muted)]">
                        Showing <span className="font-semibold text-[var(--color-text-primary)]">{filteredQuotations.length}</span> of {quotations.length} quotations
                    </p>
                </div>

                {/* Quotations Grid/List */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="card p-5 animate-pulse">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-stone-200 rounded-xl" />
                                    <div className="w-20 h-6 bg-stone-200 rounded-lg" />
                                </div>
                                <div className="h-5 bg-stone-200 rounded w-3/4 mb-2" />
                                <div className="h-4 bg-stone-100 rounded w-1/2 mb-4" />
                                <div className="h-8 bg-stone-100 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : filteredQuotations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                        {filteredQuotations.map((quotation, index) => {
                            const statusConfig = getStatusConfig(quotation.status);
                            const StatusIcon = statusConfig.icon;
                            return (
                                <div
                                    key={quotation.id}
                                    onClick={() => handleViewEdit(quotation.id)}
                                    className="group relative bg-white rounded-2xl border border-stone-200/60 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-stone-200/50 hover:border-[var(--color-accent)]/30"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Content */}
                                    <div className="relative pt-2">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-5">
                                            {/* Solid colored icon box - Orange Theme */}
                                            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center shadow-none">
                                                <FileText className="w-6 h-6 text-white" />
                                            </div>

                                            {/* Status Badge */}
                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border} flex items-center gap-1.5`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {quotation.status}
                                            </span>
                                        </div>



                                        {/* Title & Client */}
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-stone-800 mb-1 group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                                                {quotation.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-stone-500">
                                                <Users className="w-4 h-4" />
                                                <span className="text-sm font-medium truncate">{quotation.client_name || 'No client'}</span>
                                            </div>
                                        </div>

                                        {/* Amount Box */}
                                        <div className="bg-[#F8F6F4] rounded-xl p-4 mb-5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-stone-500">Total Amount</span>
                                                <span className="text-xl font-bold text-[var(--color-accent)]">
                                                    {formatCurrency(quotation.total_amount)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-1">
                                            {isAdmin() ? (
                                                <button
                                                    onClick={(e) => handleDeleteQuotation(quotation.id, e)}
                                                    className="flex items-center gap-1.5 text-sm font-medium text-stone-400 hover:text-rose-600 transition-colors p-1 -ml-1 rounded-md hover:bg-rose-50"
                                                    title="Delete Quotation"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="opacity-100 group-hover:opacity-100 transition-opacity">Delete</span>
                                                </button>
                                            ) : <div></div>}

                                            <div className="flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)] opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer hover:gap-2 duration-300">
                                                <span>View</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                ) : (
                    <div className="card p-16 text-center animate-fade-in-up">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[var(--color-accent)]/10 to-amber-100/50 flex items-center justify-center">
                            <FileText className="w-10 h-10 text-[var(--color-accent)]" />
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No quotations found</h3>
                        <p className="text-[var(--color-text-muted)] mb-6 max-w-sm mx-auto">
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Start by creating your first quotation to begin managing your proposals'}
                        </p>
                        <button
                            onClick={handleAddModalOpen}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create First Quotation
                        </button>
                    </div>
                )}
            </main>

            {/* Add Quotation Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-[var(--color-border)]">
                            <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">New Quotation</h3>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">Create a new quotation for a client</p>
                        </div>

                        <form onSubmit={handleAddQuotation} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        id="title"
                                        value={newQuotation.title}
                                        onChange={handleInputChange}
                                        required
                                        className="input"
                                        placeholder="e.g., Living Room Renovation"
                                    />
                                </div>

                                <div className="flex items-center gap-4 p-3 bg-[var(--color-bg-subtle)] rounded-xl">
                                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">Client:</span>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                className="accent-[var(--color-accent)]"
                                                name="clientOption"
                                                checked={!useExistingClient}
                                                onChange={() => { setUseExistingClient(false); setSelectedClientId(''); }}
                                            />
                                            <span className="text-sm">New Client</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                className="accent-[var(--color-accent)]"
                                                name="clientOption"
                                                checked={useExistingClient}
                                                onChange={() => setUseExistingClient(true)}
                                            />
                                            <span className="text-sm">Existing Client</span>
                                        </label>
                                    </div>
                                </div>

                                {useExistingClient ? (
                                    <div>
                                        <label htmlFor="client_id" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Select Client</label>
                                        <select
                                            name="client_id"
                                            id="client_id"
                                            value={selectedClientId}
                                            onChange={(e) => setSelectedClientId(e.target.value)}
                                            required
                                            className="input"
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
                                            <label htmlFor="client_name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Client Name</label>
                                            <input type="text" name="client_name" id="client_name" value={newQuotation.client_name} onChange={handleInputChange} required={!useExistingClient} className="input" placeholder="John Doe" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="client_email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Email</label>
                                                <input type="email" name="client_email" id="client_email" value={newQuotation.client_email} onChange={handleInputChange} className="input" placeholder="john@example.com" />
                                            </div>
                                            <div>
                                                <label htmlFor="client_phone" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Phone</label>
                                                <input type="tel" name="client_phone" id="client_phone" value={newQuotation.client_phone} onChange={handleInputChange} className="input" placeholder="+91 9876543210" />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="client_address" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Address</label>
                                            <textarea name="client_address" id="client_address" value={newQuotation.client_address} onChange={handleInputChange} rows="2" className="input resize-none" placeholder="123 Main Street, City" />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={handleAddModalClose} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Quotation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotations;