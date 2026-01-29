import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Check, Plus, Minus, X, Edit2 } from 'lucide-react';

// Component for a single material card in the selection grid
const MaterialCard = React.memo(({ 
    material,
    roomMaterial,
    onUpdateQuantity, 
    onDelete, 
    onAdd, 
    onEdit,
    formatCurrency
}) => {
    const isAdded = !!roomMaterial;
    const quantity = roomMaterial ? roomMaterial.quantity : 0;
    const roomMaterialId = roomMaterial?.id;

    // Local state for input to prevent jumping/deletion while typing
    const [localQty, setLocalQty] = useState(quantity > 0 ? Number(quantity) : '');
    const inputRef = useRef(null);
    const addButtonRef = useRef(null);
    const prevIsAdded = useRef(isAdded);

    // Sync local state with prop quantity (handles external updates)
    useEffect(() => {
        // Don't overwrite if user is typing (focused) to prevent cursor jumping/value reset
        if (document.activeElement === inputRef.current) return;

        if (quantity > 0 && Number(localQty) !== Number(quantity)) {
            setLocalQty(Number(quantity));
        }
    }, [quantity]);

    // Focus management to prevent scroll jump on delete
    useEffect(() => {
        if (prevIsAdded.current && !isAdded && addButtonRef.current) {
            addButtonRef.current.focus({ preventScroll: true });
        }
        prevIsAdded.current = isAdded;
    }, [isAdded]);

    // Debounce update to parent
    useEffect(() => {
        const timer = setTimeout(() => {
            const numVal = parseInt(localQty, 10);
            if (!isNaN(numVal) && numVal > 0 && numVal !== quantity && roomMaterialId) {
                onUpdateQuantity(roomMaterialId, numVal);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localQty, quantity, roomMaterialId, onUpdateQuantity]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setLocalQty(val);
    };

    // Get description/specification from room material or catalog
    const displayDescription = roomMaterial?.specification || material.description || '';

    return (
        <div className={`group relative bg-white rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg flex flex-col justify-between h-full ${
            isAdded ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 hover:border-blue-300'
        }`}>
            
            <div className="mb-4">
                <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        isAdded ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {material.category || 'General'}
                    </span>
                    {isAdded && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onEdit(roomMaterial)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Details"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <div className="h-7 w-7 bg-blue-100 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                    )}
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">
                    {material.name}
                </h3>
                
                {/* Description/Specification */}
                {displayDescription && (
                    <p className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-2">
                        {displayDescription}
                    </p>
                )}
                
                <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-2xl font-bold text-slate-900">
                        {formatCurrency(roomMaterial?.price || material.price)}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">
                        / {material.unit}
                    </span>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
                {isAdded ? (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex-1 flex items-center justify-between bg-white rounded-lg border-2 border-blue-200 p-1">
                            <button 
                                onClick={() => {
                                    if (quantity > 1) {
                                        setLocalQty(Number(quantity) - 1);
                                        onUpdateQuantity(roomMaterialId, Number(quantity) - 1);
                                    } else {
                                        onDelete(roomMaterialId, material.name, true);
                                    }
                                }}
                                className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <input 
                                type="number"
                                ref={inputRef}
                                value={localQty}
                                onChange={handleInputChange}
                                onBlur={() => {
                                    if (localQty === '' || Number(localQty) <= 0) {
                                        setLocalQty(Number(quantity));
                                    }
                                }}
                                onFocus={(e) => e.target.select()}
                                className="flex-1 w-0 h-9 text-center bg-transparent font-bold text-slate-900 focus:outline-none cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button 
                                onClick={() => {
                                    setLocalQty(Number(quantity) + 1);
                                    onUpdateQuantity(roomMaterialId, Number(quantity) + 1);
                                }}
                                className="w-9 h-9 flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        ref={addButtonRef}
                        onClick={() => onAdd(material.id, 1)}
                        className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Item
                    </button>
                )}
            </div>
        </div>
    );
});

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
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRoomItem, setEditingRoomItem] = useState(null);
    const [customItem, setCustomItem] = useState({ 
        description: '', 
        unit: 'nos', 
        rate: '', 
        quantity: 1, 
        specification: '', 
        saveToCatalog: false 
    });
    const isInitialMount = useRef(true);

    const fetchData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) { navigate('/signin'); return; }

            // Fetch quotation details
            const quotationRes = await axios.get(`${API_URL}/quotations/${quotationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setQuotation(quotationRes.data);
            
            // Fetch all rooms for this quotation
            const allRoomsRes = await axios.get(`${API_URL}/quotations/${quotationId}/rooms`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllQuotationRooms(allRoomsRes.data);

            // Fetch all master materials
            const allMaterialsRes = await axios.get(`${API_URL}/materials`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllMasterMaterials(allMaterialsRes.data);

            // Fetch materials for the active room
            const activeRoomMaterialsRes = await axios.get(`${API_URL}/rooms/${activeRoomId}/materials`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActiveRoomMaterials(activeRoomMaterialsRes.data);
            
        } catch (err) {
            console.error("Error fetching room details and materials:", err);
            setError("Failed to load room details or materials.");
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [quotationId, activeRoomId, navigate]);

    useEffect(() => {
        fetchData(isInitialMount.current);
        isInitialMount.current = false;
    }, [fetchData]);

    const activeRoom = useMemo(() => {
        return allQuotationRooms.find(r => Number(r.id) === Number(activeRoomId));
    }, [allQuotationRooms, activeRoomId]);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    }, []);

    const handleRoomSelect = useCallback((selectedRoomId) => {
        setActiveRoomId(selectedRoomId);
    }, []);

    const handleAddCustomItem = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/rooms/${activeRoomId}/materials`, 
                customItem,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setActiveRoomMaterials(prev => [...prev, res.data]);
            setIsCustomModalOpen(false);
            setCustomItem({ description: '', unit: 'nos', rate: '', quantity: 1, specification: '', saveToCatalog: false });
        } catch (err) {
            console.error("Error adding custom item:", err);
            alert("Failed to add custom item.");
        }
    };

    const handleUpdateRoomItemDetails = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.put(`${API_URL}/room-materials/${editingRoomItem.id}`, 
                {
                    description: editingRoomItem.name,
                    specification: editingRoomItem.specification,
                    rate: editingRoomItem.price,
                    quantity: editingRoomItem.quantity
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setActiveRoomMaterials(prev => prev.map(m => 
                m.id === editingRoomItem.id ? res.data : m
            ));
            setIsEditModalOpen(false);
            setEditingRoomItem(null);
        } catch (err) {
            console.error("Error updating room item details:", err);
            alert("Failed to update item details.");
        }
    };

    const handleAddMaterialToRoom = useCallback(async (materialId, quantity) => {
        if (!quantity || Number(quantity) <= 0) {
            alert("Please enter a valid quantity.");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/rooms/${activeRoomId}/materials`, 
                { material_id: materialId, quantity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setActiveRoomMaterials(prev => [...prev, res.data]);
        } catch (err) {
            console.error("Error adding material to room:", err);
            alert("Failed to add material. It might already be in the room.");
        }
    }, [activeRoomId]);

    const handleUpdateMaterialQuantity = useCallback(async (roomMaterialId, newQuantity) => {
        try {
            const token = localStorage.getItem("token");
            
            // Optimistic UI update
            setActiveRoomMaterials(prev => prev.map(m => 
                m.id === roomMaterialId ? { ...m, quantity: newQuantity } : m
            ));

            await axios.put(`${API_URL}/room-materials/${roomMaterialId}`, 
                { quantity: newQuantity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error("Error updating material quantity:", err);
            fetchData(false);
        }
    }, [fetchData]);

    const handleDeleteMaterialFromRoom = useCallback(async (roomMaterialId, materialName, skipConfirm = false) => {
        if (!skipConfirm && !window.confirm(`Are you sure you want to remove "${materialName}" from this room?`)) return;
        try {
            const token = localStorage.getItem("token");
            
            // Optimistic UI update
            setActiveRoomMaterials(prev => prev.filter(mat => mat.id !== roomMaterialId));

            await axios.delete(`${API_URL}/room-materials/${roomMaterialId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Error deleting material from room:", err);
            fetchData(false);
        }
    }, [fetchData]);

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

    // --- Bulk Selection Logic ---
    const areAllSelected = useMemo(() => {
        return filteredMasterMaterials.length > 0 && 
               filteredMasterMaterials.every(m => activeRoomMaterials.some(arm => Number(arm.material_id) === Number(m.id)));
    }, [filteredMasterMaterials, activeRoomMaterials]);

    const handleSelectAll = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (areAllSelected) {
            // Deselect All
            const materialsToRemove = activeRoomMaterials.filter(arm => 
                filteredMasterMaterials.some(m => Number(m.id) === Number(arm.material_id))
            );
            
            if (materialsToRemove.length === 0) return;
            if (!window.confirm(`Remove all ${materialsToRemove.length} materials from this room?`)) return;

            try {
                await Promise.all(materialsToRemove.map(m => 
                    axios.delete(`${API_URL}/room-materials/${m.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ));
                fetchData(false);
            } catch (err) {
                console.error("Error removing all materials:", err);
            }
        } else {
            // Select All
            const materialsToAdd = filteredMasterMaterials.filter(m => 
                !activeRoomMaterials.some(arm => Number(arm.material_id) === Number(m.id))
            );

            if (materialsToAdd.length === 0) return;

            try {
                await Promise.all(materialsToAdd.map(m => 
                    axios.post(`${API_URL}/rooms/${activeRoomId}/materials`, 
                        { material_id: m.id, quantity: 1 },
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                ));
                fetchData(false);
            } catch (err) {
                console.error("Error adding all materials:", err);
            }
        }
    }, [areAllSelected, filteredMasterMaterials, activeRoomMaterials, activeRoomId, fetchData]);

    if (isLoading) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p>Loading room materials...</p></div>;
    if (error) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p className="text-red-500">{error}</p></div>;
    if (!quotation) return <div className="flex h-screen bg-gray-100 justify-center items-center"><p>Quotation not found.</p></div>;

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-gray-800">
            <Sidebar />
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row pt-16 md:pt-0">
                {/* Mobile Room Selector */}
                <div className="md:hidden bg-white border-b p-4 flex-shrink-0">
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Current Room</label>
                    <select 
                        value={activeRoomId} 
                        onChange={(e) => handleRoomSelect(Number(e.target.value))}
                        className="w-full p-3 border-2 border-slate-200 rounded-lg bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    >
                        {allQuotationRooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={() => navigate(`/quotations/${quotationId}`)} 
                        className="w-full mt-3 text-sm text-blue-600 font-semibold flex items-center justify-center gap-1 hover:text-blue-700"
                    >
                        <span>←</span> Back to Quotation
                    </button>
                </div>

                {/* Left Rooms Sidebar */}
                <aside className="hidden md:block w-72 bg-white border-r border-slate-200 p-6 flex-shrink-0 overflow-y-auto">
                    <h3 className="text-lg font-bold mb-5 text-slate-800">Rooms</h3>
                    <nav className="space-y-2">
                        {allQuotationRooms.map(r => (
                            <button
                                key={r.id}
                                onClick={() => handleRoomSelect(r.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                    parseInt(activeRoomId) === r.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                {r.name}
                            </button>
                        ))}
                    </nav>
                    <button 
                        onClick={() => navigate(`/quotations/${quotationId}`)} 
                        className="w-full mt-8 bg-slate-700 text-white px-4 py-3 rounded-lg shadow-sm hover:bg-slate-800 transition font-medium"
                    >
                        ← Back to Quotation
                    </button>
                </aside>

                {/* Container for Main Content and Sticky Bar */}
                <div className="flex-1 flex flex-col relative">
                    {/* Main Content */}
                    <main className="flex-1 p-6 md:p-10 overflow-y-auto pb-24">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                Select Work Items
                            </h1>
                            <p className="text-base text-slate-600">
                                {activeRoom?.name} • Quotation: {quotation.title}
                            </p>
                            
                            {/* Search Bar */}
                            <div className="mt-6">
                                <input
                                    type="text"
                                    placeholder="Search work items..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                />
                            </div>

                            {/* Category Pills */}
                            <div className="flex flex-wrap gap-3 mt-6">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-wide transition-all ${
                                            selectedCategory === cat
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Bulk Actions */}
                            <div className="flex items-center justify-end mt-6">
                                <div 
                                    className="flex items-center gap-2 cursor-pointer group" 
                                    onClick={handleSelectAll}
                                >
                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                                        areAllSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                                    }`}>
                                        {areAllSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                                        {areAllSelected ? "Deselect All" : "Select All"}
                                    </span>
                                </div>
                            </div>
                        </header>

                        {/* Material Selection Grid */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {/* Custom Item Card - More Inviting */}
                            <div 
                                onClick={() => setIsCustomModalOpen(true)}
                                className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300 p-8 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer min-h-[280px]"
                            >
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <Plus className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    Can't find what you need?
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                                    Add a custom work item and optionally save it to your catalog for future use
                                </p>
                            </div>

                            {/* Work Item Cards */}
                            {filteredMasterMaterials.map(material => {
                                const roomMaterial = activeRoomMaterials.find(m => Number(m.material_id) === Number(material.id));
                                return (
                                    <MaterialCard 
                                        key={material.id} 
                                        material={material} 
                                        roomMaterial={roomMaterial}
                                        onUpdateQuantity={handleUpdateMaterialQuantity}
                                        onDelete={handleDeleteMaterialFromRoom}
                                        onAdd={handleAddMaterialToRoom}
                                        onEdit={(item) => {
                                            setEditingRoomItem(item);
                                            setIsEditModalOpen(true);
                                        }}
                                        formatCurrency={formatCurrency}
                                    />
                                );
                            })}
                        </section>
                    </main>

                    {/* Custom Item Modal */}
                    {isCustomModalOpen && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                    <h3 className="text-xl font-bold text-slate-900">Add Custom Work Item</h3>
                                    <button onClick={() => setIsCustomModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleAddCustomItem} className="p-6 space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wide">Item Name / Description</label>
                                        <input 
                                            type="text" required
                                            value={customItem.description}
                                            onChange={(e) => setCustomItem({...customItem, description: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            placeholder="e.g., Custom TV Unit Fabrication"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wide">Unit</label>
                                            <input 
                                                type="text" required
                                                value={customItem.unit}
                                                onChange={(e) => setCustomItem({...customItem, unit: e.target.value})}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="sqft, nos..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wide">Rate (₹)</label>
                                            <input 
                                                type="number" required
                                                value={customItem.rate}
                                                onChange={(e) => setCustomItem({...customItem, rate: e.target.value})}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wide">Qty</label>
                                            <input 
                                                type="number" required
                                                value={customItem.quantity}
                                                onChange={(e) => setCustomItem({...customItem, quantity: e.target.value})}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wide">Technical Specification</label>
                                        <textarea 
                                            rows="3"
                                            value={customItem.specification}
                                            onChange={(e) => setCustomItem({...customItem, specification: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
                                            placeholder="Details about materials, finish, etc."
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 py-2">
                                        <input 
                                            type="checkbox" id="saveToCat"
                                            checked={customItem.saveToCatalog}
                                            onChange={(e) => setCustomItem({...customItem, saveToCatalog: e.target.checked})}
                                            className="w-4 h-4 text-blue-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <label htmlFor="saveToCat" className="text-sm text-slate-700 font-medium cursor-pointer">
                                            Save this item to my Master Catalog for future use
                                        </label>
                                    </div>
                                    <button 
                                        type="submit"
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
                                    >
                                        Add to Room
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit Room Item Modal */}
                    {isEditModalOpen && editingRoomItem && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                    <h3 className="text-xl font-bold text-slate-900">Edit Item Details</h3>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleUpdateRoomItemDetails} className="p-6 space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wide">Item Name</label>
                                        <input 
                                            type="text" required
                                            value={editingRoomItem.name}
                                            onChange={(e) => setEditingRoomItem({...editingRoomItem, name: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wide">
                                                Rate (₹) / {editingRoomItem.unit}
                                            </label>
                                            <input 
                                                type="number" required
                                                value={editingRoomItem.price}
                                                onChange={(e) => setEditingRoomItem({...editingRoomItem, price: e.target.value})}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wide">Quantity</label>
                                            <input 
                                                type="number" required
                                                value={editingRoomItem.quantity}
                                                onChange={(e) => setEditingRoomItem({...editingRoomItem, quantity: e.target.value})}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wide">Technical Specification</label>
                                        <textarea 
                                            rows="4"
                                            value={editingRoomItem.specification || ''}
                                            onChange={(e) => setEditingRoomItem({...editingRoomItem, specification: e.target.value})}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
                                            placeholder="Details about materials, finish, etc."
                                        />
                                        <p className="text-xs text-slate-500 mt-2 italic">
                                            Note: Changes here only affect this specific quotation.
                                        </p>
                                    </div>
                                    <button 
                                        type="submit"
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
                                    >
                                        Save Changes
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Sticky Bottom Summary Bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 shadow-xl transition-all duration-300 ease-in-out" style={{ height: isSummaryExpanded ? '50%' : '70px' }}>
                        {/* Collapsed View Header */}
                        <div className="h-[70px] flex items-center justify-between px-8 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}>
                            <h3 className="text-lg font-bold text-slate-900">
                                Summary for <span className="text-blue-600">{activeRoom?.name}</span>
                            </h3>
                            <div className="flex items-center gap-6">
                                <span className="text-xl font-bold text-slate-900">{formatCurrency(activeRoomSubtotal)}</span>
                                <button className="transform transition-transform duration-300" style={{ transform: isSummaryExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Expanded View Content */}
                        {isSummaryExpanded && (
                            <div className="p-8 pt-4 h-[calc(100%-70px)] overflow-y-auto">
                                <div className="space-y-3">
                                    {activeRoomMaterials.length > 0 ? (
                                        activeRoomMaterials.map(material => (
                                            <div key={material.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-slate-900">{material.name}</p>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            {material.quantity} {material.unit} @ {formatCurrency(material.price)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="font-bold text-slate-900">
                                                            {formatCurrency(Number(material.price) * Number(material.quantity))}
                                                        </p>
                                                        <button 
                                                            onClick={() => handleDeleteMaterialFromRoom(material.id, material.name)} 
                                                            className="text-red-500 hover:text-red-700 text-xs font-semibold mt-1 hover:underline"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-slate-400 italic py-12">
                                            No materials added to this room yet.
                                        </p>
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