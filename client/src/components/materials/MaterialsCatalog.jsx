import React from 'react';
import { Search, Plus, Minus, Trash2, Edit, Package2 } from 'lucide-react';

const MaterialsCatalog = ({
    searchTerm,
    setSearchTerm,
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
        <div className="flex-1 flex flex-col overflow-hidden bg-stone-50">
            {/* Search Bar */}
            <div className="bg-white border-b border-stone-200 px-8 py-5">
                <div className="max-w-[1600px] mx-auto flex items-center gap-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search materials by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setIsCustomModalOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40"
                    >
                        <Plus className="w-5 h-5 inline-block mr-2" />
                        Custom Item
                    </button>
                </div>
            </div>

            {/* Table View */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-[1600px] mx-auto px-8 py-6">
                    {filteredMaterials.length > 0 ? (
                        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            {/* Table Header */}
                            <div className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                                    <div className="col-span-4">Material</div>
                                    <div className="col-span-2">Category</div>
                                    <div className="col-span-2 text-right">Price</div>
                                    <div className="col-span-2 text-center">Status</div>
                                    <div className="col-span-2 text-right">Actions</div>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-stone-100">
                                {filteredMaterials.map(material => {
                                    const roomMat = activeRoomMaterials.find(m => Number(m.material_id) === Number(material.id));
                                    const isAdded = !!roomMat;

                                    return (
                                        <div
                                            key={material.id}
                                            className={`grid grid-cols-12 gap-4 px-6 py-5 items-center transition-all hover:bg-orange-50/50 ${isAdded ? 'bg-orange-50/30' : ''
                                                }`}
                                        >
                                            {/* Material Name */}
                                            <div className="col-span-4 flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                                                    <Package2 className="w-6 h-6 text-orange-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-stone-900 text-base">
                                                        {material.name}
                                                    </h3>
                                                    <p className="text-sm text-stone-500">{material.unit}</p>
                                                </div>
                                            </div>

                                            {/* Category */}
                                            <div className="col-span-2">
                                                <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                                                    {material.category || 'General'}
                                                </span>
                                            </div>

                                            {/* Price */}
                                            <div className="col-span-2 text-right">
                                                <div className="text-lg font-bold text-stone-900">
                                                    {formatCurrency(material.price)}
                                                </div>
                                                <div className="text-xs text-stone-500">per {material.unit}</div>
                                            </div>

                                            {/* Status/Quantity */}
                                            <div className="col-span-2">
                                                {isAdded ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                roomMat.quantity > 1
                                                                    ? handleUpdateMaterialQuantity(roomMat.id, roomMat.quantity - 1)
                                                                    : handleDeleteMaterialFromRoom(roomMat.id, material.name)
                                                            }
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-12 text-center font-bold text-stone-900 text-lg">
                                                            {roomMat.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => handleUpdateMaterialQuantity(roomMat.id, roomMat.quantity + 1)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-stone-50 text-stone-500">
                                                            Not Added
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-2 flex items-center justify-end gap-2">
                                                {isAdded ? (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditingRoomItem(roomMat);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 hover:text-stone-900 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMaterialFromRoom(roomMat.id, material.name)}
                                                            className="p-2 hover:bg-red-50 rounded-lg text-stone-500 hover:text-red-600 transition-colors"
                                                            title="Remove"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddMaterialToRoom(material.id, 1)}
                                                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
                                                    >
                                                        Add to Room
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-stone-200 p-16 text-center">
                            <Package2 className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-stone-900 mb-2">No materials found</h3>
                            <p className="text-stone-500">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaterialsCatalog;
