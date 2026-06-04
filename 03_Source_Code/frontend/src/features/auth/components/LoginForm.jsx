import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Envelope, LockKey, EyeSlash, Eye, CircleNotch } from '@phosphor-icons/react';
import { isCivitasRole, isFacilityAdminRole, isSuperAdminRole } from '../../../shared/utils/authRole';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!email) newErrors.email = 'Email tidak boleh kosong.';
    else if (!validateEmail(email)) newErrors.email = 'Format email tidak valid.';

    if (!password) newErrors.password = 'Kata sandi tidak boleh kosong.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      setLoading(true);
      const user = await login(email, password);
      toast.success('Selamat datang!');

      if (user.role === 'civitas') navigate('/civitas/dashboard');
      else if (user.role === 'facility_manager') navigate('/admin/facility/validations');
      else if (user.role === 'admin') navigate('/admin/super/master-data');
      else navigate('/');
    } catch (error) {
      const backendMessage = error?.response?.data?.data?.error?.message;
      const status = error?.response?.status;

      if (status === 403 && backendMessage) {
        // Account locked — show the backend's message verbatim (includes time remaining)
        toast.error(backendMessage, { duration: 6000 });
      } else if (backendMessage) {
        toast.error(backendMessage);
      } else {
        toast.error('Email atau kata sandi salah.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5" noValidate>
      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Envelope size={20} className={errors.email ? 'text-danger' : 'text-on-surface-variant'} />
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            placeholder="nama@email.com"
            className={`w-full pl-10 pr-4 py-3 rounded-btn border bg-surface-lowest text-on-surface outline-none transition-all focus:ring-2 ${
              errors.email
                ? 'border-danger focus:ring-danger'
                : 'border-gray-300 focus:ring-primary-container focus:border-transparent'
            }`}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-danger font-medium">{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="password">
          Kata Sandi
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LockKey size={20} className={errors.password ? 'text-danger' : 'text-on-surface-variant'} />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            placeholder="Masukkan kata sandi"
            className={`w-full pl-10 pr-10 py-3 rounded-btn border bg-surface-lowest text-on-surface outline-none transition-all focus:ring-2 ${
              errors.password
                ? 'border-danger focus:ring-danger'
                : 'border-gray-300 focus:ring-primary-container focus:border-transparent'
            }`}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-primary-container"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <Eye size={20} /> : <EyeSlash size={20} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-danger font-medium">{errors.password}</p>}
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-secondary to-accent text-white font-semibold py-3 rounded-btn shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {loading ? <CircleNotch size={24} className="animate-spin" /> : 'Masuk'}
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-on-surface-variant">
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-primary-container hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </form>
  );
}
