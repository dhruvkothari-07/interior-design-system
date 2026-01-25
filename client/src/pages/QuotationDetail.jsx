import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const QuotationDetail = () => {
    const { id } = useParams(); // Get the quotation ID from the URL
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rooms, setRooms] = useState([]); // Rooms will now include room_total from backend
    const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
    const [newRoom, setNewRoom] = useState({
        name: '',
        length: '', width: '', height: '', notes: ''
    });
    const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false); // For editing room details
    const [editingRoom, setEditingRoom] = useState(null); // For editing room details

    // State for project
    const [project, setProject] = useState(null);
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [newProjectDetails, setNewProjectDetails] = useState({
        start_date: '',
        end_date: ''
    });



    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600'; // Draft
        }
    };

    useEffect(() => {
        const fetchQuotationDetails = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate('/signin'); // Redirect to signin if no token
                    return;
                }
    
                const res = await axios.get(`${API_URL}/quotations/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQuotation(res.data);
    
                // Rooms now come with their total from the backend
                const roomsRes = await axios.get(`${API_URL}/quotations/${id}/rooms`, { 
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRooms(roomsRes.data);

                // Gracefully check if a project exists for this quotation
                try {
                    const projectRes = await axios.get(`${API_URL}/projects/by-quotation/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setProject(projectRes.data);
                } catch (projectError) {
                    if (projectError.response && projectError.response.status === 404) {
                        setProject(null); // This is expected, no project exists yet.
                    } else {
                        throw projectError; // Re-throw other errors to be caught by the main catch block
                    }
                }
            } catch (err) {
                console.error("Error fetching quotation details:", err);
                setError("Failed to load quotation details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuotationDetails();
    }, [id, navigate]);

    useEffect(() => {
        // This is a placeholder for a potential bug fix if the project check fails on first load.
    }, [quotation]);
    
    const handleRoomInputChange = (e) => {
        const { name, value } = e.target;
        setNewRoom(prev => ({ ...prev, [name]: value }));
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.post(`${API_URL}/quotations/${id}/rooms`, newRoom, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRooms([res.data, ...rooms]);
            setIsAddRoomModalOpen(false);
            setNewRoom({
                name: '',
                length: '',
                width: '',
                height: '',
                notes: ''
            });
        } catch (err) {
            console.error("Error adding room:", err);
            alert("Failed to add room.");
        }
    };

    const handleEditRoomClick = (room) => {
        setEditingRoom(room);
        setIsEditRoomModalOpen(true);
    };

    const handleEditingRoomInputChange = (e) => {
        const { name, value } = e.target;
        setEditingRoom(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateRoom = async (e) => {
        e.preventDefault();
        if (!editingRoom) return;

        try {
            const token = localStorage.getItem("token");
            const res = await axios.put(`${API_URL}/rooms/${editingRoom.id}`, editingRoom, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update the room in the state
            setRooms(currentRooms => currentRooms.map(room =>
                room.id === editingRoom.id ? { ...room, ...res.data } : room
            ));

            // Close modal and reset state
            setIsEditRoomModalOpen(false);
            setEditingRoom(null);
        } catch (err) {
            console.error("Error updating room material:", err);
            alert("Failed to update material.");
        }
    };

    const handleDeleteRoom = async (roomId, roomName) => {
        if (!window.confirm(`Are you sure you want to delete the room "${roomName}"? This will also remove all materials inside it.`)) {
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/rooms/${roomId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove the room from the state
            setRooms(currentRooms => currentRooms.filter(room => room.id !== roomId));
        } catch (err) {
            console.error("Error deleting room:", err);
            alert("Failed to delete room.");
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to change the status to "${newStatus}"?`)) {
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/quotations/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setQuotation(prev => ({ ...prev, status: newStatus }));
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status.");
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const postData = {
                quotation_id: id,
                start_date: newProjectDetails.start_date,
                end_date: newProjectDetails.end_date,
            };

            const res = await axios.post(`${API_URL}/projects`, postData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Close modal and reset state
            setIsCreateProjectModalOpen(false);
            setNewProjectDetails({ start_date: '', end_date: '' });

            // Redirect to the new project's detail page
            navigate(`/projects/${res.data.id}`);
        } catch (err) {
            console.error("Error creating project:", err);
            alert(err.response?.data?.message || "Failed to create project.");
        }
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };
    
    const handleNewProjectInputChange = (e) => {
        const { name, value } = e.target;
        setNewProjectDetails(prev => ({ ...prev, [name]: value }));
    };

    const currentSubTotal = useMemo(() => {
        return rooms.reduce((total, room) => total + Number(room.room_total || 0), 0);
    }, [rooms]);

    const roomSuggestions = ["Living Room", "Master Bedroom", "Bedroom", "Kitchen", "Bathroom", "Dining Room", "Office"];


    if (isLoading) {
        return (
            <div className="flex h-screen bg-gray-100 text-gray-800 justify-center items-center">
                <p className="text-lg">Loading quotation details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen bg-gray-100 text-gray-800 justify-center items-center">
                <p className="text-red-500 text-lg">{error}</p>
            </div>
        );
    }

    if (!quotation) {
        return (
            <div className="flex h-screen bg-gray-100 text-gray-800 justify-center items-center">
                <p className="text-lg">Quotation not found.</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-800">
            {/* Sidebar (can be a shared component later) */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8">
                <header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-4">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Quotation: {quotation.title}</h1>
                    <button
                        onClick={() => navigate(`/quotations`)} // Example: Go back to list
                        className="bg-gray-600 text-white px-5 py-2 rounded-lg shadow hover:bg-gray-700 transition duration-150 ease-in-out"
                    >
                        Back to List
                    </button>
                </header>

                <section className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4">Quotation Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-600"><strong>Title:</strong> {quotation.title}</p>
                            <div className="flex items-center space-x-2 text-gray-600">
                                <strong>Status:</strong>
                                <select
                                    value={quotation.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border-transparent focus:border-gray-300 focus:ring-0 ${getStatusBadge(quotation.status)}`}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            <p className="text-gray-600"><strong>Created At:</strong> {new Date(quotation.createdAt).toLocaleString()}</p>
                            <p className="text-gray-600"><strong>Last Updated:</strong> {new Date(quotation.updatedAt).toLocaleString()}</p>
                            <p className="text-gray-600 font-bold text-lg mt-2"><strong>Current Subtotal:</strong> {formatCurrency(currentSubTotal)}</p>
                            <p className="text-gray-600"><strong>Saved Amount:</strong> {quotation.total_amount ? formatCurrency(quotation.total_amount) : 'N/A'}</p>
                            <button
                                onClick={() => navigate(`/quotations/${id}/summary`)}
                                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 transition"
                            >
                                View Summary
                            </button>

                            {/* Conditional "Create Project" Button */}
                            {quotation.status === 'Approved' && (
                                <div className="mt-4">
                                    {project ? (
                                        <button onClick={() => alert(`Navigating to project ${project.id}`)} className="bg-gray-400 text-white px-4 py-2 rounded-md shadow cursor-not-allowed" disabled>
                                            Project Already Exists
                                        </button> 
                                    ) : (
                                        <button onClick={() => setIsCreateProjectModalOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-md shadow hover:bg-purple-700 transition">
                                            Create Project
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="text-lg font-medium mb-2">Client Information</h4>
                            <p className="text-gray-600"><strong>Name:</strong> {quotation.client_name || 'N/A'}</p>
                            <p className="text-gray-600"><strong>Email:</strong> {quotation.client_email || 'N/A'}</p>
                            <p className="text-gray-600"><strong>Phone:</strong> {quotation.client_phone || 'N/A'}</p>
                            <p className="text-gray-600"><strong>Address:</strong> {quotation.client_address || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="mt-8 border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-semibold">Rooms & Materials</h3>
                        </div>
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setIsAddRoomModalOpen(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700 transition"
                            >
                                + Add Room
                            </button>
                        </div>
                        <div className="space-y-4">
                            {rooms.length > 0 ? (
                                rooms.map(room => {
                                    return ( 
                                        <div key={room.id} className="bg-gray-50 p-4 rounded-xl border mb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-lg">{room.name}</h4>
                                                    <p className="text-sm text-gray-600">
                                                        Dimensions: {room.length} x {room.width} x {room.height}
                                                    </p>
                                                </div>
                                                <div className="text-right"> 
                                                    <p className="font-semibold text-lg">{formatCurrency(room.room_total || 0)}</p>
                                                    <div className="mt-1 flex gap-2 justify-end">
                                                        <button onClick={() => handleEditRoomClick(room)} className="text-sm text-blue-600 hover:underline">Edit</button>
                                                        <button onClick={() => handleDeleteRoom(room.id, room.name)} className="text-sm text-red-600 hover:underline ml-4">Delete</button>
                                                        <button onClick={() => navigate(`/quotations/${id}/rooms/${room.id}/materials`)} className="text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition">
                                                            Manage Materials
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {room.notes && <p className="text-sm text-gray-500 mt-1 italic">Notes: {room.notes}</p>}
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-gray-500 italic text-center py-4">No rooms have been added to this quotation yet.</p>
                            )}
                        </div>
                    </div>

                </section>

                {/* Add Room Modal */}
                {isAddRoomModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
                            <h3 className="text-2xl font-semibold mb-6">Add a Room</h3>
                            <form onSubmit={handleAddRoom}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Room Name</label>
                                        <input list="room-suggestions" type="text" name="name" id="name" value={newRoom.name} onChange={handleRoomInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                        <datalist id="room-suggestions">
                                            {roomSuggestions.map(suggestion => <option key={suggestion} value={suggestion} />)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label htmlFor="length" className="block text-sm font-medium text-gray-700">Length</label>
                                        <input type="number" name="length" id="length" value={newRoom.length} onChange={handleRoomInputChange} step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="width" className="block text-sm font-medium text-gray-700">Width</label>
                                        <input type="number" name="width" id="width" value={newRoom.width} onChange={handleRoomInputChange} step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height</label>
                                        <input type="number" name="height" id="height" value={newRoom.height} onChange={handleRoomInputChange} step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                        <textarea name="notes" id="notes" value={newRoom.notes} onChange={handleRoomInputChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end space-x-4">
                                    <button type="button" onClick={() => setIsAddRoomModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Add Room</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Room Modal */}
                {isEditRoomModalOpen && editingRoom && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
                            <h3 className="text-2xl font-semibold mb-6">Edit Room</h3>
                            <form onSubmit={handleUpdateRoom}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Room Name</label>
                                        <input list="room-suggestions" type="text" name="name" id="name" value={editingRoom.name} onChange={handleEditingRoomInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                        <datalist id="room-suggestions">
                                            {roomSuggestions.map(suggestion => <option key={suggestion} value={suggestion} />)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label htmlFor="length" className="block text-sm font-medium text-gray-700">Length</label>
                                        <input type="number" name="length" id="length" value={editingRoom.length} onChange={handleEditingRoomInputChange} step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="width" className="block text-sm font-medium text-gray-700">Width</label>
                                        <input type="number" name="width" id="width" value={editingRoom.width} onChange={handleEditingRoomInputChange} step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height</label>
                                        <input type="number" name="height" id="height" value={editingRoom.height} onChange={handleEditingRoomInputChange} step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                        <textarea name="notes" id="notes" value={editingRoom.notes} onChange={handleEditingRoomInputChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end space-x-4">
                                    <button type="button" onClick={() => setIsEditRoomModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Create Project Modal */}
                {isCreateProjectModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
                            <h3 className="text-2xl font-semibold mb-6">Create New Project</h3>
                            <form onSubmit={handleCreateProject}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Project Name</label>
                                        <p className="mt-1 text-lg font-semibold text-gray-800">{quotation.title}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Budget (from Quotation)</label>
                                        <p className="mt-1 text-lg font-semibold text-gray-800">{formatCurrency(quotation.total_amount || currentSubTotal)}</p>
                                    </div>
                                    <div>
                                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
                                        <input type="date" name="start_date" id="start_date" value={newProjectDetails.start_date} onChange={handleNewProjectInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">Target End Date</label>
                                        <input type="date" name="end_date" id="end_date" value={newProjectDetails.end_date} onChange={handleNewProjectInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end space-x-4">
                                    <button type="button" onClick={() => setIsCreateProjectModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Confirm and Create Project</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default QuotationDetail;