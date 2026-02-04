import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Plus, Minus, Check, X, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { API_URL } from '../../config';

// --- Sub-components (MaterialCard) ---
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

    const [localQty, setLocalQty] = useState(quantity > 0 ? Number(quantity) : '');
    const inputRef = useRef(null);
    const addButtonRef = useRef(null);
    const prevIsAdded = useRef(isAdded);

    useEffect(() => {
        if (document.activeElement === inputRef.current) return;
        if (quantity > 0 && Number(localQty) !== Number(quantity)) {
            setLocalQty(Number(quantity));
        }
    }, [quantity]);

    useEffect(() => {
        if (prevIsAdded.current && !isAdded && addButtonRef.current) {
            addButtonRef.current.focus({ preventScroll: true });
        }
        prevIsAdded.current = isAdded;
    }, [isAdded]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const numVal = parseInt(localQty, 10);
            if (!isNaN(numVal) && numVal > 0 && numVal !== quantity && roomMaterialId) {
                onUpdateQuantity(roomMaterialId, numVal);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localQty, quantity, roomMaterialId, onUpdateQuantity]);

    const displayDescription = roomMaterial?.specification || material.description || '';

    return (
        <div className={`group relative bg-white rounded-2xl border-2 p-4 transition-all duration-300 hover:shadow-lg flex flex-col justify-between h-full ${isAdded ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100 hover:border-orange-200'
            }`}>
            <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${isAdded ? 'bg-orange-100 text-theme-orange' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {material.category || 'General'}
                    </span>
                    {isAdded && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onEdit(roomMaterial)}
                                className="p-1 text-gray-400 hover:text-theme-orange hover:bg-orange-50 rounded-lg transition-colors"
                                title="Edit Details"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="h-5 w-5 bg-orange-100 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-theme-orange" />
                            </div>
                        </div>
                    )}
                </div>

                <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">
                    {material.name}
                </h3>

                {displayDescription && (
                    <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">
                        {displayDescription}
                    </p>
                )}

                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(roomMaterial?.price || material.price)}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                        / {material.unit}
                    </span>
                </div>
            </div>

            <div className="mt-auto">
                {isAdded ? (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center justify-between bg-white rounded-xl border border-orange-200 p-0.5">
                            <button
                                onClick={() => {
                                    if (quantity > 1) {
                                        setLocalQty(Number(quantity) - 1);
                                        onUpdateQuantity(roomMaterialId, Number(quantity) - 1);
                                    } else {
                                        onDelete(roomMaterialId, material.name, true);
                                    }
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <input
                                type="number"
                                ref={inputRef}
                                value={localQty}
                                onChange={(e) => setLocalQty(e.target.value)}
                                onBlur={() => {
                                    if (localQty === '' || Number(localQty) <= 0) {
                                        setLocalQty(Number(quantity));
                                    }
                                }}
                                onFocus={(e) => e.target.select()}
                                className="flex-1 w-0 h-8 text-center bg-transparent font-bold text-sm text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                                onClick={() => {
                                    setLocalQty(Number(quantity) + 1);
                                    onUpdateQuantity(roomMaterialId, Number(quantity) + 1);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-theme-orange text-white hover:bg-orange-700 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        ref={addButtonRef}
                        onClick={() => onAdd(material.id, 1)}
                        className="w-full py-2.5 bg-orange-50 text-theme-orange border border-orange-200 font-semibold rounded-xl text-sm hover:bg-theme-orange hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                )}
            </div>
        </div>
    );
});

const WorksheetTab = ({
    quotationId,
    rooms,
    onRoomsUpdate,
    activeRoomId,
    setActiveRoomId,
    onAddRoomClick,
    onEditRoom,
    onDeleteRoom
}) => {
    // State for materials
    const [allMasterMaterials, setAllMasterMaterials] = useState([]);
    const [activeRoomMaterials, setActiveRoomMaterials] = useState([]);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Modals
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRoomItem, setEditingRoomItem] = useState(null);
    const [customItem, setCustomItem] = useState({
        description: '', unit: 'nos', rate: '', quantity: 1, specification: '', saveToCatalog: false
    });

    const activeRoom = rooms.find(r => r.id === activeRoomId);

    // Initial Load of Master Materials
    useEffect(() => {
        const fetchMasterMaterials = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await axios.get(`${API_URL}/materials`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAllMasterMaterials(res.data);
            } catch (err) {
                console.error("Error fetching master materials", err);
            }
        };
        fetchMasterMaterials();
    }, []);

    // Fetch Active Room Materials when room changes
    const fetchActiveRoomMaterials = useCallback(async () => {
        if (!activeRoomId) {
            setActiveRoomMaterials([]);
            return;
        }
        setIsLoadingMaterials(true);
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get(`${API_URL}/rooms/${activeRoomId}/materials`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActiveRoomMaterials(res.data);
        } catch (err) {
            console.error("Error fetching room materials", err);
        } finally {
            setIsLoadingMaterials(false);
        }
    }, [activeRoomId]);

    useEffect(() => {
        fetchActiveRoomMaterials();
    }, [fetchActiveRoomMaterials]);


    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    // Material Actions
    const handleAddMaterialToRoom = async (materialId, quantity) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/rooms/${activeRoomId}/materials`,
                { material_id: materialId, quantity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setActiveRoomMaterials(prev => [...prev, res.data]);
            onRoomsUpdate(); // Update total in parent
        } catch (err) {
            alert("Failed to add material.");
        }
    };

    const handleUpdateMaterialQuantity = async (roomMaterialId, newQuantity) => {
        try {
            const token = localStorage.getItem("token");
            // Optimistic
            setActiveRoomMaterials(prev => prev.map(m =>
                m.id === roomMaterialId ? { ...m, quantity: newQuantity } : m
            ));

            await axios.put(`${API_URL}/room-materials/${roomMaterialId}`,
                { quantity: newQuantity },
                {
                    headers: { Authorization: `Bearer ${token}` }
                });
            onRoomsUpdate();
        } catch (err) {
            fetchActiveRoomMaterials(); // Revert on error
        }
    };

    const handleDeleteMaterialFromRoom = async (roomMaterialId, materialName, skipConfirm = false) => {
        if (!skipConfirm && !window.confirm(`Remove "${materialName}"?`)) return;
        try {
            const token = localStorage.getItem("token");
            setActiveRoomMaterials(prev => prev.filter(mat => mat.id !== roomMaterialId));
            await axios.delete(`${API_URL}/room-materials/${roomMaterialId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onRoomsUpdate();
        } catch (err) {
            fetchActiveRoomMaterials();
        }
    };

    const handleAddCustomItem = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/rooms/${activeRoomId}/materials`,
                { ...customItem, category: 'Custom' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setActiveRoomMaterials(prev => [...prev, res.data]);
            setIsCustomModalOpen(false);
            setCustomItem({ description: '', unit: 'nos', rate: '', quantity: 1, specification: '', saveToCatalog: false });
            onRoomsUpdate();
        } catch (err) {
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
            onRoomsUpdate();
        } catch (err) {
            alert("Failed to update item details.");
        }
    };

    // Merge Logic: Combine Catalog Items with Custom Items currently in the room
    const mergedMaterials = useMemo(() => {
        // Find items in activeRoomMaterials that do NOT match any master material by ID
        const customItems = activeRoomMaterials.filter(rm =>
            !allMasterMaterials.some(mm => Number(mm.id) === Number(rm.material_id))
        ).map(rm => ({
            id: `custom-${rm.id}`, // Unique ID for the grid key
            isCustom: true,
            originalRoomMaterialId: rm.id,
            name: rm.description || 'Custom Item',
            category: 'Custom',
            price: rm.rate || rm.price || 0,
            unit: rm.unit || 'nos',
            description: rm.specification || ''
        }));

        return [...customItems, ...allMasterMaterials];
    }, [allMasterMaterials, activeRoomMaterials]);

    // Filter Logic
    const filteredMasterMaterials = useMemo(() => {
        return mergedMaterials.filter(material => {
            const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || material.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [mergedMaterials, searchTerm, selectedCategory]);

    const categories = useMemo(() => {
        const allCats = mergedMaterials.map(m => m.category).filter(Boolean);
        return ['All', ...new Set(allCats)];
    }, [mergedMaterials]);


    return (
        <div className="flex flex-col md:flex-row md:h-[calc(100vh-180px)] h-auto bg-white rounded-2xl shadow-sm border border-gray-100 md:overflow-hidden overflow-visible animate-fade-in-up">
            {/* Left Sidebar: Room List (Desktop Only) */}
            <aside className="w-full md:w-72 hidden md:flex flex-none bg-gray-50/50 border-r border-gray-100 flex-col md:h-full md:max-h-full overflow-hidden transition-all">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="font-bold text-gray-900">Rooms</h3>
                    <button
                        onClick={onAddRoomClick}
                        className="p-2 bg-orange-50 text-theme-orange rounded-lg hover:bg-orange-100 transition"
                        title="Add Room"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {rooms.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4 italic">No rooms yet. Add one to start.</p>
                    )}
                    {rooms.map(room => (
                        <div
                            key={room.id}
                            onClick={() => setActiveRoomId(room.id)}
                            className={`group w-full text-left p-4 rounded-xl text-sm border-2 transition-all cursor-pointer relative ${activeRoomId === room.id
                                ? 'bg-white border-theme-orange shadow-sm'
                                : 'bg-white border-gray-100 hover:border-orange-200 text-gray-600'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`font-semibold ${activeRoomId === room.id ? 'text-gray-900' : 'text-gray-900'}`}>{room.name}</span>
                                {activeRoomId === room.id && <Check className="w-4 h-4 text-theme-orange" />}
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <span className="text-xs text-gray-500">{room.dimensions || `${room.length}x${room.width}`}</span>
                                <span className="font-bold text-theme-orange">{formatCurrency(room.room_total || 0)}</span>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 transition-opacity shadow-sm">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEditRoom(room); }}
                                    className="p-1.5 text-gray-400 hover:text-theme-orange rounded-lg hover:bg-orange-50"
                                    title="Edit Room"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteRoom(room); }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                    title="Delete Room"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Area: Materials */}
            <main className="flex-1 flex flex-col min-w-0 bg-white md:h-full h-auto">
                {/* Mobile Room Selector (Sticky) */}
                <div className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-100 p-3 flex gap-2 items-center shadow-sm">
                    <div className="flex-1 relative">
                        <select
                            value={activeRoomId || ''}
                            onChange={(e) => setActiveRoomId(Number(e.target.value))}
                            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-theme-orange focus:border-theme-orange block p-3 pr-8 font-medium"
                        >
                            <option value="" disabled>Select Room...</option>
                            {rooms.length === 0 && <option value="" disabled>No rooms added</option>}
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                    <button
                        onClick={onAddRoomClick}
                        className="p-3 bg-theme-orange text-white rounded-xl shadow-lg hover:bg-orange-700 transition flex-shrink-0"
                        title="Add Room"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    {activeRoomId && (
                        <div className="flex gap-1 ml-1 border-l pl-2 border-gray-200">
                            <button
                                onClick={() => { const r = rooms.find(r => r.id === activeRoomId); if (r) onEditRoom(r); }}
                                className="p-2 text-gray-500 hover:text-theme-orange rounded-lg hover:bg-orange-50"
                                title="Edit Room"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { const r = rooms.find(r => r.id === activeRoomId); if (r) onDeleteRoom(r); }}
                                className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Delete Room"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {!activeRoomId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                            <Edit2 className="w-8 h-8 text-orange-300" />
                        </div>
                        <p className="text-lg font-medium text-gray-500">Select a room to start adding items</p>
                        <p className="text-sm mt-2">Or add a new room from the sidebar</p>
                    </div>
                ) : (
                    <>
                        {/* Material Toolbar */}
                        <div className="p-4 border-b border-gray-100 flex flex-col gap-4 bg-white z-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="hidden md:block">
                                    <h2 className="text-lg font-bold text-gray-900">{activeRoom?.name}</h2>
                                    <p className="text-sm text-gray-500">{activeRoomMaterials.length} items added • Total: <span className="font-semibold text-theme-orange">{formatCurrency(activeRoom?.room_total || 0)}</span></p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <input
                                        type="text"
                                        placeholder="Search catalog..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1 md:w-64 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange"
                                    />
                                    <button
                                        onClick={() => setIsCustomModalOpen(true)}
                                        className="px-4 py-2.5 bg-theme-orange text-white text-sm font-medium rounded-xl hover:bg-orange-700 transition whitespace-nowrap shadow-lg shadow-orange-200"
                                    >
                                        + Custom Item
                                    </button>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border-2 transition-all ${selectedCategory === cat
                                                ? 'bg-theme-orange text-white border-theme-orange shadow-lg shadow-orange-200'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-orange-200 hover:bg-orange-50'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={async () => {
                                            const allSelected = filteredMasterMaterials.length > 0 && filteredMasterMaterials.every(m => {
                                                if (m.isCustom) return true;
                                                return activeRoomMaterials.find(rm => Number(rm.material_id) === Number(m.id));
                                            });

                                            if (allSelected) {
                                                // Unselect All Logic
                                                const itemsToRemove = activeRoomMaterials.filter(rm => {
                                                    if (filteredMasterMaterials.some(m => m.isCustom && m.originalRoomMaterialId === rm.id)) return true;
                                                    return filteredMasterMaterials.some(m => !m.isCustom && Number(m.id) === Number(rm.material_id));
                                                });

                                                if (itemsToRemove.length === 0) return;
                                                const confirmMsg = itemsToRemove.length === 1 ? "Remove 1 item?" : `Remove ${itemsToRemove.length} items from this room?`;
                                                if (!window.confirm(confirmMsg)) return;

                                                setIsLoadingMaterials(true);
                                                try {
                                                    const token = localStorage.getItem("token");
                                                    await Promise.all(itemsToRemove.map(item =>
                                                        axios.delete(`${API_URL}/room-materials/${item.id}`, {
                                                            headers: { Authorization: `Bearer ${token}` }
                                                        })
                                                    ));
                                                    // Refresh
                                                    const res = await axios.get(`${API_URL}/rooms/${activeRoomId}/materials`, {
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    });
                                                    setActiveRoomMaterials(res.data);
                                                    onRoomsUpdate();
                                                } catch (err) {
                                                    console.error(err);
                                                    alert("Failed to remove items.");
                                                } finally {
                                                    setIsLoadingMaterials(false);
                                                }
                                            } else {
                                                // Select All Logic
                                                const itemsToAdd = filteredMasterMaterials
                                                    .filter(m => !m.isCustom)
                                                    .filter(m => !activeRoomMaterials.find(rm => Number(rm.material_id) === Number(m.id)));

                                                if (itemsToAdd.length === 0) return;
                                                const confirmMsg = itemsToAdd.length === 1 ? "Add 1 item?" : `Add ${itemsToAdd.length} items to this room?`;
                                                if (!window.confirm(confirmMsg)) return;

                                                setIsLoadingMaterials(true);
                                                try {
                                                    const token = localStorage.getItem("token");
                                                    await Promise.all(itemsToAdd.map(item =>
                                                        axios.post(`${API_URL}/rooms/${activeRoomId}/materials`,
                                                            { material_id: item.id, quantity: 1 },
                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                        )
                                                    ));
                                                    // Refresh
                                                    const res = await axios.get(`${API_URL}/rooms/${activeRoomId}/materials`, {
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    });
                                                    setActiveRoomMaterials(res.data);
                                                    onRoomsUpdate();
                                                } catch (err) {
                                                    console.error(err);
                                                    alert("Failed to add items.");
                                                } finally {
                                                    setIsLoadingMaterials(false);
                                                }
                                            }
                                        }}
                                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-theme-orange font-medium cursor-pointer"
                                    >
                                        <div className={`w-5 h-5 border-2 rounded-lg flex items-center justify-center transition-colors ${filteredMasterMaterials.length > 0 && filteredMasterMaterials.every(m => m.isCustom || activeRoomMaterials.find(rm => Number(rm.material_id) === Number(m.id)))
                                            ? 'bg-theme-orange border-theme-orange'
                                            : 'border-gray-300 bg-white'
                                            }`}>
                                            {filteredMasterMaterials.length > 0 && filteredMasterMaterials.every(m => m.isCustom || activeRoomMaterials.find(rm => Number(rm.material_id) === Number(m.id))) &&
                                                <Check className="w-3 h-3 text-white" />
                                            }
                                        </div>
                                        {filteredMasterMaterials.length > 0 && filteredMasterMaterials.every(m => m.isCustom || activeRoomMaterials.find(rm => Number(rm.material_id) === Number(m.id)))
                                            ? 'Unselect All'
                                            : 'Select All'
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Material Grid */}
                        <div className="md:flex-1 h-auto md:overflow-y-auto overflow-visible p-4 bg-gray-50/50">
                            {isLoadingMaterials ? (
                                <div className="flex justify-center p-8"><span className="text-gray-500 animate-pulse">Loading materials...</span></div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredMasterMaterials.map(material => {
                                        const roomMaterial = material.isCustom
                                            ? activeRoomMaterials.find(rm => rm.id === material.originalRoomMaterialId)
                                            : activeRoomMaterials.find(m => Number(m.material_id) === Number(material.id));

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
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Custom Item Modal */}
            {isCustomModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Add Custom Work Item</h3>
                            <button onClick={() => setIsCustomModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddCustomItem} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name</label>
                                <input type="text" required value={customItem.description} onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange/50 focus:border-theme-orange outline-none" placeholder="e.g. Custom Cabinetry" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit</label><input type="text" required value={customItem.unit} onChange={(e) => setCustomItem({ ...customItem, unit: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" placeholder="sqft" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rate (₹)</label><input type="number" required value={customItem.rate} onChange={(e) => setCustomItem({ ...customItem, rate: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" placeholder="0.00" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qty</label><input type="number" required value={customItem.quantity} onChange={(e) => setCustomItem({ ...customItem, quantity: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" /></div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Specification</label>
                                <textarea rows="3" value={customItem.specification} onChange={(e) => setCustomItem({ ...customItem, specification: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl resize-none" placeholder="Details..." />
                            </div>
                            <button type="submit" className="w-full bg-theme-orange text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-200">Add Item</button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Modal (Simpler version) */}
            {isEditModalOpen && editingRoomItem && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Edit Item</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleUpdateRoomItemDetails} className="p-6 space-y-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label><input type="text" required value={editingRoomItem.name} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rate</label><input type="number" required value={editingRoomItem.price} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, price: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qty</label><input type="number" required value={editingRoomItem.quantity} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, quantity: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" /></div>
                            </div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Specification</label><textarea rows="3" value={editingRoomItem.specification || ''} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, specification: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl resize-none" /></div>
                            <button type="submit" className="w-full bg-theme-orange text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-200">Save Changes</button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default WorksheetTab;
