import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { ArrowLeft, Mail, Phone, MapPin, FileText, FolderKanban } from 'lucide-react';

const ClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [clientData, setClientData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClientDetails = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) { navigate('/signin'); return; }

            const res = await axios.get(`${API_URL}/clients/${id}/details`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setClientData(res.data);
        } catch (err) {
            console.error("Error fetching client details:", err);
            setError("Failed to load client details.");
        } finally {
            setIsLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchClientDetails();
    }, [fetchClientDetails]);

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    const getStatusConfig = (status) => {
        const configs = {
            'Approved': 'badge-success',
            'Completed': 'badge-success',
            'Pending': 'badge-warning',
            'In Progress': 'badge-warning',
            'Rejected': 'badge-danger',
            'On Hold': 'badge-danger',
            'Draft': 'badge-neutral',
            'Not Started': 'badge-neutral'
        };
        return configs[status] || 'badge-neutral';
    };

    if (isLoading) return <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text-muted)]">Loading client details...</div>;
    if (error) return <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-rose-500">{error}</div>;
    if (!clientData) return <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text-muted)]">Client not found.</div>;

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <button onClick={() => navigate('/clients')} className="group flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Clients
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-[var(--color-accent)] font-bold text-2xl">
                            {clientData.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">{clientData.name}</h1>
                            <p className="text-[var(--color-text-secondary)] mt-1">Client Overview & Activity</p>
                        </div>
                    </div>
                </div>

                {/* Contact Card */}
                <div className="card p-6 mb-8 animate-fade-in-up">
                    <h3 className="font-semibold text-lg text-[var(--color-text-primary)] mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-[var(--color-bg-subtle)] rounded-lg">
                                <Mail className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-text-muted)]">Email</p>
                                <p className="font-medium text-[var(--color-text-primary)]">{clientData.email || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-[var(--color-bg-subtle)] rounded-lg">
                                <Phone className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-text-muted)]">Phone</p>
                                <p className="font-medium text-[var(--color-text-primary)]">{clientData.phone || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-[var(--color-bg-subtle)] rounded-lg">
                                <MapPin className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-text-muted)]">Address</p>
                                <p className="font-medium text-[var(--color-text-primary)]">{clientData.address || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quotations */}
                    <div className="card p-6 animate-fade-in-up animation-delay-100">
                        <div className="flex items-center gap-2 mb-5">
                            <FileText className="w-5 h-5 text-[var(--color-accent)]" />
                            <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">Quotations</h3>
                        </div>

                        {clientData.quotations?.length ? (
                            <div className="space-y-3">
                                {clientData.quotations.map((q) => (
                                    <div
                                        key={q.id}
                                        onClick={() => navigate(`/quotations/${q.id}`)}
                                        className="p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-bg-subtle)] cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                                                {q.title}
                                            </p>
                                            <span className={getStatusConfig(q.status)}>{q.status}</span>
                                        </div>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            Amount: <span className="font-medium text-[var(--color-text-primary)]">{q.total_amount ? formatCurrency(q.total_amount) : '—'}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--color-text-muted)] italic text-center py-8">No quotations available.</p>
                        )}
                    </div>

                    {/* Projects */}
                    <div className="card p-6 animate-fade-in-up animation-delay-200">
                        <div className="flex items-center gap-2 mb-5">
                            <FolderKanban className="w-5 h-5 text-[var(--color-accent)]" />
                            <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">Projects</h3>
                        </div>

                        {clientData.projects?.length ? (
                            <div className="space-y-3">
                                {clientData.projects.map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => navigate(`/projects/${p.id}`)}
                                        className="p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-bg-subtle)] cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                                                {p.name}
                                            </p>
                                            <span className={getStatusConfig(p.status)}>{p.status}</span>
                                        </div>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            Budget: <span className="font-medium text-[var(--color-text-primary)]">{p.budget ? formatCurrency(p.budget) : '—'}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--color-text-muted)] italic text-center py-8">No projects found.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ClientDetail;