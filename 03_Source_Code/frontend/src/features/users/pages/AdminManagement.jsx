import React, { useState, useEffect } from 'react';
import { Plus, PencilSimple, Trash, UserCircle } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';
import AdminFormModal from '../components/AdminFormModal';
import ConfirmModal from '../../../shared/components/ui/Modal/ConfirmModal';
import AdminPageHeader from '../../../shared/components/ui/AdminHeader/AdminPageHeader';
import AdminDataTable from '../../../shared/components/ui/AdminTable/AdminDataTable';

export default function AdminManagement() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  
  // Confirm modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState(null);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const res = await userService.getAllManagers(0, 100);
      if (res?.data?.items) {
        setManagers(res.data.items);
      }
    } catch (error) {
      toast.error('Gagal memuat data admin fasilitas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleOpenAdd = () => {
    setEditingManager(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (manager) => {
    setEditingManager(manager);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (manager) => {
    setManagerToDelete(manager);
    setIsConfirmOpen(true);
  };

  const handleToggleActive = async (manager) => {
    const nextValue = !(manager.is_active !== false);
    try {
      await userService.updateManager(manager.id, { is_active: nextValue });
      setManagers((prev) => prev.map((item) => (
        item.id === manager.id ? { ...item, is_active: nextValue } : item
      )));
      toast.success(`Admin berhasil ${nextValue ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Gagal memperbarui status admin');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingManager) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userService.updateManager(editingManager.id, updateData);
        toast.success('Data admin berhasil diperbarui');
      } else {
        await userService.createManager(formData);
        toast.success('Admin baru berhasil ditambahkan');
      }
      setIsFormOpen(false);
      fetchManagers();
    } catch (error) {
      toast.error(error?.response?.data?.data?.error?.message || 'Terjadi kesalahan pada sistem');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!managerToDelete) return;
    try {
      await userService.deleteManager(managerToDelete.id);
      toast.success('Admin berhasil dihapus');
      fetchManagers();
    } catch (error) {
      toast.error('Gagal menghapus admin');
    }
  };

  const filteredManagers = managers.filter(m => 
    m.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.idnum.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: 'Admin',
      accessor: 'fullname',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
            <UserCircle size={24} weight="fill" />
          </div>
          <div>
            <p className="font-medium text-sm text-primary-container">{row.fullname}</p>
            <p className="text-sm text-slate-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'NIP',
      accessor: 'idnum',
      cellClassName: 'text-sm text-slate-600'
    },
    {
      header: 'Unit Kerja',
      accessor: 'work_unit',
      render: (row) => row.work_unit || '-',
      cellClassName: 'text-sm text-slate-600'
    },
    {
      header: 'Aktif',
      accessor: 'status',
      className: 'text-center',
      cellClassName: 'text-center',
      render: (row) => {
        const isActive = row.is_active !== false;

        return (
          <button
            type="button"
            onClick={() => handleToggleActive(row)}
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              isActive
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title={isActive ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isActive ? 'Aktif' : 'Nonaktif'}
          </button>
        );
      }
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
            className="p-2 text-slate-400 hover:text-accent hover:bg-slate-100 rounded-md transition-colors"
            title="Edit Admin"
          >
            <PencilSimple size={18} weight="fill" />
          </button>
          <button 
            onClick={() => handleOpenDelete(row)}
            className="p-2 text-slate-400 hover:text-danger hover:bg-red-50 rounded-md transition-colors"
            title="Hapus Admin"
          >
            <Trash size={18} weight="fill" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      
      <AdminPageHeader 
        title="Manajemen Admin"
        description="Kelola daftar Admin Fasilitas yang memiliki akses ke sistem."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari admin..."
        actions={
          <button 
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-primary-container text-white py-2.5 px-4 rounded-btn font-semibold text-sm shadow-sm hover:bg-primary-container/90 transition-all"
          >
            <Plus size={16} weight="bold" />
            Tambah Admin
          </button>
        }
      />

      <AdminDataTable 
        columns={columns}
        data={filteredManagers}
        loading={loading}
        emptyMessage="Tidak ada data admin ditemukan."
      />

      {/* Modals */}
      <AdminFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleFormSubmit}
        initialData={editingManager}
      />
      
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Admin Fasilitas"
        message={`Apakah Anda yakin ingin menghapus admin ${managerToDelete?.fullname}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        type="danger"
      />
    </div>
  );
}
