import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URL } from '../config';
import {
    Check, Plus, Minus, X, Edit2, ArrowLeft, Search, Package,
    ChevronRight, Home, Tag, Sparkles, ShoppingBag, Trash2,
    ChevronDown, Layers, IndianRupee, Grid3X3, LayoutList, Filter
} from 'lucide-react';

const RoomMaterials = () => {
    const { quotationId, roomId } = useParams();
    const navigate = useNavigate();

    const [quotation, setQuotation] = useState(null);
    const [allQuotationRooms, setAllQuotationRooms] = useState([]);
    const [allMasterMaterials, setAllMasterMaterials] = useState([]);
    const [activeRoomMaterials, setActiveRoomMaterials] = useState([]);

    const [activeRoomId, setActiveRoomId] = useState(roomId);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [viewMode, setViewMode] = useState('grid');
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRoomItem, setEditingRoomItem] = useState(null);
    const [customItem, setCustomItem] = useState({ description: '', unit: 'nos', rate: '', quantity: 1, specification: '' });
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
            console.error("Error:", err);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [quotationId, activeRoomId, navigate]);

    useEffect(() => {
        fetchData(isInitialMount.current);
        isInitialMount.current = false;
    }, [fetchData]);

    const activeRoom = useMemo(() => allQuotationRooms.find(r => Number(r.id) === Number(activeRoomId)), [allQuotationRooms, activeRoomId]);
    const formatCurrency = useCallback((amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt), []);

    const handleAddMaterialToRoom = useCallback(async (materialId, quantity) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/rooms/${activeRoomId}/materials`, { material_id: materialId, quantity }, { headers: { Authorization: `Bearer ${token}` } });
            setActiveRoomMaterials(prev => [...prev, res.data]);
            toast.success('Added to room');
        } catch (err) {
            toast.error('Already added');
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

    const handleDeleteMaterialFromRoom = useCallback(async (roomMaterialId, name) => {
        try {
            const token = localStorage.getItem("token");
            setActiveRoomMaterials(prev => prev.filter(m => m.id !== roomMaterialId));
            await axios.delete(`${API_URL}/room-materials/${roomMaterialId}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Removed');
        } catch (err) {
            fetchData(false);
        }
    }, [fetchData]);

    const handleAddCustomItem = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_URL}/rooms/${activeRoomId}/materials`, customItem, { headers: { Authorization: `Bearer ${token}` } });
            setActiveRoomMaterials(prev => [...prev, res.data]);
            setIsCustomModalOpen(false);
            setCustomItem({ description: '', unit: 'nos', rate: '', quantity: 1, specification: '' });
            toast.success('Custom item added');
        } catch (err) {
            toast.error('Failed to add');
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
            toast.success('Updated');
        } catch (err) {
            toast.error('Failed to update');
        }
    };

    const filteredMaterials = useMemo(() => {
        return allMasterMaterials.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [allMasterMaterials, searchTerm, selectedCategory]);

    const categories = useMemo(() => ['All', ...new Set(allMasterMaterials.map(m => m.category).filter(Boolean))], [allMasterMaterials]);
    const roomSubtotal = useMemo(() => activeRoomMaterials.reduce((sum, m) => sum + (Number(m.price) * Number(m.quantity)), 0), [activeRoomMaterials]);

    if (isLoading) return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center animate-pulse">
                    <Package className="w-8 h-8 text-white" />
                </div>
                <p className="text-[var(--color-text-muted)]">Loading materials...</p>
            </div>
        </div>
    );

    if (!quotation) return null;

    return (
        <div className="min-h-screen bg-stone-100">
            <Navbar />

            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left - Breadcrumb */}
                        <div className="flex items-center gap-3 min-w-0">
                            <button onClick={() => navigate(`/quotations/${quotationId}`)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                                <ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                            <div className="hidden sm:flex items-center gap-2 text-sm min-w-0">
                                <span className="text-[var(--color-text-muted)] truncate max-w-[120px]">{quotation.title}</span>
                                <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
                                <div className="relative group">
                                    <button className="flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors">
                                        <Home className="w-4 h-4" />
                                        {activeRoom?.name}
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[var(--color-border)] py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                        {allQuotationRooms.map(r => (
                                            <button key={r.id} onClick={() => setActiveRoomId(r.id)} className={`w-full text-left px-4 py-2 text-sm transition-colors ${Number(activeRoomId) === r.id ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium' : 'hover:bg-stone-50'}`}>
                                                {r.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right - Cart Summary */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-stone-50 rounded-xl">
                                <ShoppingBag className="w-5 h-5 text-[var(--color-accent)]" />
                                <div className="text-right">
                                    <p className="text-xs text-[var(--color-text-muted)]">{activeRoomMaterials.length} items</p>
                                    <p className="font-bold text-[var(--color-text-primary)]">{formatCurrency(roomSubtotal)}</p>
                                </div>
                            </div>
                            <button onClick={() => navigate(`/quotations/${quotationId}`)} className="btn-primary text-sm px-4 py-2">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Panel - Materials Catalog */}
                    <div className="lg:col-span-2">
                        {/* Search & Filters Card */}
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 mb-5">
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                    <input
                                        type="text"
                                        placeholder="Search materials..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-stone-50 border-0 rounded-xl text-[var(--color-text-primary)] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-[var(--color-accent)] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                                        <Grid3X3 className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-[var(--color-accent)] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                                        <LayoutList className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                <Filter className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Materials Grid/List */}
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Add Custom Card */}
                                <div onClick={() => setIsCustomModalOpen(true)} className="group bg-white rounded-2xl border-2 border-dashed border-[var(--color-accent)]/30 p-6 flex flex-col items-center justify-center text-center hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-all cursor-pointer min-h-[180px]">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all">
                                        <Plus className="w-6 h-6 text-[var(--color-accent)] group-hover:text-white" />
                                    </div>
                                    <p className="font-semibold text-sm text-[var(--color-text-primary)]">Custom Item</p>
                                    <p className="text-xs text-stone-400 mt-1">Add unlisted item</p>
                                </div>

                                {filteredMaterials.map(material => {
                                    const roomMat = activeRoomMaterials.find(m => Number(m.material_id) === Number(material.id));
                                    const isAdded = !!roomMat;
                                    return (
                                        <div key={material.id} className={`group bg-white rounded-2xl border p-4 transition-all hover:shadow-lg cursor-pointer ${isAdded ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40'}`} onClick={() => !isAdded && handleAddMaterialToRoom(material.id, 1)}>
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="px-2 py-0.5 rounded bg-stone-100 text-[10px] font-medium text-stone-500 uppercase">{material.category || 'General'}</span>
                                                {isAdded && <div className="w-6 h-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div>}
                                            </div>
                                            <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-2 line-clamp-2">{material.name}</h3>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-bold text-[var(--color-text-primary)]">{formatCurrency(material.price)}</span>
                                                <span className="text-xs text-stone-400">/{material.unit}</span>
                                            </div>
                                            {isAdded && (
                                                <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
                                                        <button onClick={() => roomMat.quantity > 1 ? handleUpdateMaterialQuantity(roomMat.id, roomMat.quantity - 1) : handleDeleteMaterialFromRoom(roomMat.id, material.name)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white transition-colors"><Minus className="w-4 h-4" /></button>
                                                        <span className="w-8 text-center font-bold text-sm">{roomMat.quantity}</span>
                                                        <button onClick={() => handleUpdateMaterialQuantity(roomMat.id, roomMat.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"><Plus className="w-4 h-4" /></button>
                                                    </div>
                                                    <button onClick={() => { setEditingRoomItem(roomMat); setIsEditModalOpen(true); }} className="p-1.5 text-stone-400 hover:text-[var(--color-accent)] transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                                <div onClick={() => setIsCustomModalOpen(true)} className="p-4 flex items-center gap-4 hover:bg-stone-50 cursor-pointer transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center"><Plus className="w-6 h-6 text-[var(--color-accent)]" /></div>
                                    <div><p className="font-semibold text-[var(--color-text-primary)]">Add Custom Item</p><p className="text-xs text-stone-400">Create unlisted material</p></div>
                                </div>
                                {filteredMaterials.map(material => {
                                    const roomMat = activeRoomMaterials.find(m => Number(m.material_id) === Number(material.id));
                                    const isAdded = !!roomMat;
                                    return (
                                        <div key={material.id} className={`p-4 flex items-center gap-4 transition-colors cursor-pointer ${isAdded ? 'bg-[var(--color-accent)]/5' : 'hover:bg-stone-50'}`} onClick={() => !isAdded && handleAddMaterialToRoom(material.id, 1)}>
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAdded ? 'bg-[var(--color-accent)] text-white' : 'bg-stone-100 text-stone-400'}`}><Package className="w-6 h-6" /></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2"><p className="font-semibold text-[var(--color-text-primary)] truncate">{material.name}</p><span className="px-2 py-0.5 rounded bg-stone-100 text-[10px] font-medium text-stone-500 uppercase">{material.category}</span></div>
                                                <p className="text-sm text-stone-500">{formatCurrency(material.price)} / {material.unit}</p>
                                            </div>
                                            {isAdded ? (
                                                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
                                                        <button onClick={() => roomMat.quantity > 1 ? handleUpdateMaterialQuantity(roomMat.id, roomMat.quantity - 1) : handleDeleteMaterialFromRoom(roomMat.id, material.name)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white transition-colors"><Minus className="w-4 h-4" /></button>
                                                        <span className="w-8 text-center font-bold text-sm">{roomMat.quantity}</span>
                                                        <button onClick={() => handleUpdateMaterialQuantity(roomMat.id, roomMat.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded bg-[var(--color-accent)] text-white"><Plus className="w-4 h-4" /></button>
                                                    </div>
                                                    <button onClick={() => { setEditingRoomItem(roomMat); setIsEditModalOpen(true); }} className="p-2 text-stone-400 hover:text-[var(--color-accent)]"><Edit2 className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <button className="p-2 text-stone-400"><Plus className="w-5 h-5" /></button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {filteredMaterials.length === 0 && (
                            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center">
                                <Package className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                                <p className="text-stone-500">No materials found</p>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Room Cart */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
                            {/* Cart Header */}
                            <div className="p-5 bg-gradient-to-r from-[var(--color-accent)]/10 to-amber-50 border-b border-[var(--color-border)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-white" /></div>
                                    <div>
                                        <h2 className="font-bold text-[var(--color-text-primary)]">{activeRoom?.name}</h2>
                                        <p className="text-xs text-[var(--color-text-muted)]">{activeRoomMaterials.length} items selected</p>
                                    </div>
                                </div>
                            </div>

                            {/* Cart Items */}
                            <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3">
                                {activeRoomMaterials.length > 0 ? activeRoomMaterials.map(item => (
                                    <div key={item.id} className="group bg-stone-50 rounded-xl p-3 hover:bg-stone-100 transition-colors">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{item.name}</p>
                                                <p className="text-xs text-stone-500 mt-0.5">{item.quantity} × {formatCurrency(item.price)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-[var(--color-text-primary)]">{formatCurrency(item.price * item.quantity)}</p>
                                                <button onClick={() => handleDeleteMaterialFromRoom(item.id, item.name)} className="text-xs text-rose-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8">
                                        <Package className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                                        <p className="text-sm text-stone-400">No items added</p>
                                        <p className="text-xs text-stone-400">Click materials to add them</p>
                                    </div>
                                )}
                            </div>

                            {/* Cart Footer */}
                            <div className="p-5 border-t border-[var(--color-border)] bg-stone-50">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-[var(--color-text-muted)]">Room Subtotal</span>
                                    <span className="text-2xl font-bold text-[var(--color-accent)]">{formatCurrency(roomSubtotal)}</span>
                                </div>
                                <button onClick={() => navigate(`/quotations/${quotationId}`)} className="w-full btn-primary flex items-center justify-center gap-2">
                                    Save & Continue <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] p-4 lg:hidden z-40">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[var(--color-text-muted)]">{activeRoomMaterials.length} items</p>
                        <p className="font-bold text-lg text-[var(--color-text-primary)]">{formatCurrency(roomSubtotal)}</p>
                    </div>
                    <button onClick={() => navigate(`/quotations/${quotationId}`)} className="btn-primary px-6">Done</button>
                </div>
            </div>

            {/* Custom Item Modal */}
            {isCustomModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center">
                            <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Add Custom Item</h3>
                            <button onClick={() => setIsCustomModalOpen(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5 text-stone-400" /></button>
                        </div>
                        <form onSubmit={handleAddCustomItem} className="p-6 space-y-4">
                            <input type="text" required value={customItem.description} onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })} className="input" placeholder="Item name *" />
                            <div className="grid grid-cols-3 gap-3">
                                <input type="text" required value={customItem.unit} onChange={(e) => setCustomItem({ ...customItem, unit: e.target.value })} className="input" placeholder="Unit" />
                                <input type="number" required value={customItem.rate} onChange={(e) => setCustomItem({ ...customItem, rate: e.target.value })} className="input" placeholder="Rate ₹" />
                                <input type="number" required value={customItem.quantity} onChange={(e) => setCustomItem({ ...customItem, quantity: e.target.value })} className="input" placeholder="Qty" />
                            </div>
                            <textarea rows="2" value={customItem.specification} onChange={(e) => setCustomItem({ ...customItem, specification: e.target.value })} className="input resize-none" placeholder="Specification (optional)" />
                            <button type="submit" className="w-full btn-primary">Add Item</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingRoomItem && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center">
                            <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Edit Item</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5 text-stone-400" /></button>
                        </div>
                        <form onSubmit={handleUpdateRoomItemDetails} className="p-6 space-y-4">
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