import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useParams, useNavigate } from 'react-router-dom';

const RoomMaterials = () => {
    const { quotationId, roomId } = useParams();
    const navigate = useNavigate();

    // State for data
    const [quotation, setQuotation] = useState(null);
    const [allQuotationRooms, setAllQuotationRooms] = useState([]);
    const [allMasterMaterials, setAllMasterMaterials] = useState([]);
    const [activeRoomMaterials, setActiveRoomMaterials] = useState([]);

    // State for UI and interaction
    const [activeRoomId, setActiveRoomId] = useState(roomId);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) { navigate('/signin'); return; }

            // Fetch quotation details (for title)
            const quotationRes = await axios.get(`http://localhost:3001/api/v1/quotations/${quotationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setQuotation(quotationRes.data);
            
            // Fetch all rooms for this quotation for the sidebar
            const allRoomsRes = await axios.get(`http://localhost:3001/api/v1/quotations/${quotationId}/rooms`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllQuotationRooms(allRoomsRes.data);

            // Fetch all master materials for the selection grid
            const allMaterialsRes = await axios.get(`http://localhost:3001/api/v1/materials`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllMasterMaterials(allMaterialsRes.data);

            // Fetch materials for the initially active room
            const activeRoomMaterialsRes = await axios.get(`http://localhost:3001/api/v1/rooms/${activeRoomId}/materials`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActiveRoomMaterials(activeRoomMaterialsRes.data);
            
        } catch (err) {
            console.error("Error fetching room details and materials:", err);
            setError("Failed to load room details or materials.");
        } finally {
            setIsLoading(false);
        }
    }, [quotationId, activeRoomId, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activeRoom = useMemo(() => {
        return allQuotationRooms.find(r => r.id === parseInt(activeRoomId));
    }, [allQuotationRooms, activeRoomId]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const handleRoomSelect = async (selectedRoomId) => {
        setActiveRoomId(selectedRoomId);
        // Fetch materials for the newly selected room
        try {
            const token = localStorage.getItem("token");
            const materialsRes = await axios.get(`http://localhost:3001/api/v1/rooms/${selectedRoomId}/materials`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActiveRoomMaterials(materialsRes.data);
        } catch (err) {
            console.error(`Error fetching materials for room ${selectedRoomId}:`, err);
            setError(`Failed to load materials for the selected room.`);
        }
    };

    const handleAddMaterialToRoom = async (materialId, quantity) => {
        if (!quantity || Number(quantity) <= 0) {
            alert("Please enter a valid quantity.");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`http://localhost:3001/api/v1/rooms/${activeRoomId}/materials`, 
                { material_id: materialId, quantity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Add new material to the active room's list for immediate UI update
            setActiveRoomMaterials(prev => [...prev, res.data]);
        } catch (err) {
            console.error("Error adding material to room:", err);
            alert("Failed to add material. It might already be in the room.");
        }
    };

    const handleDeleteMaterialFromRoom = async (roomMaterialId, materialName) => {
        if (!window.confirm(`Are you sure you want to remove "${materialName}" from this room?`)) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:3001/api/v1/room-materials/${roomMaterialId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActiveRoomMaterials(prev => prev.filter(mat => mat.id !== roomMaterialId));
        } catch (err) {
            console.error("Error deleting material from room:", err);
            alert("Failed to delete material from room.");
        }
    };

    const filteredMasterMaterials = useMemo(() => {
        return allMasterMaterials.filter(material => {
            const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || material.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [allMasterMaterials, searchTerm, selectedCategory]);
    const categories = useMemo(() => {
        const allCats = allMasterMaterials.map(m => m.category).filter(Boolean);
        return ['All', ...new Set(allCats)];
    }, [allMasterMaterials]);
    const activeRoomSubtotal = useMemo(() => {
        return activeRoomMaterials.reduce((sum, material) => sum + (Number(material.price) * Number(material.quantity)), 0);
    }, [activeRoomMaterials]);

    if (isLoading) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p>Loading room materials...</p></div>;
    if (error) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p className="text-red-500">{error}</p></div>;
    if (!quotation) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p>Quotation not found.</p></div>;

    // Component for a single material card in the selection grid
    const MaterialCard = ({ material }) => {
        const [quantity, setQuantity] = useState('');
        const isAdded = activeRoomMaterials.some(m => m.material_id === material.id);

        const handleQuantityStep = (step) => {
            const currentQty = Number(quantity) || 0;
            const newQty = Math.max(0, currentQty + step);
            setQuantity(newQty.toString());
        };

        // Horizontal Card Style
        return (
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${isAdded ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{material.name}</h4>
                    <p className="text-sm text-gray-500">{formatCurrency(material.price)} / {material.unit}</p>
                </div>
                <div className="flex items-center gap-1">
                    {/* Numeric Stepper */}
                    <div className="flex items-center border rounded-md">
                        <button onClick={() => handleQuantityStep(-1)} disabled={isAdded} className="px-2 py-1 text-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50">-</button>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Qty"
                            className="w-16 text-center border-l border-r focus:outline-none text-sm"
                            disabled={isAdded}
                        />
                        <button onClick={() => handleQuantityStep(1)} disabled={isAdded} className="px-2 py-1 text-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50">+</button>
                    </div>

                    <button
                        onClick={() => {
                            handleAddMaterialToRoom(material.id, quantity);
                            setQuantity('');
                        }}
                        className="w-20 text-center px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={isAdded}
                    >
                        {isAdded ? 'Added' : 'Add'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-800">
            <Sidebar />
            <div className="flex flex-1 overflow-hidden">
                {/* Left Rooms Sidebar */}
                <aside className="w-64 bg-white border-r p-4 flex-shrink-0">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Rooms</h3>
                    <nav className="space-y-2">
                        {allQuotationRooms.map(r => (
                            <button
                                key={r.id}
                                onClick={() => handleRoomSelect(r.id)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                                    parseInt(activeRoomId) === r.id
                                        ? 'bg-indigo-100 text-indigo-700 font-semibold'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {r.name}
                            </button>
                        ))}
                    </nav>
                    <button onClick={() => navigate(`/quotations/${quotationId}`)} className="w-full mt-8 bg-gray-600 text-white px-3 py-2 rounded-lg shadow hover:bg-gray-700 transition text-sm">
                        Back to Quotation
                    </button>
                </aside>

                {/* New container for Main Content and Sticky Bar */}
                <div className="flex-1 flex flex-col relative">
                    {/* Main Content */}
                    <main className="flex-1 p-8 overflow-y-auto pb-24"> {/* Add padding-bottom for the sticky bar */}
                        <header className="mb-6">
                            <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Select Materials for: <span className="text-indigo-600">{activeRoom?.name}</span></h1>
                            <p className="text-sm text-gray-500 mt-1">For Quotation: {quotation.title}</p>
                            <div className="flex flex-wrap gap-4 mt-4">
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-grow px-4 py-2 border rounded-lg"
                                />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-4 py-2 border rounded-lg bg-white"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </header>

                        {/* Material Selection Grid */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-1">
                            {filteredMasterMaterials.map(material => (
                                <MaterialCard key={material.id} material={material} />
                            ))}
                        </section>
                    </main>

                    {/* Sticky Bottom Summary Bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t shadow-lg transition-all duration-300 ease-in-out" style={{ height: isSummaryExpanded ? '50%' : '60px' }}>
                        {/* Collapsed View Header */}
                        <div className="h-[60px] flex items-center justify-between px-8 cursor-pointer" onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}>
                            <h3 className="text-lg font-semibold">Summary for <span className="text-indigo-600">{activeRoom?.name}</span></h3>
                            <div className="flex items-center gap-4">
                                <span className="text-lg font-bold">{formatCurrency(activeRoomSubtotal)}</span>
                                <button className="transform transition-transform duration-300" style={{ transform: isSummaryExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    {/* Chevron Up Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Expanded View Content */}
                        {isSummaryExpanded && (
                            <div className="p-8 pt-4 h-[calc(100%-60px)] overflow-y-auto">
                                <div className="space-y-3">
                                    {activeRoomMaterials.length > 0 ? (
                                        activeRoomMaterials.map(material => (
                                            <div key={material.id} className="bg-gray-50 p-3 rounded-lg border">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-800">{material.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {material.quantity} {material.unit} @ {formatCurrency(material.price)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right ml-2">
                                                        <p className="font-semibold">{formatCurrency(Number(material.price) * Number(material.quantity))}</p>
                                                        <button onClick={() => handleDeleteMaterialFromRoom(material.id, material.name)} className="text-red-500 hover:text-red-700 text-xs mt-1">
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-400 italic py-8">No materials added to this room yet.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomMaterials;