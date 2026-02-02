import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URL } from '../config';
import {
    Check,
    Plus,
    Minus,
    X,
    Edit2,
    ArrowLeft,
    Search,
    Package,
    IndianRupee,
    ChevronRight,
    Home,
    Layers,
    Tag,
    Sparkles,
    ShoppingCart,
    Trash2,
    Grid3X3,
    List,
    ChevronDown,
    ExternalLink,
    Package2,
    Boxes
} from 'lucide-react';

// Compact Material Card for grid view
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
        <div
            className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${isAdded ? 'ring-2 ring-[var(--color-accent)] shadow-lg' : 'border border-[var(--color-border)] hover:border-[var(--color-accent)]/40'
                }`}
            onClick={() => !isAdded && onAdd(material.id, 1)}
        >
            {/* Category Tag */}
            <div className="absolute top-3 left-3 z-10">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm ${isAdded
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-white/90 text-stone-600'
                    }`}>
                    {material.category || 'General'}
                </span>
            </div>

            {/* Added indicator */}
            {isAdded && (
                <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center shadow-lg">
                    <Check className="w-3.5 h-3.5 text-white" />
                </div>
            )}

            {/* Visual placeholder */}
            <div className={`h-28 flex items-center justify-center transition-colors ${isAdded
                    ? 'bg-gradient-to-br from-[var(--color-accent)]/10 to-amber-50'
                    : 'bg-gradient-to-br from-stone-50 to-stone-100'
                }`}>
                <Package2 className={`w-10 h-10 ${isAdded ? 'text-[var(--color-accent)]' : 'text-stone-300'}`} />
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-[var(--color-text-primary)] text-sm leading-tight mb-1 line-clamp-2">
                    {material.name}
                </h3>

                <div className="flex items-baseline justify-between mt-2">
                    <div>
                        <span className="text-lg font-bold text-[var(--color-text-primary)]">
                            {formatCurrency(roomMaterial?.price || material.price)}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)] ml-1">
                            /{material.unit}
                        </span>
                    </div>
                </div>

                {/* Quantity controls when added */}
                {isAdded && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border)]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center bg-stone-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => {
                                        if (quantity > 1) {
                                            setLocalQty(Number(quantity) - 1);
                                            onUpdateQuantity(roomMaterialId, Number(quantity) - 1);
                                        } else {
                                            onDelete(roomMaterialId, material.name, true);
                                        }
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white text-stone-600 transition-colors"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                    type="number"
                                    ref={inputRef}
                                    value={localQty}
                                    onChange={(e) => setLocalQty(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-10 h-7 text-center bg-transparent font-bold text-sm text-[var(--color-text-primary)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    onClick={() => {
                                        setLocalQty(Number(quantity) + 1);
                                        onUpdateQuantity(roomMaterialId, Number(quantity) + 1);
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <button
                                onClick={() => onEdit(roomMaterial)}
                                className="p-1.5 text-stone-400 hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-lg transition-colors"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

const RoomMaterials = () => {
    const { quotationId, roomId } = useParams();
    const navigate = useNavigate();

    const [quotation, setQuotation] = useState(null);
    const [allQuotationRooms, setAllQuotationRooms] = useState([]);
    const [allMasterMaterials, setAllMasterMaterials] = useState([]);
    const [activeRoomMaterials, setActiveRoomMaterials] = useState([]);

    const [activeRoomId, setActiveRoomId] = useState(roomId);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isCartOpen, setIsCartOpen] = useState(true);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRoomItem, setEditingRoomItem] = useState(null);
    const [customItem, setCustomItem] = useState({
        description: '', unit: 'nos', rate: '', quantity: 1, specification: '', saveToCatalog: false
    });
    const isInitialMount = useRef(true);

    const fetchData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) { navigate('/signin'); return; }

            const [quotationRes, allRoomsRes, allMaterialsRes, activeRoomMaterialsRes] = await Promise.all([
                axios.get(`${API_URL}/quotations/${quotationId}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/quotations/${quotationId}/rooms`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/materials`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/rooms/${activeRoomId}/materials`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setQuotation(quotationRes.data);
            setAllQuotationRooms(allRoomsRes.data);
            setAllMasterMaterials(allMaterialsRes.data);
            setActiveRoomMaterials(activeRoomMaterialsRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data.");
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [quotationId, activeRoomId, navigate]);

    useEffect(() => {
        fetchData(isInitialMount.current);
        isInitialMount.current = false;
    }, [fetchData]);

    const activeRoom = useMemo(() => allQuotationRooms.find(r => Number(r.id) === Number(activeRoomId)), [allQuotationRooms, activeRoomId]);

    const formatCurrency = useCallback((amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount), []);

    const handleRoomSelect = useCallback((selectedRoomId) => setActiveRoomId(selectedRoomId), []);

    const handleAddCustomItem = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/rooms/${activeRoomId}/materials`, customItem, { headers: { Authorization: `Bearer ${token}` } });
            setActiveRoomMaterials(prev => [...prev, res.data]);
            setIsCustomModalOpen(false);
            setCustomItem({ description: '', unit: 'nos', rate: '', quantity: 1, specification: '', saveToCatalog: false });
            toast.success('Custom item added!');
        } catch (err) {
            toast.error('Failed to add item');
        }
    };

    const handleUpdateRoomItemDetails = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.put(`${API_URL}/room-materials/${editingRoomItem.id}`,
                { description: editingRoomItem.name, specification: editingRoomItem.specification, rate: editingRoomItem.price, quantity: editingRoomItem.quantity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setActiveRoomMaterials(prev => prev.map(m => m.id === editingRoomItem.id ? res.data : m));
            setIsEditModalOpen(false);
            toast.success('Item updated!');
        } catch (err) {
            toast.error('Failed to update');
        }
    };

    const handleAddMaterialToRoom = useCallback(async (materialId, quantity) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/rooms/${activeRoomId}/materials`, { material_id: materialId, quantity }, { headers: { Authorization: `Bearer ${token}` } });
            setActiveRoomMaterials(prev => [...prev, res.data]);
            toast.success('Added!');
        } catch (err) {
            toast.error('Already in room');
        }
    }, [activeRoomId]);

    const handleUpdateMaterialQuantity = useCallback(async (roomMaterialId, newQuantity) => {
        try {
            const token = localStorage.getItem("token");
            setActiveRoomMaterials(prev => prev.map(m => m.id === roomMaterialId ? { ...m, quantity: newQuantity } : m));
            await axios.put(`${API_URL}/room-materials/${roomMaterialId}`, { quantity: newQuantity }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
            fetchData(false);
        }
    }, [fetchData]);

    const handleDeleteMaterialFromRoom = useCallback(async (roomMaterialId, materialName, skipConfirm = false) => {
        const doDelete = async () => {
            try {
                const token = localStorage.getItem("token");
                setActiveRoomMaterials(prev => prev.filter(mat => mat.id !== roomMaterialId));
                await axios.delete(`${API_URL}/room-materials/${roomMaterialId}`, { headers: { Authorization: `Bearer ${token}` } });
            } catch (err) {
                fetchData(false);
            }
        };
        if (skipConfirm) { doDelete(); }
        else {
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <p className="font-medium text-sm">Remove "{materialName}"?</p>
                    <div className="flex gap-2">
                        <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 text-xs bg-stone-100 rounded-lg">Cancel</button>
                        <button onClick={() => { toast.dismiss(t.id); doDelete(); toast.success('Removed'); }} className="px-3 py-1 text-xs bg-rose-500 text-white rounded-lg">Remove</button>
                    </div>
                </div>
            ), { duration: 8000 });
        }
    }, [fetchData]);

    const filteredMasterMaterials = useMemo(() => {
        return allMasterMaterials.filter(material => {
            const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || material.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [allMasterMaterials, searchTerm, selectedCategory]);

    const categories = useMemo(() => ['All', ...new Set(allMasterMaterials.map(m => m.category).filter(Boolean))], [allMasterMaterials]);
    const activeRoomSubtotal = useMemo(() => activeRoomMaterials.reduce((sum, m) => sum + (Number(m.price) * Number(m.quantity)), 0), [activeRoomMaterials]);

    if (isLoading) return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center animate-pulse">
                    <Package className="w-7 h-7 text-white" />
                </div>
                <p className="text-[var(--color-text-muted)]">Loading materials...</p>
            </div>
        </div>
    );

    if (error || !quotation) return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
            <p className="text-rose-500">{error || 'Quotation not found'}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--color-border)]">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/quotations/${quotationId}`)}
                                className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                            <ChevronRight className="w-4 h-4 text-stone-300" />
                            <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[150px]">{quotation.title}</span>
                            <ChevronRight className="w-4 h-4 text-stone-300" />

                            {/* Room Dropdown */}
                            <div className="relative group">
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-lg font-medium text-sm">
                                    <Home className="w-3.5 h-3.5" />
                                    {activeRoom?.name}
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-[var(--color-border)] py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                    {allQuotationRooms.map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => handleRoomSelect(r.id)}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${parseInt(activeRoomId) === r.id
                                                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium'
                                                    : 'text-[var(--color-text-secondary)] hover:bg-stone-50'
                                                }`}
                                        >
                                            {r.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Cart Toggle */}
                        <button
                            onClick={() => setIsCartOpen(!isCartOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="hidden sm:inline">Cart</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs">
                                {activeRoomMaterials.length}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Main Content Area */}
                <main className={`flex-1 transition-all duration-300 ${isCartOpen ? 'lg:mr-80' : ''}`}>
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                                Select Materials
                            </h1>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Click on items to add them to {activeRoom?.name}
                            </p>
                        </div>

                        {/* Search & Filters */}
                        <div className="mb-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search materials..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat
                                                ? 'bg-[var(--color-accent)] text-white'
                                                : 'bg-white text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Materials Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {/* Add Custom Card */}
                            <div
                                onClick={() => setIsCustomModalOpen(true)}
                                className="bg-gradient-to-br from-[var(--color-accent)]/5 to-amber-50 rounded-2xl border-2 border-dashed border-[var(--color-accent)]/30 p-6 flex flex-col items-center justify-center text-center hover:border-[var(--color-accent)] hover:shadow-lg transition-all cursor-pointer min-h-[200px]"
                            >
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm">
                                    <Plus className="w-6 h-6 text-[var(--color-accent)]" />
                                </div>
                                <p className="font-semibold text-sm text-[var(--color-text-primary)]">Add Custom</p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">Create new item</p>
                            </div>

                            {/* Material Cards */}
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
                                        onEdit={(item) => { setEditingRoomItem(item); setIsEditModalOpen(true); }}
                                        formatCurrency={formatCurrency}
                                    />
                                );
                            })}
                        </div>

                        {filteredMasterMaterials.length === 0 && (
                            <div className="text-center py-16">
                                <Boxes className="w-16 h-16 mx-auto text-stone-200 mb-4" />
                                <p className="text-[var(--color-text-muted)]">No materials found</p>
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Sidebar Cart */}
                <aside className={`fixed right-0 top-14 bottom-0 w-80 bg-white border-l border-[var(--color-border)] transform transition-transform duration-300 z-20 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'
                    } hidden lg:block`}>
                    <div className="flex flex-col h-full">
                        {/* Cart Header */}
                        <div className="p-4 border-b border-[var(--color-border)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                                        <ShoppingCart className="w-4 h-4 text-[var(--color-accent)]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">{activeRoom?.name}</h3>
                                        <p className="text-xs text-[var(--color-text-muted)]">{activeRoomMaterials.length} items</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-stone-100 rounded-lg">
                                    <X className="w-4 h-4 text-stone-400" />
                                </button>
                            </div>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {activeRoomMaterials.length > 0 ? (
                                activeRoomMaterials.map(material => (
                                    <div key={material.id} className="bg-stone-50 rounded-xl p-3 group hover:bg-stone-100 transition-colors">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{material.name}</p>
                                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                                    {material.quantity} × {formatCurrency(material.price)}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-sm text-[var(--color-text-primary)]">
                                                    {formatCurrency(Number(material.price) * Number(material.quantity))}
                                                </p>
                                                <button
                                                    onClick={() => handleDeleteMaterialFromRoom(material.id, material.name, true)}
                                                    className="text-xs text-rose-500 hover:underline mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <Package className="w-10 h-10 mx-auto text-stone-200 mb-3" />
                                    <p className="text-sm text-[var(--color-text-muted)]">No items yet</p>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Click materials to add</p>
                                </div>
                            )}
                        </div>

                        {/* Cart Footer - Total */}
                        <div className="p-4 border-t border-[var(--color-border)] bg-gradient-to-r from-[var(--color-accent)]/5 to-amber-50">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm text-[var(--color-text-muted)]">Subtotal</span>
                                <span className="text-xl font-bold text-[var(--color-accent)]">{formatCurrency(activeRoomSubtotal)}</span>
                            </div>
                            <button
                                onClick={() => navigate(`/quotations/${quotationId}`)}
                                className="w-full py-2.5 bg-[var(--color-accent)] text-white rounded-xl font-medium text-sm hover:bg-[var(--color-accent-hover)] transition-colors flex items-center justify-center gap-2"
                            >
                                Done
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Mobile Cart Button */}
            <div className="fixed bottom-4 left-4 right-4 lg:hidden z-40">
                <button
                    onClick={() => navigate(`/quotations/${quotationId}`)}
                    className="w-full py-3 bg-[var(--color-accent)] text-white rounded-2xl font-medium shadow-xl flex items-center justify-center gap-3"
                >
                    <span>{activeRoomMaterials.length} items</span>
                    <span className="w-px h-4 bg-white/30" />
                    <span className="font-bold">{formatCurrency(activeRoomSubtotal)}</span>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Custom Item Modal */}
            {isCustomModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="px-5 py-4 border-b border-[var(--color-border)] flex justify-between items-center">
                            <h3 className="font-bold text-[var(--color-text-primary)]">Add Custom Item</h3>
                            <button onClick={() => setIsCustomModalOpen(false)} className="p-1 hover:bg-stone-100 rounded-lg">
                                <X className="w-5 h-5 text-stone-400" />
                            </button>
                        </div>
                        <form onSubmit={handleAddCustomItem} className="p-5 space-y-4">
                            <input type="text" required value={customItem.description} onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })} className="input" placeholder="Item name" />
                            <div className="grid grid-cols-3 gap-3">
                                <input type="text" required value={customItem.unit} onChange={(e) => setCustomItem({ ...customItem, unit: e.target.value })} className="input" placeholder="Unit" />
                                <input type="number" required value={customItem.rate} onChange={(e) => setCustomItem({ ...customItem, rate: e.target.value })} className="input" placeholder="Rate" />
                                <input type="number" required value={customItem.quantity} onChange={(e) => setCustomItem({ ...customItem, quantity: e.target.value })} className="input" placeholder="Qty" />
                            </div>
                            <textarea rows="2" value={customItem.specification} onChange={(e) => setCustomItem({ ...customItem, specification: e.target.value })} className="input resize-none" placeholder="Specification (optional)" />
                            <button type="submit" className="w-full btn-primary">Add Item</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {isEditModalOpen && editingRoomItem && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="px-5 py-4 border-b border-[var(--color-border)] flex justify-between items-center">
                            <h3 className="font-bold text-[var(--color-text-primary)]">Edit Item</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-stone-100 rounded-lg">
                                <X className="w-5 h-5 text-stone-400" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateRoomItemDetails} className="p-5 space-y-4">
                            <input type="text" required value={editingRoomItem.name} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, name: e.target.value })} className="input" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" required value={editingRoomItem.price} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, price: e.target.value })} className="input" placeholder="Rate" />
                                <input type="number" required value={editingRoomItem.quantity} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, quantity: e.target.value })} className="input" placeholder="Qty" />
                            </div>
                            <textarea rows="2" value={editingRoomItem.specification || ''} onChange={(e) => setEditingRoomItem({ ...editingRoomItem, specification: e.target.value })} className="input resize-none" placeholder="Specification" />
                            <button type="submit" className="w-full btn-primary">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomMaterials;