import React, { useEffect, useState } from 'react';
import axios from "axios";
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import { Search, Package, Plus, X, Edit3, Trash2 } from 'lucide-react';

const Materials = () => {
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newMaterial, setNewMaterial] = useState({ name: '', category: '', unit: '', price: '', default_description: '' });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMaterials = async (search = '') => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.get(`${API_URL}/materials`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search }
            });
            setMaterials(res.data);
        } catch (err) {
            console.error("Error fetching Materials:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounceFetch = setTimeout(() => { fetchMaterials(searchTerm); }, 300);
        return () => clearTimeout(debounceFetch);
    }, [searchTerm]);

    useEffect(() => { fetchMaterials(''); }, []);

    const handleDeleteMaterial = async (materialId, materialName) => {
        if (!window.confirm(`Delete "${materialName}"?`)) return;
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            await axios.delete(`${API_URL}/materials/${materialId}`, { headers: { Authorization: `Bearer ${token}` } });
            setMaterials(materials.filter(m => m.id !== materialId));
        } catch (err) {
            console.error("Error deleting material:", err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMaterial(prev => ({ ...prev, [name]: value }));
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditingMaterial(prev => ({ ...prev, [name]: value }));
    };

    const handleAddMaterial = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            await axios.post(`${API_URL}/materials`, newMaterial, { headers: { Authorization: `Bearer ${token}` } });
            await fetchMaterials();
            setIsAddModalOpen(false);
            setNewMaterial({ name: '', category: '', unit: '', price: '', default_description: '' });
        } catch (err) {
            console.error("Error adding material:", err);
            alert("Failed to add material.");
        }
    };

    const handleEditClick = (material) => {
        setEditingMaterial(material);
        setIsEditModalOpen(true);
    };

    const handleUpdateMaterial = async (e) => {
        e.preventDefault();
        if (!editingMaterial) return;
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.put(`${API_URL}/materials/${editingMaterial.id}`, editingMaterial, { headers: { Authorization: `Bearer ${token}` } });
            setMaterials(materials.map(m => m.id === editingMaterial.id ? res.data : m));
            setIsEditModalOpen(false);
            setEditingMaterial(null);
        } catch (err) {
            console.error("Error updating material:", err);
            alert("Failed to update material.");
        }
    };

    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);

    const MaterialFormModal = ({ isOpen, onClose, title, onSubmit, data, onChange, submitLabel }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="card w-full max-w-md p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--color-bg-subtle)] rounded-lg transition">
                            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                        </button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name *</label>
                            <input type="text" name="name" value={data.name} onChange={onChange} required className="input" placeholder="Material name" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Category</label>
                                <input type="text" name="category" value={data.category} onChange={onChange} className="input" placeholder="e.g. Wood" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Unit *</label>
                                <input type="text" name="unit" value={data.unit} onChange={onChange} required className="input" placeholder="e.g. sqft" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Price *</label>
                            <input type="number" name="price" value={data.price} onChange={onChange} required step="0.01" className="input" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Default Specification</label>
                            <textarea name="default_description" value={data.default_description || ''} onChange={onChange} rows="2" className="input resize-none" placeholder="Template specification..." />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary">{submitLabel}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Materials</h1>
                        <p className="text-[var(--color-text-secondary)] mt-1">Manage your materials and pricing catalog</p>
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Material
                    </button>
                </div>

                {/* Search */}
                <div className="mb-8 animate-fade-in animation-delay-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search materials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-12"
                        />
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="card p-8 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded" />)}
                        </div>
                    </div>
                ) : materials.length > 0 ? (
                    <div className="card overflow-hidden animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[var(--color-bg-subtle)]">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Unit</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {materials.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-[var(--color-bg-subtle)]/50 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-[var(--color-accent)] text-xs font-bold">
                                                        {item.name?.charAt(0) || 'M'}
                                                    </div>
                                                    <span className="font-medium text-[var(--color-text-primary)]">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                                                {item.category || <span className="italic text-[var(--color-text-muted)]">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{item.unit}</td>
                                            <td className="px-6 py-4 text-right font-medium text-[var(--color-text-primary)]">{formatCurrency(item.price)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditClick(item)} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-subtle)] rounded-lg transition">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteMaterial(item.id, item.name)} className="p-2 text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="card p-12 text-center animate-fade-in">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-subtle)] flex items-center justify-center">
                            <Package className="w-8 h-8 text-[var(--color-text-muted)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No materials found</h3>
                        <p className="text-[var(--color-text-secondary)]">
                            {searchTerm ? `No results for "${searchTerm}"` : 'Add your first material to get started'}
                        </p>
                    </div>
                )}
            </main>

            {/* Modals */}
            <MaterialFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Material"
                onSubmit={handleAddMaterial}
                data={newMaterial}
                onChange={handleInputChange}
                submitLabel="Add Material"
            />
            <MaterialFormModal
                isOpen={isEditModalOpen && !!editingMaterial}
                onClose={() => { setIsEditModalOpen(false); setEditingMaterial(null); }}
                title="Edit Material"
                onSubmit={handleUpdateMaterial}
                data={editingMaterial || {}}
                onChange={handleEditInputChange}
                submitLabel="Save Changes"
            />
        </div>
    );
};

export default Materials;