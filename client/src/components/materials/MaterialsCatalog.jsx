import React from 'react';
import { Search, Grid3X3, LayoutList, Filter, Plus, Package, Check, Minus, Edit2, IndianRupee } from 'lucide-react';

const MaterialsCatalog = ({
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredMaterials,
    activeRoomMaterials,
    handleAddMaterialToRoom,
    handleUpdateMaterialQuantity,
    handleDeleteMaterialFromRoom,
    setEditingRoomItem,
    setIsEditModalOpen,
    setIsCustomModalOpen,
    formatCurrency
}) => {
    return (
        <div className="lg:col-span-2">
            {/* Search & Filters Card */}
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 mb-5 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search materials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-stone-50 border-0 rounded-xl text-[var(--color-text-primary)] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[var(--color-accent)] text-white shadow-md' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                            <Grid3X3 className="w-5 h-5" />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[var(--color-accent)] text-white shadow-md' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                            <LayoutList className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <Filter className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-[var(--color-accent)] text-white shadow-md transform scale-105' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Materials Grid/List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Add Custom Card */}
                    <div onClick={() => setIsCustomModalOpen(true)} className="group bg-white rounded-2xl border-2 border-dashed border-[var(--color-accent)]/30 p-6 flex flex-col items-center justify-center text-center hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-all cursor-pointer min-h-[180px]">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all transform group-hover:scale-110">
                            <Plus className="w-6 h-6 text-[var(--color-accent)] group-hover:text-white" />
                        </div>
                        <p className="font-semibold text-sm text-[var(--color-text-primary)]">Custom Item</p>
                        <p className="text-xs text-stone-400 mt-1">Add unlisted item</p>
                    </div>

                    {filteredMaterials.map(material => {
                        const roomMat = activeRoomMaterials.find(m => Number(m.material_id) === Number(material.id));
                        const isAdded = !!roomMat;
                        return (
                            <div key={material.id} className={`group bg-white rounded-2xl border p-4 transition-all hover:shadow-lg cursor-pointer transform hover:-translate-y-1 ${isAdded ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 ring-1 ring-[var(--color-accent)]' : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40'}`} onClick={() => !isAdded && handleAddMaterialToRoom(material.id, 1)}>
                                <div className="flex items-start justify-between mb-3">
                                    <span className="px-2 py-0.5 rounded bg-white/50 text-[10px] font-medium text-stone-500 uppercase border border-stone-100">{material.category || 'General'}</span>
                                    {isAdded && <div className="w-6 h-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center shadow-sm animate-scale-in"><Check className="w-3.5 h-3.5 text-white" /></div>}
                                </div>
                                <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-2 line-clamp-2 h-10">{material.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-[var(--color-text-primary)]">{formatCurrency(material.price)}</span>
                                    <span className="text-xs text-stone-400">/{material.unit}</span>
                                </div>
                                {isAdded && (
                                    <div className="mt-3 pt-3 border-t border-[var(--color-accent)]/20 flex items-center justify-between animate-fade-in" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-stone-100">
                                            <button onClick={() => roomMat.quantity > 1 ? handleUpdateMaterialQuantity(roomMat.id, roomMat.quantity - 1) : handleDeleteMaterialFromRoom(roomMat.id, material.name)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 transition-colors text-stone-600"><Minus className="w-3.5 h-3.5" /></button>
                                            <span className="w-8 text-center font-bold text-sm text-[var(--color-text-primary)]">{roomMat.quantity}</span>
                                            <button onClick={() => handleUpdateMaterialQuantity(roomMat.id, roomMat.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors shadow-sm"><Plus className="w-3.5 h-3.5" /></button>
                                        </div>
                                        <button onClick={() => { setEditingRoomItem(roomMat); setIsEditModalOpen(true); }} className="p-1.5 text-stone-400 hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] shadow-sm">
                    <div onClick={() => setIsCustomModalOpen(true)} className="p-4 flex items-center gap-4 hover:bg-stone-50 cursor-pointer transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors"><Plus className="w-6 h-6 text-[var(--color-accent)] group-hover:text-white" /></div>
                        <div><p className="font-semibold text-[var(--color-text-primary)]">Add Custom Item</p><p className="text-xs text-stone-400">Create unlisted material</p></div>
                    </div>
                    {filteredMaterials.map(material => {
                        const roomMat = activeRoomMaterials.find(m => Number(m.material_id) === Number(material.id));
                        const isAdded = !!roomMat;
                        return (
                            <div key={material.id} className={`p-4 flex items-center gap-4 transition-colors cursor-pointer ${isAdded ? 'bg-[var(--color-accent)]/5' : 'hover:bg-stone-50'}`} onClick={() => !isAdded && handleAddMaterialToRoom(material.id, 1)}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isAdded ? 'bg-[var(--color-accent)] text-white shadow-md' : 'bg-stone-100 text-stone-400'}`}><Package className="w-6 h-6" /></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2"><p className="font-semibold text-[var(--color-text-primary)] truncate">{material.name}</p><span className="px-2 py-0.5 rounded bg-stone-100 text-[10px] font-medium text-stone-500 uppercase">{material.category}</span></div>
                                    <p className="text-sm text-stone-500">{formatCurrency(material.price)} / {material.unit}</p>
                                </div>
                                {isAdded ? (
                                    <div className="flex items-center gap-3 animate-fade-in" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-stone-200 shadow-sm">
                                            <button onClick={() => roomMat.quantity > 1 ? handleUpdateMaterialQuantity(roomMat.id, roomMat.quantity - 1) : handleDeleteMaterialFromRoom(roomMat.id, material.name)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 transition-colors"><Minus className="w-4 h-4" /></button>
                                            <span className="w-8 text-center font-bold text-sm">{roomMat.quantity}</span>
                                            <button onClick={() => handleUpdateMaterialQuantity(roomMat.id, roomMat.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded bg-[var(--color-accent)] text-white"><Plus className="w-4 h-4" /></button>
                                        </div>
                                        <button onClick={() => { setEditingRoomItem(roomMat); setIsEditModalOpen(true); }} className="p-2 text-stone-400 hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <button className="p-2 text-stone-400 hover:text-[var(--color-accent)] transition-colors"><Plus className="w-5 h-5" /></button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {filteredMaterials.length === 0 && (
                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-stone-300" />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No materials found</h3>
                    <p className="text-stone-500 mt-1">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
};

export default MaterialsCatalog;
