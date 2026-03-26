import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Save, Store, Mail, Phone, FileText, Image, Users, UserPlus, Trash2, Shield, Lock, User } from 'lucide-react';

const Settings = () => {
    const navigate = useNavigate();
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

    // Staff Management State
    const [activeTab, setActiveTab] = useState('company');
    const [staffList, setStaffList] = useState([]);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);
    const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({ username: '', email: '', password: '' });
    const [isCreatingStaff, setIsCreatingStaff] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState('staff'); // Default safety

    // Helper to get full image URL
    const getImageUrl = (url) => {
        if (!url) return null;
        const normalizedUrl = url.replace(/\\/g, '/');
        if (normalizedUrl.startsWith('http')) return normalizedUrl;
        if (normalizedUrl === '/logo.jpg') return normalizedUrl;
        const baseUrl = API_URL.replace('/api/v1', '');
        return `${baseUrl}/${normalizedUrl.replace(/^\//, '')}`;
    };

    useEffect(() => {
        // Decode token to get role
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload.role || 'staff';
                setCurrentUserRole(role);
                // Redirect if not admin
                if (role !== 'admin') {
                    navigate('/');
                }
            } catch (e) { console.error("Token decode error", e); }
        }
        fetchSettings();
    }, []);

    useEffect(() => {
        if (activeTab === 'staff') {
            fetchStaff();
        }
    }, [activeTab]);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Use default terms if none saved, otherwise use saved or empty string to prevent null
            const defaultTermsText = '1. This quotation includes only the work and materials specifically mentioned above. Any additional or modified work will be charged separately.\n2. Prices are valid for a limited period and may change due to variation in material costs or project requirements.\n3. Payments must be made as per agreed milestones. Delay in payment may result in temporary suspension of work.\n4. The client shall ensure site readiness, including access, electricity, water, and necessary permissions before commencement of work.\n5. Once materials, designs, shades, or finishes are finalized and ordered, they cannot be cancelled or returned. Any changes will be charged additionally.\n6. The service provider shall not be responsible for delays or damages caused due to site conditions, third-party work, natural events, or circumstances beyond control.';

            setSettings({
                company_name: res.data.company_name || 'My Interior Design Co.',
                company_address: res.data.company_address || '123 Design Street, Creative City',
                company_email: res.data.company_email || 'contact@designco.com',
                company_phone: res.data.company_phone || '+91 98765 43210',
                default_terms: res.data.default_terms || defaultTermsText,
                logo_url: res.data.logo_url || '/logo.jpg'
            });
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStaff = async () => {
        setIsLoadingStaff(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/staff`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaffList(res.data);
        } catch (err) {
            console.error("Failed to fetch staff", err);
        } finally {
            setIsLoadingStaff(false);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setIsCreatingStaff(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${API_URL}/staff`, newStaff, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewStaff({ username: '', email: '', password: '' });
            setIsAddStaffModalOpen(false);
            fetchStaff();
            alert("Staff member added successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create staff.");
        } finally {
            setIsCreatingStaff(false);
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm("Are you sure you want to remove this staff member? They will lose access immediately.")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/staff/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaffList(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert("Failed to delete staff member.");
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
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-gray-500 mt-1">Manage company details {currentUserRole === 'admin' ? '& staff access' : ''}.</p>
            </header>

            {/* Tabs (Admin Only sees Staff tab?) - Assuming standard users see Settings but maybe restricted? 
                Actually plan said Settings is Admin Only. So if we are here, we are likely Admin. 
                But let's be safe and conditional render. 
            */}
            {currentUserRole === 'admin' && (
                <div className="flex justify-center mb-8">
                    <div className="inline-flex bg-white p-1.5 rounded-2xl shadow-sm border border-[var(--color-border)]">
                        <button
                            onClick={() => setActiveTab('company')}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                ${activeTab === 'company'
                                    ? 'bg-[var(--color-accent)] text-white shadow-md'
                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-stone-50'}
                            `}
                        >
                            {/* <Store className="w-4 h-4" /> */}
                            Company Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('staff')}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                ${activeTab === 'staff'
                                    ? 'bg-[var(--color-accent)] text-white shadow-md'
                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-stone-50'}
                            `}
                        >
                            {/* <Users className="w-4 h-4" /> */}
                            Staff Management
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'company' && (
                <form onSubmit={handleSave} className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 animate-fade-in-up">
                    {/* ... Existing fields ... */}

                    {/* Company Identity */}
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            {/* <Store className="w-5 h-5 text-theme-orange" /> */}
                            Identity
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                                <input type="text" name="company_name" value={settings.company_name} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-orange outline-none transition" placeholder="e.g. Acme Interiors" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Logo</label>
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Image className="w-4 h-4" /></div>
                                            <input type="text" name="logo_url" value={settings.logo_url} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-orange outline-none transition" placeholder="Enter URL or upload below..." />
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
                                                file:bg-orange-50 file:text-theme-orange
                                                hover:file:bg-orange-100
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
                            {/* <Mail className="w-5 h-5 text-theme-orange" /> */}
                            Contact Details
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <input type="email" name="company_email" value={settings.company_email} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-orange outline-none transition" placeholder="contact@company.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                <input type="text" name="company_phone" value={settings.company_phone} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-orange outline-none transition" placeholder="+91 98765 43210" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Office Address</label>
                                <textarea name="company_address" rows="3" value={settings.company_address} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-orange outline-none resize-none transition" placeholder="Full office address..." />
                            </div>
                        </div>
                    </section>

                    {/* Defaults */}
                    {/* <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-theme-orange" />
                            Quotation Defaults
                        </h2>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Default Terms & Conditions</label>
                            <textarea name="default_terms" rows="6" value={settings.default_terms} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-orange outline-none resize-none transition font-mono text-sm" placeholder="1. Payment terms...&#10;2. Validity..." />
                            <p className="text-xs text-gray-500 mt-2">These terms will automatically appear on all new quotations.</p>
                        </div>
                    </section> */}

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-theme-orange text-white font-medium rounded-lg hover:bg-orange-700 shadow-sm transition disabled:opacity-70">
                            <Save className="w-5 h-5" />
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'staff' && (
                <div className="animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Team Members</h2>
                        <button onClick={() => setIsAddStaffModalOpen(true)} className="btn-primary flex items-center gap-2">
                            Add Staff
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {isLoadingStaff ? (
                            <div className="p-8 text-center text-gray-500">Loading staff...</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Joined</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {staffList.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{staff.username}</div>
                                                        <div className="text-xs text-gray-500">{staff.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Staff
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(staff.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDeleteStaff(staff.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remove Access">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {staffList.length === 0 && (
                                        <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No staff members found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Add Staff Modal */}
            {isAddStaffModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Add New Staff Member</h3>
                            <button onClick={() => setIsAddStaffModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                                <input type="text" required value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange outline-none" placeholder="e.g. john_doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input type="email" required value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange outline-none" placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input type="text" required value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-orange outline-none font-mono" placeholder="Temporary password" />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Share this password with the staff member securely.</p>
                            </div>
                            <div className="pt-2">
                                <button type="submit" disabled={isCreatingStaff} className="w-full btn-primary py-3">
                                    {isCreatingStaff ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
