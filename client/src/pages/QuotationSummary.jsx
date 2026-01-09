import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { API_URL } from '../config';

const QuotationSummary = () => {
    const { id } = useParams(); // Get the quotation ID from the URL
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);
    const [rooms, setRooms] = useState([]);
    // Default settings (Hardcoded fallback)
    const [settings] = useState({
        company_name: 'My Interior Design Co.',
        company_address: '123 Design Street, Creative City',
        company_email: 'contact@designco.com',
        company_phone: '+91 98765 43210',
        logo_url: '/logo.jpg', 
        terms_and_conditions: '1. This quotation includes only the work and materials specifically mentioned above. Any additional or modified work will be charged separately.\n2. Prices are valid for a limited period and may change due to variation in material costs or project requirements.\n3. Payments must be made as per agreed milestones. Delay in payment may result in temporary suspension of work.\n4. The client shall ensure site readiness, including access, electricity, water, and necessary permissions before commencement of work.\n5. Once materials, designs, shades, or finishes are finalized and ordered, they cannot be cancelled or returned. Any changes will be charged additionally.\n6. The service provider shall not be responsible for delays or damages caused due to site conditions, third-party work, natural events, or circumstances beyond control.'
    }); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for summary calculations
    const [taxPercentage, setTaxPercentage] = useState(18.00); // Default tax at 18%
    const [laborCost, setLaborCost] = useState(0);
    const [designFeeType, setDesignFeeType] = useState('percentage'); // 'flat' or 'percentage'
    const [designFeeValue, setDesignFeeValue] = useState(0);

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
                const resQuotation = await axios.get(`${API_URL}/quotations/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQuotation(resQuotation.data);
                
                // Initialize calculation fields from DB if they exist
                setLaborCost(Number(resQuotation.data.labor_cost) || 0);
                setDesignFeeType(resQuotation.data.design_fee_type || 'percentage');
                setDesignFeeValue(Number(resQuotation.data.design_fee_value) || 0);

                // Step 1: Fetch rooms for the quotation
                const resRooms = await axios.get(`${API_URL}/quotations/${id}/rooms`, { 
                    headers: { Authorization: `Bearer ${token}` },
                });
                const fetchedRooms = resRooms.data;

                // Step 2: Fetch materials for each room and combine the data
                const roomsWithMaterials = await Promise.all(fetchedRooms.map(async (room) => {
                    const resMaterials = await axios.get(`${API_URL}/rooms/${room.id}/materials`, { headers: { Authorization: `Bearer ${token}` } });
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

    const materialsTotal = useMemo(() => {
        // Recalculate from materials to ensure consistency with what's displayed
        return rooms.reduce((total, room) => {
            const roomTotal = (room.materials || []).reduce((roomSum, material) => {
                return roomSum + (Number(material.price) * Number(material.quantity));
            }, 0);
            return total + roomTotal;
        }, 0);
    }, [rooms]);

    const calculatedDesignFee = useMemo(() => {
        const val = parseFloat(designFeeValue) || 0;
        if (designFeeType === 'flat') {
            return val;
        } else {
            // Percentage of (Materials + Labor)
            const base = materialsTotal + (parseFloat(laborCost) || 0);
            return (base * val) / 100;
        }
    }, [materialsTotal, laborCost, designFeeType, designFeeValue]);

    const taxableAmount = useMemo(() => {
        return materialsTotal + (parseFloat(laborCost) || 0) + calculatedDesignFee;
    }, [materialsTotal, laborCost, calculatedDesignFee]);

    const taxAmount = useMemo(() => {
        const tax = parseFloat(taxPercentage);
        if (isNaN(tax)) return 0;
        return (taxableAmount * tax) / 100;
    }, [taxableAmount, taxPercentage]);

    const finalTotal = useMemo(() => {
        return taxableAmount + taxAmount;
    }, [taxableAmount, taxAmount]);

    const handleSaveFinalTotal = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/quotations/${id}/total`,
                { 
                    total_amount: finalTotal,
                    labor_cost: laborCost,
                    design_fee_type: designFeeType,
                    design_fee_value: designFeeValue
                },
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
        <div className="flex h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-800">
            {/* Sidebar (can be a shared component later) */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-4">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Summary for: {quotation.title}</h1>
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

                <section ref={printRef} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    {/* New Header for PDF */}
                    <div className="mb-8 border-b pb-4">
                        <div className="flex justify-between items-start"> 
                            {/* Company Info & Logo */}
                            <div className="w-1/2">
                                {settings.logo_url && <img src={settings.logo_url} alt="Company Logo" className="h-20 mb-4 object-contain" />}
                                <h2 className="text-lg font-bold text-gray-800">{settings.company_name || 'Your Company'}</h2>
                                {settings.company_address && <p className="text-sm text-gray-600 whitespace-pre-line">{settings.company_address}</p>}
                                {settings.company_email && <p className="text-sm text-gray-600">{settings.company_email}</p>}
                                {settings.company_phone && <p className="text-sm text-gray-600">{settings.company_phone}</p>}
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
                                    <div key={room.id} className="bg-gray-50 p-4 rounded-xl border">
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
                                    <div className="flex justify-between"><span className="text-gray-600">Total Materials</span><span className="font-medium">{formatCurrency(materialsTotal)}</span></div>
                                    
                                    {/* Labor Cost Input */}
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="labor" className="text-gray-600">Labor Estimate</label>
                                        <input type="number" id="labor" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} className="w-32 px-2 py-1 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right" />
                                    </div>

                                    {/* Design Fee Input */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-gray-600">Design Fee</label>
                                            <div className="flex gap-1">
                                                <select 
                                                    value={designFeeType} 
                                                    onChange={(e) => setDesignFeeType(e.target.value)}
                                                    className="text-xs border rounded bg-gray-50 focus:outline-none"
                                                >
                                                    <option value="percentage">%</option>
                                                    <option value="flat">Flat</option>
                                                </select>
                                                <input type="number" value={designFeeValue} onChange={(e) => setDesignFeeValue(e.target.value)} className="w-20 px-2 py-1 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right" />
                                            </div>
                                        </div>
                                        <div className="text-right text-sm text-gray-500">
                                            {formatCurrency(calculatedDesignFee)}
                                        </div>
                                    </div>

                                    <div className="border-t my-2"></div>
                                    <div className="flex justify-between"><span className="text-gray-800 font-medium">Subtotal (Taxable)</span><span className="font-medium">{formatCurrency(taxableAmount)}</span></div>

                                    <div className="flex justify-between items-center"><label htmlFor="tax" className="text-gray-600">Tax (%)</label><input type="number" id="tax" value={taxPercentage} onChange={(e) => setTaxPercentage(e.target.value)} className="w-24 px-2 py-1 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right" step="0.01" /></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Tax Amount</span><span className="font-medium">{formatCurrency(taxAmount)}</span></div>
                                    <div className="border-t my-2"></div>
                                    <div className="flex justify-between text-xl font-bold"><span className="text-gray-800">Grand Total</span><span>{formatCurrency(finalTotal)}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions - now at the bottom, full width */}
                        <div className="mt-12 text-sm text-gray-600">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Terms & Conditions</h3>
                            {settings.terms_and_conditions ? (
                                <p className="whitespace-pre-line">{settings.terms_and_conditions}</p>
                            ) : (
                                <p className="italic">No terms and conditions have been set.</p>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default QuotationSummary;