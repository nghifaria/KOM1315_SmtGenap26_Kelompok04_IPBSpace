import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { 
  Layout, 
  Door, 
  ClockCounterClockwise, 
  UserCircle, 
  SignOut, 
  CalendarBlank,
  Scroll,
  SquaresFour,
  Users,
  List,
  CaretLeft,
  CaretRight,
  Package,
  Wrench
} from '@phosphor-icons/react';
import logoIPBSpace from '../../../assets/icons/logo.png';
import LogoutModal from '../ui/Modal/LogoutModal';
import { isSuperAdminRole } from '../../../shared/utils/authRole';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const isSuperAdmin = isSuperAdminRole(user?.role);
  const homePath = isSuperAdmin ? '/admin/super/overview' : '/admin/facility/validations';

  const handleLogout = () => {
    setShowLogoutModal(false);
    if (logout) logout();
    navigate('/');
  };

  const facilityAdminMenu = [
    {
      to: "/admin/facility/validations",
      label: "Dashboard Validasi",
      icon: Layout,
    },
    {
      to: "/admin/facility/room-management",
      label: "Manajemen Ruangan",
      icon: Door,
    },
    {
      to: "/admin/facility/calendar",
      label: "Kalender Jadwal",
      icon: CalendarBlank,
    },
    {
      to: "/admin/facility/history",
      label: "Riwayat Peminjaman",
      icon: ClockCounterClockwise,
    },
  ];

  const superAdminMenu = [
    {
      to: "/admin/super/overview",
      label: "Dashboard Utama",
      icon: SquaresFour,
    },
    {
      to: "/admin/super/users",
      label: "Manajemen Admin",
      icon: Users,
    },
    {
      to: "/admin/super/master-data",
      label: "Master Fasilitas",
      icon: Door,
    },
    {
      to: "/admin/super/items",
      label: "Master Item",
      icon: Package,
    },
    {
      to: "/admin/super/assets",
      label: "Master Aset",
      icon: Wrench,
    },
    {
      to: "/admin/super/calendar",
      label: "Kalender Pusat",
      icon: CalendarBlank,
    },
    {
      to: "/admin/super/audit",
      label: "Log Audit Sistem",
      icon: Scroll,
    },
  ];

  const activeMenu = isSuperAdmin ? superAdminMenu : facilityAdminMenu;

  // Determine whether to display the text labels inside the sidebar (expanded or hovered)
  const showText = !isCollapsed || isHovered;

  return (
    <div 
      className="min-h-screen font-sans flex flex-col relative"
      style={{
        background: 'linear-gradient(0deg, #F4F7FB, #F4F7FB), #FFFFFF'
      }}
    >
      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        onMouseEnter={() => { if (isCollapsed) setIsHovered(true); }}
        onMouseLeave={() => { setIsHovered(false); }}
        className={`fixed left-0 top-0 h-screen z-50 flex flex-col bg-primary-container text-white shadow-xl transition-all duration-300 ease-in-out 
          ${isMobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'} 
          ${isCollapsed 
            ? (isHovered ? 'md:w-[280px] shadow-2xl' : 'md:w-[84px]') 
            : 'md:w-[280px]'
          }
        `}
      >
        {/* Sidebar Header Brand Logo */}
        <div className="pl-4 pr-4 py-4 border-b border-white/10 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <Link to={homePath} className="bg-white p-1.5 rounded-xl hover:scale-105 transition-transform shrink-0">
              <img 
                src={logoIPBSpace} 
                alt="IPB Space" 
                className="h-10 w-auto drop-shadow-md" 
              />
            </Link>
            <div className={`flex flex-col transition-all duration-300 ${showText ? 'opacity-100 max-w-[180px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-4 pointer-events-none'}`}>
              <span className="text-xl md:text-2xl font-black tracking-tight italic leading-normal whitespace-nowrap text-white">
                IPB Space
              </span>
              <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase mt-1.5 whitespace-nowrap">
                {isSuperAdmin ? 'Super Admin' : 'Panel Admin'}
              </span>
            </div>
          </div>

          {/* Toggle button placed cleanly inside the header, visible when expanded/hovered on desktop */}
          {showText && (
            <button
              onClick={() => {
                setIsCollapsed(!isCollapsed);
                setIsHovered(false);
              }}
              className="text-blue-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer hidden md:block shrink-0"
              title={isCollapsed ? "Pin Sidebar" : "Unpin/Collapse Sidebar"}
            >
              {isCollapsed ? <CaretRight size={18} weight="bold" /> : <CaretLeft size={18} weight="bold" />}
            </button>
          )}
        </div>
        
        {/* Sidebar Navigation Menu */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {activeMenu.map((item) => (
            <NavLink 
              key={item.to}
              to={item.to} 
              className={({ isActive }) => `flex items-center rounded-btn text-base font-semibold transition-all pl-[14px] pr-4 py-3.5 gap-4 ${isActive ? 'bg-white/10 text-white border-l-4 md:border-l-0 md:border-r-4 border-accent' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              title={!showText ? item.label : undefined}
              onClick={() => setIsMobileOpen(false)}
            >
              {({ isActive }) => {
                const Icon = item.icon;
                return (
                  <>
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <Icon size={24} weight={isActive ? "fill" : "regular"} /> 
                    </div>
                    <span className={`truncate transition-all duration-300 whitespace-nowrap ${showText ? 'opacity-100 max-w-[180px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'}`}>
                      {item.label}
                    </span>
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>
        
        {/* Sidebar Footer User Info & Logout */}
        <div className="p-4 border-t border-white/10">
          <div 
            className="flex items-center mb-3 bg-white/5 rounded-xl border border-white/10 select-none pl-[11px] pr-3 py-3 gap-3"
          >
            <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0">
              <UserCircle size={30} weight="fill" className="text-blue-200/50" />
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 ${showText ? 'opacity-100 max-w-[180px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'}`}>
              <p className="text-sm font-bold truncate text-slate-200">{user?.fullname || 'Memuat...'}</p>
              <p className="text-[10px] text-blue-200/50 truncate">
                {isSuperAdmin ? 'Sistem Administrator' : (user?.work_unit || 'Facility Admin')}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center rounded-btn text-base font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all border border-transparent hover:border-red-500/20 cursor-pointer pl-[14px] pr-4 py-2.5 gap-4"
            title={!showText ? "Keluar Sistem" : undefined}
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <SignOut size={24} weight="fill" /> 
            </div>
            <span className={`whitespace-nowrap transition-all duration-300 ${showText ? 'opacity-100 max-w-[180px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'}`}>
              Keluar Sistem
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area - padded left by sidebar width */}
      <div 
        className={`flex-1 flex flex-col min-h-screen relative transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:pl-[84px]' : 'md:pl-[280px]'}
        `}
      >
        {/* Top Navbar Header - ONLY visible on Mobile */}
        <header 
          className="fixed z-40 top-0 left-0 right-0 h-[61px] flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm md:hidden"
        >
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Open Sidebar"
          >
            <List size={24} weight="bold" />
          </button>

          <Link to={homePath} className="shrink-0">
            <img src={logoIPBSpace} alt="IPB Space" className="h-9 shrink-0" />
          </Link>

          <button 
            onClick={() => setShowLogoutModal(true)}
            className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
            title="Keluar"
          >
            <SignOut size={20} weight="bold" />
          </button>
        </header>

        {/* Mobile Header Spacer to prevent content overlap */}
        <div className="h-[61px] md:hidden" />
        
        {/* Content Render Outlet */}
        <main className="flex-1 w-full p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Sleek Logout Confirmation Modal */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
