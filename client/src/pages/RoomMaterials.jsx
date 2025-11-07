import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useParams, useNavigate } from 'react-router-dom';
import MaterialSelectionModal from '../components/MaterialSelectionModal'; // Updated import path

const RoomMaterials = () => {
    const { quotationId, roomId } = useParams();
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);
    const [room, setRoom] = useState(null);
    const [materials, setMaterials] = useState([]); // Materials specific to this room
    const [allMaterials, setAllMaterials] = useState([]); // All available materials for dropdown
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isMaterialSelectionModalOpen, setIsMaterialSelectionModalOpen] = useState(false); // State to control the new MaterialSelectionModal
    const [isEditMaterialModalOpen, setIsEditMaterialModalOpen] = useState(false); // State for editing materials
    const [editingRoomMaterial, setEditingRoomMaterial] = useState(null); // State for editing materials

    const fetchRoomAndMaterialsData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) { navigate('/signin'); return; }

            // Fetch quotation details (for title)
            const quotationRes = await axios.get(`http://localhost:3001/api/v1/quotations/${quotationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setQuotation(quotationRes.data);

            // Fetch specific room details
            const roomRes = await axios.get(`http://localhost:3001/api/v1/rooms/${roomId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRoom(roomRes.data);

            // Fetch materials for this specific room
            const materialsRes = await axios.get(`http://localhost:3001/api/v1/rooms/${roomId}/materials`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMaterials(materialsRes.data);

            // Fetch all available materials for the "Add Material" modal
            const allMaterialsRes = await axios.get(`http://localhost:3001/api/v1/materials`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllMaterials(allMaterialsRes.data);

        } catch (err) {
            console.error("Error fetching room details and materials:", err);
            setError("Failed to load room details or materials.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomAndMaterialsData();
    }, [quotationId, roomId, navigate]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const roomSubtotal = useMemo(() => {
        return materials.reduce((sum, material) => sum + (Number(material.price) * Number(material.quantity)), 0);
    }, [materials]);

    const handleEditMaterialClick = (material) => {
        setEditingRoomMaterial(material);
        setIsEditMaterialModalOpen(true);
    };

    const handleEditingMaterialInputChange = (e) => {
        const { name, value } = e.target;
        setEditingRoomMaterial(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateRoomMaterial = async (e) => {
        e.preventDefault();
        if (!editingRoomMaterial) return;

        try {
            const token = localStorage.getItem("token");
            const { id, quantity } = editingRoomMaterial;

            const res = await axios.put(`http://localhost:3001/api/v1/room-materials/${id}`,
                { quantity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMaterials(prev => prev.map(mat => mat.id === id ? res.data : mat));
            setIsEditMaterialModalOpen(false);
            setEditingRoomMaterial(null);
            await fetchRoomAndMaterialsData(); // Re-fetch all data to update totals
        } catch (err) {
            console.error("Error updating room material:", err);
            alert("Failed to update material.");
        }
    };

    const handleDeleteMaterialFromRoom = async (roomMaterialId, materialName) => {
        if (!window.confirm(`Are you sure you want to remove "${materialName}" from this room?`)) {
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:3001/api/v1/room-materials/${roomMaterialId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMaterials(prev => prev.filter(mat => mat.id !== roomMaterialId));
            await fetchRoomAndMaterialsData(); // Re-fetch all data to update totals
        } catch (err) {
            console.error("Error deleting material from room:", err);
            alert("Failed to delete material from room.");
        }
    };

    if (isLoading) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p>Loading room materials...</p></div>;
    if (error) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p className="text-red-500">{error}</p></div>;
    if (!room || !quotation) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p>Room or Quotation not found.</p></div>;

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-4">
                    <div>
                        <h2 className="text-3xl font-semibold text-gray-800">Quotation: {quotation.title}</h2>
                        <p className="text-xl text-gray-600">Room: {room.name}</p>
                        <p className="text-sm text-gray-500">Dimensions: {room.length} x {room.width} x {room.height}</p>
                        {room.notes && <p className="text-sm text-gray-500">Notes: {room.notes}</p>}
                    </div>
                    <button
                        onClick={() => navigate(`/quotations/${quotationId}`)}
                        className="bg-gray-600 text-white px-5 py-2 rounded-lg shadow hover:bg-gray-700 transition"
                    >
                        Back to Quotation
                    </button>
                </header>

                <section className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Materials in this Room</h3>
                        <button // This button now opens the new modal
                            onClick={() => setIsMaterialSelectionModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700 transition"
                        >
                            + Add Material
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        {materials.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Material Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Rate ({room.unit})</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {materials.map(material => (
                                        <tr key={material.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.quantity} {material.unit}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(material.price)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(Number(material.price) * Number(material.quantity))}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                <button onClick={() => handleEditMaterialClick(material)} className="text-indigo-600 hover:text-indigo-800">Edit</button>
                                                <button onClick={() => handleDeleteMaterialFromRoom(material.id, material.name)} className="text-red-600 hover:text-red-800">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500 py-8 italic">No materials added to this room yet.</p>
                        )}
                    </div>
                    <div className="mt-6 text-right text-xl font-bold">
                        Subtotal for {room.name}: {formatCurrency(roomSubtotal)}
                    </div>
                </section>

                {/* New Material Selection Modal */}
                {isMaterialSelectionModalOpen && (
                    <MaterialSelectionModal
                        roomId={roomId}
                        onMaterialsAdded={fetchRoomAndMaterialsData} // Callback to re-fetch data after materials are added
                        onClose={() => setIsMaterialSelectionModalOpen(false)}
                    />
                )}

                {/* Edit Material Modal */}
                {isEditMaterialModalOpen && editingRoomMaterial && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                            <h3 className="text-2xl font-semibold mb-6">Edit Material Quantity</h3>
                            <form onSubmit={handleUpdateRoomMaterial}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Material</label>
                                        <p className="mt-1 text-lg font-semibold">{editingRoomMaterial.name}</p>
                                    </div>
                                    <div>
                                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                                        <input type="number" name="quantity" id="quantity" value={editingRoomMaterial.quantity} onChange={handleEditingMaterialInputChange} required step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end space-x-4">
                                    <button type="button" onClick={() => setIsEditMaterialModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default RoomMaterials;