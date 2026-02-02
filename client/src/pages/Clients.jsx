import React, { useEffect, useState } from 'react';
import axios from "axios";
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Search, Users, Plus, X, ArrowRight, Mail, Phone, MapPin } from 'lucide-react';

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
        } catch (err) {
            console.error("Error adding client: ", err);
            alert("Failed to add client.");
        }
    };

    const handleEditClick = (client) => {
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
        } catch (err) {
            console.error("Error updating client: ", err);
            alert("Failed to update client.");
        }
    };

    const handleDeleteClient = async (clientId, clientName) => {
        if (!window.confirm(`Are you sure you want to delete "${clientName}"?`)) return;
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            await axios.delete(`${API_URL}/clients/${clientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClients(clients.filter(client => client.id !== clientId));
        } catch (err) {
            console.error("Error deleting client: ", err);
            alert("Failed to delete client.");
        }
    };

    const ClientFormModal = ({ isOpen, onClose, title, onSubmit, clientData, onChange, submitLabel }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="card w-full max-w-md p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--color-bg-subtle)] rounded-lg transition">
                            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                        </button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
                            <input type="text" name="name" value={clientData.name} onChange={onChange} required className="input" placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
                            <input type="email" name="email" value={clientData.email} onChange={onChange} className="input" placeholder="john@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Phone</label>
                            <input type="tel" name="phone" value={clientData.phone} onChange={onChange} className="input" placeholder="+91 98765 43210" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Address</label>
                            <textarea name="address" value={clientData.address} onChange={onChange} rows="2" className="input resize-none" placeholder="123 Main Street, City" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary">{submitLabel}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Clients</h1>
                        <p className="text-[var(--color-text-secondary)] mt-1">Manage client relationships and contact details</p>
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Client
                    </button>
                </div>

                {/* Search */}
                <div className="mb-8 animate-fade-in animation-delay-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search clients by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-12"
                        />
                    </div>
                </div>

                {/* Client Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="card p-6 animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-4" />
                                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                                <div className="h-3 bg-gray-100 rounded w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : clients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {clients.map((client, index) => (
                            <div
                                key={client.id}
                                className="card-hover group p-6 animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-[var(--color-accent)] font-bold text-lg">
                                            {client.name?.charAt(0) || 'C'}
                                        </div>
                                        <div>
                                            <h3
                                                className="font-semibold text-lg text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors cursor-pointer"
                                                onClick={() => navigate(`/clients/${client.id}`)}
                                            >
                                                {client.name}
                                            </h3>
                                            <p className="text-sm text-[var(--color-text-muted)]">Client #{client.id}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6 text-sm text-[var(--color-text-secondary)]">
                                    {client.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                                            <span>{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-[var(--color-text-muted)]" />
                                            <span>{client.phone}</span>
                                        </div>
                                    )}
                                    {!client.email && !client.phone && (
                                        <p className="text-[var(--color-text-muted)] italic">No contact info</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                                    <button
                                        onClick={() => navigate(`/clients/${client.id}`)}
                                        className="text-sm font-medium text-[var(--color-accent)] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        View Details <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <div className="flex gap-3 text-sm">
                                        <button onClick={() => handleEditClick(client)} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition">Edit</button>
                                        <button onClick={() => handleDeleteClient(client.id, client.name)} className="text-rose-500 hover:text-rose-600 transition">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card p-12 text-center animate-fade-in">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-subtle)] flex items-center justify-center">
                            <Users className="w-8 h-8 text-[var(--color-text-muted)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No clients found</h3>
                        <p className="text-[var(--color-text-secondary)]">
                            {searchTerm ? `No results for "${searchTerm}"` : 'Add your first client to get started'}
                        </p>
                    </div>
                )}
            </main>

            {/* Modals */}
            <ClientFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Client"
                onSubmit={handleAddClient}
                clientData={newClient}
                onChange={handleInputChange}
                submitLabel="Add Client"
            />
            <ClientFormModal
                isOpen={isEditModalOpen && !!editingClient}
                onClose={() => { setIsEditModalOpen(false); setEditingClient(null); }}
                title="Edit Client"
                onSubmit={handleUpdateClient}
                clientData={editingClient || {}}
                onChange={handleEditInputChange}
                submitLabel="Save Changes"
            />
        </div>
    );
};

export default Clients;