import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URL } from '../config';
import {
    ArrowLeft,
    Search,
    Plus,
    Minus,
    Trash2,
    Edit3,
    Package,
    X,
    Check,
    Filter,
    ChevronDown,
    ChevronRight,
    Grid3X3,
    List,
    ShoppingBag,
    Layers,
    Home,
    Palette
} from 'lucide-react';

const RoomMaterials = () => {
    const { quotationId, roomId } = useParams();
    const navigate = useNavigate();

    // Data States
    const [quotation, setQuotation] = useState(null);
    const [room, setRoom] = useState(null);
    const [catalogItems, setCatalogItems] = useState([]);
    const [roomMaterials, setRoomMaterials] = useState([]);

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [isMoodboardOpen, setIsMoodboardOpen] = useState(true);

    // Modal States
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [customForm, setCustomForm] = useState({
        description: '',
        unit: 'nos',
        rate: '',
        quantity: 1,
        specification: '',
        saveToCatalog: false
    });

    const isInitialMount = useRef(true);

    // --- Data Fetching ---
    const fetchData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) { navigate('/signin'); return; }

            const headers = { Authorization: `Bearer ${token}` };
            const [quotationRes, roomsRes, materialsRes, roomItemsRes] = await Promise.all([
                axios.get(`${API_URL}/quotations/${quotationId}`, { headers }),
                axios.get(`${API_URL}/quotations/${quotationId}/rooms`, { headers }),
                axios.get(`${API_URL}/materials`, { headers }),
                axios.get(`${API_URL}/rooms/${roomId}/materials`, { headers })
            ]);

            setQuotation(quotationRes.data);
            setRoom(roomsRes.data.find(r => Number(r.id) === Number(roomId)));
            setCatalogItems(materialsRes.data);
            setRoomMaterials(roomItemsRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load data");
            if (err.response?.status === 404) navigate(`/quotations/${quotationId}`);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [quotationId, roomId, navigate]);

    useEffect(() => {
        fetchData(isInitialMount.current);
        isInitialMount.current = false;
    }, [fetchData]);

    // --- Computed Values ---
    const categories = useMemo(() => {
        const cats = new Set(catalogItems.map(item => item.category).filter(Boolean));
        return ['All', ...Array.from(cats).sort()];
    }, [catalogItems]);

    const filteredCatalog = useMemo(() => {
        return catalogItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [catalogItems, searchTerm, selectedCategory]);

    const roomTotal = useMemo(() => {
        return roomMaterials.reduce((sum, m) => sum + (Number(m.price) * Number(m.quantity)), 0);
    }, [roomMaterials]);

    const formatCurrency = useCallback((amt) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amt || 0);
    }, []);

    // --- Handlers ---
    const handleAddToRoom = useCallback(async (materialId) => {
        const token = localStorage.getItem("token");
        try {
            const res = await axios.post(
                `${API_URL}/rooms/${roomId}/materials`,
                { material_id: materialId, quantity: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRoomMaterials(prev => [...prev, res.data]);
            toast.success('Added to room!');
        } catch (err) {
            if (err.response?.status === 409) {
                toast.error('Already in this room');
            } else {
                toast.error('Failed to add');
            }
        }
    }, [roomId]);

    const handleUpdateQuantity = useCallback(async (itemId, newQty) => {
        if (newQty < 1) return;
        const token = localStorage.getItem("token");
        try {
            setRoomMaterials(prev => prev.map(m =>
                m.id === itemId ? { ...m, quantity: newQty } : m
            ));
            await axios.put(
                `${API_URL}/room-materials/${itemId}`,
                { quantity: newQty },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            fetchData(false);
            toast.error('Failed to update');
        }
    }, [fetchData]);

    const handleRemoveFromRoom = useCallback(async (itemId) => {
        const token = localStorage.getItem("token");
        try {
            setRoomMaterials(prev => prev.filter(m => m.id !== itemId));
            await axios.delete(
                `${API_URL}/room-materials/${itemId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Removed');
        } catch (err) {
            fetchData(false);
            toast.error('Failed to remove');
        }
    }, [fetchData]);

    const handleAddCustom = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        try {
            const res = await axios.post(
                `${API_URL}/rooms/${roomId}/materials`,
                {
                    description: customForm.description,
                    unit: customForm.unit,
                    rate: Number(customForm.rate),
                    quantity: Number(customForm.quantity),
                    specification: customForm.specification,
                    saveToCatalog: customForm.saveToCatalog
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRoomMaterials(prev => [...prev, res.data]);
            setIsCustomModalOpen(false);
            setCustomForm({ description: '', unit: 'nos', rate: '', quantity: 1, specification: '', saveToCatalog: false });
            toast.success('Custom item added!');
        } catch (err) {
            toast.error('Failed to add custom item');
        }
    };

    const handleEditItem = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        try {
            await axios.put(
                `${API_URL}/room-materials/${editingItem.id}`,
                {
                    quantity: Number(editingItem.quantity),
                    rate: Number(editingItem.price),
                    description: editingItem.name,
                    specification: editingItem.specification
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRoomMaterials(prev => prev.map(m => m.id === editingItem.id ? editingItem : m));
            setIsEditModalOpen(false);
            setEditingItem(null);
            toast.success('Updated!');
        } catch (err) {
            toast.error('Failed to update');
        }
    };

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center animate-pulse">
                        <Package className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-[var(--color-text-muted)]">Loading materials...</p>
                </div>
            </div>
        );
    }

    if (!quotation || !room) return null;

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            {/* Header Bar */}
            <header className="sticky top-0 z-40 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Back + Title */}
                        <div className="flex items-center gap-4 min-w-0">
                            <button
                                onClick={() => navigate(`/quotations/${quotationId}`)}
                                className="p-2 hover:bg-[var(--color-bg-subtle)] rounded-xl transition-colors flex-shrink-0"
                            >
                                <ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center shadow-md flex-shrink-0">
                                    <Home className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-[var(--color-text-muted)] truncate">{quotation.title}</p>
                                    <h1 className="text-lg font-bold text-[var(--color-text-primary)] truncate">{room.name}</h1>
                                </div>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">
                            {/* Mobile Moodboard Toggle */}
                            <button
                                onClick={() => setIsMoodboardOpen(!isMoodboardOpen)}
                                className="lg:hidden relative p-2 hover:bg-[var(--color-bg-subtle)] rounded-xl transition-colors"
                            >
                                <ShoppingBag className="w-5 h-5 text-[var(--color-text-muted)]" />
                                {roomMaterials.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-accent)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {roomMaterials.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => navigate(`/quotations/${quotationId}`)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                <span className="hidden sm:inline">Done</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content: Split Panel */}
            <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex gap-4">
                    {/* Left Panel: Catalog */}
                    <div className="flex-1 min-w-0">
                        {/* Search & Filters */}
                        <div className="card p-3 mb-4 animate-fade-in">
                            <div className="flex flex-col lg:flex-row gap-3">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                                    <input
                                        type="text"
                                        placeholder="Search materials..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input pl-12"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`btn-secondary flex items-center gap-2 ${showFilters ? 'ring-2 ring-[var(--color-accent)] ring-offset-1' : ''}`}
                                    >
                                        <Filter className="w-4 h-4" />
                                        <span>Filters</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                    </button>

                                    <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-2 ${viewMode === 'grid' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]'}`}
                                        >
                                            <Grid3X3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 ${viewMode === 'list' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]'}`}
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setIsCustomModalOpen(true)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span className="hidden sm:inline">Custom</span>
                                    </button>
                                </div>
                            </div>

                            {/* Category Filters - Collapsible */}
                            {showFilters && (
                                <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-wrap gap-1.5 animate-fade-in">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat
                                                ? 'bg-[var(--color-accent)] text-white'
                                                : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Catalog Grid */}
                        <div className="animate-fade-in-up">
                            {filteredCatalog.length > 0 ? (
                                <div className={viewMode === 'grid'
                                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
                                    : 'space-y-2'
                                }>
                                    {filteredCatalog.map((item, index) => {
                                        const roomItem = roomMaterials.find(m => Number(m.material_id) === Number(item.id));
                                        const isAdded = !!roomItem;

                                        return viewMode === 'grid' ? (
                                            // Grid Card
                                            <div
                                                key={item.id}
                                                className={`card-material p-4 ${isAdded ? 'is-added' : ''}`}
                                                style={{ animationDelay: `${index * 0.03}s` }}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-bg-subtle)] to-[var(--color-border)] flex items-center justify-center">
                                                        <Package className="w-7 h-7 text-[var(--color-text-muted)]" />
                                                    </div>
                                                    {isAdded && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                                                            <Check className="w-3 h-3" />
                                                            Added
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                                                    {item.category || 'General'}
                                                </span>
                                                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mt-1 mb-3 line-clamp-2 min-h-[2.5rem]">
                                                    {item.name}
                                                </h3>

                                                <div className="flex items-baseline gap-1 mb-4">
                                                    <span className="text-xl font-bold text-[var(--color-accent)]">
                                                        {formatCurrency(item.price)}
                                                    </span>
                                                    <span className="text-sm text-[var(--color-text-muted)]">/{item.unit}</span>
                                                </div>

                                                {isAdded ? (
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-bg-subtle)]">
                                                            <button
                                                                onClick={() => roomItem.quantity > 1
                                                                    ? handleUpdateQuantity(roomItem.id, roomItem.quantity - 1)
                                                                    : handleRemoveFromRoom(roomItem.id)
                                                                }
                                                                className="p-2 hover:bg-[var(--color-border)] transition-colors"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                            <span className="w-8 text-center font-semibold">{roomItem.quantity}</span>
                                                            <button
                                                                onClick={() => handleUpdateQuantity(roomItem.id, roomItem.quantity + 1)}
                                                                className="p-2 hover:bg-[var(--color-border)] transition-colors"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(roomItem);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="p-2 hover:bg-[var(--color-bg-subtle)] rounded-xl transition-colors border border-[var(--color-border)]"
                                                            title="Edit item"
                                                        >
                                                            <Edit3 className="w-4 h-4 text-[var(--color-accent)]" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddToRoom(item.id)}
                                                        className="w-full btn-primary"
                                                    >
                                                        Add to Room
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            // List Row
                                            <div
                                                key={item.id}
                                                className={`card p-4 flex items-center gap-4 transition-all hover:shadow-lg ${isAdded ? 'ring-2 ring-[var(--color-accent)] ring-offset-2' : ''}`}
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-subtle)] flex items-center justify-center flex-shrink-0">
                                                    <Package className="w-6 h-6 text-[var(--color-text-muted)]" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                                                        {item.category || 'General'}
                                                    </span>
                                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)] truncate">
                                                        {item.name}
                                                    </h3>
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    <span className="text-lg font-bold text-[var(--color-accent)]">
                                                        {formatCurrency(item.price)}
                                                    </span>
                                                    <span className="text-sm text-[var(--color-text-muted)]">/{item.unit}</span>
                                                </div>

                                                {isAdded ? (
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
                                                            <button
                                                                onClick={() => roomItem.quantity > 1
                                                                    ? handleUpdateQuantity(roomItem.id, roomItem.quantity - 1)
                                                                    : handleRemoveFromRoom(roomItem.id)
                                                                }
                                                                className="p-2 hover:bg-[var(--color-bg-subtle)]"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                            <span className="w-10 text-center font-semibold">{roomItem.quantity}</span>
                                                            <button
                                                                onClick={() => handleUpdateQuantity(roomItem.id, roomItem.quantity + 1)}
                                                                className="p-2 hover:bg-[var(--color-bg-subtle)]"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(roomItem);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="p-2 hover:bg-[var(--color-bg-subtle)] rounded-lg"
                                                        >
                                                            <Edit3 className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveFromRoom(roomItem.id)}
                                                            className="p-2 hover:bg-rose-50 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-rose-500" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddToRoom(item.id)}
                                                        className="btn-primary flex-shrink-0"
                                                    >
                                                        Add
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="card p-16 text-center">
                                    <Package className="w-16 h-16 text-[var(--color-border)] mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No materials found</h3>
                                    <p className="text-[var(--color-text-muted)]">Try adjusting your search or filters</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Moodboard Cart */}
                    <aside className={`hidden lg:block w-96 flex-shrink-0 ${isMoodboardOpen ? '' : 'lg:hidden'}`}>
                        <div className="sticky top-24">
                            <div className="panel-glass rounded-2xl overflow-hidden animate-fade-in">
                                {/* Cart Header */}
                                <div className="px-5 py-4 border-b border-white/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center">
                                                <Palette className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-[var(--color-text-primary)]">Project Moodboard</h2>
                                                <p className="text-xs text-[var(--color-text-muted)]">{roomMaterials.length} materials selected</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Cart Items */}
                                <div className="max-h-[calc(100vh-320px)] overflow-y-auto p-4 space-y-3">
                                    {roomMaterials.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-subtle)] flex items-center justify-center mx-auto mb-4">
                                                <Layers className="w-8 h-8 text-[var(--color-border)]" />
                                            </div>
                                            <p className="text-sm text-[var(--color-text-muted)]">Your moodboard is empty</p>
                                            <p className="text-xs text-[var(--color-text-muted)] mt-1">Add materials from the catalog</p>
                                        </div>
                                    ) : (
                                        roomMaterials.map((item) => (
                                            <div key={item.id} className="cart-item">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center flex-shrink-0">
                                                        <Package className="w-5 h-5 text-[var(--color-text-muted)]" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{item.name}</h4>
                                                        <p className="text-xs text-[var(--color-text-muted)]">
                                                            {formatCurrency(item.price)} × {item.quantity}
                                                        </p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-sm font-bold text-[var(--color-accent)]">
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Item Actions */}
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
                                                    <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden bg-white">
                                                        <button
                                                            onClick={() => item.quantity > 1
                                                                ? handleUpdateQuantity(item.id, item.quantity - 1)
                                                                : handleRemoveFromRoom(item.id)
                                                            }
                                                            className="p-1.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                            className="p-1.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(item);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="p-1.5 hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveFromRoom(item.id)}
                                                            className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Cart Footer */}
                                <div className="px-5 py-4 border-t border-white/30 bg-white/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Room Total</span>
                                        <span className="text-2xl font-bold text-[var(--color-accent)]">{formatCurrency(roomTotal)}</span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/quotations/${quotationId}`)}
                                        className="w-full btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Finish & Go Back
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Mobile Moodboard Drawer */}
            {isMoodboardOpen && (
                <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMoodboardOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl animate-slide-in-right">
                        {/* Mobile Cart Header */}
                        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center">
                                    <Palette className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-[var(--color-text-primary)]">Moodboard</h2>
                                    <p className="text-xs text-[var(--color-text-muted)]">{roomMaterials.length} items</p>
                                </div>
                            </div>
                            <button onClick={() => setIsMoodboardOpen(false)} className="p-2 hover:bg-[var(--color-bg-subtle)] rounded-xl">
                                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                        </div>

                        {/* Mobile Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                            {roomMaterials.length === 0 ? (
                                <div className="text-center py-12">
                                    <Layers className="w-12 h-12 text-[var(--color-border)] mx-auto mb-4" />
                                    <p className="text-[var(--color-text-muted)]">Your moodboard is empty</p>
                                </div>
                            ) : (
                                roomMaterials.map((item) => (
                                    <div key={item.id} className="cart-item">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center">
                                                <Package className="w-5 h-5 text-[var(--color-text-muted)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold truncate">{item.name}</h4>
                                                <p className="text-xs text-[var(--color-text-muted)]">
                                                    {formatCurrency(item.price)} × {item.quantity} = <strong>{formatCurrency(item.price * item.quantity)}</strong>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveFromRoom(item.id)}
                                                className="p-2 hover:bg-rose-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4 text-rose-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Mobile Cart Footer */}
                        <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-[var(--color-border)] bg-white">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-[var(--color-text-secondary)]">Total</span>
                                <span className="text-xl font-bold text-[var(--color-accent)]">{formatCurrency(roomTotal)}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setIsMoodboardOpen(false);
                                    navigate(`/quotations/${quotationId}`);
                                }}
                                className="w-full btn-primary"
                            >
                                Finish & Go Back
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Item Modal */}
            {isCustomModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Add Custom Item</h3>
                            <button onClick={() => setIsCustomModalOpen(false)} className="p-1.5 hover:bg-[var(--color-bg-subtle)] rounded-lg">
                                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                        </div>

                        <form onSubmit={handleAddCustom} className="p-6 space-y-4">
                            <div>
                                <label className="label">Item Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={customForm.description}
                                    onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                                    className="input"
                                    placeholder="Wall Plastering Work"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="label">Unit *</label>
                                    <input
                                        type="text"
                                        required
                                        value={customForm.unit}
                                        onChange={(e) => setCustomForm({ ...customForm, unit: e.target.value })}
                                        className="input"
                                        placeholder="sqft"
                                    />
                                </div>
                                <div>
                                    <label className="label">Rate *</label>
                                    <input
                                        type="number"
                                        required
                                        value={customForm.rate}
                                        onChange={(e) => setCustomForm({ ...customForm, rate: e.target.value })}
                                        className="input"
                                        placeholder="150"
                                    />
                                </div>
                                <div>
                                    <label className="label">Quantity *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={customForm.quantity}
                                        onChange={(e) => setCustomForm({ ...customForm, quantity: e.target.value })}
                                        className="input"
                                        placeholder="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Specification (Optional)</label>
                                <textarea
                                    rows="2"
                                    value={customForm.specification}
                                    onChange={(e) => setCustomForm({ ...customForm, specification: e.target.value })}
                                    className="input resize-none"
                                    placeholder="Additional details..."
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={customForm.saveToCatalog}
                                    onChange={(e) => setCustomForm({ ...customForm, saveToCatalog: e.target.checked })}
                                    className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                                />
                                <span className="text-sm text-[var(--color-text-secondary)]">Save to catalog for future use</span>
                            </label>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsCustomModalOpen(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {isEditModalOpen && editingItem && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Edit Item</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-[var(--color-bg-subtle)] rounded-lg">
                                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                        </div>

                        <form onSubmit={handleEditItem} className="p-6 space-y-4">
                            <div>
                                <label className="label">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingItem.name}
                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Rate</label>
                                    <input
                                        type="number"
                                        required
                                        value={editingItem.price}
                                        onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={editingItem.quantity}
                                        onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Specification</label>
                                <textarea
                                    rows="2"
                                    value={editingItem.specification || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, specification: e.target.value })}
                                    className="input resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomMaterials;
