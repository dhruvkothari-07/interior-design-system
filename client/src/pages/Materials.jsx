import React, { useEffect, useState } from 'react';
import axios from "axios";

const Materials = () => {
    const [materials, setMaterials] = useState([]);
    const fetchMaterials = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                return;
            }
            const res = await axios.get("http://localhost:3001/api/v1/materials", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMaterials(res.data);
        } catch (err) {
            console.error("Error fetching Materials:", err);
        }
    }


    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleDeleteMaterial = async (materialId, materialName) => {
        if (!window.confirm(`Are you sure you want to delete "${materialName}"?`)) {
            return;
        }
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                return;
            }
            await axios.delete(`http://localhost:3001/api/v1/materials/${materialId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Material deleted successfully");

        } catch (err) {
            console.error("Error deleting material: ", err);
        }
    };


    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            {/* Sidebar (Consistent Theme) */}
            <aside className="w-64 bg-gray-800 text-white p-5 hidden md:flex flex-col justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-8 text-center">Management</h1>
                    <nav>
                        <ul className="space-y-3">
                            <li>
                                <a href="/dashboard" className="block py-2 px-4 rounded hover:bg-gray-700 transition">Dashboard</a>
                            </li>
                            <li>
                                <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700 transition">Quotations</a>
                            </li>
                            <li>
                                {/* Highlight active page */}
                                <a href="/materials" className="block py-2 px-4 rounded bg-gray-700 font-semibold">Materials</a>
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
                    <h2 className="text-3xl font-semibold text-gray-800">Materials List</h2>
                    {/* Add Material Button - Consider linking to a separate add page/modal */}
                    <button
                        // onClick={() => { /* Implement add functionality */ }}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition duration-150 ease-in-out"
                    >
                        + Add Material
                    </button>
                </header>



                <section className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    {/* Added overflow-hidden for rounded corners on table */}
                    <div className="overflow-x-auto">
                        {materials.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {materials.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50 transition duration-150 ease-in-out"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {item.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.category || <span className="italic text-gray-400">N/A</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                                                {item.price}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                {/* Placeholder Edit Button */}
                                                <button className="text-indigo-600 hover:text-indigo-800 transition">
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMaterial(item.id, item.name)} // Pass ID and name
                                                    className="text-red-600 hover:text-red-800 transition"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500 py-8 italic">No materials found.</p>
                        )}
                    </div>
                </section>
            </main>
        </div >

    )
};
export default Materials;