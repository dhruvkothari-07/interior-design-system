import React, { useEffect, useState, useMemo } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URL } from '../config';
import {
    Search,
    Users,
    User, // Added User icon
    Plus,
    X,
    ArrowRight,
    Mail,
    Phone,
    MapPin,
    Edit2,
    Trash2,
    TrendingUp,
    FileText,
    FolderKanban,
    IndianRupee,
    UserPlus,
    Filter
} from 'lucide-react';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchClients = async (search = '') => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.get(`${API_URL}/clients-full`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search }
            });
            setClients(res.data);
        } catch (err) {
            console.error("Error fetching Clients:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounceFetch = setTimeout(() => { fetchClients(searchTerm); }, 300);
        return () => clearTimeout(debounceFetch);
    }, [searchTerm]);

    useEffect(() => { fetchClients(''); }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewClient(prev => ({ ...prev, [name]: value }));
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditingClient(prev => ({ ...prev, [name]: value }));
    };

    const handleAddClient = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.post(`${API_URL}/clients`, newClient, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClients([res.data, ...clients]);
            setIsAddModalOpen(false);
            setNewClient({ name: '', email: '', phone: '', address: '' });
            toast.success('Client added successfully!');
        } catch (err) {
            console.error("Error adding client: ", err);
            toast.error('Failed to add client');
        }
    };

    const handleEditClick = (client, e) => {
        e.stopPropagation();
        setEditingClient(client);
        setIsEditModalOpen(true);
    };

    const handleUpdateClient = async (e) => {
        e.preventDefault();
        if (!editingClient) return;
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.put(`${API_URL}/clients/${editingClient.id}`, editingClient, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClients(clients.map(client => client.id === editingClient.id ? res.data : client));
            setIsEditModalOpen(false);
            setEditingClient(null);
            toast.success('Client updated!');
        } catch (err) {
            console.error("Error updating client: ", err);
            const errorMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to update client';
            toast.error(errorMsg);
        }
    };

    const handleDeleteClient = async (clientId, clientName, e) => {
        e.stopPropagation();
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium text-sm">Delete "{clientName}"?</p>
                <div className="flex gap-2">
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 text-xs bg-stone-100 rounded-lg">Cancel</button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const token = localStorage.getItem("token");
                                await axios.delete(`${API_URL}/clients/${clientId}`, { headers: { Authorization: `Bearer ${token}` } });
                                setClients(clients.filter(c => c.id !== clientId));
                                toast.success('Client deleted');
                            } catch (err) {
                                toast.error('Failed to delete');
                            }
                        }}
                        className="px-3 py-1 text-xs bg-rose-500 text-white rounded-lg"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), { duration: 8000 });
    };

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

    // Stats
    const stats = useMemo(() => ({
        total: clients.length,
        withProjects: clients.filter(c => c.project_count > 0).length,
        totalRevenue: clients.reduce((sum, c) => sum + (Number(c.total_revenue) || 0), 0)
    }), [clients]);


    return (
        <div className="min-h-screen bg-[var(--color-bg)]">

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Header */}
                <div className="bg-gradient-to-br from-[var(--color-accent)]/10 via-amber-50/50 to-orange-50/30 rounded-3xl p-4 lg:p-8 mb-2 animate-fade-in">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">Clients</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Add */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in-up">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all"
                        />
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap">
                        Add Client
                    </button>
                </div>

                {/* Client Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-[var(--color-border)] p-6 animate-pulse">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-stone-200" />
                                    <div className="flex-1">
                                        <div className="h-5 bg-stone-200 rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-stone-100 rounded w-1/2" />
                                    </div>
                                </div>
                                <div className="h-3 bg-stone-100 rounded w-full mb-2" />
                                <div className="h-3 bg-stone-100 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : clients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {clients.map((client, index) => (
                            <div
                                key={client.id}
                                onClick={() => navigate(`/clients/${client.id}`)}
                                className="group bg-white rounded-2xl border border-[var(--color-border)] p-6 hover:shadow-xl hover:border-[var(--color-accent)]/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-base md:text-lg text-[var(--color-text-primary)] transition-colors truncate">
                                                {client.name}
                                            </h3>
                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                Added {new Date(client.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => handleEditClick(client, e)} className="p-2 hover:bg-[var(--color-accent)]/10 rounded-lg transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => handleDeleteClient(client.id, client.name, e)} className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-[var(--color-text-muted)] hover:text-rose-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-2 mb-5">
                                    {client.email && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                            <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                                            <span className="truncate">{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                            <Phone className="w-4 h-4 text-[var(--color-text-muted)]" />
                                            <span>{client.phone}</span>
                                        </div>
                                    )}
                                    {client.address && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                            <MapPin className="w-4 h-4 text-[var(--color-text-muted)]" />
                                            <span className="truncate">{client.address}</span>
                                        </div>
                                    )}
                                    {!client.email && !client.phone && !client.address && (
                                        <p className="text-sm text-[var(--color-text-muted)] italic">No contact info added</p>
                                    )}
                                </div>

                                {/* Stats Footer */}
                                <div className="flex items-center gap-4 pt-4 border-t border-[var(--color-border)]">
                                    <div className="flex items-center gap-1.5 text-sm">

                                        <span className="font-medium text-[var(--color-text-primary)]">{client.project_count || 0}</span>
                                        <span className="text-[var(--color-text-muted)]">Projects</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">

                                        <span className="font-medium text-[var(--color-text-primary)]">{client.quotation_count || 0}</span>
                                        <span className="text-[var(--color-text-muted)]">Quotes</span>
                                    </div>
                                    {client.total_revenue > 0 && (
                                        <div className="ml-auto flex items-center gap-1 text-sm font-medium text-emerald-600">
                                            <IndianRupee className="w-3.5 h-3.5" />
                                            {new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(client.total_revenue)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center animate-fade-in">
                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No clients found</h3>
                        <p className="text-[var(--color-text-secondary)] mb-6">
                            {searchTerm ? `No results for "${searchTerm}"` : 'Add your first client to get started'}
                        </p>
                        {!searchTerm && (
                            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Add Your First Client
                            </button>
                        )}
                    </div>
                )}
            </main>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-accent)]/5 to-amber-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">

                                Add New Client
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-white rounded-lg transition">
                                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                        </div>
                        <form onSubmit={handleAddClient} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Full Name *</label>
                                <input type="text" name="name" value={newClient.name} onChange={handleInputChange} required className="input" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Email</label>
                                <input type="email" name="email" value={newClient.email} onChange={handleInputChange} className="input" placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Phone</label>
                                <input type="tel" name="phone" value={newClient.phone} onChange={handleInputChange} className="input" placeholder="+91 98765 43210" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Address</label>
                                <textarea name="address" value={newClient.address} onChange={handleInputChange} rows="2" className="input resize-none" placeholder="123 Main Street, City" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 btn-secondary">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary">Add Client</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingClient && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-accent)]/5 to-amber-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                Edit Client
                            </h3>
                            <button onClick={() => { setIsEditModalOpen(false); setEditingClient(null); }} className="p-1.5 hover:bg-white rounded-lg transition">
                                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateClient} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Full Name *</label>
                                <input type="text" name="name" value={editingClient.name} onChange={handleEditInputChange} required className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Email</label>
                                <input type="email" name="email" value={editingClient.email || ''} onChange={handleEditInputChange} className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Phone</label>
                                <input type="tel" name="phone" value={editingClient.phone || ''} onChange={handleEditInputChange} className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Address</label>
                                <textarea name="address" value={editingClient.address || ''} onChange={handleEditInputChange} rows="2" className="input resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingClient(null); }} className="flex-1 btn-secondary">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;