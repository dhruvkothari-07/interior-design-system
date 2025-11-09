import React, { useEffect, useState } from 'react';
import axios from "axios";
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom'; 

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // State for Add Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    // State for Edit Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchClients = async (search = '') => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.get("http://localhost:3001/api/v1/clients-full", {
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
        }, 300); // 300ms debounce
        return () => clearTimeout(debounceFetch);
    }, [searchTerm]);

    useEffect(() => {
        fetchClients(''); // Initial fetch
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
            const res = await axios.post("http://localhost:3001/api/v1/clients", newClient, {
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
            const res = await axios.put(`http://localhost:3001/api/v1/clients/${editingClient.id}`, editingClient, {
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
        if (!window.confirm(`Are you sure you want to delete "${clientName}"? This may affect existing quotations.`)) {
            return;
        }
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            await axios.delete(`http://localhost:3001/api/v1/clients/${clientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClients(clients.filter(client => client.id !== clientId));
        } catch (err) {
            console.error("Error deleting client: ", err);
            alert("Failed to delete client. They may be linked to existing quotations.");
        }
    };

    const renderClientForm = (handler, clientData, changeHandler) => (
        <form onSubmit={handler}>
            <div className="space-y-4">
                <div><label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label><input type="text" name="name" id="name" value={clientData.name} onChange={changeHandler} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
                <div><label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label><input type="email" name="email" id="email" value={clientData.email} onChange={changeHandler} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
                <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label><input type="tel" name="phone" id="phone" value={clientData.phone} onChange={changeHandler} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
                <div><label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label><textarea name="address" id="address" value={clientData.address} onChange={changeHandler} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
            </div>
            <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={() => handler === handleAddClient ? setIsAddModalOpen(false) : setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">{handler === handleAddClient ? 'Add Client' : 'Save Changes'}</button>
            </div>
        </form>
    );

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-4">
                    <h2 className="text-3xl font-semibold text-gray-800">Clients</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition duration-150 ease-in-out">+ New Client</button>
                </header>

                <header className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by client name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-1/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </header>

                <section className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <p className="text-center text-gray-500 py-8">Loading clients...</p>
                        ) : clients.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {clients.map((client) => (
                                        <tr key={client.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button onClick={() => navigate(`/clients/${client.id}`)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 text-left">
                                                    {client.name}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                <button onClick={() => handleEditClick(client)} className="text-indigo-600 hover:text-indigo-800 transition">Edit</button>
                                                <button onClick={() => handleDeleteClient(client.id, client.name)} className="text-red-600 hover:text-red-800 transition">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500 py-8 italic">No clients found. Add one to get started!</p>
                        )}
                    </div>
                </section>

                {/* Add Client Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                            <h3 className="text-2xl font-semibold mb-6">Add New Client</h3>
                            {renderClientForm(handleAddClient, newClient, handleInputChange)}
                        </div>
                    </div>
                )}

                {/* Edit Client Modal */}
                {isEditModalOpen && editingClient && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                            <h3 className="text-2xl font-semibold mb-6">Edit Client</h3>
                            {renderClientForm(handleUpdateClient, editingClient, handleEditInputChange)}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Clients;