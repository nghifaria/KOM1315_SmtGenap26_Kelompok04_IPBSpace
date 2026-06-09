import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FloppyDisk, Image, Trash } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { assetService } from '../../assets/services/assetService';
import { facilityService } from '../services/facilityService';

const CONDITION_OPTIONS = [
  { value: 'good', label: 'Baik / Tersedia' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'broken', label: 'Rusak' },
];

const emptyForm = {
  name: '',
  code: '',
  location: '',
  capacity: '',
  threshold: '',
  condition: 'good',
  contact_person: '',
};

export default function FacilityFormPage() {
  const navigate = useNavigate();
  const { facilityId } = useParams();
  const isEditing = !!facilityId && facilityId !== 'new';

  const [formData, setFormData] = useState(emptyForm);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [assets, setAssets] = useState([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isAssetsLoading, setIsAssetsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchFacility = async () => {
      if (!isEditing) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await facilityService.getFacilityById(facilityId);
        const facility = res?.data?.facility || res?.data || res;

        if (!isMounted) return;

        setFormData({
          name: facility?.name || '',
          code: facility?.code || '',
          location: facility?.location || '',
          capacity: facility?.capacity ?? '',
          threshold: facility?.threshold ?? '',
          condition: facility?.condition || 'good',
          contact_person: facility?.contact_person || '',
        });
        setSelectedAssetIds(
          Array.isArray(facility?.assets)
            ? facility.assets.map((asset) => Number(asset.id)).filter((assetId) => Number.isInteger(assetId) && assetId > 0)
            : []
        );
        setCurrentImageUrl(facility?.image_url || '');
        setImagePreview(facility?.image_url || '');
      } catch (error) {
        console.error(error);
        toast.error('Gagal memuat data fasilitas.');
        navigate('/admin/super/master-data');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFacility();

    return () => {
      isMounted = false;
    };
  }, [facilityId, isEditing, navigate]);

  useEffect(() => {
    let isMounted = true;

    const fetchAssets = async () => {
      try {
        setIsAssetsLoading(true);
        const response = await assetService.getAllAssets();
        const items = response?.data?.items || response?.data || [];

        if (!isMounted) return;
        setAssets(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error(error);
        if (isMounted) {
          toast.error('Gagal memuat daftar aset.');
        }
      } finally {
        if (isMounted) setIsAssetsLoading(false);
      }
    };

    fetchAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview && imageFile) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imageFile, imagePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssetSelectionChange = (event) => {
    const values = Array.from(event.target.selectedOptions, (option) => Number(option.value)).filter(
      (assetId) => Number.isInteger(assetId) && assetId > 0
    );
    setSelectedAssetIds(values);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (imagePreview && imageFile) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview && imageFile) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(currentImageUrl || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append('name', formData.name.trim());
    payload.append('code', formData.code.trim());
    payload.append('location', formData.location.trim());
    payload.append('capacity', String(parseInt(formData.capacity, 10)));

    if (formData.threshold !== '') {
      payload.append('threshold', String(parseInt(formData.threshold, 10) || 0));
    }
    if (formData.condition) payload.append('condition', formData.condition);
    if (formData.contact_person.trim()) payload.append('contact_person', formData.contact_person.trim());
    payload.append('asset_ids', JSON.stringify(selectedAssetIds));
    if (imageFile) payload.append('image', imageFile);

    try {
      setIsSaving(true);
      if (isEditing) {
        await facilityService.updateFacility(facilityId, payload);
        toast.success('Fasilitas berhasil diperbarui');
      } else {
        await facilityService.createFacility(payload);
        toast.success('Fasilitas baru berhasil ditambahkan');
      }
      navigate('/admin/super/master-data');
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.detail || 'Gagal menyimpan fasilitas');
    } finally {
      setIsSaving(false);
    }
  };

  const pageTitle = isEditing ? 'Edit Master Fasilitas' : 'Tambah Fasilitas Baru';
  const pageDescription = isEditing
    ? 'Perbarui seluruh data fasilitas, termasuk gambar, kapasitas, dan aset.'
    : 'Isi semua data fasilitas dengan lengkap agar langsung siap dipakai di katalog dan peminjaman.';

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div className="flex flex-col gap-4 bg-white shadow-ambient rounded-card p-6 md:p-8 border border-slate-100">
        <button
          type="button"
          onClick={() => navigate('/admin/super/master-data')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors w-max"
        >
          <ArrowLeft size={18} weight="bold" />
          Kembali ke Master Fasilitas
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary-container tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">{pageDescription}</p>
        </div>
      </div>

      <div className="bg-white shadow-ambient rounded-card border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-3 text-sm">Memuat data fasilitas...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Fasilitas <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-btn border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Contoh: Aula Mini Fakultas"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kode <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    className="w-full rounded-btn border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="RK-U1-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kapasitas <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full rounded-btn border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lokasi <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full rounded-btn border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Contoh: Gedung A, Lantai 2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Threshold</label>
                  <input
                    type="number"
                    name="threshold"
                    value={formData.threshold}
                    onChange={handleChange}
                    min="0"
                    className="w-full rounded-btn border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kondisi</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full rounded-btn border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    {CONDITION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gambar Fasilitas</label>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 space-y-4">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <img src={imagePreview} alt="Preview fasilitas" className="h-56 w-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-2 text-sm font-bold text-danger hover:text-danger/80"
                      >
                        <Trash size={16} weight="bold" /> {isEditing && currentImageUrl ? 'Kembalikan gambar lama' : 'Hapus pilihan gambar'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-slate-500">
                      <Image size={36} weight="duotone" />
                      <p className="text-sm font-semibold">Belum ada gambar</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-btn file:border-0 file:bg-primary-container file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-primary-container/90"
                  />
                  {isEditing && currentImageUrl && !imageFile && (
                    <p className="text-xs text-slate-500">Gambar saat ini akan tetap dipakai jika tidak diganti.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Person</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  className="w-full rounded-btn border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Nama penanggung jawab"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Aset Fasilitas</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 min-h-[400px] max-h-[560px] overflow-y-auto">
                  {isAssetsLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                      <p className="text-xs text-slate-500">Memuat daftar aset...</p>
                    </div>
                  ) : assets.length === 0 ? (
                    <p className="text-xs text-slate-500 py-10 text-center">Tidak ada aset tersedia dalam sistem.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {assets.map((asset) => {
                        const isSelected = selectedAssetIds.includes(Number(asset.id));
                        return (
                          <label 
                            key={asset.id} 
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              isSelected 
                                ? 'bg-accent/5 border-accent text-accent font-bold shadow-sm' 
                                : 'bg-white border-slate-200 hover:border-slate-350 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const idNum = Number(asset.id);
                                if (isSelected) {
                                  setSelectedAssetIds(prev => prev.filter(id => id !== idNum));
                                } else {
                                  setSelectedAssetIds(prev => [...prev, idNum]);
                                }
                              }}
                              className="w-4 h-4 text-accent border-slate-350 rounded focus:ring-accent"
                            />
                            <div className="flex-grow min-w-0">
                              <p className="text-xs font-bold truncate leading-tight">{asset.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: #{asset.id}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-slate-455">
                  <span>Pilih semua aset pendukung ruangan</span>
                  <span className="text-accent bg-accent/5 px-2.5 py-0.5 rounded-full border border-accent/10 shadow-sm">
                    {selectedAssetIds.length} Terpilih
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/admin/super/master-data')}
                className="px-5 py-2.5 rounded-btn font-semibold text-sm text-on-surface-variant border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
                disabled={isSaving}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-btn font-semibold text-sm bg-primary-container text-white hover:bg-primary-container/90 transition-colors shadow-sm inline-flex items-center gap-2 disabled:opacity-60"
              >
                <FloppyDisk size={18} weight="bold" />
                {isSaving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Fasilitas'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
