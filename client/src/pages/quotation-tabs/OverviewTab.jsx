import React, { useState } from 'react';
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
        if (!window.confirm(`Are you sure you want to change the status to "${newStatus}"?`)) {
            return;
        }
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

    // Check for existing project (Simplified version - better to pass from parent if possible)
    React.useEffect(() => {
        const checkProject = async () => {
            const token = localStorage.getItem("token");
            try {
                const projectRes = await axios.get(`${API_URL}/projects/by-quotation/${quotation.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProject(projectRes.data);
            } catch (projectError) {
                // Ignore 404
            }
        }
        checkProject();
    }, [quotation.id]);


    return (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in-up">
            <h3 className="text-xl font-semibold mb-4">Quotation Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <div className="mb-4">
                        <label className="text-gray-500 text-sm">Title</label>
                        <p className="text-lg font-medium text-gray-900">{quotation.title}</p>
                    </div>

                    <div className="mb-4">
                        <label className="text-gray-500 text-sm">Status</label>
                        <div className="mt-1">
                            <select
                                value={quotation.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 border-none outline-none cursor-pointer transition-all ${getStatusBadge(quotation.status)}`}
                            >
                                <option value="Draft">Draft</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
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
                            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow hover:bg-blue-700 transition font-medium"
                        >
                            View & Print Summary
                        </button>
                    </div>

                    {/* Conditional "Create Project" Button */}
                    {quotation.status === 'Approved' && (
                        <div className="mt-4">
                            {project ? (
                                <button onClick={() => navigate(`/projects/${project.id}`)} className="text-indigo-600 font-medium hover:underline text-sm">
                                    View Linked Project →
                                </button>
                            ) : (
                                <button onClick={() => setIsCreateProjectModalOpen(true)} className="w-full bg-purple-600 text-white px-4 py-2.5 rounded-lg shadow hover:bg-purple-700 transition font-medium">
                                    Create Project from Quotation
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-l pl-0 md:pl-8 border-gray-100">
                    <h4 className="text-lg font-medium mb-4 text-gray-800">Client Information</h4>
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
            {isCreateProjectModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
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
                </div>
            )}
        </section>
    );
};

export default OverviewTab;
