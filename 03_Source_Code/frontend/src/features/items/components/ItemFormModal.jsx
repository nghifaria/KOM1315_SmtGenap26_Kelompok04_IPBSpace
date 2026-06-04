import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, FloppyDisk } from '@phosphor-icons/react';

const CATEGORY_OPTIONS = [
  { value: 'Elektronik', label: 'Elektronik / AV' },
  { value: 'Furnitur', label: 'Furnitur / Meja Kursi' },
  { value: 'Alat Tulis', label: 'Alat Tulis Kantor' },
  { value: 'Konsumsi', label: 'Konsumsi / Catering' },
  { value: 'Lainnya', label: 'Lain-lain' }
];

const CONDITION_OPTIONS = [
  { value: 'good', label: 'Baik / Layak' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'broken', label: 'Rusak / Perlu Diganti' }
];

export default function ItemFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Elektronik',
    total_stock: 0,
    available_stock: 0,
    storeroom_location: '',
    condition: 'good'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          category: initialData.category || 'Elektronik',
          total_stock: initialData.total_stock ?? 0,
          available_stock: initialData.available_stock ?? 0,
          storeroom_location: initialData.storeroom_location || '',
          condition: initialData.condition || 'good'
        });
      } else {
        setFormData({
          name: '',
          category: 'Elektronik',
          total_stock: 0,
          available_stock: 0,
          storeroom_location: '',
          condition: 'good'
        });
      }
      setIsSubmitting(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('stock') ? (parseInt(value, 10) || 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        storeroom_location: formData.storeroom_location.trim() || null
      });
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
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Package size={22} weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 leading-tight">
                {isEditing ? 'Ubah Barang Standar' : 'Tambah Barang Standar'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {isEditing ? 'Perbarui informasi inventaris barang universitas' : 'Masukkan spesifikasi inventaris barang baru'}
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

        {/* Form Body */}
        <form id="itemForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[60vh] bg-slate-50/30">
          
          <div>
            <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
              Nama Barang <span className="text-danger">*</span>
            </label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-accent focus:border-accent rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm"
              placeholder="Contoh: Proyektor LCD 4K"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                Kategori <span className="text-danger">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-accent focus:border-accent rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none transition-all shadow-sm"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                Kondisi <span className="text-danger">*</span>
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-accent focus:border-accent rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none transition-all shadow-sm"
              >
                {CONDITION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                Stok Total <span className="text-danger">*</span>
              </label>
              <input 
                type="number" 
                name="total_stock"
                value={formData.total_stock}
                onChange={handleChange}
                required
                min={0}
                className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-accent focus:border-accent rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none transition-all shadow-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                Stok Tersedia <span className="text-danger">*</span>
              </label>
              <input 
                type="number" 
                name="available_stock"
                value={formData.available_stock}
                onChange={handleChange}
                required
                min={0}
                max={formData.total_stock}
                className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-accent focus:border-accent rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none transition-all shadow-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
              Lokasi Ruang Penyimpanan / Gudang
            </label>
            <input 
              type="text" 
              name="storeroom_location"
              value={formData.storeroom_location}
              onChange={handleChange}
              className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-accent focus:border-accent rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm"
              placeholder="Contoh: Gedung Rektorat Lt. 1, Lemari B-2"
            />
          </div>

        </form>

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
            form="itemForm"
            type="submit"
            disabled={isSubmitting || !formData.name.trim() || formData.available_stock > formData.total_stock}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary-container disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <FloppyDisk size={18} weight="bold" />
            {isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan' : 'Tambah'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
