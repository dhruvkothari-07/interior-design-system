import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const MaterialSelectionModal = ({ roomId, onMaterialsAdded, onClose }) => {
    const [allMaterials, setAllMaterials] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaterials, setSelectedMaterials] = useState({}); // { materialId: quantity }
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllMaterials = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_URL}/materials`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAllMaterials(res.data);
            } catch (err) {
                console.error("Error fetching all materials:", err);
                setError("Failed to load materials.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllMaterials();
    }, []);

    const filteredMaterials = useMemo(() => {
        if (!searchTerm) {
            return allMaterials;
        }
        return allMaterials.filter(material =>
            material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            material.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allMaterials, searchTerm]);

    const handleQuantityChange = (materialId, quantity) => {
        setSelectedMaterials(prev => {
            const newQuantity = Number(quantity);
            if (newQuantity > 0) {
                return { ...prev, [materialId]: newQuantity };
            } else {
                const newState = { ...prev };
                delete newState[materialId];
                return newState;
            }
        });
    };

    const handleAddSelectedMaterials = async () => {
        if (Object.keys(selectedMaterials).length === 0) {
            alert("Please select at least one material with a quantity.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const addPromises = Object.entries(selectedMaterials).map(([materialId, quantity]) =>
                axios.post(`${API_URL}/rooms/${roomId}/materials`,
                    { material_id: materialId, quantity },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
            );
            await Promise.all(addPromises);
            onMaterialsAdded(); // Notify parent to re-fetch
            onClose(); // Close the modal
        } catch (err) {
            console.error("Error adding selected materials:", err);
            alert("Failed to add one or more materials. Please try again.");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    if (isLoading) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl h-3/4 flex justify-center items-center">
                <p>Loading materials...</p>
            </div>
        </div>
    );
    if (error) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl h-3/4 flex justify-center items-center">
                <p className="text-red-500">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl h-3/4 flex flex-col">
                <h3 className="text-2xl font-semibold mb-6 border-b pb-3">Select Materials for Room</h3>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search materials by name or category..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2"> {/* Custom scrollbar area */}
                    {filteredMaterials.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMaterials.map(material => (
                                <div key={material.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-semibold text-lg text-gray-800">{material.name}</h4>
                                        <p className="text-sm text-gray-600">{material.category || 'General'}</p>
                                        <p className="text-sm text-gray-700 mt-1">
                                            {formatCurrency(material.price)} / {material.unit}
                                        </p>
                                    </div>
                                    <div className="mt-3 flex items-center">
                                        <label htmlFor={`qty-${material.id}`} className="sr-only">Quantity</label>
                                        <input
                                            type="number"
                                            id={`qty-${material.id}`}
                                            value={selectedMaterials[material.id] || ''}
                                            onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                                            min="0"
                                            step="0.01"
                                            placeholder="Qty"
                                            className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        />
                                        <span className="ml-2 text-gray-600">{material.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8 italic">No materials found matching your search.</p>
                    )}
                </div>

                <div className="mt-6 flex justify-end space-x-4 border-t pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleAddSelectedMaterials}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                        disabled={Object.keys(selectedMaterials).length === 0}
                    >
                        Add Selected Materials ({Object.keys(selectedMaterials).length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaterialSelectionModal;