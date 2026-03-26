import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { API_URL } from '../../config';
import { useQuotationCalculations } from '../../hooks/useQuotationCalculations';
import {
    Download,
    Save,
    FileText,
    Printer,
    Mail,
    Share2,
    IndianRupee,
    Home,
    Calculator,
    Percent,
    FileCheck,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    Calendar,
    Building2,
    User,
    Phone,
    MapPin,
    ChevronRight
} from 'lucide-react';

const PreviewTab = ({ quotation, setQuotation }) => {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        company_name: 'My Interior Design Co.',
        company_address: '123 Design Street, Creative City',
        company_email: 'contact@designco.com',
        company_phone: '+91 98765 43210',
        logo_url: '/logo.jpg',
        terms_and_conditions: '1. This quotation includes only the work and materials specifically mentioned above. Any additional or modified work will be charged separately.\n2. Prices are valid for a limited period and may change due to variation in material costs or project requirements.\n3. Payments must be made as per agreed milestones. Delay in payment may result in temporary suspension of work.\n4. The client shall ensure site readiness, including access, electricity, water, and necessary permissions before commencement of work.\n5. Once materials, designs, shades, or finishes are finalized and ordered, they cannot be cancelled or returned. Any changes will be charged additionally.\n6. The service provider shall not be responsible for delays or damages caused due to site conditions, third-party work, natural events, or circumstances beyond control.'
    });

    const getImageUrl = (url) => {
        if (!url) return null;
        const normalizedUrl = url.replace(/\\/g, '/');
        if (normalizedUrl.startsWith('http')) return normalizedUrl;
        if (normalizedUrl === '/logo.jpg') return normalizedUrl;
        const baseUrl = API_URL.replace('/api/v1', '');
        return `${baseUrl}/${normalizedUrl.replace(/^\//, '')}`;
    };

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
                setLaborCost(Number(quotation.labor_cost) || 0);
                setDesignFeeType(quotation.design_fee_type || 'percentage');
                setDesignFeeValue(Number(quotation.design_fee_value) || 0);

                const resSettings = await axios.get(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } });
                const dbSettings = resSettings.data || {};

                setSettings({
                    company_name: dbSettings.company_name || 'My Interior Design Co.',
                    company_address: dbSettings.company_address || '123 Design Street, Creative City',
                    company_email: dbSettings.company_email || 'contact@designco.com',
                    company_phone: dbSettings.company_phone || '+91 98765 43210',
                    logo_url: dbSettings.logo_url || '/logo.jpg',
                    terms_and_conditions: dbSettings.default_terms || '1. This quotation includes only the work and materials specifically mentioned above.\n2. Prices are valid for a limited period and may change due to variation in material costs or project requirements.\n3. Payments must be made as per agreed milestones. Delay in payment may result in temporary suspension of work.\n4. The client shall ensure site readiness, including access, electricity, water, and necessary permissions before commencement of work.\n5. Once materials, designs, shades, or finishes are finalized and ordered, they cannot be cancelled or returned. Any changes will be charged additionally.\n6. The service provider shall not be responsible for delays or damages caused due to site conditions, third-party work, natural events, or circumstances beyond control.'
                });

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
    }, [quotation.id, quotation.labor_cost]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Use centralized calculation hook
    const {
        materialsTotal,
        totalMaterialsCount,
        calculatedDesignFee,
        taxableAmount,
        taxAmount,
        finalTotal
    } = useQuotationCalculations(rooms, laborCost, designFeeType, designFeeValue, taxPercentage);

    const handleSaveFinalTotal = async () => {
        setIsSaving(true);
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
            setQuotation(prev => ({ ...prev, total_amount: finalTotal, labor_cost: laborCost, design_fee_type: designFeeType, design_fee_value: designFeeValue }));
            toast.success('Saved successfully!');
        } catch (err) {
            toast.error('Failed to save.');
        } finally {
            setIsSaving(false);
        }
    };

    const [isPrinting, setIsPrinting] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const handleSendEmail = async () => {
        const toastId = 'email-generation';
        try {
            setIsSendingEmail(true);
            toast.loading('Preparing document for email...', { id: toastId });

            await new Promise(resolve => setTimeout(resolve, 100));

            const element = printRef.current;
            if (!element) throw new Error('Document element not found');

            toast.loading('Capturing document...', { id: toastId });
            const canvas = await html2canvas(element, {
                scale: 1,     // Lower scale for email (keeps it small)
                logging: false,
                useCORS: true
            });

            toast.loading('Generating PDF attachment...', { id: toastId });
            const data = canvas.toDataURL('image/jpeg', 0.7);  // JPEG at 70% quality = much smaller
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            pdf.addImage(data, 'JPEG', 0, 0, imgWidth * ratio, imgHeight * ratio);

            toast.loading('Sending email to client...', { id: toastId });

            // Convert PDF to clean base64 (no data URI prefix)
            const pdfArrayBuffer = pdf.output('arraybuffer');
            const pdfBytes = new Uint8Array(pdfArrayBuffer);
            let binary = '';
            for (let i = 0; i < pdfBytes.length; i++) {
                binary += String.fromCharCode(pdfBytes[i]);
            }
            const pdfBase64 = btoa(binary);
            
            const token = localStorage.getItem("token");
            await axios.post(`${API_URL}/quotations/${quotation.id}/email`, 
                { pdfBase64 },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Email sent successfully!', { id: toastId });
        } catch (error) {
            console.error('Email generation failed:', error);
            const errorMessage = error.response?.data?.message || 'Failed to send email. Please try again.';
            toast.error(errorMessage, { id: toastId });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleDownloadPdf = async () => {
        const toastId = 'pdf-generation';
        try {
            setIsPrinting(true);
            toast.loading('Preparing document...', { id: toastId });

            // Small delay to ensure UI updates
            await new Promise(resolve => setTimeout(resolve, 100));

            const element = printRef.current;
            if (!element) {
                throw new Error('Document element not found');
            }

            toast.loading('Capturing document...', { id: toastId });
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true
            });

            toast.loading('Generating PDF...', { id: toastId });
            const data = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            pdf.addImage(data, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);

            const fileName = `quotation-${quotation.title.replace(/ /g, '_')}.pdf`;
            pdf.save(fileName);

            toast.success('PDF downloaded successfully!', { id: toastId });
        } catch (error) {
            console.error('PDF generation failed:', error);
            toast.error('Failed to generate PDF. Please try again.', { id: toastId });
        } finally {
            setIsPrinting(false);
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 flex items-center justify-center animate-pulse">
                    <FileText className="w-7 h-7 text-white" />
                </div>
                <p className="text-[var(--color-text-muted)]">Loading preview...</p>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fade-in-up">
            {/* Left Sidebar - Controls */}
            <div className="xl:col-span-1 space-y-5">
                {/* Summary Card */}
                <div className="card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Calculation</h3>
                    </div>

                    <div className="space-y-3">
                        {/* Materials Cost */}
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-[var(--color-text-muted)]">Materials ({totalMaterialsCount})</span>
                            <span className="font-medium text-[var(--color-text-primary)]">{formatCurrency(materialsTotal)}</span>
                        </div>

                        {/* Labor Cost */}
                        <div className="flex justify-between items-center py-2 border-t border-[var(--color-border)]">
                            <span className="text-sm text-[var(--color-text-muted)]">Labor Cost</span>
                            <input
                                type="number"
                                value={laborCost}
                                onChange={(e) => setLaborCost(e.target.value)}
                                className="w-28 text-right bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                            />
                        </div>

                        {/* Design Fee */}
                        <div className="py-2 border-t border-[var(--color-border)]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-[var(--color-text-muted)]">Design Fee</span>
                                <div className="flex items-center gap-1 bg-[var(--color-bg-subtle)] rounded-lg p-0.5">
                                    <button
                                        onClick={() => setDesignFeeType('percentage')}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${designFeeType === 'percentage' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'}`}
                                    >
                                        <Percent className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => setDesignFeeType('flat')}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${designFeeType === 'flat' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'}`}
                                    >
                                        <IndianRupee className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <input
                                    type="number"
                                    value={designFeeValue}
                                    onChange={(e) => setDesignFeeValue(e.target.value)}
                                    className="w-20 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                                    placeholder={designFeeType === 'percentage' ? '%' : '₹'}
                                />
                                <span className="font-medium text-[var(--color-text-primary)]">{formatCurrency(calculatedDesignFee)}</span>
                            </div>
                        </div>

                        {/* Subtotal */}
                        <div className="flex justify-between items-center py-2 border-t border-[var(--color-border)]">
                            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Subtotal</span>
                            <span className="font-semibold text-[var(--color-text-primary)]">{formatCurrency(taxableAmount)}</span>
                        </div>

                        {/* Tax */}
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-[var(--color-text-muted)]">Tax ({taxPercentage}%)</span>
                            <span className="font-medium text-[var(--color-text-primary)]">{formatCurrency(taxAmount)}</span>
                        </div>

                        {/* Final Total */}
                        <div className="flex justify-between items-center py-3 border-t-2 border-[var(--color-accent)] bg-gradient-to-r from-[var(--color-accent)]/5 to-amber-50 -mx-5 px-5 mt-2">
                            <span className="font-bold text-[var(--color-text-primary)]">Grand Total</span>
                            <span className="text-2xl font-bold">{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions Card */}
                <div className="card p-5">
                    <div className="flex items-center mb-4">
                        <h3 className="font-semibold text-[var(--color-text-primary)]">Actions</h3>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleSaveFinalTotal}
                            disabled={isSaving || isPrinting || isSendingEmail}
                            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSaving ? 'Saving...' : 'Save Totals'}
                        </button>

                        <button
                            onClick={handleDownloadPdf}
                            disabled={isPrinting || isSaving || isSendingEmail}
                            className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isPrinting ? (
                                <div className="w-4 h-4 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isPrinting ? 'Generating...' : 'Download PDF'}
                        </button>

                        <button
                            onClick={handleSendEmail}
                            disabled={isSendingEmail || isPrinting || isSaving}
                            className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSendingEmail ? (
                                <div className="w-4 h-4 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
                            ) : (
                                <Mail className="w-4 h-4" />
                            )}
                            {isSendingEmail ? 'Sending...' : 'Email to Client'}
                        </button>
                    </div>
                </div>


            </div>

            {/* Right - Preview Area */}
            <div className="xl:col-span-3">
                <div className="bg-stone-100 rounded-2xl p-6 overflow-x-auto">
                    <div ref={printRef} className="bg-white rounded-lg shadow-xl w-[210mm] min-h-[297mm] p-10 mx-auto text-stone-800 text-sm print:shadow-none">

                        {/* Document Header */}
                        <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-stone-100">
                            <div>
                                {settings.logo_url && <img src={getImageUrl(settings.logo_url)} alt="Logo" className="h-14 mb-4 object-contain" />}
                                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{settings.company_name}</h1>
                                <p className="text-stone-500 mt-2 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                    {settings.company_address}
                                </p>
                                <p className="text-stone-500 mt-1 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                    {settings.company_phone}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="inline-block px-4 py-2 rounded-xl text-2xl font-semibold tracking-wide mb-4">
                                    QUOTATION
                                </div>
                                <div className="space-y-1 text-stone-600">
                                    <p className="flex items-center justify-end gap-2">
                                        <span className="text-stone-400">Date:</span>
                                        <span className="font-medium">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </p>
                                    <p className="flex items-center justify-end gap-2">
                                        <span className="text-stone-400">Ref:</span>
                                        <span className="font-medium font-mono">QT-{String(quotation.id).padStart(4, '0')}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Client Info */}
                        <div className="mb-10 p-5 bg-stone-50 rounded-xl">
                            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Bill To</p>
                            <p className="text-lg font-bold text-stone-900 flex items-center gap-2">

                                {quotation.client_name || 'Client Name'}
                            </p>
                            {quotation.client_address && (
                                <p className="text-stone-600 mt-1">{quotation.client_address}</p>
                            )}
                        </div>

                        {/* Room Sections with Material Tables */}
                        <div className="mb-10">
                            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">Project Details</h3>

                            {rooms.map((room, roomIndex) => {
                                const roomTotal = (room.materials || []).reduce((s, m) => s + (m.price * m.quantity), 0);
                                return (
                                    <div key={room.id} className="mb-6 break-inside-avoid">
                                        {/* Room Header */}
                                        <div className="flex justify-between items-center bg-gradient-to-r from-stone-100 to-stone-50 px-4 py-3 rounded-t-lg border border-stone-200 border-b-0">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold">
                                                    {roomIndex + 1}.
                                                </div>
                                                <span className="font-semibold text-stone-800">{room.name}</span>
                                            </div>
                                            <span className="font-bold">{formatCurrency(roomTotal)}</span>
                                        </div>

                                        {/* Materials Table */}
                                        <table className="w-full border border-stone-200 rounded-b-lg overflow-hidden">
                                            <thead>
                                                <tr className="bg-stone-50 text-xs text-stone-500 uppercase tracking-wide">
                                                    <th className="py-2.5 px-4 text-left font-medium">Description</th>
                                                    <th className="py-2.5 px-4 text-right font-medium">Rate</th>
                                                    <th className="py-2.5 px-4 text-center font-medium">Qty</th>
                                                    <th className="py-2.5 px-4 text-right font-medium">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {room.materials && room.materials.map((m, idx) => (
                                                    <tr key={m.id} className={`border-t border-stone-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}`}>
                                                        <td className="py-3 px-4">
                                                            <div className="font-medium text-stone-800">{m.name}</div>
                                                            {m.specification && <div className="text-xs text-stone-500 mt-0.5">{m.specification}</div>}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-stone-700 whitespace-nowrap">{formatCurrency(m.price)}</td>
                                                        <td className="py-3 px-4 text-center text-stone-700">
                                                            {m.quantity} <span className="text-xs text-stone-400">{m.unit}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-medium text-stone-800 whitespace-nowrap">{formatCurrency(m.price * m.quantity)}</td>
                                                    </tr>
                                                ))}
                                                {(!room.materials || room.materials.length === 0) && (
                                                    <tr>
                                                        <td colSpan="4" className="py-6 text-center text-stone-400 italic">No materials added</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}

                            {rooms.length === 0 && (
                                <div className="text-center py-12 text-stone-400">
                                    <Home className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                    <p>No rooms added to this quotation</p>
                                </div>
                            )}
                        </div>

                        {/* Footer - Totals & Terms */}
                        <div className="flex gap-8 break-inside-avoid pt-6 border-t-2 border-stone-200">
                            {/* Terms */}
                            <div className="flex-1">
                                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Terms & Conditions</h4>
                                <p className="text-[11px] text-stone-500 whitespace-pre-line leading-relaxed">{settings.terms_and_conditions}</p>
                            </div>

                            {/* Totals */}
                            <div className="w-72">
                                <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between text-stone-600">
                                            <span>Material Cost</span>
                                            <span className="font-medium">{formatCurrency(materialsTotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-stone-600">
                                            <span>Labor Cost</span>
                                            <span className="font-medium">{formatCurrency(laborCost)}</span>
                                        </div>
                                        <div className="flex justify-between text-stone-600">
                                            <span>Design Fee {designFeeType === 'percentage' && <span className="text-stone-400">({designFeeValue}%)</span>}</span>
                                            <span className="font-medium">{formatCurrency(calculatedDesignFee)}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-stone-200 font-medium text-stone-800">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(taxableAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-stone-600">
                                            <span>Tax ({taxPercentage}%)</span>
                                            <span className="font-medium">{formatCurrency(taxAmount)}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between pt-4 mt-4 border-t-2 border-[#A65D38]">
                                        <span className="text-lg font-bold text-stone-900">Total</span>
                                        <span className="text-xl font-bold">{formatCurrency(finalTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewTab;
