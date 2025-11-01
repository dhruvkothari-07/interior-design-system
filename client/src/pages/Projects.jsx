import React, { useEffect, useState } from 'react';
import axios from "axios";
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                if (!token) { navigate('/signin'); return; }

                const res = await axios.get("http://localhost:3001/api/v1/projects", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProjects(res.data);
            } catch (err) {
                console.error("Error fetching projects:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, [navigate]);

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-4">
                    <h2 className="text-3xl font-semibold text-gray-800">Projects</h2>
                </header>
                <section className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
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
                                            <td className="px-6 py-4"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{project.status}</span></td>
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
            </main>
        </div>
    );
};

export default Projects;