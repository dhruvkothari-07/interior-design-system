import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { Copy, Edit2, X, DollarSign, Calendar, User, ArrowRight, FileText, CheckCircle, LayoutDashboard } from 'lucide-react';

const OverviewTab = ({ quotation, setQuotation, currentSubTotal, onTabChange }) => {
    const navigate = useNavigate();
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [project, setProject] = useState(null);
    const [newProjectDetails, setNewProjectDetails] = useState({
        start_date: '',
        end_date: ''
    });

    // Duplicate Modal State
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [clients, setClients] = useState([]);
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
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const handleStatusChange = async (newStatus) => {
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

            setIsCreateProjectModalOpen(false);
            setNewProjectDetails({ start_date: '', end_date: '' });
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
            if (!quotation.client_id) {
                alert("This quotation is not linked to a valid client record.");
                return;
            }

            const res = await axios.put(`${API_URL}/clients/${quotation.client_id}`, clientEditData, {
                headers: { Authorization: `Bearer ${token}` }
            });

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
        <div className="animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 1. Subtotal Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-theme-orange">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-gray-500 font-medium text-sm">Calculation Subtotal</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900">{formatCurrency(currentSubTotal)}</p>
                        <p className="text-xs text-gray-400 mt-1">Saved: {formatCurrency(quotation.total_amount || 0)}</p>
                    </div>
                </div>

                {/* 2. Status Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <span className="text-gray-500 font-medium text-sm">Status</span>
                    </div>
                    <div>
                        <select
                            value={quotation.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className={`w-full px-4 py-2 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-theme-orange border cursor-pointer transition-all ${getStatusBadge(quotation.status)}`}
                        >
                            <option value="Draft">Draft</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* 3. Timeline Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-gray-500 font-medium text-sm">Timeline</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Created</p>
                            <p className="font-semibold text-gray-900 mt-0.5">{new Date(quotation.createdAt || quotation.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Updated</p>
                            <p className="font-semibold text-gray-900 mt-0.5">{new Date(quotation.updatedAt || quotation.updated_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* 4. Client Information (Span 2) */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                            <User className="w-5 h-5" />
                        </div>
                        <h4 className="text-gray-900 font-bold text-lg">Client Information</h4>
                        <button onClick={handleEditClientOpen} className="ml-auto flex items-center gap-1 text-theme-orange hover:text-orange-700 text-sm font-medium bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Name</p>
                            <p className="text-gray-900 font-semibold">{quotation.client_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Email</p>
                            <p className="text-gray-900 font-medium">{quotation.client_email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Phone</p>
                            <p className="text-gray-900 font-medium">{quotation.client_phone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Address</p>
                            <p className="text-gray-900 font-medium">{quotation.client_address || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* 5. Quick Actions (Span 1) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:border-orange-200 transition-colors">
                    <h3 className="text-gray-900 font-bold text-lg mb-2">Quick Actions</h3>

                    <button onClick={() => onTabChange('preview')} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-theme-orange hover:bg-orange-50 group transition-all bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-theme-orange border border-gray-100"><FileText className="w-5 h-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">View & Print</p>
                                <p className="text-xs text-gray-500">Preview summary</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-theme-orange transition-colors" />
                    </button>

                    {project ? (
                        <button onClick={() => navigate(`/projects/${project.id}`)} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 group transition-all bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-emerald-600 border border-gray-100"><LayoutDashboard className="w-5 h-5" /></div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900">View Project</p>
                                    <p className="text-xs text-gray-500">Go to linked project</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 transition-colors" />
                        </button>
                    ) : (
                        <button onClick={() => setIsCreateProjectModalOpen(true)} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-theme-orange hover:bg-orange-50 group transition-all bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-theme-orange border border-gray-100"><Copy className="w-5 h-5" /></div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900">Create Project</p>
                                    <p className="text-xs text-gray-500">Convert to active project</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-theme-orange transition-colors" />
                        </button>
                    )}
                </div>
            </div>

            {/* Create Project Modal */}
            {isCreateProjectModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg relative">
                        <button onClick={() => setIsCreateProjectModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h3>
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
                                    <input type="date" name="start_date" id="start_date" value={newProjectDetails.start_date} onChange={handleNewProjectInputChange} className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange" />
                                </div>
                                <div>
                                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">Target End Date</label>
                                    <input type="date" name="end_date" id="end_date" value={newProjectDetails.end_date} onChange={handleNewProjectInputChange} className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange" />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-4">
                                <button type="button" onClick={() => setIsCreateProjectModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-theme-orange text-white rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-200 font-medium">Confirm & Create</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Client Modal */}
            {isEditClientModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
                        <button onClick={() => setIsEditClientModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Client Details</h3>
                        <form onSubmit={handleClientUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700">Client Name</label>
                                    <input type="text" name="name" id="edit_name" value={clientEditData.name} onChange={handleEditClientChange} required className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange" />
                                </div>
                                <div>
                                    <label htmlFor="edit_email" className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" name="email" id="edit_email" value={clientEditData.email} onChange={handleEditClientChange} className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange" />
                                </div>
                                <div>
                                    <label htmlFor="edit_phone" className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input type="tel" name="phone" id="edit_phone" value={clientEditData.phone} onChange={handleEditClientChange} className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange" />
                                </div>
                                <div>
                                    <label htmlFor="edit_address" className="block text-sm font-medium text-gray-700">Address</label>
                                    <textarea name="address" id="edit_address" value={clientEditData.address} onChange={handleEditClientChange} rows="3" className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange resize-none" />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-4">
                                <button type="button" onClick={() => setIsEditClientModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-theme-orange text-white rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-200 font-medium">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Duplicate Quotation Modal */}
            {isDuplicateModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsDuplicateModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Duplicate Quotation</h3>
                        <form onSubmit={handleDuplicateQuotation}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="new_title" className="block text-sm font-medium text-gray-700">New Title</label>
                                    <input type="text" name="new_title" id="new_title" value={duplicateData.new_title} onChange={handleDuplicateInputChange} required className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange" />
                                </div>

                                {/* Client Selection Toggle */}
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-sm font-medium text-gray-700">Client:</span>
                                    <div className="flex space-x-4">
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                className="form-radio text-theme-orange"
                                                name="clientOption"
                                                value="new"
                                                checked={!useExistingClient}
                                                onChange={() => { setUseExistingClient(false); setSelectedClientId(''); }}
                                            />
                                            <span className="ml-2 text-sm text-gray-700">New Client</span>
                                        </label>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                className="form-radio text-theme-orange"
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
                                        <label htmlFor="new_client_id" className="block text-sm font-medium text-gray-700">Select Client</label>
                                        <select
                                            name="new_client_id"
                                            id="new_client_id"
                                            value={selectedClientId}
                                            onChange={(e) => setSelectedClientId(e.target.value)}
                                            required
                                            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange bg-white"
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
                                            <input type="text" name="new_client_name" id="new_client_name" value={duplicateData.new_client_name} onChange={handleDuplicateInputChange} required={!useExistingClient} className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange" />
                                        </div>
                                        <div>
                                            <label htmlFor="new_client_email" className="block text-sm font-medium text-gray-700">Client Email</label>
                                            <input type="email" name="new_client_email" id="new_client_email" value={duplicateData.new_client_email} onChange={handleDuplicateInputChange} className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange" />
                                        </div>
                                        <div>
                                            <label htmlFor="new_client_phone" className="block text-sm font-medium text-gray-700">Client Phone</label>
                                            <input type="tel" name="new_client_phone" id="new_client_phone" value={duplicateData.new_client_phone} onChange={handleDuplicateInputChange} className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange" />
                                        </div>
                                        <div>
                                            <label htmlFor="new_client_address" className="block text-sm font-medium text-gray-700">Client Address</label>
                                            <textarea name="new_client_address" id="new_client_address" value={duplicateData.new_client_address} onChange={handleDuplicateInputChange} rows="2" className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange focus:border-theme-orange resize-none" />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="mt-8 flex justify-end space-x-4">
                                <button type="button" onClick={() => setIsDuplicateModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-theme-orange text-white rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-200 font-medium">Duplicate</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default OverviewTab;
