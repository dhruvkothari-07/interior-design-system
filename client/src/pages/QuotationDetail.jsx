import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const QuotationDetail = () => {
    const { id } = useParams(); // Get the quotation ID from the URL
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchQuotationDetails = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate('/signin'); // Redirect to signin if no token
                    return;
                }

                const res = await axios.get(`http://localhost:3001/api/v1/quotations/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQuotation(res.data);
            } catch (err) {
                console.error("Error fetching quotation details:", err);
                setError("Failed to load quotation details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuotationDetails();
    }, [id, navigate]); // Re-fetch if ID changes or navigate function changes

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

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default: // Draft
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            {/* Sidebar (can be a shared component later) */}
            <aside className="w-64 bg-gray-800 text-white p-5 hidden md:flex flex-col justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-8 text-center">Management</h1>
                    <nav>
                        <ul className="space-y-3">
                            <li><a href="/dashboard" className="block py-2 px-4 rounded hover:bg-gray-700 transition">Dashboard</a></li>
                            <li><a href="/quotations" className="block py-2 px-4 rounded bg-gray-700 font-semibold">Quotations</a></li>
                            <li><a href="/materials" className="block py-2 px-4 rounded hover:bg-gray-700 transition">Materials</a></li>
                        </ul>
                    </nav>
                </div>
                <div>
                    <a href="/signin" onClick={() => localStorage.removeItem('token')} className="block py-2 px-4 rounded hover:bg-red-700 bg-red-600 text-center transition">Logout</a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-4">
                    <h2 className="text-3xl font-semibold text-gray-800">Quotation: {quotation.title}</h2>
                    <button
                        onClick={() => navigate(`/quotations`)} // Example: Go back to list
                        className="bg-gray-600 text-white px-5 py-2 rounded-lg shadow hover:bg-gray-700 transition duration-150 ease-in-out"
                    >
                        Back to List
                    </button>
                </header>

                <section className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4">Quotation Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-600"><strong>Title:</strong> {quotation.title}</p>
                            <p className="text-gray-600"><strong>Status:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(quotation.status)}`}>{quotation.status}</span></p>
                            <p className="text-gray-600"><strong>Created At:</strong> {new Date(quotation.createdAt).toLocaleString()}</p>
                            <p className="text-gray-600"><strong>Last Updated:</strong> {new Date(quotation.updatedAt).toLocaleString()}</p>
                            <p className="text-gray-600"><strong>Total Amount:</strong> {quotation.total_amount ? `₹${Number(quotation.total_amount).toLocaleString('en-IN')}` : 'N/A'}</p>
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
                        <h3 className="text-xl font-semibold mb-4">Rooms & Materials</h3>
                        <p className="text-gray-500 italic">Coming soon: Functionality to add and manage rooms and materials for this quotation.</p>
                        {/* Future: Add components for rooms and materials here */}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default QuotationDetail;