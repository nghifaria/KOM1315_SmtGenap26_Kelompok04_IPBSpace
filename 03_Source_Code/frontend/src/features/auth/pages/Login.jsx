import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import LoginForm from '../components/LoginForm';
import bgImage from '../../../assets/images/background.jpg';
import logo from '../../../assets/icons/logo.png';
import { isCivitasRole, isFacilityAdminRole, isSuperAdminRole } from '../../../shared/utils/authRole';

export default function Login() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getPostLoginPath = (role) => {
    const from = location.state?.from;
    if (from?.pathname) {
      return `${from.pathname}${from.search || ''}${from.hash || ''}`;
    }

    if (isCivitasRole(role)) return '/civitas/dashboard';
    if (isFacilityAdminRole(role)) return '/admin/facility/validations';
    if (isSuperAdminRole(role)) return '/admin/super/overview';
    return '/';
  };

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      navigate(getPostLoginPath(user.role), { replace: true });
    }
  }, [loading, isAuthenticated, user, navigate, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-container">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent shadow-md"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col md:flex-row overflow-hidden bg-primary-container">
      {/* DESKTOP BACKGROUND SYSTEM */}
      <div className="absolute inset-0 hidden md:block">
        {/* The Image (Only on 2/3 left) */}
        <div className="absolute left-0 top-0 w-2/3 h-full">
          <img
            src={bgImage}
            alt="Rektorat IPB"
            className="w-full h-full object-cover"
          />
          {/* THE SEAMLESS GRADIENT: Pelan tapi pasti menuju murni biru */}
          {/* Start from almost transparent, move through primary-container tones, solidifying at the right edge */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-container/40 via-primary-container/80 to-primary-container"></div>

          {/* Mobile-inspired color vibes (Secondary/Accent hints) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 via-transparent to-transparent"></div>
        </div>

        {/* Right 1/3 is already covered by the parent's bg-primary-container */}
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10 flex flex-col md:flex-row w-full h-full min-h-screen">
        {/* Mobile background (Gradient based on user request) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-container via-primary to-secondary md:hidden -z-10"></div>

        {/* Left Content (1/2 of screen) */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center items-center px-12 animate-slide-up">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] mb-8 border border-white/20 shadow-2xl">
            <Link to="/" aria-label="Kembali ke beranda" className="inline-flex">
              <img src={logo} alt="IPB Logo" className="w-24 h-24 drop-shadow-2xl" />
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 italic tracking-tighter drop-shadow-sm">
              IPB Space
            </h1>
            <div className="h-1.5 w-24 bg-accent rounded-full mb-8 shadow-lg shadow-accent/50 mx-auto"></div>
            <p className="text-2xl text-white font-medium max-w-lg leading-relaxed drop-shadow-md">
              Book Your Space, <br />
              Set Your Pace, <br />
              Make Your Place.
            </p>
          </div>
        </div>

        {/* Right Content (1/2 of screen) */}
        <div className="flex-1 md:w-1/2 flex justify-center items-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            {/* Mobile Header with Logo */}
            <div className="text-center mb-10 md:hidden animate-slide-up flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-3xl mb-4 border border-white/20">
                <Link to="/" aria-label="Kembali ke beranda" className="inline-flex">
                  <img src={logo} alt="IPB Logo" className="w-20 h-20 drop-shadow-xl" />
                </Link>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2 italic">IPB Space</h1>
              <p className="text-white/90 text-base font-medium">Book Your Space, Set Your Pace, Make Your Place.</p>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-card shadow-2xl animate-slide-up bg-surface-lowest border border-white/10">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-primary-container tracking-tight">Masuk</h2>
                <div className="h-1 w-12 bg-secondary/20 mx-auto mt-2 rounded-full"></div>
                <p className="text-on-surface-variant text-sm mt-3 font-medium">Silakan masuk ke akun Anda</p>
              </div>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
