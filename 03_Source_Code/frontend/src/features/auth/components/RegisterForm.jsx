import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, IdentificationBadge, Envelope, LockKey, EyeSlash, Eye, CircleNotch } from '@phosphor-icons/react';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullname: '',
    idnum: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.fullname) newErrors.fullname = 'Nama lengkap tidak boleh kosong.';
    if (!formData.idnum) newErrors.idnum = 'NIM / NIP tidak boleh kosong.';
    if (!formData.email) {
      newErrors.email = 'Email tidak boleh kosong.';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Format email tidak valid.';
    }
    if (!formData.password) newErrors.password = 'Kata sandi tidak boleh kosong.';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      setLoading(true);
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
        if (errObj.type === 'validation_error' && errObj.details?.length > 0) {
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

  return (
    <form onSubmit={handleRegister} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="fullname">
          Nama Lengkap
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User size={20} className={errors.fullname ? 'text-danger' : 'text-on-surface-variant'} />
          </div>
          <input
            id="fullname"
            name="fullname"
            type="text"
            value={formData.fullname}
            onChange={handleChange}
            placeholder="Masukkan nama lengkap"
            className={`w-full pl-10 pr-4 py-3 rounded-btn border bg-surface-lowest text-on-surface outline-none transition-all focus:ring-2 ${
              errors.fullname ? 'border-danger focus:ring-danger' : 'border-gray-300 focus:ring-primary-container focus:border-transparent'
            }`}
          />
        </div>
        {errors.fullname && <p className="mt-1 text-xs text-danger font-medium">{errors.fullname}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="idnum">
          NIM / NIP
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IdentificationBadge size={20} className={errors.idnum ? 'text-danger' : 'text-on-surface-variant'} />
          </div>
          <input
            id="idnum"
            name="idnum"
            type="text"
            value={formData.idnum}
            onChange={handleChange}
            placeholder="Masukkan NIM atau NIP"
            className={`w-full pl-10 pr-4 py-3 rounded-btn border bg-surface-lowest text-on-surface outline-none transition-all focus:ring-2 ${
              errors.idnum ? 'border-danger focus:ring-danger' : 'border-gray-300 focus:ring-primary-container focus:border-transparent'
            }`}
          />
        </div>
        {errors.idnum && <p className="mt-1 text-xs text-danger font-medium">{errors.idnum}</p>}
      </div>

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
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="nama@email.com"
            className={`w-full pl-10 pr-4 py-3 rounded-btn border bg-surface-lowest text-on-surface outline-none transition-all focus:ring-2 ${
              errors.email ? 'border-danger focus:ring-danger' : 'border-gray-300 focus:ring-primary-container focus:border-transparent'
            }`}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-danger font-medium">{errors.email}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Sandi"
              className={`w-full pl-10 pr-10 py-3 rounded-btn border bg-surface-lowest text-on-surface outline-none transition-all focus:ring-2 ${
                errors.password ? 'border-danger focus:ring-danger' : 'border-gray-300 focus:ring-primary-container focus:border-transparent'
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

        <div>
          <label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="confirmPassword">
            Konfirmasi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockKey size={20} className={errors.confirmPassword ? 'text-danger' : 'text-on-surface-variant'} />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Ulangi"
              className={`w-full pl-10 pr-10 py-3 rounded-btn border bg-surface-lowest text-on-surface outline-none transition-all focus:ring-2 ${
                errors.confirmPassword ? 'border-danger focus:ring-danger' : 'border-gray-300 focus:ring-primary-container focus:border-transparent'
              }`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-primary-container"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <Eye size={20} /> : <EyeSlash size={20} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-danger font-medium">{errors.confirmPassword}</p>}
        </div>
      </div>

      <div className="pt-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-secondary to-accent text-white font-semibold py-3 rounded-btn shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {loading ? <CircleNotch size={24} className="animate-spin" /> : 'Daftar Sekarang'}
        </button>
      </div>

      <div className="mt-5 text-center">
        <p className="text-sm text-on-surface-variant">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-primary-container hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </form>
  );
}
