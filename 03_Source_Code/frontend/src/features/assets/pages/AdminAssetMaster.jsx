import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, Plus, PencilSimple, Trash, Wrench } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { assetService } from '../services/assetService';
import AssetFormModal from '../components/AssetFormModal';
import ConfirmModal from '../../../shared/components/ui/Modal/ConfirmModal';
import AdminPageHeader from '../../../shared/components/ui/AdminHeader/AdminPageHeader';
import AdminDataTable from '../../../shared/components/ui/AdminTable/AdminDataTable';

export default function AdminAssetMaster() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // Confirm delete states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await assetService.getAllAssets();
      // apiClient unwraps res.data, but handles defensively
      const raw = res?.data?.items ?? res?.items ?? (Array.isArray(res) ? res : []);
      setAssets(raw);
    } catch (error) {
      toast.error('Gagal memuat data master aset.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (asset) => {
    setAssetToDelete(asset);
    setIsConfirmOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingAsset) {
        await assetService.updateAsset(editingAsset.id, formData);
        toast.success('Nama aset berhasil diperbarui!');
      } else {
        await assetService.createAsset(formData);
        toast.success('Aset baru berhasil ditambahkan!');
      }
      setIsFormOpen(false);
      fetchAssets();
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Gagal menyimpan aset.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!assetToDelete) return;
    try {
      await assetService.deleteAsset(assetToDelete.id);
      toast.success('Aset berhasil dihapus dari sistem!');
      fetchAssets();
    } catch (error) {
      toast.error('Gagal menghapus aset. Aset mungkin sedang dikaitkan dengan fasilitas aktif.');
    }
  };

  const filteredAssets = assets.filter(asset => 
    (asset.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(asset.id).includes(searchQuery)
  );

  const columns = [
    {
      header: 'Aset',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary shrink-0">
            <Wrench size={20} weight="fill" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800">{row.name}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Asset ID: #{row.id}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Tanggal Dibuat',
      accessor: 'created_at',
      render: (row) => row.created_at 
        ? new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
        : '-'
    },
    {
      header: 'Terakhir Diperbarui',
      accessor: 'updated_at',
      render: (row) => row.updated_at 
        ? new Date(row.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
        : '-'
    },
    {
      header: 'Aksi',
      accessor: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          <button 
            onClick={() => handleOpenEdit(row)}
            className="p-2 text-slate-400 hover:text-accent hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            title="Ubah Nama Aset"
          >
            <PencilSimple size={18} weight="bold" />
          </button>
          <button 
            onClick={() => handleOpenDelete(row)}
            className="p-2 text-slate-400 hover:text-danger hover:bg-red-50 rounded-xl transition-all cursor-pointer"
            title="Hapus Aset"
          >
            <Trash size={18} weight="bold" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <AdminPageHeader 
        title="Master Aset"
        description="Kelola katalog aset pendukung fisik yang dipasang di ruangan kampus IPB."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari berdasarkan nama atau ID..."
        actions={
          <button 
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-primary text-white py-2.5 px-4 rounded-xl font-bold text-sm shadow-md hover:bg-primary-container transition-all active:scale-95"
          >
            <Plus size={16} weight="bold" />
            Tambah Aset
          </button>
        }
      />

      <AdminDataTable 
        columns={columns}
        data={filteredAssets}
        loading={loading}
        emptyMessage="Tidak ada data aset ditemukan."
      />

      {/* Form Modal */}
      <AssetFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleFormSubmit}
        initialData={editingAsset}
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Aset Fasilitas"
        message={`Apakah Anda yakin ingin menghapus aset "${assetToDelete?.name}"? Tindakan ini dapat membatalkan keterkaitan aset pada data fasilitas.`}
        confirmText="Ya, Hapus"
        type="danger"
      />
    </div>
  );
}
