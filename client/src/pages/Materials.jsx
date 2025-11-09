import React, { useEffect, useState } from 'react';
import axios from "axios";
import Sidebar from './Sidebar';

const Materials = () => {
    const [materials, setMaterials] = useState([]);
    
    // State for Add Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newMaterial, setNewMaterial] = useState({
        name: '',
        category: '',
        unit: '',
        price: ''
    });

    // State for Edit Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMaterials = async (search = '') => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                return;
            }
            const res = await axios.get("http://localhost:3001/api/v1/materials", {
                headers: { Authorization: `Bearer ${token}` },
                params: { search }
            });
            setMaterials(res.data);
        } catch (err) {
            console.error("Error fetching Materials:", err);
        }
    }


    useEffect(() => {
        const debounceFetch = setTimeout(() => {
            fetchMaterials(searchTerm);
        }, 300); // 300ms debounce
        return () => clearTimeout(debounceFetch);
    }, [searchTerm]);

    useEffect(() => {
        fetchMaterials(''); // Initial fetch
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
            // Update the state to reflect the deletion
            setMaterials(materials.filter(material => material.id !== materialId));

        } catch (err) {
            console.error("Error deleting material: ", err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMaterial(prev => ({ ...prev, [name]: value }));
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditingMaterial(prev => ({ ...prev, [name]: value }));
    };

    const handleAddMaterial = async (e) => {
        e.preventDefault(); // Prevent default form submission
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.post("http://localhost:3001/api/v1/materials", newMaterial, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Instead of optimistically updating, just re-fetch the whole list
            await fetchMaterials();
            setIsAddModalOpen(false);
            // Reset form
            setNewMaterial({
                name: '',
                category: '',
                unit: '',
                price: ''
            });

        } catch (err) {
            console.error("Error adding material: ", err);
            // Optionally, show an error message to the user
            alert("Failed to add material. Please check the console for details.");
        }
    };

    const handleEditClick = (material) => {
        setEditingMaterial(material);
        setIsEditModalOpen(true);
    };

    const handleUpdateMaterial = async (e) => {
        e.preventDefault();
        if (!editingMaterial) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.put(`http://localhost:3001/api/v1/materials/${editingMaterial.id}`, editingMaterial, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update the material in the list
            setMaterials(materials.map(material =>
                material.id === editingMaterial.id ? res.data : material
            ));

            // Close modal and reset state
            setIsEditModalOpen(false);
            setEditingMaterial(null);

        } catch (err) {
            console.error("Error updating material: ", err);
            alert("Failed to update material. Please check the console for details.");
        }
    };


    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-800">
            {/* Sidebar (Consistent Theme) */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-4">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Materials</h1>
                    {/* Add Material Button - Consider linking to a separate add page/modal */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition duration-150 ease-in-out"
                    >
                        + Add Material
                    </button>
                </header>

                <header className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by material name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-1/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </header>



                <section className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden">
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
                                                {/* Display category: show empty string if it's an empty string, or N/A if null/undefined */}
                                                {item.category === ''
                                                    ? '' // Render an empty string if category is explicitly empty
                                                    : item.category || <span className="italic text-gray-400">N/A</span> // Otherwise, show category or N/A if null/undefined
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                                                {item.price}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                {/* Placeholder Edit Button */}
                                                <button
                                                    onClick={() => handleEditClick(item)}
                                                    className="text-indigo-600 hover:text-indigo-800 transition"
                                                >
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

                {/* Add Material Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                            <h3 className="text-2xl font-semibold mb-6">Add New Material</h3>
                            <form onSubmit={handleAddMaterial}>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                                        <input type="text" name="name" id="name" value={newMaterial.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category (Optional)</label>
                                        <input type="text" name="category" id="category" value={newMaterial.category} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
                                        <input type="text" name="unit" id="unit" value={newMaterial.unit} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                                        <input type="number" name="price" id="price" value={newMaterial.price} onChange={handleInputChange} required step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                                    >
                                        Add Material
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Material Modal */}
                {isEditModalOpen && editingMaterial && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                            <h3 className="text-2xl font-semibold mb-6">Edit Material</h3>
                            <form onSubmit={handleUpdateMaterial}>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Name</label>
                                        <input type="text" name="name" id="edit-name" value={editingMaterial.name} onChange={handleEditInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">Category (Optional)</label>
                                        <input type="text" name="category" id="edit-category" value={editingMaterial.category} onChange={handleEditInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="edit-unit" className="block text-sm font-medium text-gray-700">Unit</label>
                                        <input type="text" name="unit" id="edit-unit" value={editingMaterial.unit} onChange={handleEditInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700">Price</label>
                                        <input type="number" name="price" id="edit-price" value={editingMaterial.price} onChange={handleEditInputChange} required step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditModalOpen(false);
                                            setEditingMaterial(null);
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div >

    )
};
export default Materials;