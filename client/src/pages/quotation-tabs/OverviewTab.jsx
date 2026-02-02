import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { Calendar, User, Mail, Phone, MapPin, FileText, ArrowRight, FolderKanban, IndianRupee } from 'lucide-react';

const OverviewTab = ({ quotation, setQuotation, currentSubTotal, onTabChange }) => {
    const navigate = useNavigate();
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [project, setProject] = useState(null);
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

    const getStatusConfig = (status) => {
        const configs = {
            'Approved': { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200' },
            'Pending': { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' },
            'Rejected': { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200' },
            'Draft': { bg: 'bg-stone-100', text: 'text-stone-600', ring: 'ring-stone-200' }
        };
        return configs[status] || configs['Draft'];
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

    const statusConfig = getStatusConfig(quotation.status);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Subtotal Card */}
                <div className="card p-6 bg-gradient-to-br from-white to-orange-50/30">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <IndianRupee className="w-5 h-5 text-[var(--color-accent)]" />
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-muted)]">Calculation Subtotal</span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--color-text-primary)]">{formatCurrency(currentSubTotal)}</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        {quotation.total_amount ? `Saved: ${formatCurrency(quotation.total_amount)}` : 'Not finalized'}
                    </p>
                </div>

                {/* Status Card */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl ${statusConfig.bg} flex items-center justify-center`}>
                            <FileText className={`w-5 h-5 ${statusConfig.text}`} />
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-muted)]">Status</span>
                    </div>
                    <select
                        value={quotation.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold ${statusConfig.bg} ${statusConfig.text} ring-1 ${statusConfig.ring} border-none outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[var(--color-accent)]`}
                    >
                        <option value="Draft">Draft</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

                {/* Dates Card */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-stone-600" />
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-muted)]">Timeline</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Created</p>
                            <p className="font-semibold text-[var(--color-text-primary)]">{new Date(quotation.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Updated</p>
                            <p className="font-semibold text-[var(--color-text-primary)]">{new Date(quotation.updatedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client Information */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-[var(--color-accent)]" />
                        Client Information
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <User className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5" />
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Name</p>
                                <p className="font-medium text-[var(--color-text-primary)]">{quotation.client_name || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5" />
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Email</p>
                                <p className="font-medium text-[var(--color-text-primary)]">{quotation.client_email || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5" />
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Phone</p>
                                <p className="font-medium text-[var(--color-text-primary)]">{quotation.client_phone || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5" />
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Address</p>
                                <p className="font-medium text-[var(--color-text-primary)] whitespace-pre-wrap">{quotation.client_address || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Card */}
                <div className="lg:col-span-2 card p-6 bg-gradient-to-br from-stone-50 to-orange-50/20">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => onTabChange('preview')}
                            className="group flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-[var(--color-accent)]" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-[var(--color-text-primary)]">View & Print</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">Preview summary document</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all" />
                        </button>

                        {quotation.status === 'Approved' && (
                            project ? (
                                <button
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className="group flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--color-border)] hover:border-emerald-300 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                            <FolderKanban className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-[var(--color-text-primary)]">View Project</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">Go to linked project</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsCreateProjectModalOpen(true)}
                                    className="group flex items-center justify-between p-4 bg-gradient-to-r from-[var(--color-accent)] to-orange-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                            <FolderKanban className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">Create Project</p>
                                            <p className="text-xs text-white/80">From this quotation</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all" />
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Create Project Modal */}
            {isCreateProjectModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Create New Project</h3>
                        </div>
                        <form onSubmit={handleCreateProject} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Project Name</label>
                                    <p className="text-lg font-semibold text-[var(--color-text-primary)]">{quotation.title}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Budget (from Quotation)</label>
                                    <p className="text-lg font-semibold text-[var(--color-accent)]">{formatCurrency(quotation.total_amount || currentSubTotal)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={newProjectDetails.start_date}
                                        onChange={handleNewProjectInputChange}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Target End Date</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={newProjectDetails.end_date}
                                        onChange={handleNewProjectInputChange}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsCreateProjectModalOpen(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Confirm & Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverviewTab;
