import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URL } from '../config';
import {
    ArrowLeft, ChevronRight, Home, ChevronDown, Package, X
} from 'lucide-react';
import MaterialsCatalog from '../components/materials/MaterialsCatalog';
import RoomCart from '../components/materials/RoomCart';

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
            toast.error("Failed to load data");
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
            toast.error(err.response?.data?.message || 'Failed to add item');
        }
    }, [activeRoomId]);

    const handleUpdateMaterialQuantity = useCallback(async (roomMaterialId, newQuantity) => {
        try {
            const token = localStorage.getItem("token");
            setActiveRoomMaterials(prev => prev.map(m => m.id === roomMaterialId ? { ...m, quantity: newQuantity } : m));
            await axios.put(`${API_URL}/room-materials/${roomMaterialId}`, { quantity: newQuantity }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
            fetchData(false);
            toast.error('Failed to update quantity');
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
            toast.error('Failed to remove item');
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
            toast.error(err.response?.data?.message || 'Failed to add custom item');
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
                            <button onClick={() => navigate(`/quotations/${quotationId}`)} className="btn-primary text-sm px-4 py-2">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <MaterialsCatalog
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        categories={categories}
                        filteredMaterials={filteredMaterials}
                        activeRoomMaterials={activeRoomMaterials}
                        handleAddMaterialToRoom={handleAddMaterialToRoom}
                        handleUpdateMaterialQuantity={handleUpdateMaterialQuantity}
                        handleDeleteMaterialFromRoom={handleDeleteMaterialFromRoom}
                        setEditingRoomItem={setEditingRoomItem}
                        setIsEditModalOpen={setIsEditModalOpen}
                        setIsCustomModalOpen={setIsCustomModalOpen}
                        formatCurrency={formatCurrency}
                    />

                    <RoomCart
                        activeRoom={activeRoom}
                        activeRoomMaterials={activeRoomMaterials}
                        roomSubtotal={roomSubtotal}
                        quotationId={quotationId}
                        navigate={navigate}
                        handleDeleteMaterialFromRoom={handleDeleteMaterialFromRoom}
                        formatCurrency={formatCurrency}
                    />

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