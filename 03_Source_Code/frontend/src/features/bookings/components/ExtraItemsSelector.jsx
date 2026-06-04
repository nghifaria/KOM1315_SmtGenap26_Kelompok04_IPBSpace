import React, { useState } from 'react';
import { Plus, Trash } from '@phosphor-icons/react';
import NumberCounter from '../../../shared/components/forms/NumberCounter';

export default function ExtraItemsSelector({ 
  selectedItems, 
  onItemsChange, 
  availableItemsList, 
  isLoading 
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleItemQuantityChange = (itemId, change) => {
    const existing = selectedItems.find(i => i.itemId === itemId);
    let newQuantity = (existing ? existing.quantity : 0) + change;
    
    if (newQuantity < 0) newQuantity = 0;

    let updatedItems = [...selectedItems];
    if (newQuantity === 0) {
      updatedItems = updatedItems.filter(i => i.itemId !== itemId);
    } else if (existing) {
      updatedItems = updatedItems.map(i => i.itemId === itemId ? { ...i, quantity: newQuantity } : i);
    } else {
      updatedItems.push({ itemId, quantity: newQuantity });
    }

    onItemsChange(updatedItems);
  };

  const selectedItemIds = selectedItems.map(i => i.itemId);
  const availableDropdownItems = (availableItemsList || []).filter(
    item => item?.item && !selectedItemIds.includes(item.item.id)
  );

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-accent pl-3">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest">Item Tambahan (Opsional)</h3>
        <p className="text-xs text-gray-400 mt-0.5 font-semibold">Pilih peralatan inventaris tambahan untuk menunjang kegiatan</p>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-gray-500 text-sm font-semibold animate-pulse">Memuat inventaris tambahan...</div>
      ) : (
        <div className="space-y-4">
          
          {/* Premium Custom Dropdown Overlay */}
          {availableDropdownItems.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full py-3.5 px-4 bg-gray-50 hover:bg-gray-100/60 border border-gray-250 rounded-xl focus:ring-2 focus:ring-accent focus:bg-white outline-none text-sm font-bold text-gray-700 transition-all cursor-pointer flex items-center justify-between shadow-sm"
              >
                <span>+ Tambah Item Inventaris Tambahan...</span>
                <Plus 
                  size={16} 
                  className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-45 text-danger' : 'text-accent'}`} 
                  weight="bold" 
                />
              </button>

              {isDropdownOpen && (
                <>
                  {/* Close overlay backdrop */}
                  <div 
                    className="fixed inset-0 z-20 cursor-default" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  
                  {/* Floating menu card */}
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-surface-container rounded-xl shadow-ambient z-30 py-2 max-h-60 overflow-y-auto transform-gpu transition-all animate-fade-in">
                    {availableDropdownItems.map(item => (
                      <div
                        key={item.item.id}
                        onClick={() => {
                          handleItemQuantityChange(item.item.id, 1);
                          setIsDropdownOpen(false);
                        }}
                        className="hover:bg-surface-bright/70 px-4 py-3 transition-colors text-sm font-extrabold text-on-surface cursor-pointer flex items-center justify-between group border-b border-gray-50 last:border-b-0"
                      >
                        <span className="group-hover:text-primary transition-colors pr-2">{item.item.name}</span>
                        <span className="text-xs bg-surface-dim px-2.5 py-1 rounded-full text-on-surface-variant/80 font-black border border-surface-container/60 shrink-0">
                          Tersedia: {item.item.available_stock} unit
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            availableItemsList && availableItemsList.length > 0 && (
              <p className="text-xs text-emerald-800 font-extrabold bg-emerald-50 p-3 rounded-lg border border-emerald-100/50">
                ✓ Semua peralatan tambahan yang tersedia telah terpilih.
              </p>
            )
          )}

          {/* Render only currently selected items */}
          {selectedItems.length > 0 ? (
            <div className="space-y-3">
              {selectedItems.map(sel => {
                const itemDetail = availableItemsList.find(item => item?.item?.id === sel.itemId);
                if (!itemDetail) return null;

                const name = itemDetail.item.name;
                const maxQty = itemDetail.item.available_stock;

                return (
                  <div 
                    key={sel.itemId} 
                    className="flex items-center justify-between bg-surface-bright/50 p-4 rounded-xl border border-surface-container/60 shadow-sm transition-all hover:bg-surface-bright group"
                  >
                    <div className="pr-2">
                      <p className="font-extrabold text-on-surface text-sm leading-tight">{name}</p>
                      <p className="text-xs text-on-surface-variant/70 mt-1 font-semibold">Tersedia: {maxQty} unit</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <NumberCounter 
                        value={sel.quantity}
                        min={1}
                        max={maxQty}
                        onChange={(newQty) => {
                          const diff = newQty - sel.quantity;
                          handleItemQuantityChange(sel.itemId, diff);
                        }}
                      />

                      {/* Remove trash button */}
                      <button
                        type="button"
                        onClick={() => {
                          const updatedItems = selectedItems.filter(i => i.itemId !== sel.itemId);
                          onItemsChange(updatedItems);
                        }}
                        className="p-1.5 ml-1 rounded-full text-danger hover:bg-red-50 transition-colors shadow-sm"
                        title="Hapus Item"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-400 text-xs italic bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200 text-center">
              Belum ada peralatan tambahan yang dipilih. Gunakan dropdown di atas untuk meminjam inventaris pendukung jika diperlukan.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
