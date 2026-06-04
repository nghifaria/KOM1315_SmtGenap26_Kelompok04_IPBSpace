import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';

export default function AdminFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    fullname: '',
    idnum: '',
    email: '',
    password: '',
    work_unit: '',
    is_active: true,
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          fullname: initialData.fullname || '',
          idnum: initialData.idnum || '',
          email: initialData.email || '',
          password: '', // Password empty on edit
          work_unit: initialData.work_unit || '',
          is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        });
      } else {
        setFormData({
          fullname: '',
          idnum: '',
          email: '',
          password: '',
          work_unit: '',
          is_active: true,
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-slide-up z-10 flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-primary-container">
            {isEditing ? 'Edit Admin Fasilitas' : 'Tambah Admin Baru'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-primary-container hover:bg-slate-100 transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Form Body */}
        <form id="adminForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">
              Nama Lengkap <span className="text-danger">*</span>
            </label>
            <input 
              type="text" 
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              required
              className="w-full bg-surface-lowest border border-slate-300 rounded-btn px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">
              NIP <span className="text-danger">*</span>
            </label>
            <input 
              type="text" 
              name="idnum"
              value={formData.idnum}
              onChange={handleChange}
              required
              className="w-full bg-surface-lowest border border-slate-300 rounded-btn px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              placeholder="Masukkan NIP"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">
              Email <span className="text-danger">*</span>
            </label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-surface-lowest border border-slate-300 rounded-btn px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              placeholder="admin@apps.ipb.ac.id"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">
              Unit Kerja
            </label>
            <input 
              type="text" 
              name="work_unit"
              value={formData.work_unit}
              onChange={handleChange}
              className="w-full bg-surface-lowest border border-slate-300 rounded-btn px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              placeholder="Contoh: Fakultas Pertanian"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Status Aktif</p>
              <p className="text-xs text-slate-500">Nonaktifkan untuk memblokir login admin ini.</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
              aria-pressed={formData.is_active}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${formData.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">
              Password {isEditing ? <span className="text-xs font-normal text-slate-500">(Kosongkan jika tidak ingin diubah)</span> : <span className="text-danger">*</span>}
            </label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!isEditing}
              minLength={8}
              className="w-full bg-surface-lowest border border-slate-300 rounded-btn px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              placeholder="Minimal 8 karakter (huruf & angka)"
            />
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
            form="adminForm"
            type="submit"
            className="px-5 py-2.5 rounded-btn font-semibold text-sm bg-primary-container text-white hover:bg-primary-container/90 transition-colors shadow-sm"
          >
            {isEditing ? 'Simpan Perubahan' : 'Tambah Admin'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
