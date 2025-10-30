import React, { useEffect, useState } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';

const Quotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newQuotation, setNewQuotation] = useState({
        title: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: ''
    });
    const [clients, setClients] = useState([]); // State to store existing clients
    const [useExistingClient, setUseExistingClient] = useState(false); // Toggle for new/existing client
    const [selectedClientId, setSelectedClientId] = useState(''); // State for selected existing client

    const navigate = useNavigate();


    const fetchQuotations = async () => {
        try {
            setIsLoading(true); // Start loading
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.get("http://localhost:3001/api/v1/quotations", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setQuotations(res.data);
        } catch (err) {
            console.error("Error fetching Quotations:", err);
        } finally {
            setIsLoading(false); // Stop loading
        }
    };

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.get("http://localhost:3001/api/v1/clients", {
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


    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default: // Draft
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewQuotation(prev => ({ ...prev, [name]: value }));
    };

    const handleAddModalOpen = () => {
        setIsAddModalOpen(true);
        fetchClients(); // Fetch clients when modal opens
    };

    const handleAddModalClose = () => {
        setIsAddModalOpen(false);
        setUseExistingClient(false); // Reset toggle
        setSelectedClientId(''); // Reset selected client
        setNewQuotation({ title: '', client_name: '', client_email: '', client_phone: '', client_address: '' }); // Reset new client form
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

            const res = await axios.post("http://localhost:3001/api/v1/quotations", postData, {
                headers: { Authorization: `Bearer ${token}` } });

            // Add new quotation to the top of the list and close modal
            setQuotations([res.data, ...quotations]);
            setIsAddModalOpen(false);

            // Reset form
            setNewQuotation({
                title: '',
                client_name: '',
                client_email: '',
                client_phone: '',
                client_address: ''
            });

        } catch (err) {
            console.error("Error adding quotation: ", err);
            alert("Failed to add quotation. Please check the console for details.");
        }
    };

    const handleViewEdit = (quotationId) => {
        navigate(`/quotations/${quotationId}`);
    };


    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white p-5 hidden md:flex flex-col justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-8 text-center">Management</h1>
                    <nav>
                        <ul className="space-y-3">
                            <li>
                                <a href="/dashboard" className="block py-2 px-4 rounded hover:bg-gray-700 transition">Dashboard</a>
                            </li>
                            <li>
                                <a href="/quotations" className="block py-2 px-4 rounded bg-gray-700 font-semibold">Quotations</a>
                            </li>
                            <li>
                                <a href="/materials" className="block py-2 px-4 rounded hover:bg-gray-700 transition">Materials</a>
                            </li>
                        </ul>
                    </nav>
                </div>
                <div>
                    <a
                        href="/signin"
                        onClick={() => localStorage.removeItem('token')}
                        className="block py-2 px-4 rounded hover:bg-red-700 bg-red-600 text-center transition"
                    >
                        Logout
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-4">
                    <h2 className="text-3xl font-semibold text-gray-800">Quotations</h2>
                    <button
                        onClick={handleAddModalOpen}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition duration-150 ease-in-out"
                    >
                        + New Quotation
                    </button>
                </header>

                <section className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <p className="text-center text-gray-500 py-8">Loading quotations...</p>
                        ) : quotations.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {quotations.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.client_name || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{item.total_amount ? `₹${Number(item.total_amount).toLocaleString('en-IN')}` : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                <button onClick={() => handleViewEdit(item.id)} className="text-indigo-600 hover:text-indigo-800 transition">View/Edit</button>
                                                <button className="text-red-600 hover:text-red-800 transition">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500 py-8 italic">No quotations found.</p>
                        )}
                    </div>
                </section>

                {/* Add Quotation Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                            <h3 className="text-2xl font-semibold mb-4">New Quotation</h3>
                            <form onSubmit={handleAddQuotation}>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                                        <input type="text" name="title" id="title" value={newQuotation.title} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>

                                    {/* Client Selection Toggle */}
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-sm font-medium text-gray-700">Client:</span>
                                        <div className="flex space-x-4">
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    className="form-radio"
                                                    name="clientOption"
                                                    value="new"
                                                    checked={!useExistingClient}
                                                    onChange={() => { setUseExistingClient(false); setSelectedClientId(''); }}
                                                />
                                                <span className="ml-2 text-sm text-gray-700">New Client</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    className="form-radio"
                                                    name="clientOption"
                                                    value="existing"
                                                    checked={useExistingClient}
                                                    onChange={() => setUseExistingClient(true)}
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Existing Client</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Conditional Client Fields */}
                                    {useExistingClient ? (
                                        <div>
                                            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">Select Client</label>
                                            <select
                                                name="client_id"
                                                id="client_id"
                                                value={selectedClientId}
                                                onChange={(e) => setSelectedClientId(e.target.value)}
                                                required
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                                                <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">Client Name</label>
                                                <input type="text" name="client_name" id="client_name" value={newQuotation.client_name} onChange={handleInputChange} required={!useExistingClient} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                            </div>
                                            <div><label htmlFor="client_email" className="block text-sm font-medium text-gray-700">Client Email</label><input type="email" name="client_email" id="client_email" value={newQuotation.client_email} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
                                            <div><label htmlFor="client_phone" className="block text-sm font-medium text-gray-700">Client Phone</label><input type="tel" name="client_phone" id="client_phone" value={newQuotation.client_phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
                                            <div><label htmlFor="client_address" className="block text-sm font-medium text-gray-700">Client Address</label><textarea name="client_address" id="client_address" value={newQuotation.client_address} onChange={handleInputChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
                                        </>
                                    )}
                                </div>
                                <div className="mt-8 flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={handleAddModalClose}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                                    >
                                        Create Quotation
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Quotations;