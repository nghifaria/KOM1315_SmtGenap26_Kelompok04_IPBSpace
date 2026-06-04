import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';

export default function FacilityFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    capacity: '',
    location: '',
    description: '',
    is_active: true
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          type: initialData.type || '',
          capacity: initialData.capacity || '',
          location: initialData.location || '',
          description: initialData.description || '',
          is_active: initialData.is_active !== undefined ? initialData.is_active : true
        });
      } else {
        setFormData({
          name: '',
          type: '',
          capacity: '',
          location: '',
          description: '',
          is_active: true
        });
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.capacity) {
      payload.capacity = parseInt(payload.capacity, 10);
    }
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#02275D]/45 backdrop-blur-[5px] animate-fade-in cursor-default"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl animate-slide-up z-10 flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-primary-container">
            {isEditing ? 'Edit Master Fasilitas' : 'Tambah Fasilitas Baru'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-primary-container hover:bg-slate-100 transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Form Body */}
        <form id="facilityForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">
              Nama Fasilitas / Ruangan <span className="text-danger">*</span>
            </label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-surface-lowest border border-slate-300 rounded-btn px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              placeholder="Contoh: Auditorium Toyib Hadiwijaya"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">
                Kategori/Tipe
              </label>
              <input 
                type="text" 
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-surface-lowest border border-slate-300 rounded-btn px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="Auditorium, Kelas, dll"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">
                Kapasitas (Orang) <span className="text-danger">*</span>
              </label>
              <input 
                type="number" 
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                min={1}
                className="w-full bg-surface-lowest border border-slate-300 rounded-btn px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">
              Lokasi Detail
            </label>
            <input 
              type="text" 
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full bg-surface-lowest border border-slate-300 rounded-btn px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              placeholder="Gedung, Lantai, dsb"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">
              Deskripsi
            </label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-surface-lowest border border-slate-300 rounded-btn px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
              placeholder="Deskripsi singkat mengenai fasilitas ini..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-accent border-slate-300 rounded focus:ring-accent"
            />
            <label htmlFor="is_active" className="text-sm font-semibold text-on-surface-variant cursor-pointer">
              Fasilitas Aktif & Dapat Dipinjam
            </label>
          </div>

        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-card">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-btn font-semibold text-sm text-on-surface-variant border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            form="facilityForm"
            type="submit"
            className="px-5 py-2.5 rounded-btn font-semibold text-sm bg-primary-container text-white hover:bg-primary-container/90 transition-colors shadow-sm"
          >
            {isEditing ? 'Simpan Perubahan' : 'Tambah Fasilitas'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
