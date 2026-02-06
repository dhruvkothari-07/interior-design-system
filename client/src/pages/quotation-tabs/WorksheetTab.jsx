import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Minus, Check, X, Edit2, Trash2, ChevronDown, Filter } from 'lucide-react';
import { API_URL } from '../../config';
import { handleApiError } from '../../utils/errorHandler.jsx';

// --- Sub-components (Material Card for Grid) ---
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
    const price = roomMaterial?.price || material.price;
    const lineTotal = price * quantity;

    const [localQty, setLocalQty] = useState(quantity > 0 ? Number(quantity) : '');
    const inputRef = useRef(null);

    useEffect(() => {
        if (document.activeElement === inputRef.current) return;
        if (quantity > 0 && Number(localQty) !== Number(quantity)) {
            setLocalQty(Number(quantity));
        }
    }, [quantity]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const numVal = parseInt(localQty, 10);
            if (!isNaN(numVal) && numVal > 0 && numVal !== quantity && roomMaterialId) {
                onUpdateQuantity(roomMaterialId, numVal);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localQty, quantity, roomMaterialId, onUpdateQuantity]);

    return (
        <div className={`group p-4 rounded-xl border transition-all duration-200 bg-white
            ${isAdded
                ? 'border-[var(--color-accent)]/40 shadow-sm'
                : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
            }
        `}>
            {/* Header: Name + Check */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-stone-800 leading-tight line-clamp-2 flex-1">
                    {material.name}
                </h4>
                {isAdded && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </span>
                )}
            </div>

            {/* Price */}
            <div className="mb-3">
                <span className="text-base font-bold text-[var(--color-accent)]">{formatCurrency(price)}</span>
                <span className="text-xs text-stone-400"> / {material.unit}</span>
            </div>

            {/* Quantity & Total */}
            {isAdded ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                if (quantity > 1) {
                                    setLocalQty(Number(quantity) - 1);
                                    onUpdateQuantity(roomMaterialId, Number(quantity) - 1);
                                } else {
                                    onDelete(roomMaterialId, material.name, true);
                                }
                            }}
                            className="w-6 h-6 flex items-center justify-center text-stone-500 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <input
                            type="number"
                            ref={inputRef}
                            value={localQty}
                            onChange={(e) => setLocalQty(e.target.value)}
                            onBlur={() => { if (localQty === '' || Number(localQty) <= 0) setLocalQty(Number(quantity)); }}
                            className="w-8 h-6 text-center font-medium text-sm text-stone-800 focus:outline-none border border-stone-200 rounded bg-stone-50"
                        />
                        <button
                            onClick={() => {
                                setLocalQty(Number(quantity) + 1);
                                onUpdateQuantity(roomMaterialId, Number(quantity) + 1);
                            }}
                            className="w-6 h-6 flex items-center justify-center text-stone-500 hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] rounded transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                    <span className="text-sm font-bold text-[var(--color-accent)]">{formatCurrency(lineTotal)}</span>
                </div>
            ) : (
                <button
                    onClick={() => onAdd(material.id, 1)}
                    className="w-full py-2 bg-stone-100 text-stone-600 font-medium text-sm rounded-lg hover:bg-[var(--color-accent)] hover:text-white transition-all"
                >
                    + Add
                </button>
            )}
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
    const [showFilters, setShowFilters] = useState(false);

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
            handleApiError(err, 'Failed to add material');
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
        if (!skipConfirm) {
            const confirmed = await new Promise((resolve) => {
                toast((t) => (
                    <div className="flex flex-col gap-3">
                        <p className="font-medium">Remove "{materialName}"?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { toast.dismiss(t.id); resolve(false); }}
                                className="px-3 py-1.5 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { toast.dismiss(t.id); resolve(true); }}
                                className="px-3 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ), { duration: 10000 });
            });
            if (!confirmed) return;
        }
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
            handleApiError(err, 'Failed to add custom item');
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
            handleApiError(err, 'Failed to update item details');
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


    const groupedMaterials = useMemo(() => {
        // Group filtered materials by category
        if (filteredMasterMaterials.length === 0) return {};

        const groups = {};
        filteredMasterMaterials.forEach(item => {
            const cat = item.category || 'Others';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        // Sort keys if needed?
        return groups;
    }, [filteredMasterMaterials]);


    return (
        <div className="flex flex-col md:flex-row md:h-[calc(100vh-180px)] h-auto bg-white rounded-2xl shadow-sm border border-slate-200 md:overflow-hidden overflow-visible animate-fade-in-up">
            {/* Left Sidebar: Room List (Desktop Only) - Airy Design */}
            <aside className="w-full md:w-[320px] hidden md:flex flex-none bg-white border-r border-slate-100 flex-col md:h-full md:max-h-full overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-stone-800 text-lg">Rooms</h3>
                        <button
                            onClick={onAddRoomClick}
                            className="p-2.5 bg-[var(--color-accent)] text-white rounded-xl transition-all shadow-sm"
                            title="Add Room"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-4 bg-[var(--color-accent)]/5 rounded-xl border border-[var(--color-accent)]/10">
                        <p className="text-xs text-stone-500 uppercase tracking-wide font-semibold mb-1">Total Project Value</p>
                        <p className="text-2xl font-bold text-stone-800">{formatCurrency(rooms.reduce((acc, r) => acc + (Number(r.room_total) || 0), 0))}</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {rooms.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                <Plus className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-base font-medium text-slate-600 mb-2">No rooms yet</p>
                            <button onClick={onAddRoomClick} className="text-sm text-[var(--color-accent)] hover:underline font-bold">Create your first room</button>
                        </div>
                    )}
                    {rooms.map(room => (
                        <div
                            key={room.id}
                            onClick={() => setActiveRoomId(room.id)}
                            className={`group w-full text-left p-4 rounded-xl transition-all cursor-pointer relative ${activeRoomId === room.id
                                ? 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30'
                                : 'hover:bg-stone-50 text-stone-700 border border-transparent'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className={`font-semibold text-base ${activeRoomId === room.id ? 'text-[var(--color-accent)]' : 'text-stone-700'}`}>{room.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-stone-400">{room.dimensions || 'No dimensions'}</span>
                                <span className={`text-base font-semibold ${activeRoomId === room.id ? 'text-[var(--color-accent)]' : 'text-stone-600'}`}>{formatCurrency(room.room_total || 0)}</span>
                            </div>

                            {/* Hover Actions */}
                            {activeRoomId !== room.id && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                                    <button onClick={(e) => { e.stopPropagation(); onEditRoom(room); }} className="p-2 hover:bg-white text-slate-400 hover:text-blue-600 rounded-lg transition-colors shadow-sm bg-white/80"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteRoom(room); }} className="p-2 hover:bg-white text-slate-400 hover:text-red-600 rounded-lg transition-colors shadow-sm bg-white/80"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Area: Materials */}
            <main className="flex-1 flex flex-col min-w-0 bg-white md:h-full h-auto relative">
                {!activeRoomId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/30">
                        <p className="text-slate-500 max-w-xs">Select a room from the sidebar to start adding materials and building your quotation.</p>
                    </div>
                ) : (
                    <>
                        {/* Clean Header */}
                        <div className="px-8 py-6 border-b border-slate-100 bg-white">
                            <div className="max-w-5xl mx-auto">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-900 mb-1">{activeRoom?.name}</h2>
                                        <p className="text-slate-500">{activeRoomMaterials.length} items added to this room</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold mb-1">Room Total</p>
                                        <p className="text-3xl font-bold text-[var(--color-accent)]">{formatCurrency(activeRoom?.room_total || 0)}</p>
                                    </div>
                                </div>

                                {/* Simple Search Bar */}
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Search materials..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border-0 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-400"
                                        />
                                        {searchTerm && (
                                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`px-5 py-3.5 rounded-xl flex items-center gap-2 transition-all font-medium ${showFilters
                                            ? 'bg-[var(--color-accent)] text-white'
                                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                            }`}
                                    >
                                        <Filter className="w-4 h-4" />
                                        Filters
                                    </button>

                                    <button
                                        onClick={() => setIsCustomModalOpen(true)}
                                        className="px-5 py-3.5 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:opacity-90 transition shadow-md shadow-[var(--color-accent)]/20 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Custom Item
                                    </button>
                                </div>

                                {/* Category Filters (Collapsible) */}
                                {showFilters && (
                                    <div className="mt-6 p-5 bg-slate-50 rounded-2xl animate-fade-in">
                                        <div className="flex flex-wrap gap-3">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={`px-4 py-2.5 rounded-xl font-medium transition-all ${selectedCategory === cat
                                                        ? 'bg-[var(--color-accent)] text-white'
                                                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card Grid Layout */}
                        <div className="md:flex-1 h-auto md:overflow-y-auto overflow-visible p-5 bg-stone-50/50">
                            {isLoadingMaterials ? (
                                <div className="grid place-items-center h-full py-16"><span className="animate-pulse text-stone-400 font-medium">Loading materials...</span></div>
                            ) : (
                                <div className="space-y-6 pb-8">
                                    {Object.keys(groupedMaterials).map(category => (
                                        <section key={category} className="animate-fade-in-up">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
                                                <h4 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">{category}</h4>
                                                <span className="text-xs text-stone-400">({groupedMaterials[category].length})</span>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {groupedMaterials[category].map(material => {
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
                                                            onEdit={(item) => { setEditingRoomItem(item); setIsEditModalOpen(true); }}
                                                            formatCurrency={formatCurrency}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    ))}
                                    {filteredMasterMaterials.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 text-stone-400">
                                            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                                                <Filter className="w-6 h-6 text-stone-300" />
                                            </div>
                                            <p className="font-medium">No materials found</p>
                                            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Custom Item Modal */}
            {isCustomModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden scale-100 animate-scale-in">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-lg">Add Custom Item</h3>
                            <button onClick={() => setIsCustomModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleAddCustomItem} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Item Name</label>
                                <input type="text" required value={customItem.description} onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] outline-none transition-all font-medium" placeholder="e.g. Custom Cabinetry" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unit</label><input type="text" required value={customItem.unit} onChange={(e) => setCustomItem({ ...customItem, unit: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] outline-none transition-all" placeholder="sqft" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rate (₹)</label><input type="number" required value={customItem.rate} onChange={(e) => setCustomItem({ ...customItem, rate: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] outline-none transition-all" placeholder="0.00" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Qty</label><input type="number" required value={customItem.quantity} onChange={(e) => setCustomItem({ ...customItem, quantity: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] outline-none transition-all" /></div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Specification</label>
                                <textarea rows="3" value={customItem.specification} onChange={(e) => setCustomItem({ ...customItem, specification: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] outline-none transition-all resize-none" placeholder="Details..." />
                            </div>
                            <button type="submit" className="w-full bg-[var(--color-accent)] text-white py-3 rounded-xl font-bold hover:bg-[var(--color-accent-dark)] shadow-md shadow-[var(--color-accent)]/20 transition-all transform active:scale-95">Add Custom Item</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingRoomItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden scale-100 animate-scale-in">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-lg">Edit Item Details</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleUpdateRoomItemDetails} className="p-6 space-y-5">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name</label><input type="text" required value={editingRoomItem.name} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl transition-all outline-none focus:border-[var(--color-accent)]" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rate</label><input type="number" required value={editingRoomItem.price} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, price: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl transition-all outline-none focus:border-[var(--color-accent)]" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Qty</label><input type="number" required value={editingRoomItem.quantity} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, quantity: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl transition-all outline-none focus:border-[var(--color-accent)]" /></div>
                            </div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Specification</label><textarea rows="3" value={editingRoomItem.specification || ''} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, specification: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl transition-all outline-none focus:border-[var(--color-accent)] resize-none" /></div>
                            <button type="submit" className="w-full bg-[var(--color-accent)] text-white py-3 rounded-xl font-bold hover:bg-[var(--color-accent-dark)] shadow-md shadow-[var(--color-accent)]/20 transition-all transform active:scale-95">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

};

export default WorksheetTab;
