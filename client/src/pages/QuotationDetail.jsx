import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { LayoutDashboard, TableProperties, FileText, Plus, X, ArrowLeft, FileSpreadsheet, IndianRupee } from 'lucide-react';

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

            // Set first room active if none selected and in worksheet mode
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

    useEffect(() => {
        fetchData();
    }, [id]);

    // --- Computed Values ---
    const currentSubTotal = useMemo(() => {
        return rooms.reduce((sum, room) => sum + (parseFloat(room.room_total) || 0), 0);
    }, [rooms]);

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);

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
        } catch (err) {
            console.error("Error saving room:", err);
            alert("Failed to save room.");
        }
    };

    const handleDeleteRoom = async (room) => {
        if (!window.confirm(`Delete room "${room.name}"? All items in it will be removed.`)) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/rooms/${room.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (activeRoomId === room.id) setActiveRoomId(null);
            fetchData();
        } catch (err) {
            alert("Failed to delete room.");
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            'Approved': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
            'Pending': { bg: 'bg-amber-100', text: 'text-amber-700' },
            'Rejected': { bg: 'bg-rose-100', text: 'text-rose-700' },
            'Draft': { bg: 'bg-stone-100', text: 'text-stone-600' }
        };
        return configs[status] || configs['Draft'];
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
            <div className="animate-pulse text-[var(--color-text-muted)]">Loading quotation...</div>
        </div>
    );
    if (!quotation) return null;

    const statusConfig = getStatusConfig(quotation.status);

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <button
                        onClick={() => navigate('/quotations')}
                        className="group flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Quotations
                    </button>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Left: Title & Status */}
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-sm">
                                <FileSpreadsheet className="w-7 h-7 text-[var(--color-accent)]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                        {quotation.title}
                                    </h1>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                                        {quotation.status}
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    {quotation.client_name || 'No client'} • Created {new Date(quotation.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Right: Total Value Card */}
                        <div className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 border border-[var(--color-border)] shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-orange-600 flex items-center justify-center">
                                <IndianRupee className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Total Value</p>
                                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                    {formatCurrency(currentSubTotal)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs - Pill Style */}
                <div className="flex justify-center mb-8 animate-fade-in">
                    <div className="inline-flex bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-[var(--color-border)]">
                        {[
                            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                            { id: 'worksheet', label: 'Rooms & Materials', icon: TableProperties },
                            { id: 'preview', label: 'Preview & Export', icon: FileText },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                    ${activeTab === tab.id
                                        ? 'bg-[var(--color-accent)] text-white shadow-md shadow-orange-200'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-stone-100'}
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
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
            {isRoomModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                                {editingRoom ? 'Edit Room' : 'Add New Room'}
                            </h3>
                            <button onClick={() => setIsRoomModalOpen(false)} className="p-1 hover:bg-stone-200 rounded-lg transition">
                                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveRoom} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Room Name</label>
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
                                    <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Length (ft)</label>
                                    <input type="number" name="length" value={roomForm.length} onChange={handleRoomFormChange} className="input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Width (ft)</label>
                                    <input type="number" name="width" value={roomForm.width} onChange={handleRoomFormChange} className="input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Height (ft)</label>
                                    <input type="number" name="height" value={roomForm.height} onChange={handleRoomFormChange} className="input" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Notes (Optional)</label>
                                <textarea
                                    name="notes"
                                    rows="3"
                                    value={roomForm.notes}
                                    onChange={handleRoomFormChange}
                                    className="input resize-none"
                                    placeholder="Specific requirements..."
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsRoomModalOpen(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingRoom ? 'Update Room' : 'Create Room'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotationDetail;