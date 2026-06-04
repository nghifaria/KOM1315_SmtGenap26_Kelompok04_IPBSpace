import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserCircle, SignOut } from '@phosphor-icons/react';
import { useAuth } from '../../../context/AuthContext';
import logoIPBSpace from '../../../assets/icons/logo.png';
import LogoutModal from '../ui/Modal/LogoutModal';
import { 
  PUBLIC_DESKTOP_LINKS, 
  PUBLIC_MOBILE_LINKS, 
  CIVITAS_DESKTOP_LINKS, 
  CIVITAS_MOBILE_LINKS 
} from '../../constants/navigation';

export default function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const path = location.pathname;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    if (logout) {
      logout();
    }
    navigate('/');
  };

  const isLoggedIn = !!user;
  const homePath = isLoggedIn ? '/civitas/dashboard' : '/';

  const desktopLinks = isLoggedIn ? CIVITAS_DESKTOP_LINKS : PUBLIC_DESKTOP_LINKS;
  const mobileLinks = isLoggedIn ? CIVITAS_MOBILE_LINKS : PUBLIC_MOBILE_LINKS;

  const isActive = (linkPath) => {
    if (linkPath === '/' || linkPath === '/civitas/dashboard') {
      return path === '/' || path === '/civitas/dashboard' || path === '/civitas/beranda';
    }
    return path.startsWith(linkPath);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Top Navbar (Desktop) */}
      <nav className="sticky top-0 z-50 hidden md:flex items-center justify-between px-8 py-5 bg-primary-container border-b border-primary/20 shadow-lg">
        <div className="flex-shrink-0 flex items-center gap-4">
          <Link to={homePath} className="bg-white p-0.5 rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:scale-105 transition-all">
            <img src={logoIPBSpace} alt="IPB Space" className="h-11 md:h-12 drop-shadow-md" />
          </Link>
          <span className="text-xl md:text-4xl font-black text-white tracking-tighter italic">IPB Space</span>
        </div>
        
        {/* Navigation Links in Center */}
        <div className="flex gap-2 bg-blue-900/20 p-1.5 rounded-full border border-white/5">
          {desktopLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link 
                key={link.path}
                to={link.path} 
                className={`px-6 py-2 rounded-full text-base font-bold transition-all ${
                  active 
                    ? 'bg-white text-primary-container shadow-lg scale-105' 
                    : 'text-blue-100/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
        
        {/* Right Section (Conditional Auth Actions) */}
        <div className="flex items-center gap-6">
          {isLoggedIn ? (
            <>
              <Link 
                to="/civitas/profile" 
                className={`flex items-center gap-2 hover:opacity-90 transition-opacity group ${
                  path === '/civitas/profile' ? 'text-accent border-b-2 border-accent pb-0.5' : 'text-blue-100'
                }`}
              >
                <UserCircle size={28} className={`${path === '/civitas/profile' ? 'text-accent' : 'text-blue-100'} group-hover:text-accent transition-colors`} weight="fill" />
                <span className="text-white font-bold text-base select-none group-hover:text-accent transition-colors">
                  {user?.fullname || user?.name || 'Civitas'}
                </span>
              </Link>
              <button 
                onClick={() => setShowLogoutModal(true)} 
                className="px-6 py-2.5 bg-accent text-white rounded-btn font-bold hover:scale-105 transition-all shadow-lg text-base flex items-center gap-2"
              >
                <SignOut size={20} weight="bold" />
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="px-4 py-2 text-white font-semibold hover:text-secondary-container transition-colors text-base">
                Daftar
              </Link>
              <Link to="/login" className="px-7 py-2.5 bg-accent text-white rounded-btn font-bold hover:scale-105 transition-all shadow-lg text-base">
                Masuk
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Top Navbar (Mobile) */}
      <nav className="sticky top-0 z-50 flex md:hidden items-center justify-between px-4 py-2 bg-primary-container border-b border-primary shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-xl shadow-sm">
            <img src={logoIPBSpace} alt="IPB Space" className="h-7" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight italic">IPB Space</span>
        </div>
        {isLoggedIn ? (
          <button 
            onClick={() => setShowLogoutModal(true)} 
            className="bg-accent text-white px-4 py-1.5 rounded-btn text-sm font-bold shadow-lg flex items-center gap-1.5"
          >
            <SignOut size={16} weight="bold" />
            Keluar
          </button>
        ) : (
          <Link to="/login" className="bg-accent text-white px-4 py-1.5 rounded-btn text-sm font-bold shadow-lg">
            Masuk
          </Link>
        )}
      </nav>

      {/* Main Content */}
      <main className="pb-20 md:pb-0 flex-1 flex flex-col">
        {children}
      </main>

      {/* Bottom Navbar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container/95 backdrop-blur-xl border-t border-blue-200 flex md:hidden pb-safe shadow-[0_-4px_20px_rgba(2,39,93,0.1)]">
        {mobileLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);
          return (
            <Link 
              key={link.path}
              to={link.path}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all ${
                active ? 'text-primary-container scale-110' : 'text-blue-900/40'
              }`}
            >
              <Icon size={24} weight={active ? 'fill' : 'regular'} />
              <span className="text-[10px] mt-1 font-bold uppercase tracking-wider text-center leading-tight">
                {link.name}
              </span>
              {active && <div className="w-1 h-1 bg-primary-container rounded-full mt-0.5"></div>}
            </Link>
          );
        })}
      </nav>

      {/* Sleek Logout Confirmation Modal */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
