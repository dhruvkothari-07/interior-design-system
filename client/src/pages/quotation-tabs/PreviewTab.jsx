import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { API_URL } from '../../config';

const PreviewTab = ({ quotation, setQuotation }) => {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [settings] = useState({
        company_name: 'My Interior Design Co.',
        company_address: '123 Design Street, Creative City',
        company_email: 'contact@designco.com',
        company_phone: '+91 98765 43210',
        logo_url: '/logo.jpg',
        terms_and_conditions: '1. This quotation includes only the work and materials specifically mentioned above. Any additional or modified work will be charged separately.\n2. Prices are valid for a limited period and may change due to variation in material costs or project requirements.\n3. Payments must be made as per agreed milestones. Delay in payment may result in temporary suspension of work.\n4. The client shall ensure site readiness, including access, electricity, water, and necessary permissions before commencement of work.\n5. Once materials, designs, shades, or finishes are finalized and ordered, they cannot be cancelled or returned. Any changes will be charged additionally.\n6. The service provider shall not be responsible for delays or damages caused due to site conditions, third-party work, natural events, or circumstances beyond control.'
    });

    const [taxPercentage, setTaxPercentage] = useState(18.00);
    const [laborCost, setLaborCost] = useState(0);
    const [designFeeType, setDesignFeeType] = useState('percentage');
    const [designFeeValue, setDesignFeeValue] = useState(0);

    const printRef = useRef();

    useEffect(() => {
        const fetchDeepData = async () => {
            const token = localStorage.getItem("token");
            setIsLoading(true);
            try {
                // Initialize calculation fields from prop if available (or refetch if safer)
                setLaborCost(Number(quotation.labor_cost) || 0);
                setDesignFeeType(quotation.design_fee_type || 'percentage');
                setDesignFeeValue(Number(quotation.design_fee_value) || 0);

                // Fetch rooms and their materials
                const resRooms = await axios.get(`${API_URL}/quotations/${quotation.id}/rooms`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const fetchedRooms = resRooms.data;

                const roomsWithMaterials = await Promise.all(fetchedRooms.map(async (room) => {
                    const resMaterials = await axios.get(`${API_URL}/rooms/${room.id}/materials`, { headers: { Authorization: `Bearer ${token}` } });
                    return { ...room, materials: resMaterials.data };
                }));
                setRooms(roomsWithMaterials);
            } catch (err) {
                console.error("Error loading preview data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDeepData();
    }, [quotation.id, quotation.labor_cost]); // Re-fetch if ID or prop labor cost changes

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const materialsTotal = useMemo(() => {
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
            const base = materialsTotal + (parseFloat(laborCost) || 0);
            return (base * val) / 100;
        }
    }, [materialsTotal, laborCost, designFeeType, designFeeValue]);

    const taxableAmount = useMemo(() => {
        return materialsTotal + (parseFloat(laborCost) || 0) + calculatedDesignFee;
    }, [materialsTotal, laborCost, calculatedDesignFee]);

    const taxAmount = useMemo(() => {
        return (taxableAmount * parseFloat(taxPercentage || 0)) / 100;
    }, [taxableAmount, taxPercentage]);

    const finalTotal = useMemo(() => {
        return taxableAmount + taxAmount;
    }, [taxableAmount, taxAmount]);

    const handleSaveFinalTotal = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/quotations/${quotation.id}/total`,
                {
                    total_amount: finalTotal,
                    labor_cost: laborCost,
                    design_fee_type: designFeeType,
                    design_fee_value: designFeeValue
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Saved successfully!");
            setQuotation(prev => ({ ...prev, total_amount: finalTotal, labor_cost: laborCost, design_fee_type: designFeeType, design_fee_value: designFeeValue }));
        } catch (err) {
            alert("Failed to save.");
        }
    };

    const [isPrinting, setIsPrinting] = useState(false);

    const handleDownloadPdf = async () => {
        setIsPrinting(true);
        // Wait for render cycle
        setTimeout(async () => {
            const element = printRef.current;
            if (!element) return;
            try {
                const canvas = await html2canvas(element, { scale: 2 });
                const data = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                pdf.addImage(data, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
                pdf.save(`quotation-${quotation.title.replace(/ /g, '_')}.pdf`);
            } finally {
                setIsPrinting(false);
            }
        }, 100);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading preview...</div>;

    return (
        <div className="flex flex-col gap-6 animate-fade-in-up">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-200 gap-4">
                <h3 className="font-semibold text-gray-700">Preview & Export</h3>
                <div className="flex gap-3">
                    <button onClick={handleSaveFinalTotal} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition shadow-sm">
                        Save Totals
                    </button>
                    <button onClick={handleDownloadPdf} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition shadow-sm">
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Print Area */}
            <div className="flex justify-center bg-gray-100 p-4 rounded-xl overflow-x-auto">
                <div ref={printRef} className="bg-white p-8 shadow-lg w-[210mm] min-h-[297mm] text-gray-800 text-sm"> {/* A4 Dimensions approx */}
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 border-b pb-6">
                        <div className="w-1/2">
                            {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="h-16 mb-4 object-contain" />}
                            <h1 className="text-2xl font-bold text-gray-900">{settings.company_name}</h1>
                            <p className="text-gray-500 whitespace-pre-line mt-1">{settings.company_address}</p>
                            <p className="text-gray-500 mt-1">{settings.company_email} • {settings.company_phone}</p>
                        </div>
                        <div className="w-1/2 text-right">
                            <h2 className="text-3xl font-light text-gray-400 mb-2">QUOTATION</h2>
                            <p className="text-lg font-semibold">{quotation.client_name}</p>
                            <p className="text-gray-500">{quotation.client_address}</p>
                            <div className="mt-4 text-gray-500">
                                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                                <p><strong>Ref:</strong> QT-{quotation.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mb-8">
                        {rooms.map(room => {
                            const roomTotal = (room.materials || []).reduce((s, m) => s + (m.price * m.quantity), 0);
                            return (
                                <div key={room.id} className="mb-6 break-inside-avoid">
                                    <div className="flex justify-between bg-gray-50 p-2 border-y border-gray-200 font-bold mb-2">
                                        <span>{room.name}</span>
                                        <span>{formatCurrency(roomTotal)}</span>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead><tr className="text-xs text-gray-500 border-b"><th className="pb-1 pl-2 font-normal">Description</th><th className="pb-1 px-4 text-right font-normal">Rate</th><th className="pb-1 px-4 text-right font-normal">Qty</th><th className="pb-1 pl-4 text-right font-normal">Amount</th></tr></thead>
                                        <tbody className="text-gray-700">
                                            {room.materials && room.materials.map(m => (
                                                <tr key={m.id} className="border-b border-gray-100 last:border-0">
                                                    <td className="py-2 pl-2 pr-2">
                                                        <div className="font-medium">{m.name}</div>
                                                        {m.specification && <div className="text-xs text-gray-500">{m.specification}</div>}
                                                    </td>
                                                    <td className="py-2 px-4 text-right whitespace-nowrap">{formatCurrency(m.price)}</td>
                                                    <td className="py-2 px-4 text-right">{m.quantity} <span className="text-gray-500 text-xs">{m.unit}</span></td>
                                                    <td className="py-2 pl-4 text-right font-medium whitespace-nowrap">{formatCurrency(m.price * m.quantity)}</td>
                                                </tr>
                                            ))}
                                            {(!room.materials || room.materials.length === 0) && <tr><td colSpan="4" className="py-2 text-center text-gray-400 italic">No items</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer / Totals */}
                    <div className="flex flex-col md:flex-row break-inside-avoid">
                        <div className="w-full md:w-1/2 mb-6 md:mb-0 md:pr-8">
                            <h4 className="font-bold text-gray-800 mb-2 text-xs uppercase tracking-wide">Terms & Conditions</h4>
                            <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{settings.terms_and_conditions}</p>
                        </div>
                        <div className="w-full md:w-1/2 md:pl-8 border-t md:border-t-0 md:border-l pt-6 md:pt-0">
                            <div className="space-y-2 text-right">
                                <div className="flex justify-between"><span>Material Cost</span><span>{formatCurrency(materialsTotal)}</span></div>
                                <div className="flex justify-between items-center text-gray-600">
                                    <span>Labor Cost</span>
                                    {isPrinting ? (
                                        <span className="font-medium">{formatCurrency(laborCost)}</span>
                                    ) : (
                                        <input type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} className="w-24 text-right border-b border-gray-300 focus:outline-none focus:border-blue-500 text-sm py-0.5" />
                                    )}
                                </div>
                                <div className="flex justify-between items-center text-gray-600">
                                    <span>Design Fee ({designFeeType === 'percentage' ? `${designFeeValue}%` : 'Flat'})</span>
                                    <div className="flex items-center gap-1 justify-end">
                                        {isPrinting ? (
                                            <span className="font-medium">{formatCurrency(calculatedDesignFee)}</span>
                                        ) : (
                                            <input type="number" value={designFeeValue} onChange={(e) => setDesignFeeValue(e.target.value)} className="w-16 text-right border-b border-gray-300 focus:outline-none focus:border-blue-500 text-sm py-0.5" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between pt-2 border-t font-semibold"><span>Subtotal</span><span>{formatCurrency(taxableAmount)}</span></div>
                                <div className="flex justify-between text-gray-600"><span>Tax ({taxPercentage}%)</span><span>{formatCurrency(taxAmount)}</span></div>
                                <div className="flex justify-between pt-2 border-t-2 border-gray-800 text-xl font-bold mt-2"><span>Total</span><span>{formatCurrency(finalTotal)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewTab;
