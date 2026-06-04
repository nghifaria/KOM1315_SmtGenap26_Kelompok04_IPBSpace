import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarPlus, Plus, Tag } from '@phosphor-icons/react';

export default function ExtraItemFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  allItems = [], 
  existingExtraItems = [] 
}) {
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedItemId(null);
      setSearchQuery('');
      setIsSubmitting(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter out items that are already registered as Extra Items
  const availableItems = allItems.filter(item => {
    const isAlreadyExtra = existingExtraItems.some(ei => 
      Number(ei.item?.id) === Number(item.id) || Number(ei.item_id) === Number(item.id)
    );
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return !isAlreadyExtra && matchesSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ item_id: Number(selectedItemId) });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#02275D]/45 backdrop-blur-[5px] animate-fade-in cursor-default"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-slide-up z-10 flex flex-col border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <CalendarPlus size={22} weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 leading-tight">
                Tambah Layanan Tambahan (Extra)
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Aktifkan inventaris barang standar menjadi pilihan layanan tambahan bagi peminjam ruangan.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-accent focus:border-accent rounded-xl px-4 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm"
            placeholder="Cari barang standar..."
          />
        </div>

        {/* Body Checklist */}
        <div className="p-6 overflow-y-auto flex-1 max-h-[50vh] space-y-2 bg-slate-50/20">
          {availableItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Tag size={36} weight="duotone" className="mx-auto mb-2 opacity-50" />
              <p className="font-bold text-xs">Tidak ada barang standar yang tersedia untuk dijadikan Extra Item.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? 'bg-accent/5 border-accent text-accent font-black shadow-sm ring-1 ring-accent' 
                        : 'bg-white border-slate-200 hover:border-slate-350 text-slate-600'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-accent bg-accent text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && <span className="text-[10px] font-black">✓</span>}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                        Stok: {item.available_stock} • {item.category}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedItemId}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-accent text-white hover:bg-accent-hover disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Plus size={18} weight="bold" />
            {isSubmitting ? 'Memproses...' : 'Aktifkan Layanan'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
