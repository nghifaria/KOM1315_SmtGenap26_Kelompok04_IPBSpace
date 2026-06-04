import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { CircleNotch, Buildings } from '@phosphor-icons/react';

export default function Register() {
  const [formData, setFormData] = useState({
    fullname: '',
    idnum: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { register, loading: authLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'civitas') {
        navigate('/civitas/dashboard');
      } else if (user.role === 'facility_manager') {
        navigate('/admin/facility/validations');
      } else if (user.role === 'admin') {
        navigate('/admin/super/overview');
      } else {
        navigate('/');
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.email.endsWith('@apps.ipb.ac.id')) {
      toast.error('Gunakan email @apps.ipb.ac.id yang valid.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      setLoading(true);
      // Exclude 'phone' and 'confirmPassword' since they are not in the backend schema
      const payload = {
        fullname: formData.fullname,
        idnum: formData.idnum,
        email: formData.email,
        password: formData.password,
        role: 'civitas'
      };

      await register(payload);
      toast.success('Pendaftaran berhasil! Silakan masuk.');
      navigate('/login');
    } catch (error) {
      let msg = 'Pendaftaran gagal. Periksa kembali data Anda.';
      if (error.response?.data?.data?.error) {
        const errObj = error.response.data.data.error;
        if (errObj.type === 'validation_error' && errObj.details && errObj.details.length > 0) {
          const detail = errObj.details[0];
          const field = detail.loc?.[detail.loc.length - 1] || 'Input';
          msg = `Validasi gagal pada [${field}]: ${detail.msg.replace('Value error, ', '')}`;
        } else {
          msg = errObj.message;
        }
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <CircleNotch size={40} className="animate-spin text-[#02275D]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-center items-center py-10 px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 sm:p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#02275D] p-3 rounded-2xl text-white mb-4 shadow-lg">
            <Buildings size={32} weight="fill" />
          </div>
          <h1 className="text-2xl font-bold text-[#02275D]">Daftar Civitas</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium text-center">
            Bergabunglah dan mulai booking ruangan di IPB Space.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Floating Label Input for Full Name */}
          <div className="relative">
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              className="peer w-full px-4 pt-6 pb-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#02275D] focus:border-transparent outline-none transition-all text-gray-900 placeholder-transparent"
              placeholder="Nama Lengkap"
              required
            />
            <label
              htmlFor="fullname"
              className="absolute left-4 top-2 text-xs font-semibold text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#02275D]"
            >
              Nama Lengkap
            </label>
          </div>

          {/* Floating Label Input for NIM/NIP */}
          <div className="relative">
            <input
              type="text"
              id="idnum"
              name="idnum"
              value={formData.idnum}
              onChange={handleChange}
              className="peer w-full px-4 pt-6 pb-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#02275D] focus:border-transparent outline-none transition-all text-gray-900 placeholder-transparent"
              placeholder="NIM / NIP"
              required
            />
            <label
              htmlFor="idnum"
              className="absolute left-4 top-2 text-xs font-semibold text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#02275D]"
            >
              NIM / NIP
            </label>
          </div>

          {/* Floating Label Input for Email */}
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="peer w-full px-4 pt-6 pb-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#02275D] focus:border-transparent outline-none transition-all text-gray-900 placeholder-transparent"
              placeholder="Email (@apps.ipb.ac.id)"
              required
            />
            <label
              htmlFor="email"
              className="absolute left-4 top-2 text-xs font-semibold text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#02275D]"
            >
              Email (@apps.ipb.ac.id)
            </label>
          </div>

          {/* Floating Label Input for Phone */}
          <div className="relative">
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="peer w-full px-4 pt-6 pb-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#02275D] focus:border-transparent outline-none transition-all text-gray-900 placeholder-transparent"
              placeholder="Nomor HP"
              required
            />
            <label
              htmlFor="phone"
              className="absolute left-4 top-2 text-xs font-semibold text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#02275D]"
            >
              Nomor HP
            </label>
          </div>

          {/* Floating Label Input for Password */}
          <div className="relative">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="peer w-full px-4 pt-6 pb-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#02275D] focus:border-transparent outline-none transition-all text-gray-900 placeholder-transparent"
              placeholder="Kata Sandi"
              required
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-2 text-xs font-semibold text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#02275D]"
            >
              Kata Sandi
            </label>
          </div>

          {/* Floating Label Input for Confirm Password */}
          <div className="relative">
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="peer w-full px-4 pt-6 pb-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#02275D] focus:border-transparent outline-none transition-all text-gray-900 placeholder-transparent"
              placeholder="Konfirmasi Kata Sandi"
              required
            />
            <label
              htmlFor="confirmPassword"
              className="absolute left-4 top-2 text-xs font-semibold text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#02275D]"
            >
              Konfirmasi Kata Sandi
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#02275D] hover:bg-blue-900 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <CircleNotch size={24} className="animate-spin" /> : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="font-semibold text-[#02275D] hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
