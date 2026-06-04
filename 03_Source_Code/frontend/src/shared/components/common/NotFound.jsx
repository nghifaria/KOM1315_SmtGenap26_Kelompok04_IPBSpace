import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="z-10 flex flex-col items-center text-center p-8 bg-white/50 backdrop-blur-md rounded-3xl shadow-xl border border-white/20">
        <div className="relative mb-8">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm animate-bounce">
            404
          </h1>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-gray-200 rounded-full blur-sm"></div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Waduh! Kesasar ya?
        </h2>
        
        <p className="text-gray-600 mb-8 max-w-md">
          Halaman yang kamu cari sepertinya sedang liburan atau memang tidak pernah ada. Yuk, kembali ke jalan yang benar! Semoga kamu gak tersesat lagi, ya :(
        </p>
        
        <button 
          onClick={() => navigate('/')}
          className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white transition-all duration-200 bg-primary border border-transparent rounded-full hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(var(--color-primary),0.3)] hover:-translate-y-1"
        >
          <span className="mr-2">Kembali ke Beranda</span>
          <svg 
            className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NotFound;
