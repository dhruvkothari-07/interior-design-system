import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URL } from '../config';
import { useQuotationCalculations } from '../hooks/useQuotationCalculations';
import {
    LayoutDashboard,
    TableProperties,
    FileText,
    Plus,
    X,
    ArrowLeft,
    FileSpreadsheet,
    IndianRupee,
    CheckCircle2,
    Clock,
    XCircle,
    FileEdit,
    User,
    Mail,
    Phone,
    Calendar,
    Sparkles,
    ArrowRight,
    Edit3,
    Send,
    Download,
    MoreHorizontal,
    Home,
    Layers
} from 'lucide-react';

import OverviewTab from './quotation-tabs/OverviewTab';
import WorksheetTab from './quotation-tabs/WorksheetTab';
import PreviewTab from './quotation-tabs/PreviewTab';

const QuotationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Core Data
    const [quotation, setQuotation] = useState(null);
    const [rooms, setRooms] = useState([]);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [activeRoomId, setActiveRoomId] = useState(null);

    // Modals
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [roomForm, setRoomForm] = useState({ name: '', length: '', width: '', height: '', notes: '' });

    // --- Data Fetching ---
    const fetchData = async () => {
        const token = localStorage.getItem("token");
        try {
            const [qRes, rRes] = await Promise.all([
                axios.get(`${API_URL}/quotations/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/quotations/${id}/rooms`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setQuotation(qRes.data);
            setRooms(rRes.data);

            if (activeTab === 'worksheet' && !activeRoomId && rRes.data.length > 0) {
                setActiveRoomId(rRes.data[0].id);
            }
        } catch (err) {
            console.error("Error fetching data", err);
            if (err.response?.status === 404) navigate('/quotations');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    // --- Computed Values ---
    const { materialsTotal: currentSubTotal } = useQuotationCalculations(
        rooms,
        quotation?.labor_cost || 0,
        quotation?.design_fee_type || 'percentage',
        quotation?.design_fee_value || 0
    );

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

    // --- Room Management Handlers ---
    const handleRoomFormChange = (e) => {
        setRoomForm({ ...roomForm, [e.target.name]: e.target.value });
    };

    const handleOpenAddRoom = () => {
        setEditingRoom(null);
        setRoomForm({ name: '', length: '', width: '', height: '', notes: '' });
        setIsRoomModalOpen(true);
    };

    const handleOpenEditRoom = (room) => {
        setEditingRoom(room);
        setRoomForm({
            name: room.name,
            length: room.length,
            width: room.width,
            height: room.height,
            notes: room.notes || ''
        });
        setIsRoomModalOpen(true);
    };

    const handleSaveRoom = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (editingRoom) {
                await axios.put(`${API_URL}/rooms/${editingRoom.id}`, roomForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                const res = await axios.post(`${API_URL}/quotations/${id}/rooms`, roomForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (rooms.length === 0) setActiveRoomId(res.data.id);
            }
            setIsRoomModalOpen(false);
            fetchData();
            toast.success(editingRoom ? 'Room updated!' : 'Room created!');
        } catch (err) {
            console.error("Error saving room:", err);
            toast.error('Failed to save room');
        }
    };

    const handleDeleteRoom = async (room) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-medium">Delete room "{room.name}"?</p>
                <p className="text-sm text-stone-500">All items in it will be removed.</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const token = localStorage.getItem("token");
                                await axios.delete(`${API_URL}/rooms/${room.id}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                if (activeRoomId === room.id) setActiveRoomId(null);
                                fetchData();
                                toast.success('Room deleted');
                            } catch (err) {
                                toast.error('Failed to delete room');
                            }
                        }}
                        className="px-3 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const getStatusConfig = (status) => {
        const configs = {
            'Approved': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500' },
            'Pending': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, gradient: 'from-amber-500 to-orange-500' },
            'Rejected': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle, gradient: 'from-rose-500 to-rose-600' },
            'Draft': { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200', icon: FileEdit, gradient: 'from-stone-400 to-stone-500' }
        };
        return configs[status] || configs['Draft'];
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">

                <p className="text-[var(--color-text-muted)]">Loading quotation...</p>
            </div>
        </div>
    );
    if (!quotation) return null;

    const statusConfig = getStatusConfig(quotation.status);
    const StatusIcon = statusConfig.icon;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'worksheet', label: 'Rooms & Materials', icon: Layers, badge: rooms.length },
        { id: 'preview', label: 'Preview & Export', icon: FileText }
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/quotations')}
                    className="group flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors mb-6 animate-fade-in"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Quotations
                </button>

                {/* Hero Header */}
                <div className="relative mb-8 animate-fade-in">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/5 via-transparent to-amber-500/5 rounded-3xl" />

                    <div className="relative card p-6 lg:p-8 border-none shadow-lg">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            {/* Left: Quotation Info */}
                            <div className="flex items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                            {quotation.title}
                                        </h1>
                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border flex items-center gap-1.5`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {quotation.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-muted)]">

                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            {quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Home className="w-4 h-4" />
                                            {rooms.length} rooms
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions & Total */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">



                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex justify-center mb-8 animate-fade-in-up">
                    <div className="inline-flex bg-white p-1.5 rounded-2xl shadow-sm border border-[var(--color-border)]">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                    ${activeTab === tab.id
                                        ? 'bg-[var(--color-accent)] text-white shadow-md'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-stone-50'}
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {tab.badge > 0 && activeTab !== tab.id && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-[10px] font-semibold">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="animate-fade-in-up">
                    {activeTab === 'overview' && (
                        <OverviewTab
                            quotation={quotation}
                            setQuotation={setQuotation}
                            currentSubTotal={currentSubTotal}
                            onTabChange={setActiveTab}
                        />
                    )}

                    {activeTab === 'worksheet' && (
                        <WorksheetTab
                            quotationId={id}
                            rooms={rooms}
                            onRoomsUpdate={fetchData}
                            activeRoomId={activeRoomId}
                            setActiveRoomId={setActiveRoomId}
                            onAddRoomClick={handleOpenAddRoom}
                            onEditRoom={handleOpenEditRoom}
                            onDeleteRoom={handleDeleteRoom}
                        />
                    )}

                    {activeTab === 'preview' && (
                        <PreviewTab
                            quotation={{ ...quotation, labor_cost: quotation.labor_cost, design_fee_type: quotation.design_fee_type, design_fee_value: quotation.design_fee_value }}
                            setQuotation={setQuotation}
                        />
                    )}
                </div>
            </main>

            {/* Room Modal */}
            {/* Room Modal */}
            {isRoomModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-accent)]/5 to-amber-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                <Home className="w-5 h-5 text-[var(--color-accent)]" />
                                {editingRoom ? 'Edit Room' : 'Add New Room'}
                            </h3>
                            <button onClick={() => setIsRoomModalOpen(false)} className="p-1.5 hover:bg-white rounded-lg transition">
                                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveRoom} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-3">Room Name *</label>

                                {/* Quick Add Bubbles */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {['Living Room', 'Bedroom', 'Master Bedroom', 'Kitchen', 'Bathroom', 'Balcony', 'Dining', 'Office'].map((name) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => setRoomForm(prev => ({ ...prev, name }))}
                                            className="px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 hover:bg-[var(--color-accent)] hover:text-white transition-colors border border-stone-200"
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>

                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={roomForm.name}
                                    onChange={handleRoomFormChange}
                                    className="input"
                                    placeholder="e.g. Master Bedroom"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Length (ft)</label>
                                    <input type="number" name="length" value={roomForm.length} onChange={handleRoomFormChange} className="input" placeholder="12" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Width (ft)</label>
                                    <input type="number" name="width" value={roomForm.width} onChange={handleRoomFormChange} className="input" placeholder="10" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Height (ft)</label>
                                    <input type="number" name="height" value={roomForm.height} onChange={handleRoomFormChange} className="input" placeholder="10" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Notes (Optional)</label>
                                <textarea
                                    name="notes"
                                    rows="2"
                                    value={roomForm.notes}
                                    onChange={handleRoomFormChange}
                                    className="input resize-none"
                                    placeholder="Specific requirements..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsRoomModalOpen(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingRoom ? 'Update Room' : 'Create Room'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default QuotationDetail;