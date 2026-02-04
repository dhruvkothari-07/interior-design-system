import React, { useEffect, useState } from 'react';
import axios from "axios";
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Search, FolderKanban, User, Calendar, ArrowRight } from 'lucide-react';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchProjects = async (search = '') => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) { navigate('/signin'); return; }

            const res = await axios.get(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search }
            });
            setProjects(res.data);
        } catch (err) {
            console.error("Error fetching projects:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounceFetch = setTimeout(() => {
            fetchProjects(searchTerm);
        }, 300);
        return () => clearTimeout(debounceFetch);
    }, [searchTerm, navigate]);

    useEffect(() => {
        fetchProjects('');
    }, []);

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'in progress':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'on hold':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <Layout>
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Projects</h1>
                    <p className="text-gray-500 mt-1">Track and manage your active projects</p>
                </div>
            </header>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by project or client name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange transition"
                    />
                </div>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading projects...</p>
                </div>
            ) : projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-100 transition-all duration-300 overflow-hidden group cursor-pointer"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-theme-orange transition-colors">
                                            {project.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                            <User className="w-4 h-4" />
                                            <span className="truncate">{project.client_name || 'No client'}</span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border ${getStatusStyles(project.status)}`}>
                                        {project.status || 'Planning'}
                                    </span>
                                </div>

                                {/* Budget Display */}
                                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 mb-4">
                                    <p className="text-xs text-gray-500 font-medium mb-1">Budget</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {project.budget ? formatCurrency(project.budget) : '—'}
                                    </p>
                                </div>

                                {/* Dates */}
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                                        {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                                    </span>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end">
                                <button className="flex items-center gap-2 px-4 py-2 text-theme-orange hover:bg-orange-50 rounded-lg font-medium text-sm transition">
                                    <FolderKanban className="w-4 h-4" />
                                    View Project
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100">
                    <FolderKanban className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 italic">No projects found.</p>
                    <p className="mt-2 text-sm text-gray-400">Create a project from an approved quotation</p>
                </div>
            )}
        </Layout>
    );
};

export default Projects;