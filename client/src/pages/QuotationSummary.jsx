import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const QuotationSummary = () => {
    const { id } = useParams(); // Get the quotation ID from the URL
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for summary calculations
    const [taxPercentage, setTaxPercentage] = useState(18.00); // Default tax at 18%
    const [discountAmount, setDiscountAmount] = useState(0);

    // Ref for the printable summary area
    const printRef = useRef();

    useEffect(() => {
        const fetchQuotationData = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate('/signin');
                    return;
                }

                // Fetch quotation details
                const resQuotation = await axios.get(`http://localhost:3001/api/v1/quotations/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQuotation(resQuotation.data);

                // Step 1: Fetch rooms for the quotation
                const resRooms = await axios.get(`http://localhost:3001/api/v1/quotations/${id}/rooms`, { 
                    headers: { Authorization: `Bearer ${token}` },
                });
                const fetchedRooms = resRooms.data;

                // Step 2: Fetch materials for each room and combine the data
                const roomsWithMaterials = await Promise.all(fetchedRooms.map(async (room) => {
                    const resMaterials = await axios.get(`http://localhost:3001/api/v1/rooms/${room.id}/materials`, { headers: { Authorization: `Bearer ${token}` } });
                    return { ...room, materials: resMaterials.data };
                }));
                setRooms(roomsWithMaterials);
            } catch (err) {
                console.error("Error fetching quotation summary:", err);
                setError("Failed to load quotation summary.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuotationData();
    }, [id, navigate]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const subTotal = useMemo(() => {
        // Recalculate from materials to ensure consistency with what's displayed
        return rooms.reduce((total, room) => {
            const roomTotal = (room.materials || []).reduce((roomSum, material) => {
                return roomSum + (Number(material.price) * Number(material.quantity));
            }, 0);
            return total + roomTotal;
        }, 0);
    }, [rooms]);

    const taxAmount = useMemo(() => {
        const tax = parseFloat(taxPercentage);
        if (isNaN(tax)) return 0;
        return (subTotal * tax) / 100;
    }, [subTotal, taxPercentage]);

    const finalTotal = useMemo(() => {
        const discount = parseFloat(discountAmount);
        return subTotal + taxAmount - (isNaN(discount) ? 0 : discount);
    }, [subTotal, taxAmount, discountAmount]);

    const handleSaveFinalTotal = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:3001/api/v1/quotations/${id}/total`,
                { total_amount: finalTotal },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Final quotation total has been saved!");
            // Optionally, update the quotation object in state if needed
            setQuotation(prev => ({ ...prev, total_amount: finalTotal }));
        } catch (err) {
            console.error("Error saving final total:", err);
            alert("Failed to save final total amount.");
        }
    };

    const handleDownloadPdf = async () => {
        const element = printRef.current;
        if (!element) return;

        const canvas = await html2canvas(element, {
            scale: 2, // Increase scale for better quality
        });
        const data = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

        pdf.addImage(data, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`quotation-${quotation.title.replace(/ /g, '_')}-${id}.pdf`);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen bg-gray-100 text-gray-800 justify-center items-center">
                <p className="text-lg">Loading quotation summary...</p>
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
        <div className="flex h-screen bg-gray-100 text-gray-800">
            {/* Sidebar (can be a shared component later) */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-4">
                    <div>
                        <h2 className="text-3xl font-semibold text-gray-800">Summary for: {quotation.title}</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleSaveFinalTotal}
                            className="bg-green-600 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 transition"
                        >
                            Save Final Total
                        </button>
                        <button
                            onClick={handleDownloadPdf}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 transition"
                        >
                            Download PDF
                        </button>
                        <button onClick={() => navigate(`/quotations/${id}`)} className="bg-gray-600 text-white px-5 py-2 rounded-lg shadow hover:bg-gray-700 transition">
                            Back to Details
                        </button>
                    </div>
                </header>

                <section ref={printRef} className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    {/* New Header for PDF */}
                    <div className="mb-8 border-b pb-4">
                        <div className="flex justify-between items-start"> 
                            {/* Company Info & Logo */}
                            <div className="w-1/2">
                                <img src="/logo.jpg" alt="Company Logo" className="h-20 mb-4" />
                                <h2 className="text-lg font-bold text-gray-800">Company Name</h2>
                                <p className="text-sm text-gray-600">123 Business Rd, Suite 100</p>
                                <p className="text-sm text-gray-600">City, State, 12345</p>
                                <p className="text-sm text-gray-600">contact@yourcompany.com</p>
                            </div>

                            {/* Client Info */}
                            <div className="w-1/2 text-right">
                                <h3 className="text-xl font-semibold text-gray-800">Quotation For</h3>
                                <p className="text-lg font-medium text-gray-700"> {quotation.client_name || 'N/A'}</p>
                                <p className="text-sm text-gray-600">{quotation.client_email || ''}</p>
                                <p className="text-sm text-gray-600">{quotation.client_phone || ''}</p>
                                <p className="text-sm text-gray-600">{quotation.client_address || ''}</p>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-500"><strong>Quotation ID:</strong> QT-{quotation.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xl font-semibold mb-4">Items & Services</h3>
                    <div className="space-y-6">
                        {rooms.length > 0 ? (
                            rooms.map(room => {
                                const roomTotal = (room.materials || []).reduce((sum, material) => sum + (Number(material.price) * Number(material.quantity)), 0);
                                return (
                                    <div key={room.id} className="bg-gray-50 p-4 rounded-lg border">
                                        <h4 className="font-semibold text-lg flex justify-between items-center">
                                            <span>{room.name}</span>
                                            <span>{formatCurrency(roomTotal)}</span>
                                        </h4>
                                        {room.notes && <p className="text-sm text-gray-500 italic">Notes: {room.notes}</p>}
                                        <ul className="text-sm text-gray-600 space-y-1 mt-2">
                                            {room.materials && room.materials.length > 0 ? room.materials.map(material => {
                                                const lineItemTotal = Number(material.price) * Number(material.quantity);
                                                return (
                                                    <li key={material.id} className="flex justify-between items-center pl-4">
                                                        <span>{material.name} - {material.quantity} {material.unit} @ {formatCurrency(material.price)}/{material.unit}</span>
                                                        <span>{formatCurrency(lineItemTotal)}</span>
                                                    </li>
                                                );
                                            }) : <li className="list-none italic text-gray-400 pl-4">No materials added.</li>}
                                        </ul>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500 italic text-center py-4">No rooms have been added to this quotation yet.</p>
                        )}
                    </div>

                    {/* Final Summary Section */}
                    <div className="mt-12 border-t-2 border-gray-200 pt-8"> 
                        {/* Final Calculation Card */}
                        <div className="max-w-sm ml-auto"> {/* Aligns the card to the right */} 
                            <div className="bg-white p-6 rounded-lg"> 
                                <div className="space-y-3">
                                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">{formatCurrency(subTotal)}</span></div>
                                    <div className="flex justify-between items-center"><label htmlFor="tax" className="text-gray-600">Tax (%)</label><input type="number" id="tax" value={taxPercentage} onChange={(e) => setTaxPercentage(e.target.value)} className="w-24 px-2 py-1 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right" step="0.01" /></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Tax Amount</span><span className="font-medium">{formatCurrency(taxAmount)}</span></div>
                                    <div className="flex justify-between items-center"><label htmlFor="discount" className="text-gray-600">Discount</label><input type="number" id="discount" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} className="w-32 px-2 py-1 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right" step="0.01" /></div>
                                    <div className="border-t my-2"></div>
                                    <div className="flex justify-between text-xl font-bold"><span className="text-gray-800">Grand Total</span><span>{formatCurrency(finalTotal)}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions - now at the bottom, full width */}
                        <div className="mt-12 text-sm text-gray-600">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Terms & Conditions</h3>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Payment is due within 30 days of the invoice date.</li>
                                <li>All materials are subject to availability and may be substituted with equivalent quality items.</li>
                                <li>Any changes to the scope of work will be subject to a revised quotation.</li>
                                <li>This quotation is valid for 15 days.</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default QuotationSummary;