import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SignOut } from '@phosphor-icons/react';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Self-contained CSS Animations for Spring Physics & Fade-in */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes logoutModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes logoutModalZoomIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-modal-fade {
          animation: logoutModalFadeIn 0.2s ease-out forwards;
        }
        .animate-modal-zoom {
          animation: logoutModalZoomIn 0.3s cubic-bezier(0.34, 1.61, 0.7, 1) forwards;
        }
      `}} />

      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#02275D]/45 backdrop-blur-[5px] transition-opacity animate-modal-fade"
      />
      
      {/* Modal Container */}
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden z-10 border border-slate-100/80 animate-modal-zoom">
        <div className="p-8 flex flex-col items-center text-center">
          {/* Warning Icon Container with pulse animation ring */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-75"></div>
            <div className="relative w-20 h-20 bg-gradient-to-tr from-red-50 to-red-100 rounded-full flex items-center justify-center text-danger shadow-inner border border-red-200/50">
              <SignOut size={40} className="transform -translate-x-0.5" weight="fill" />
            </div>
          </div>
          
          <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Konfirmasi Keluar</h3>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            Apakah Anda yakin ingin keluar? Sesi Anda di <span className="font-bold text-primary-container">IPB Space</span> akan diakhiri.
          </p>
          
          {/* Actions */}
          <div className="flex w-full gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              Batal
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-danger hover:brightness-110 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
