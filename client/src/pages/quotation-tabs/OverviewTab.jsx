import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';

const OverviewTab = ({ quotation, setQuotation, currentSubTotal, onTabChange }) => {
    const navigate = useNavigate();
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [project, setProject] = useState(null); // You might want to pass this from parent if it's fetched there
    const [newProjectDetails, setNewProjectDetails] = useState({
        start_date: '',
        end_date: ''
    });

    // Duplicate Modal State (Styled like "Add Quotation")
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [clients, setClients] = useState([]); // State to store existing clients
    const [useExistingClient, setUseExistingClient] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [duplicateData, setDuplicateData] = useState({
        new_title: '',
        new_client_name: '',
        new_client_email: '',
        new_client_phone: '',
        new_client_address: ''
    });

    // Edit Client Modal State
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
    const [clientEditData, setClientEditData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600'; // Draft
        }
    };

    const handleStatusChange = async (newStatus) => {
        // Confirmation
        if (!window.confirm(`Change status to "${newStatus}"?`)) return;

        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/quotations/${quotation.id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setQuotation(prev => ({ ...prev, status: newStatus }));
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status.");
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const postData = {
                quotation_id: quotation.id,
                start_date: newProjectDetails.start_date,
                end_date: newProjectDetails.end_date,
            };

            const res = await axios.post(`${API_URL}/projects`, postData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Close modal and reset state
            setIsCreateProjectModalOpen(false);
            setNewProjectDetails({ start_date: '', end_date: '' });

            // Redirect to the new project's detail page
            navigate(`/projects/${res.data.id}`);
        } catch (err) {
            console.error("Error creating project:", err);
            alert(err.response?.data?.message || "Failed to create project.");
        }
    };

    const handleNewProjectInputChange = (e) => {
        const { name, value } = e.target;
        setNewProjectDetails(prev => ({ ...prev, [name]: value }));
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

    const handleDuplicateInputChange = (e) => {
        const { name, value } = e.target;
        setDuplicateData(prev => ({ ...prev, [name]: value }));
    };

    const handleDuplicateOpen = () => {
        setDuplicateData({
            new_title: `Copy of ${quotation.title}`,
            new_client_name: '',
            new_client_email: '',
            new_client_phone: '',
            new_client_address: ''
        });
        setUseExistingClient(false);
        setSelectedClientId('');
        setIsDuplicateModalOpen(true);
        fetchClients();
    };

    const handleDuplicateQuotation = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");

            const postData = {
                new_title: duplicateData.new_title,
                ...(useExistingClient && selectedClientId ? { new_client_id: selectedClientId } : {
                    new_client_name: duplicateData.new_client_name,
                    new_client_email: duplicateData.new_client_email,
                    new_client_phone: duplicateData.new_client_phone,
                    new_client_address: duplicateData.new_client_address,
                })
            };

            const res = await axios.post(`${API_URL}/quotations/${quotation.id}/duplicate`, postData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Close modal and navigate to new quotation
            setIsDuplicateModalOpen(false);
            navigate(`/quotations/${res.data.id}`);
            window.location.reload();

        } catch (err) {
            console.error("Error duplicating quotation:", err);
            alert(err.response?.data?.message || "Failed to duplicate quotation.");
        }
    };

    const handleEditClientOpen = () => {
        setClientEditData({
            name: quotation.client_name || '',
            email: quotation.client_email || '',
            phone: quotation.client_phone || '',
            address: quotation.client_address || ''
        });
        setIsEditClientModalOpen(true);
    };

    const handleEditClientChange = (e) => {
        const { name, value } = e.target;
        setClientEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleClientUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            // Important: We need the client_id to update client. Assumes quotation has client_id.
            if (!quotation.client_id) {
                alert("This quotation is not linked to a valid client record.");
                return;
            }

            const res = await axios.put(`${API_URL}/clients/${quotation.client_id}`, clientEditData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            setQuotation(prev => ({
                ...prev,
                client_name: res.data.name,
                client_email: res.data.email,
                client_phone: res.data.phone,
                client_address: res.data.address
            }));

            setIsEditClientModalOpen(false);
        } catch (err) {
            console.error("Error updating client:", err);
            alert(err.response?.data?.message || "Failed to update client details.");
        }
    };

    const [isCheckingProject, setIsCheckingProject] = useState(true);

    // Check for existing project
    React.useEffect(() => {
        const checkProject = async () => {
            setIsCheckingProject(true);
            const token = localStorage.getItem("token");
            try {
                const projectRes = await axios.get(`${API_URL}/projects/by-quotation/${quotation.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProject(projectRes.data);
            } catch (projectError) {
                // Ignore 404
            } finally {
                setIsCheckingProject(false);
            }
        }
        checkProject();
    }, [quotation.id]);


    return (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Quotation Overview</h3>
                <button
                    onClick={handleDuplicateOpen}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200 text-sm font-medium"
                    title="Duplicate/Reuse this Quotation"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    Reuse this Quotation
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <div className="mb-4">
                        <label className="text-gray-500 text-sm">Title</label>
                        <p className="text-lg font-medium text-gray-900">{quotation.title}</p>
                    </div>

                    <div className="mb-4">
                        <label className="text-gray-500 text-sm">Status</label>
                        <div className="mt-1 flex flex-col gap-2">
                            <select
                                value={quotation.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className={`w-full md:w-auto px-3 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 border-none outline-none cursor-pointer transition-all ${getStatusBadge(quotation.status)}`}
                            >
                                <option value="Draft">Draft</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>

                            {quotation.status !== 'Approved' && (
                                <p className="text-xs text-gray-400">
                                    Approved quotations can be converted to projects.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-gray-500 text-sm">Created At</label>
                            <p className="text-gray-900">{new Date(quotation.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="text-gray-500 text-sm">Last Updated</label>
                            <p className="text-gray-900">{new Date(quotation.updatedAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-6">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-gray-600 font-medium">Calculation Subtotal</span>
                            <span className="text-2xl font-bold text-gray-900">{formatCurrency(currentSubTotal)}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-gray-500 text-sm">Saved Total Amount</span>
                            <span className="text-sm font-medium text-gray-700">{quotation.total_amount ? formatCurrency(quotation.total_amount) : 'Not finalized'}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => onTabChange('preview')}
                            className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow hover:bg-indigo-700 transition font-medium"
                        >
                            View & Print Summary
                        </button>
                    </div>


                    {/* Conditional "Create Project" Button */}
                    {quotation.status === 'Approved' && !isCheckingProject && (
                        <div className="mt-4 animate-fade-in-up">
                            {project ? (
                                <button onClick={() => navigate(`/projects/${project.id}`)} className="w-full py-2.5 px-4 bg-white border border-indigo-200 text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 transition shadow-sm flex justify-center items-center gap-2">
                                    <span>↳ View Live Project</span>
                                </button>
                            ) : (
                                <button onClick={() => setIsCreateProjectModalOpen(true)} className="w-full bg-purple-600 text-white px-4 py-2.5 rounded-lg shadow hover:bg-purple-700 transition font-medium flex justify-center items-center gap-2">
                                    <span>✨ Create Project from Quotation</span>
                                </button>
                            )}
                        </div>
                    )}


                </div>

                <div className="border-l pl-0 md:pl-8 border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-800">Client Information</h4>
                        <button
                            onClick={handleEditClientOpen}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                            </svg>
                            Edit
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-500 text-sm">Name</label>
                            <p className="text-gray-900 font-medium">{quotation.client_name || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-gray-500 text-sm">Email</label>
                            <p className="text-gray-900">{quotation.client_email || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-gray-500 text-sm">Phone</label>
                            <p className="text-gray-900">{quotation.client_phone || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-gray-500 text-sm">Address</label>
                            <p className="text-gray-900 whitespace-pre-wrap">{quotation.client_address || 'N/A'}</p>
                        </div>
                    </div>
                    {/* Future: Add Edit Client Info button here */}
                </div>
            </div>

            {/* Create Project Modal */}
            {isCreateProjectModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-semibold mb-6">Create New Project</h3>
                        <form onSubmit={handleCreateProject}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Project Name</label>
                                    <p className="mt-1 text-lg font-semibold text-gray-800">{quotation.title}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Budget (from Quotation)</label>
                                    <p className="mt-1 text-lg font-semibold text-gray-800">{formatCurrency(quotation.total_amount || currentSubTotal)}</p>
                                </div>
                                <div>
                                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
                                    <input type="date" name="start_date" id="start_date" value={newProjectDetails.start_date} onChange={handleNewProjectInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">Target End Date</label>
                                    <input type="date" name="end_date" id="end_date" value={newProjectDetails.end_date} onChange={handleNewProjectInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-4">
                                <button type="button" onClick={() => setIsCreateProjectModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow">Confirm & Create</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Client Modal */}
            {isEditClientModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-semibold mb-6">Edit Client Details</h3>
                        <form onSubmit={handleClientUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700">Client Name</label>
                                    <input type="text" name="name" id="edit_name" value={clientEditData.name} onChange={handleEditClientChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="edit_email" className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" name="email" id="edit_email" value={clientEditData.email} onChange={handleEditClientChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="edit_phone" className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input type="tel" name="phone" id="edit_phone" value={clientEditData.phone} onChange={handleEditClientChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="edit_address" className="block text-sm font-medium text-gray-700">Address</label>
                                    <textarea name="address" id="edit_address" value={clientEditData.address} onChange={handleEditClientChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-4">
                                <button type="button" onClick={() => setIsEditClientModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Duplicate Quotation Modal - Reused Style */}
            {isDuplicateModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-semibold mb-4">Duplicate / Reuse Quotation</h3>
                        <form onSubmit={handleDuplicateQuotation}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="new_title" className="block text-sm font-medium text-gray-700">New Title</label>
                                    <input type="text" name="new_title" id="new_title" value={duplicateData.new_title} onChange={handleDuplicateInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>

                                {/* Client Selection Toggle */}
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-sm font-medium text-gray-700">Client:</span>
                                    <div className="flex space-x-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio text-indigo-600"
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
                                                className="form-radio text-indigo-600"
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
                                        <label htmlFor="new_client_id" className="block text-sm font-medium text-gray-700">Select Client</label>
                                        <select
                                            name="new_client_id"
                                            id="new_client_id"
                                            value={selectedClientId}
                                            onChange={(e) => setSelectedClientId(e.target.value)}
                                            required
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                                            <label htmlFor="new_client_name" className="block text-sm font-medium text-gray-700">Client Name</label>
                                            <input type="text" name="new_client_name" id="new_client_name" value={duplicateData.new_client_name} onChange={handleDuplicateInputChange} required={!useExistingClient} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>
                                        <div><label htmlFor="new_client_email" className="block text-sm font-medium text-gray-700">Client Email</label><input type="email" name="new_client_email" id="new_client_email" value={duplicateData.new_client_email} onChange={handleDuplicateInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" /></div>
                                        <div><label htmlFor="new_client_phone" className="block text-sm font-medium text-gray-700">Client Phone</label><input type="tel" name="new_client_phone" id="new_client_phone" value={duplicateData.new_client_phone} onChange={handleDuplicateInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" /></div>
                                        <div><label htmlFor="new_client_address" className="block text-sm font-medium text-gray-700">Client Address</label><textarea name="new_client_address" id="new_client_address" value={duplicateData.new_client_address} onChange={handleDuplicateInputChange} rows="2" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" /></div>
                                    </>
                                )}
                            </div>
                            <div className="mt-8 flex justify-end space-x-4">
                                <button type="button" onClick={() => setIsDuplicateModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow">Duplicate Quotation</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </section>
    );
};

export default OverviewTab;
