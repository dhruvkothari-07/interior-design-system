import React, { useEffect, useState } from 'react';
import axios from "axios";

const Materials = () => {
    const [materials, setMaterials] = useState([]);

    useEffect(() => {
        const fetchmaterials = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    return;
                }
                const res = await axios.get("http://localhost:3001/api/v1/materials", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setMaterials(res.data);

            } catch (err) {
                console.error("Error fetching Materials:", err);
            }
        };
        fetchmaterials();
    }, []);


    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-gray-800 text-white p-5 hidden md:block">
                <h1 className="text-2xl font-bold mb-8">Management</h1>
                <nav>
                    <ul>
                        <li className="mb-4">
                            <a href="/dashboard" className="block py-2 px-4 rounded hover:bg-gray-700">Dashboard</a>
                        </li>
                        <li className="mb-4">
                            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">Quotations</a>
                        </li>
                        <li className="mb-4">
                            <a href="/materials" className="block py-2 px-4 rounded bg-gray-700">Materials</a>
                        </li>
                        <li className="absolute bottom-5">
                            <a href="/signin"
                                onClick={() => localStorage.removeItem('token')} // Basic logout
                                className="block py-2 px-4 rounded hover:bg-red-700 bg-red-600">
                                Logout
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8">
                    <h2 className="text-3xl font-semibold text-gray-800">Materials List</h2>
                    {/* Optional: Add a button to add new materials */}

                </header>

                <section className="bg-white p-6 rounded-lg shadow-md">
                    <div className="overflow-x-auto">
                        {materials.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        {/* Optional: Add Actions column */}
                                        {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {materials.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{item.price}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</a>
                                                <a href="#" className="text-red-600 hover:text-red-900">Delete</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500 py-4">No materials found.</p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Materials;