import React, { useEffect, useState } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URL } from '../config';
import {
    Search,
    FileText,
    Plus,
    X,
    Edit3,
    Trash2,
    ArrowRight,
    User,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    FileEdit,
    IndianRupee,
    Calendar,
    TrendingUp,
    Send,
    LayoutGrid,
    List,
    MoreHorizontal,
    Eye,
    Sparkles
} from 'lucide-react';

const Quotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newQuotation, setNewQuotation] = useState({ title: '', client_name: '', client_email: '', client_phone: '', client_address: '' });
    const [clients, setClients] = useState([]);
    const [useExistingClient, setUseExistingClient] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const navigate = useNavigate();

    const fetchQuotations = async (search = '') => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.get(`${API_URL}/quotations`, { headers: { Authorization: `Bearer ${token}` }, params: { search } });
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
            const res = await axios.get(`${API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } });
            setClients(res.data);
        } catch (err) {
            console.error("Error fetching clients:", err);
        }
    };

    useEffect(() => {
        const debounceFetch = setTimeout(() => { fetchQuotations(searchTerm); }, 300);
        return () => clearTimeout(debounceFetch);
    }, [searchTerm]);

    useEffect(() => { fetchQuotations(''); }, []);

    const getStatusConfig = (status) => {
        const configs = {
            'Approved': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500' },
            'Pending': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, gradient: 'from-amber-500 to-orange-500' },
            'Rejected': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle, gradient: 'from-rose-500 to-rose-600' },
            'Draft': { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200', icon: FileEdit, gradient: 'from-stone-400 to-stone-500' }
        };
        return configs[status] || configs['Draft'];
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
            const res = await axios.post(`${API_URL}/quotations`, postData, { headers: { Authorization: `Bearer ${token}` } });
            setQuotations([res.data, ...quotations]);
            handleAddModalClose();
            navigate(`/quotations/${res.data.id}`);
        } catch (err) {
            console.error("Error adding quotation:", err);
            toast.error('Failed to add quotation');
        }
    };

    const handleDeleteQuotation = async (id, title, e) => {
        e.stopPropagation();

        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-medium">Delete "{title}"?</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const token = localStorage.getItem("token");
                                if (!token) return;
                                await axios.delete(`${API_URL}/quotations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                                setQuotations(current => current.filter(q => q.id !== id));
                                toast.success('Quotation deleted');
                            } catch (err) {
                                console.error("Error deleting quotation:", err);
                                toast.error('Failed to delete quotation');
                            }
                        }}
                        className="px-3 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

    // Stats
    const stats = {
        total: quotations.length,
        pending: quotations.filter(q => q.status === 'Pending').length,
        approved: quotations.filter(q => q.status === 'Approved').length,
        rejected: quotations.filter(q => q.status === 'Rejected').length,
        draft: quotations.filter(q => q.status === 'Draft').length,
        totalValue: quotations.reduce((sum, q) => sum + Number(q.total_amount || 0), 0),
        approvedValue: quotations.filter(q => q.status === 'Approved').reduce((sum, q) => sum + Number(q.total_amount || 0), 0)
    };

    const statusTabs = [
        { value: 'all', label: 'All', count: stats.total },
        { value: 'Pending', label: 'Pending', count: stats.pending },
        { value: 'Approved', label: 'Approved', count: stats.approved },
        { value: 'Draft', label: 'Drafts', count: stats.draft }
    ];

    const filteredQuotations = statusFilter === 'all'
        ? quotations
        : quotations.filter(q => q.status === statusFilter);

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Header */}
                <div className="relative mb-10 animate-fade-in">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/5 via-transparent to-amber-500/5 rounded-3xl" />

                    <div className="relative p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center shadow-lg">
                                    <FileText className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                        Quotations
                                    </h1>
                                    <p className="text-[var(--color-text-muted)] mt-1">
                                        {stats.total} total • {formatCurrency(stats.totalValue)} pipeline value
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleAddModalOpen}
                                className="btn-primary flex items-center gap-2 shadow-lg shadow-[var(--color-accent)]/25"
                            >
                                <Plus className="w-4 h-4" />
                                New Quotation
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
                    {/* Total Value */}
                    <div className="card p-5 relative overflow-hidden group hover:shadow-lg transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-500" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-[var(--color-text-muted)]">Pipeline Value</span>
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center">
                                    <IndianRupee className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(stats.totalValue)}</p>
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="card p-5 group hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-[var(--color-text-muted)]">Pending</span>
                            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Clock className="w-4 h-4 text-amber-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.pending}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">awaiting response</p>
                    </div>

                    {/* Approved */}
                    <div className="card p-5 group hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-[var(--color-text-muted)]">Approved</span>
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
                        <p className="text-xs text-emerald-600 mt-1">{formatCurrency(stats.approvedValue)}</p>
                    </div>

                    {/* Conversion Rate */}
                    <div className="card p-5 group hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-[var(--color-text-muted)]">Conversion</span>
                            <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-4 h-4 text-stone-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                            {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">success rate</p>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 animate-fade-in-up">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search quotations or clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-11 bg-white/80 backdrop-blur-sm"
                        />
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-[var(--color-border)] shadow-sm">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setStatusFilter(tab.value)}
                                className={`
                                    px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                                    ${statusFilter === tab.value
                                        ? 'bg-[var(--color-accent)] text-white shadow-md'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'}
                                `}
                            >
                                {tab.label}
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs font-semibold ${statusFilter === tab.value
                                    ? 'bg-white/20'
                                    : 'bg-stone-100'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[var(--color-border)] shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:bg-stone-100'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:bg-stone-100'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
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
                                <div className="h-8 bg-stone-100 rounded mb-3" />
                            </div>
                        ))}
                    </div>
                ) : filteredQuotations.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in-up">
                            {filteredQuotations.map((item, index) => {
                                const statusConfig = getStatusConfig(item.status);
                                const StatusIcon = statusConfig.icon;

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => navigate(`/quotations/${item.id}`)}
                                        className="card p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                                        style={{ animationDelay: `${index * 40}ms` }}
                                    >
                                        {/* Top gradient accent */}
                                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${statusConfig.gradient}`} />

                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                                                <FileText className="w-6 h-6 text-white" />
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border flex items-center gap-1`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {item.status}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                                            {item.title}
                                        </h3>

                                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-4">
                                            <User className="w-3.5 h-3.5" />
                                            <span className="truncate">{item.client_name || 'No client assigned'}</span>
                                        </div>

                                        {/* Amount */}
                                        <div className="bg-[var(--color-bg-subtle)] rounded-xl p-3 mb-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-[var(--color-text-muted)]">Total Value</span>
                                                <span className="text-lg font-bold text-[var(--color-text-primary)]">{formatCurrency(item.total_amount)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                                            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No date'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleDeleteQuotation(item.id, item.title, e)}
                                                    className="p-2 text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <div className="flex items-center gap-1 text-xs text-[var(--color-accent)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    View
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card overflow-hidden animate-fade-in-up">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Quotation</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Client</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Status</th>
                                            <th className="text-right px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Amount</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {filteredQuotations.map((item, index) => {
                                            const statusConfig = getStatusConfig(item.status);
                                            const StatusIcon = statusConfig.icon;

                                            return (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => navigate(`/quotations/${item.id}`)}
                                                    className="hover:bg-[var(--color-bg-subtle)] cursor-pointer transition-colors group"
                                                    style={{ animationDelay: `${index * 30}ms` }}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center`}>
                                                                <FileText className="w-5 h-5 text-white" />
                                                            </div>
                                                            <span className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{item.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                                                        {item.client_name || <span className="text-[var(--color-text-muted)] italic">No client</span>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-semibold text-[var(--color-text-primary)]">
                                                        {formatCurrency(item.total_amount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">
                                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => handleDeleteQuotation(item.id, item.title, e)}
                                                                className="p-2 text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="card p-16 text-center animate-fade-in-up">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[var(--color-accent)]/10 to-amber-100/50 flex items-center justify-center">
                            <FileText className="w-10 h-10 text-[var(--color-accent)]" />
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No quotations found</h3>
                        <p className="text-[var(--color-text-muted)] mb-6 max-w-sm mx-auto">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Create your first quotation to start managing client proposals'}
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

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-accent)]/5 to-amber-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
                                New Quotation
                            </h3>
                            <button onClick={handleAddModalClose} className="p-1.5 hover:bg-white rounded-lg transition">
                                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                        </div>
                        <form onSubmit={handleAddQuotation} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Title *</label>
                                <input type="text" name="title" value={newQuotation.title} onChange={handleInputChange} required className="input" placeholder="e.g. Living Room Renovation" />
                            </div>

                            {/* Client Toggle */}
                            <div className="flex items-center gap-4 p-3 bg-[var(--color-bg-subtle)] rounded-xl">
                                <span className="text-sm font-medium text-[var(--color-text-secondary)]">Client:</span>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="clientOption" checked={!useExistingClient} onChange={() => { setUseExistingClient(false); setSelectedClientId(''); }} className="accent-[var(--color-accent)]" />
                                        <span className="text-sm text-[var(--color-text-primary)]">New</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="clientOption" checked={useExistingClient} onChange={() => setUseExistingClient(true)} className="accent-[var(--color-accent)]" />
                                        <span className="text-sm text-[var(--color-text-primary)]">Existing</span>
                                    </label>
                                </div>
                            </div>

                            {useExistingClient ? (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Select Client *</label>
                                    <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required className="input">
                                        <option value="" disabled>Choose a client</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Client Name *</label>
                                        <input type="text" name="client_name" value={newQuotation.client_name} onChange={handleInputChange} required={!useExistingClient} className="input" placeholder="John Doe" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Email</label>
                                            <input type="email" name="client_email" value={newQuotation.client_email} onChange={handleInputChange} className="input" placeholder="john@example.com" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Phone</label>
                                            <input type="tel" name="client_phone" value={newQuotation.client_phone} onChange={handleInputChange} className="input" placeholder="+91..." />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={handleAddModalClose} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create & Edit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotations;