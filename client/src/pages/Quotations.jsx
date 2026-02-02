import React, { useEffect, useState } from 'react';
import axios from "axios";
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Search, FileText, Plus, X, Edit3, Trash2, ArrowRight, User } from 'lucide-react';

const Quotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newQuotation, setNewQuotation] = useState({ title: '', client_name: '', client_email: '', client_phone: '', client_address: '' });
    const [clients, setClients] = useState([]);
    const [useExistingClient, setUseExistingClient] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
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
            'Approved': { class: 'badge-success', label: 'Approved' },
            'Pending': { class: 'badge-warning', label: 'Pending' },
            'Rejected': { class: 'badge-danger', label: 'Rejected' },
            'Draft': { class: 'badge-neutral', label: 'Draft' }
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
        } catch (err) {
            console.error("Error adding quotation:", err);
            alert("Failed to add quotation.");
        }
    };

    const handleDeleteQuotation = async (id, title) => {
        if (!window.confirm(`Delete "${title}"?`)) return;
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            await axios.delete(`${API_URL}/quotations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setQuotations(current => current.filter(q => q.id !== id));
        } catch (err) {
            console.error("Error deleting quotation:", err);
            alert("Failed to delete quotation.");
        }
    };

    const formatCurrency = (amt) => amt ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt) : '—';

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Quotations</h1>
                        <p className="text-[var(--color-text-secondary)] mt-1">Manage client quotations and proposals</p>
                    </div>
                    <button onClick={handleAddModalOpen} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Quotation
                    </button>
                </div>

                {/* Search */}
                <div className="mb-8 animate-fade-in animation-delay-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search quotations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-12"
                        />
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="card p-8 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded" />)}
                        </div>
                    </div>
                ) : quotations.length > 0 ? (
                    <div className="card overflow-hidden animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[var(--color-bg-subtle)]">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {quotations.map((item, index) => {
                                        const statusConfig = getStatusConfig(item.status);
                                        return (
                                            <tr key={item.id} className="hover:bg-[var(--color-bg-subtle)]/50 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-[var(--color-accent)] text-xs font-bold">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium text-[var(--color-text-primary)]">{item.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{item.client_name || <span className="italic text-[var(--color-text-muted)]">No client</span>}</td>
                                                <td className="px-6 py-4 text-right font-medium text-[var(--color-text-primary)]">{formatCurrency(item.total_amount)}</td>
                                                <td className="px-6 py-4"><span className={statusConfig.class}>{statusConfig.label}</span></td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => navigate(`/quotations/${item.id}`)} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-subtle)] rounded-lg transition">
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteQuotation(item.id, item.title)} className="p-2 text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="card p-12 text-center animate-fade-in">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-subtle)] flex items-center justify-center">
                            <FileText className="w-8 h-8 text-[var(--color-text-muted)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No quotations found</h3>
                        <p className="text-[var(--color-text-secondary)]">
                            {searchTerm ? `No results for "${searchTerm}"` : 'Create your first quotation to get started'}
                        </p>
                    </div>
                )}
            </main>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-md p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">New Quotation</h3>
                            <button onClick={handleAddModalClose} className="p-2 hover:bg-[var(--color-bg-subtle)] rounded-lg transition">
                                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                        </div>
                        <form onSubmit={handleAddQuotation} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Title *</label>
                                <input type="text" name="title" value={newQuotation.title} onChange={handleInputChange} required className="input" placeholder="Quotation title" />
                            </div>

                            {/* Client Toggle */}
                            <div className="flex items-center gap-4 p-3 bg-[var(--color-bg-subtle)] rounded-xl">
                                <span className="text-sm font-medium text-[var(--color-text-secondary)]">Client:</span>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="clientOption" checked={!useExistingClient} onChange={() => { setUseExistingClient(false); setSelectedClientId(''); }} className="text-[var(--color-accent)]" />
                                        <span className="text-sm text-[var(--color-text-primary)]">New</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="clientOption" checked={useExistingClient} onChange={() => setUseExistingClient(true)} className="text-[var(--color-accent)]" />
                                        <span className="text-sm text-[var(--color-text-primary)]">Existing</span>
                                    </label>
                                </div>
                            </div>

                            {useExistingClient ? (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Select Client *</label>
                                    <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required className="input">
                                        <option value="" disabled>Choose a client</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Client Name *</label>
                                        <input type="text" name="client_name" value={newQuotation.client_name} onChange={handleInputChange} required={!useExistingClient} className="input" placeholder="John Doe" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
                                            <input type="email" name="client_email" value={newQuotation.client_email} onChange={handleInputChange} className="input" placeholder="john@example.com" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Phone</label>
                                            <input type="tel" name="client_phone" value={newQuotation.client_phone} onChange={handleInputChange} className="input" placeholder="+91..." />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={handleAddModalClose} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create Quotation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotations;