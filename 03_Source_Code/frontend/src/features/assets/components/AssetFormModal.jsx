import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Wrench, FloppyDisk } from '@phosphor-icons/react';

export default function AssetFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim() });
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
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up z-10 flex flex-col border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Wrench size={22} weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 leading-tight">
                {isEditing ? 'Ubah Nama Aset' : 'Tambah Aset Baru'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {isEditing ? 'Perbarui informasi aset pendukung' : 'Masukkan nama aset pendukung fasilitas baru'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Form Body */}
        <form id="assetForm" onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
              Nama Aset <span className="text-danger">*</span>
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-accent focus:border-accent rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all"
              placeholder="Contoh: Proyektor LCD Epson"
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
            form="assetForm"
            type="submit"
            disabled={isSubmitting || !name.trim()}
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
