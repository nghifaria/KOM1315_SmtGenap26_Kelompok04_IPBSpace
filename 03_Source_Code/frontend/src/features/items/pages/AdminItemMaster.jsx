import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, Plus, PencilSimple, Trash, Package, ShieldCheck, Wrench, Warning } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { itemService } from '../services/itemService';
import ItemFormModal from '../components/ItemFormModal';
import ConfirmModal from '../../../shared/components/ui/Modal/ConfirmModal';
import AdminPageHeader from '../../../shared/components/ui/AdminHeader/AdminPageHeader';
import AdminDataTable from '../../../shared/components/ui/AdminTable/AdminDataTable';

export default function AdminItemMaster() {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Standard Item modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Delete confirmations
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { id, name }

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await itemService.getAllItems();
      const raw = res?.data?.items ?? res?.items ?? (Array.isArray(res) ? res : []);
      setAllItems(Array.isArray(raw) ? raw : []);
    } catch (error) {
      toast.error('Gagal mengambil data inventaris barang.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddStandard = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEditStandard = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (id, name) => {
    setItemToDelete({ id, name });
    setIsConfirmOpen(true);
  };

  const handleStandardSubmit = async (formData) => {
    try {
      if (editingItem) {
        await itemService.updateItem(editingItem.id, formData);
        toast.success('Informasi barang standar berhasil diperbarui!');
      } else {
        await itemService.createItem(formData);
        toast.success('Barang standar baru berhasil ditambahkan!');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Gagal menyimpan barang.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    const { id } = itemToDelete;
    try {
      await itemService.deleteItem(id);
      toast.success('Barang standar berhasil dihapus dari sistem!');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus barang. Barang mungkin sedang digunakan dalam transaksi aktif.');
    }
  };

  // Filtered items for search
  const filteredStandard = allItems.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item.id).includes(searchQuery)
  );

  const getConditionBadge = (cond) => {
    const c = (cond || 'good').toLowerCase();
    if (c === 'good') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <ShieldCheck size={12} weight="fill" /> Baik
        </span>
      );
    }
    if (c === 'maintenance') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
          <Wrench size={12} weight="fill" /> Perbaikan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
        <Warning size={12} weight="fill" /> Rusak
      </span>
    );
  };

  const standardColumns = [
    {
      header: 'Barang Standar',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary shrink-0">
            <Package size={20} weight="fill" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800 leading-tight">{row.name}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded w-max">
              {row.category}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Lokasi Gudang',
      accessor: 'storeroom_location',
      render: (row) => (
        <span className="text-slate-600 font-medium text-xs">
          {row.storeroom_location || '—'}
        </span>
      )
    },
    {
      header: 'Kondisi',
      accessor: 'condition',
      render: (row) => getConditionBadge(row.condition)
    },
    {
      header: 'Stok (Tersedia / Total)',
      accessor: 'available_stock',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
            {row.available_stock}
          </span>
          <span className="text-slate-400 font-bold">/</span>
          <span className="font-mono text-sm font-bold text-slate-500">
            {row.total_stock}
          </span>
        </div>
      )
    },
    {
      header: 'Aksi',
      accessor: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          <button 
            onClick={() => handleOpenEditStandard(row)}
            className="p-2 text-slate-400 hover:text-accent hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            title="Edit Barang"
          >
            <PencilSimple size={18} weight="bold" />
          </button>
          <button 
            onClick={() => handleOpenDelete(row.id, row.name)}
            className="p-2 text-slate-400 hover:text-danger hover:bg-red-50 rounded-xl transition-all cursor-pointer"
            title="Hapus Barang"
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
        title="Master Item"
        description="Kelola seluruh logistik inventaris barang standar milik universitas."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari barang standar..."
        actions={
          <button 
            onClick={handleOpenAddStandard}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-primary text-white py-2.5 px-4 rounded-xl font-bold text-sm shadow-md hover:bg-primary-container transition-all active:scale-95"
          >
            <Plus size={16} weight="bold" />
            Tambah Barang Standar
          </button>
        }
      />

      <AdminDataTable 
        columns={standardColumns}
        data={filteredStandard}
        loading={loading}
        emptyMessage="Tidak ada data barang standar ditemukan."
      />

      {/* Standard Item Modal */}
      <ItemFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleStandardSubmit}
        initialData={editingItem}
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Barang Inventaris?"
        message={`Apakah Anda yakin ingin menghapus barang "${itemToDelete?.name}" dari sistem secara permanen?`}
        confirmText="Ya, Hapus"
        type="danger"
      />
    </div>
  );
}
