import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { LayoutDashboard, TableProperties, FileText, Plus, X } from 'lucide-react';

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
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden mt-16 md:mt-0">
                {/* Header with Tabs */}
                <header className="bg-white border-b border-gray-200 pt-6 px-8 pb-0 z-20">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mb-1">
                                <span onClick={() => navigate('/quotations')} className="hover:text-indigo-600 cursor-pointer transition">Quotations</span>
                                <span>/</span>
                                <span>{quotation.id}</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">{quotation.title}</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Total Value</p>
                            <p className="text-xl font-bold text-indigo-600">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(currentSubTotal)}
                            </p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-8">
                        {[
                            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                            { id: 'worksheet', label: 'Rooms & Materials', icon: TableProperties },
                            { id: 'preview', label: 'Preview & Export', icon: FileText },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto p-6 md:p-8">
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
                </main>
            </div>

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
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Room Name</label>
                                <input type="text" name="name" required value={roomForm.name} onChange={handleRoomFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Master Bedroom" />
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
                                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">{editingRoom ? 'Update Room' : 'Create Room'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotationDetail;