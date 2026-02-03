import React from 'react';
import { ShoppingBag, ChevronRight, Package } from 'lucide-react';

const RoomCart = ({
    activeRoom,
    activeRoomMaterials,
    roomSubtotal,
    quotationId,
    navigate,
    handleDeleteMaterialFromRoom,
    formatCurrency
}) => {
    return (
        <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Cart Header */}
                <div className="p-5 bg-gradient-to-r from-[var(--color-accent)]/10 to-amber-50/50 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center shadow-md transform rotate-3">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[var(--color-text-primary)]">{activeRoom?.name || 'Room items'}</h2>
                            <p className="text-xs text-[var(--color-text-muted)] font-medium">{activeRoomMaterials.length} items selected</p>
                        </div>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {activeRoomMaterials.length > 0 ? activeRoomMaterials.map(item => (
                        <div key={item.id} className="group bg-stone-50 rounded-xl p-3 hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-[var(--color-text-primary)] truncate" title={item.name}>{item.name}</p>
                                    <p className="text-xs text-stone-500 mt-0.5">{item.quantity} × {formatCurrency(item.price)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm text-[var(--color-text-primary)]">{formatCurrency(item.price * item.quantity)}</p>
                                    <button onClick={() => handleDeleteMaterialFromRoom(item.id, item.name)} className="text-xs text-rose-500 hover:text-rose-700 hover:underline opacity-0 group-hover:opacity-100 transition-opacity font-medium mt-1">Remove</button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Package className="w-8 h-8 text-stone-300" />
                            </div>
                            <p className="text-sm font-medium text-stone-500">Your cart is empty</p>
                            <p className="text-xs text-stone-400 mt-1 max-w-[200px] mx-auto">Select materials from the catalog to add them to this room</p>
                        </div>
                    )}
                </div>

                {/* Cart Footer */}
                <div className="p-5 border-t border-[var(--color-border)] bg-stone-50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-[var(--color-text-muted)]">Room Subtotal</span>
                        <span className="text-2xl font-bold text-[var(--color-accent)]">{formatCurrency(roomSubtotal)}</span>
                    </div>
                    <button onClick={() => navigate(`/quotations/${quotationId}`)} className="w-full btn-primary flex items-center justify-center gap-2 shadow-lg temp-glow-effect group">
                        Save & Continue <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomCart;
