import React, { useEffect, useState } from 'react';
import axios from "axios";
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Plus, Search, User, Edit2, Trash2, ArrowRight, X } from 'lucide-react';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState('staff');
    const navigate = useNavigate();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

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
        const debounceFetch = setTimeout(() => {
            fetchClients(searchTerm);
        }, 300);
        return () => clearTimeout(debounceFetch);
    }, [searchTerm]);

    useEffect(() => {
        fetchClients('');
        // Decode token
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role || 'staff');
            } catch (e) { console.error("Token error", e); }
        }
    }, []);

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
        if (!window.confirm(`Are you sure you want to delete "${clientName}"?`)) {
            return;
        }
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

    const renderClientForm = (handler, clientData, changeHandler, isAdd) => (
        <form onSubmit={handler} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" name="name" id="name" value={clientData.name} onChange={changeHandler} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange outline-none" />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" id="email" value={clientData.email} onChange={changeHandler} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange outline-none" />
            </div>
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" name="phone" id="phone" value={clientData.phone} onChange={changeHandler} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange outline-none" />
            </div>
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea name="address" id="address" value={clientData.address} onChange={changeHandler} rows="3" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => isAdd ? setIsAddModalOpen(false) : setIsEditModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-theme-orange text-white rounded-lg font-medium hover:bg-orange-700 transition shadow-lg shadow-orange-200">{isAdd ? 'Add Client' : 'Save Changes'}</button>
            </div>
        </form>
    );

    return (
        <Layout>
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Clients</h1>
                    <p className="text-gray-500 mt-1">Manage your client database</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-theme-orange hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-orange-200"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Client</span>
                </button>
            </header>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange transition"
                    />
                </div>
            </div>

            {/* Clients Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading clients...</p>
                </div>
            ) : clients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map((client) => (
                        <div
                            key={client.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-100 transition-all duration-300 overflow-hidden group"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center">
                                            <User className="w-6 h-6 text-theme-orange" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-theme-orange transition-colors">{client.name}</h3>
                                            <p className="text-sm text-gray-500">{client.email || 'No email'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <p><span className="font-medium">Phone:</span> {client.phone || 'N/A'}</p>
                                    {client.quotation_count !== undefined && (
                                        <p><span className="font-medium">Quotations:</span> {client.quotation_count}</p>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(client)}
                                        className="p-2 text-gray-400 hover:text-theme-orange hover:bg-orange-50 rounded-lg transition"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {userRole === 'admin' && (
                                        <button
                                            onClick={() => handleDeleteClient(client.id, client.name)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => navigate(`/clients/${client.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 text-theme-orange hover:bg-orange-50 rounded-lg font-medium text-sm transition"
                                >
                                    View Details
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100">
                    <User className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 italic">No clients found.</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-4 text-theme-orange hover:text-orange-700 font-medium text-sm"
                    >
                        + Add your first client
                    </button>
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
                        <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Client</h3>
                        {renderClientForm(handleAddClient, newClient, handleInputChange, true)}
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingClient && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Client</h3>
                        {renderClientForm(handleUpdateClient, editingClient, handleEditInputChange, false)}
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Clients;