import React, { useEffect, useState } from 'react';
import axios from "axios";
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

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
        }, 300); // 300ms debounce to prevent API calls on every keystroke

        return () => clearTimeout(debounceFetch);
    }, [searchTerm, navigate]);

    useEffect(() => {
        fetchProjects(''); // Initial fetch
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-800">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8">
                <header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-4">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Projects</h1>
                </header>
                <header className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by project or client name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-1/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </header>
                
                {/* Desktop View: Table */}
                <section className="hidden md:block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <p className="text-center py-8">Loading projects...</p>
                        ) : projects.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {projects.map((project) => (
                                        <tr key={project.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{project.name}</td>
                                            <td className="px-6 py-4 text-gray-500">{project.client_name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    {'Completed': 'bg-green-100 text-green-700', 'On Hold': 'bg-red-100 text-red-700', 'Not Started': 'bg-gray-100 text-gray-600', 'In Progress': 'bg-yellow-100 text-yellow-700'}[project.status] || 'bg-gray-100 text-gray-600'
                                                }`}>{project.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right"><button onClick={() => navigate(`/projects/${project.id}`)} className="text-indigo-600 hover:text-indigo-800">View</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center py-8 italic">No projects found.</p>
                        )}
                    </div>
                </section>

                {/* Mobile View: Cards */}
                <section className="md:hidden space-y-4">
                    {isLoading ? (
                        <p className="text-center py-8">Loading projects...</p>
                    ) : projects.length > 0 ? (
                        projects.map((project) => (
                            <div key={project.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                                        <p className="text-sm text-gray-500">{project.client_name}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        {'Completed': 'bg-green-100 text-green-700', 'On Hold': 'bg-red-100 text-red-700', 'Not Started': 'bg-gray-100 text-gray-600', 'In Progress': 'bg-yellow-100 text-yellow-700'}[project.status] || 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {project.status}
                                    </span>
                                </div>
                                
                                <div className="pt-3 border-t border-gray-100 flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-400">ID: #{project.id}</span>
                                    <button 
                                        onClick={() => navigate(`/projects/${project.id}`)} 
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                    >
                                        View Details →
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-8 italic text-gray-500">No projects found.</p>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Projects;