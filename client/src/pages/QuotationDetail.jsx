import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Layout from './Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { LayoutDashboard, TableProperties, FileText, Plus, X, ArrowLeft, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';

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
                // Update
                await axios.put(`${API_URL}/rooms/${editingRoom.id}`, roomForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Create
                const res = await axios.post(`${API_URL}/quotations/${id}/rooms`, roomForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // If this is the first room, auto-select it
                if (rooms.length === 0) setActiveRoomId(res.data.id);
            }
            setIsRoomModalOpen(false);
            fetchData(); // Refresh list
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

    if (isLoading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;
    if (!quotation) return null;

    return (
        <Layout>
            {/* Header with Tabs */}
            {/* Header with Tabs */}
            <div className="mb-8">
                {/* Back Link */}
                <button
                    onClick={() => navigate('/quotations')}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6 text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Quotations</span>
                </button>

                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    {/* Left: Title & Metadata */}
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 flex-shrink-0">
                            <FileText className="w-7 h-7 text-theme-orange" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{quotation.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${quotation.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                        quotation.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {quotation.status || 'Draft'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="font-medium text-gray-700">{quotation.client_name}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    Created {new Date(quotation.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Total Value Card */}
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-5">
                        <div className="w-12 h-12 bg-theme-orange rounded-full flex items-center justify-center shadow-lg shadow-orange-200">
                            <span className="text-white font-serif text-xl">₹</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Total Value</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(currentSubTotal)}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Centered Tabs (Pill Style) */}
                <div className="flex justify-center">
                    <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 inline-flex">
                        {[
                            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                            { id: 'worksheet', label: 'Rooms & Materials', icon: TableProperties },
                            { id: 'preview', label: 'Preview & Export', icon: FileText },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === tab.id
                                        ? 'bg-theme-orange text-white shadow-md'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="mt-6">
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
                        onRoomsUpdate={fetchData} // Refresh all rooms to update totals
                        activeRoomId={activeRoomId}
                        setActiveRoomId={setActiveRoomId}
                        onAddRoomClick={handleOpenAddRoom}
                        onEditRoom={handleOpenEditRoom}
                        onDeleteRoom={handleDeleteRoom}
                    />
                )}

                {activeTab === 'preview' && (
                    <PreviewTab
                        quotation={{ ...quotation, labor_cost: quotation.labor_cost, design_fee_type: quotation.design_fee_type, design_fee_value: quotation.design_fee_value }} // Ensure latest props
                        setQuotation={setQuotation}
                    />
                )}

                {/* Shared Room Modal */}
                {isRoomModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
                                <button onClick={() => setIsRoomModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
                            </div>
                            <form onSubmit={handleSaveRoom} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Room Name</label>

                                    {/* Quick Select Chips */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {['Living Room', 'Master Bedroom', 'Kitchen', 'Bathroom', 'Dining', 'Balcony'].map(roomType => (
                                            <button
                                                key={roomType}
                                                type="button"
                                                onClick={() => setRoomForm({ ...roomForm, name: roomType })}
                                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${roomForm.name === roomType
                                                    ? 'bg-orange-100 text-theme-orange border-orange-200'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                                                    }`}
                                            >
                                                {roomType}
                                            </button>
                                        ))}
                                    </div>

                                    <input type="text" name="name" required value={roomForm.name} onChange={handleRoomFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-orange outline-none" placeholder="e.g. Master Bedroom" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Length (ft)</label><input type="number" name="length" value={roomForm.length} onChange={handleRoomFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Width (ft)</label><input type="number" name="width" value={roomForm.width} onChange={handleRoomFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Height (ft)</label><input type="number" name="height" value={roomForm.height} onChange={handleRoomFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (Optional)</label>
                                    <textarea name="notes" rows="3" value={roomForm.notes} onChange={handleRoomFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none" placeholder="Specific requirements..." />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsRoomModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 bg-theme-orange text-white font-bold rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-200 transition">{editingRoom ? 'Update Room' : 'Create Room'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default QuotationDetail;