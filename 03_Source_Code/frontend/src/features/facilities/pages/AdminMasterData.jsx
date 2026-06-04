import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Plus, PencilSimple, Trash, Door } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { facilityService } from '../services/facilityService';
import ConfirmModal from '../../../shared/components/ui/Modal/ConfirmModal';

export default function AdminMasterData() {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Confirm modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState(null);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await facilityService.getAllFacilities();
      if (res?.data?.items) {
        setFacilities(res.data.items);
      } else if (Array.isArray(res?.data)) {
        setFacilities(res.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data master fasilitas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleOpenEdit = (facility) => {
    navigate(`/admin/super/master-data/${facility.id}/edit`);
  };

  const handleOpenAdd = () => {
    navigate('/admin/super/master-data/new');
  };

  const handleOpenDelete = (facility) => {
    setFacilityToDelete(facility);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!facilityToDelete) return;
    try {
      await facilityService.deleteFacility(facilityToDelete.id);
      toast.success('Fasilitas berhasil dihapus');
      fetchFacilities();
    } catch (error) {
      toast.error('Gagal menghapus fasilitas');
    }
  };

  const filteredFacilities = facilities.filter(f => 
    (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white shadow-ambient rounded-card gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary-container tracking-tight">Master Fasilitas</h2>
          <p className="text-base text-slate-500 mt-1">Kelola data seluruh ruangan dan fasilitas yang tersedia untuk dipinjam.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari fasilitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-transparent rounded-btn py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all"
            />
          </div>
          
          {/* Add Button */}
          <button 
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-primary-container text-white py-2.5 px-4 rounded-btn font-semibold text-sm shadow-sm hover:bg-primary-container/90 transition-all"
          >
            <Plus size={16} weight="bold" />
            Tambah Fasilitas
          </button>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-white shadow-ambient rounded-card overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 font-semibold text-sm text-primary-container whitespace-nowrap">Nama Fasilitas</th>
                <th className="py-4 px-6 font-semibold text-sm text-primary-container whitespace-nowrap">Tipe & Lokasi</th>
                <th className="py-4 px-6 font-semibold text-sm text-primary-container whitespace-nowrap text-center">Kapasitas</th>
                <th className="py-4 px-6 font-semibold text-sm text-primary-container whitespace-nowrap text-center">Status</th>
                <th className="py-4 px-6 font-semibold text-sm text-primary-container whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
                    <p className="mt-3 text-sm">Memuat data...</p>
                  </td>
                </tr>
              ) : filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-500">
                    <p className="text-sm">Tidak ada data fasilitas ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredFacilities.map((facility) => (
                  <tr key={facility.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Facility Name Cell */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary-container flex-shrink-0">
                          <Door size={22} weight="fill" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-primary-container">{facility.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]" title={facility.description}>
                            {facility.description || 'Tidak ada deskripsi'}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Type & Location Cell */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-slate-700">{facility.type || 'Umum'}</span>
                        <span className="text-xs text-slate-500">{facility.location || '-'}</span>
                      </div>
                    </td>
                    
                    {/* Capacity Cell */}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                        {facility.capacity} Orang
                      </div>
                    </td>
                    
                    {/* Status Cell */}
                    <td className="py-4 px-6 text-center">
                      {((facility.condition || '').toLowerCase() === 'good' || !(facility.condition || '')) ? (
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold border border-cyan-100">
                          Tersedia
                        </div>
                      ) : (facility.condition || '').toLowerCase() === 'maintenance' ? (
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                          Maintenance
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-xs font-bold border border-slate-200">
                          Rusak
                        </div>
                      )}
                    </td>
                    
                    {/* Actions Cell */}
                    <td className="py-4 px-6">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => handleOpenEdit(facility)}
                          className="p-2 text-slate-400 hover:text-accent hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Fasilitas"
                        >
                          <PencilSimple size={18} weight="fill" />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(facility)}
                          className="p-2 text-slate-400 hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                          title="Hapus Fasilitas"
                        >
                          <Trash size={18} weight="fill" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && facilities.length > 0 && (
          <div className="flex items-center justify-between p-4 px-6 border-t border-slate-100 bg-white">
            <span className="text-sm text-slate-500">
              Menampilkan {filteredFacilities.length} data
            </span>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-400 opacity-50 cursor-not-allowed">
                Sebelumnnya
              </button>
              <button className="px-3 py-1 border border-accent bg-cyan-50 rounded text-sm text-cyan-700 font-medium">
                1
              </button>
              <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-500 hover:bg-slate-50">
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Fasilitas"
        message={`Apakah Anda yakin ingin menghapus fasilitas ${facilityToDelete?.name}? Tindakan ini mungkin akan mempengaruhi data peminjaman yang sudah ada.`}
        confirmText="Ya, Hapus"
        type="danger"
      />
    </div>
  );
}
