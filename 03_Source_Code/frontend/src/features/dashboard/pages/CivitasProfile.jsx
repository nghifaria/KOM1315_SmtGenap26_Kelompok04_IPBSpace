import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { User, IdentificationCard, EnvelopeSimple, Shield, PencilSimpleLine } from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';

export default function CivitasProfile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [idnum, setIdnum] = useState(user?.idnum || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullname.trim() || !idnum.trim() || !email.trim()) {
      toast.error('Semua data wajib diisi.');
      return;
    }

    try {
      await toast.promise(
        updateProfile(fullname.trim(), idnum.trim(), email.trim()),
        {
          loading: 'Memperbarui profil...',
          success: 'Profil berhasil diperbarui!',
          error: (err) => err?.response?.data?.detail || err.message || 'Gagal memperbarui profil.',
        }
      );
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const hasChanges = fullname.trim() !== (user?.fullname || '') || 
                     idnum.trim() !== (user?.idnum || '') || 
                     email.trim() !== (user?.email || '');

  return (
    <div className="bg-surface-bright py-8 px-4 md:px-8 min-h-screen flex-1">
      <div className="max-w-6xl mx-auto">
        {/* Header Profile */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-gray-100 pb-4 gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-primary flex items-center gap-3">
              <User size={36} weight="duotone" className="text-accent" />
              Profil Saya
            </h1>
            <p className="text-gray-500 mt-2 text-base">
              Kelola data diri dan informasi keanggotaan IPB Space Anda di sini.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Summary Card */}
          <div className="lg:col-span-1 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white rounded-card shadow-ambient border border-gray-100 p-6 flex flex-col items-center text-center relative overflow-hidden group">
              {/* Decorative accent top line */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-accent"></div>
              
              {/* Big Avatar */}
              <div className="w-28 h-28 rounded-full bg-surface-dim border-4 border-gray-50 flex items-center justify-center mb-4 shadow-inner relative group-hover:scale-105 transition-all">
                <User size={56} className="text-primary-container" weight="fill" />
              </div>

              {/* User details */}
              <h2 className="text-lg font-black text-gray-800 leading-tight mb-1">{user?.fullname}</h2>
              <span className="px-3 py-1 bg-primary-container/10 text-primary-container rounded-full text-xs font-black tracking-wide uppercase mb-2">
                {user?.role === 'civitas' ? 'Civitas IPB' : user?.role || 'Pengguna'}
              </span>
            </div>
          </div>

          {/* Right Column: Detailed Info Form */}
          <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white rounded-card shadow-ambient border border-gray-100 p-6 md:p-8">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                  <IdentificationCard size={22} className="text-accent" /> Informasi Akun
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface text-gray-600 rounded-btn font-semibold hover:bg-gray-100 hover:text-primary transition-all text-xs"
                  >
                    <PencilSimpleLine size={14} /> Edit Profil
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Full Name field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} className="text-gray-400" /> Nama Lengkap
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-medium text-sm text-gray-800"
                      required
                    />
                  ) : (
                    <div className="px-4 py-3 bg-surface rounded-xl font-semibold text-sm text-gray-700">
                      {user?.fullname || '-'}
                    </div>
                  )}
                </div>

                {/* Identity Number (NIM/NIP) field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <IdentificationCard size={14} className="text-gray-400" /> NIM / NIP
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={idnum}
                      onChange={(e) => setIdnum(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-medium text-sm text-gray-800"
                      required
                    />
                  ) : (
                    <div className="px-4 py-3 bg-surface rounded-xl font-semibold text-sm text-gray-700">
                      {user?.idnum || '-'}
                    </div>
                  )}
                </div>

                {/* Email Address field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <EnvelopeSimple size={14} className="text-gray-400" /> Alamat Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-medium text-sm text-gray-800"
                      required
                    />
                  ) : (
                    <div className="px-4 py-3 bg-surface rounded-xl font-semibold text-sm text-gray-700">
                      {user?.email || '-'}
                    </div>
                  )}
                </div>

                {/* Account Role field (Always Read-only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={14} className="text-gray-400" /> Hak Akses / Peran
                  </label>
                  <div className="px-4 py-3 bg-surface rounded-xl font-semibold text-sm text-gray-500 capitalize select-none">
                    {user?.role || 'Civitas'}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-4 pt-4 border-t border-gray-100 animate-fade-in">
                    <button
                      type="submit"
                      className={`px-6 py-2.5 rounded-btn font-bold shadow-md transition-all text-xs ${
                        hasChanges
                          ? 'bg-accent text-white hover:brightness-110 active:scale-95 cursor-pointer'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!hasChanges}
                    >
                      Simpan Perubahan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFullname(user?.fullname || '');
                        setIdnum(user?.idnum || '');
                        setEmail(user?.email || '');
                        setIsEditing(false);
                      }}
                      className="px-6 py-2.5 bg-surface text-gray-600 rounded-btn font-semibold hover:bg-gray-100 transition-all text-xs"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
