import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Warning, Trash, Question } from '@phosphor-icons/react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Konfirmasi Tindakan', 
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?', 
  confirmText = 'Ya, Lanjutkan', 
  cancelText = 'Batal',
  type = 'danger' // 'danger' | 'warning' | 'info'
}) {
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: Trash,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50 border-red-100',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/35',
      glow: 'shadow-red-500/5'
    },
    warning: {
      icon: Warning,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-100',
      confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500/35',
      glow: 'shadow-amber-500/5'
    },
    info: {
      icon: Question,
      iconColor: 'text-accent',
      iconBg: 'bg-accent/5 border-accent/15',
      confirmBtn: 'bg-accent hover:bg-accent-hover text-white focus:ring-accent/35',
      glow: 'shadow-accent/5'
    }
  };

  const currentConfig = typeConfig[type] || typeConfig.info;
  const Icon = currentConfig.icon;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Self-contained CSS Animations for Spring Physics & Fade-in */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes confirmModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirmModalZoomIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-modal-fade {
          animation: confirmModalFadeIn 0.2s ease-out forwards;
        }
        .animate-modal-zoom {
          animation: confirmModalZoomIn 0.3s cubic-bezier(0.34, 1.61, 0.7, 1) forwards;
        }
      `}} />

      {/* Backdrop Overlay with blur */}
      <div 
        className="fixed inset-0 bg-[#02275D]/45 backdrop-blur-[5px] animate-modal-fade cursor-default" 
        onClick={onClose}
      />
      
      {/* Modal Dialog Card */}
      <div 
        className={`relative bg-white rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl border border-gray-100 transform-gpu z-10 animate-modal-zoom ${currentConfig.glow}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors focus:outline-none cursor-pointer"
          title="Tutup"
        >
          <X size={18} weight="bold" />
        </button>

        {/* Modal Header & Icon */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className={`p-4 rounded-2xl border mb-5 shadow-sm transition-transform duration-500 hover:scale-105 ${currentConfig.iconBg}`}>
            <Icon size={32} className={currentConfig.iconColor} weight="duotone" />
          </div>
          
          <h3 className="text-2xl font-black text-primary tracking-tight leading-tight mb-2.5">
            {title}
          </h3>
          <p className="text-gray-500 text-sm font-semibold leading-relaxed px-1">
            {message}
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100/80 border border-gray-250 text-primary font-black rounded-xl text-sm transition-all duration-200 active:scale-97 text-center cursor-pointer shadow-sm select-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 px-4 font-black rounded-xl text-sm transition-all duration-200 active:scale-97 text-center cursor-pointer shadow-md select-none ${currentConfig.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
