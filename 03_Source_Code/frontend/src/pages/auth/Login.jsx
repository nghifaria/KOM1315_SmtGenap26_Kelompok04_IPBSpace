import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { CircleNotch, Buildings } from '@phosphor-icons/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loading: authLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'civitas') {
        navigate('/civitas/dashboard', { replace: true });
      } else if (user.role === 'facility_manager') {
        navigate('/admin/facility/validations', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/super/overview', { replace: true });
      } else {
        navigate('/');
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan kata sandi harus diisi.');
      return;
    }

    try {
      setLoading(true);
      const userObj = await login(email, password);
      toast.success('Login berhasil!');
      
      // Role-based redirect
      if (userObj.role === 'civitas') {
        navigate('/civitas/dashboard', { replace: true });
      } else if (userObj.role === 'facility_manager') {
        navigate('/admin/facility/validations', { replace: true });
      } else if (userObj.role === 'admin') {
        navigate('/admin/super/master-data', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      const msg = error.response?.data?.data?.error?.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Tampilkan spinner saat cek session awal — SETELAH semua hooks
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <CircleNotch size={40} className="animate-spin text-[#02275D]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-end sm:justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-3xl shadow-xl p-8 sm:p-10 transform transition-transform duration-500 translate-y-0 sm:translate-y-0 translate-y-4 animate-slide-up sm:animate-none">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#02275D] p-3 rounded-2xl text-white mb-4 shadow-lg">
            <Buildings size={32} weight="fill" />
          </div>
          <h1 className="text-2xl font-bold text-[#02275D]">IPB Space</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Book Your Space, Set Your Pace, Make Your Place.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@apps.ipb.ac.id"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#02275D] focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="password">
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#02275D] focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#02275D] hover:bg-blue-900 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <CircleNotch size={24} className="animate-spin" /> : 'Masuk'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Belum memiliki akun Civitas?{' '}
            <Link to="/register" className="font-semibold text-[#02275D] hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}