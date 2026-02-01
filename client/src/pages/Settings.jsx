import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { API_URL } from '../config';
import { Save, Store, Mail, Phone, FileText, Image } from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState({
        company_name: '',
        company_address: '',
        company_email: '',
        company_phone: '',
        default_terms: '',
        logo_url: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Helper to get full image URL
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        // Assume API_URL is http://localhost:3001/api/v1, we want http://localhost:3001
        const baseUrl = API_URL.replace('/api/v1', '');
        return `${baseUrl}${url}`;
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Use default terms if none saved, otherwise use saved or empty string to prevent null
            const defaultTermsText = '1. This quotation includes only the work and materials specifically mentioned above. Any additional or modified work will be charged separately.\n2. Prices are valid for a limited period and may change due to variation in material costs or project requirements.\n3. Payments must be made as per agreed milestones. Delay in payment may result in temporary suspension of work.\n4. The client shall ensure site readiness, including access, electricity, water, and necessary permissions before commencement of work.\n5. Once materials, designs, shades, or finishes are finalized and ordered, they cannot be cancelled or returned. Any changes will be charged additionally.\n6. The service provider shall not be responsible for delays or damages caused due to site conditions, third-party work, natural events, or circumstances beyond control.';

            setSettings({
                company_name: res.data.company_name || '',
                company_address: res.data.company_address || '',
                company_email: res.data.company_email || '',
                company_phone: res.data.company_phone || '',
                default_terms: res.data.default_terms || defaultTermsText,
                logo_url: res.data.logo_url || ''
            });
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");

            const formData = new FormData();
            Object.keys(settings).forEach(key => {
                formData.append(key, settings[key]);
            });
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const res = await axios.put(`${API_URL}/settings`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSettings(prev => ({ ...prev, logo_url: res.data.logo_url || prev.logo_url }));
            setLogoFile(null); // Clear selected file after upload
            alert("Settings saved successfully!");
        } catch (err) {
            console.error("Failed to save settings", err);
            alert("Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading settings...</div>;

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden mt-16 md:mt-0 p-6 md:p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Company Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your company details and default preferences.</p>
                </header>

                <form onSubmit={handleSave} className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 animate-fade-in-up">

                    {/* Company Identity */}
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <Store className="w-5 h-5 text-indigo-600" />
                            Identity
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                                <input type="text" name="company_name" value={settings.company_name} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="e.g. Acme Interiors" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Logo</label>
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Image className="w-4 h-4" /></div>
                                            <input type="text" name="logo_url" value={settings.logo_url} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="Enter URL or upload below..." />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setLogoFile(e.target.files[0])}
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-indigo-50 file:text-indigo-700
                                                hover:file:bg-indigo-100
                                            "
                                        />
                                        {(logoFile || settings.logo_url) && (
                                            <img
                                                src={logoFile ? URL.createObjectURL(logoFile) : getImageUrl(settings.logo_url)}
                                                alt="Preview"
                                                className="h-16 w-16 object-contain border rounded bg-gray-50 shadow-sm"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Contact Info */}
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-indigo-600" />
                            Contact Details
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <input type="email" name="company_email" value={settings.company_email} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="contact@company.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                <input type="text" name="company_phone" value={settings.company_phone} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="+91 98765 43210" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Office Address</label>
                                <textarea name="company_address" rows="3" value={settings.company_address} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition" placeholder="Full office address..." />
                            </div>
                        </div>
                    </section>

                    {/* Defaults */}
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            Quotation Defaults
                        </h2>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Default Terms & Conditions</label>
                            <textarea name="default_terms" rows="6" value={settings.default_terms} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition font-mono text-sm" placeholder="1. Payment terms...&#10;2. Validity..." />
                            <p className="text-xs text-gray-500 mt-2">These terms will automatically appear on all new quotations.</p>
                        </div>
                    </section>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition disabled:opacity-70">
                            <Save className="w-5 h-5" />
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
