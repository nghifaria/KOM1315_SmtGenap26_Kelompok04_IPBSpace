import React, { useState, useEffect } from 'react';
import { Users, Desktop, Wind, Wrench, CheckCircle, Package, MagnifyingGlass, FunnelSimple } from '@phosphor-icons/react';
import { facilityService } from '../services/facilityService';
import { toast } from 'react-hot-toast';
import FacilityStatusModal from '../components/FacilityStatusModal';
import CustomDropdown from '../../../shared/components/ui/CustomDropdown';

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (facility) => {
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const handleSaveStatus = async (id, newStatus, conditionNotes) => {
    try {
      toast.loading('Menyimpan perubahan...', { id: 'facilityUpdate' });
      await facilityService.updateFacility(id, { condition: newStatus });
      setFacilities(prev => prev.map(f => f.id === id ? { ...f, condition: newStatus } : f));
      toast.success('Status ruangan berhasil diperbarui!', { id: 'facilityUpdate' });
      setIsModalOpen(false);
      setSelectedFacility(null);
    } catch (error) {
      console.error("Gagal update facility:", error);
      toast.error('Gagal memperbarui status ruangan.', { id: 'facilityUpdate' });
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchFacilities = async () => {
      try {
        setIsLoading(true);
        const res = await facilityService.getAllFacilities();
        if (isMounted) {
          // apiClient unwraps response.data → res = { success, data: { items: [] } }
          const raw = res?.data?.items ?? res?.data ?? res?.items ?? res ?? [];
          const items = Array.isArray(raw) ? raw : [];
          setFacilities(items);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          toast.error("Gagal memuat data ruangan.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchFacilities();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFacilities = facilities.filter(f => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = q === '' || 
      f.name.toLowerCase().includes(q) || 
      (f.location && f.location.toLowerCase().includes(q));

    let matchesStatus = true;
    if (filterStatus !== 'Semua Status') {
      const cond = (f.condition || f.status || 'good').toLowerCase();
      if (filterStatus === 'Tersedia') matchesStatus = cond === 'good' || cond === 'available';
      else if (filterStatus === 'Maintenance') matchesStatus = cond === 'maintenance' || cond === 'under_maintenance';
    }

    return matchesSearch && matchesStatus;
  });

  const getAssetIcon = (assetName) => {
    if (!assetName) return <Package size={16} />;
    const name = assetName.toLowerCase();
    if (name.includes('ac') || name.includes('pendingin')) return <Wind size={16} />;
    if (name.includes('pc') || name.includes('komputer') || name.includes('desktop')) return <Desktop size={16} />;
    return <Package size={16} />;
  };

  return (
    <div className="flex-grow p-4 md:p-8 bg-slate-50 overflow-auto min-h-full">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary mb-1">Manajemen Ruangan</h1>
          <p className="text-slate-500 text-sm">Kelola status, kondisi, dan ketersediaan fasilitas IPB Space.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input 
              type="text"
              placeholder="Cari ruangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl focus:ring-2 focus:ring-accent focus:border-accent block w-full p-3 pl-10 shadow-sm outline-none transition-all hover:bg-slate-50"
            />
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <CustomDropdown
            value={filterStatus}
            onChange={setFilterStatus}
            icon={<FunnelSimple size={16} weight="bold" />}
            options={[
              { value: 'Semua Status', label: 'Semua Status' },
              { value: 'Tersedia',    label: 'Tersedia',     color: 'bg-emerald-500' },
              { value: 'Maintenance', label: 'Maintenance',  color: 'bg-slate-400' },
            ]}
            className="w-full md:w-48 shrink-0"
          />
        </div>
      </div>

      {/* Bento Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {[...Array(8)].map((_, i) => (
             <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 h-80 animate-pulse">
               <div className="h-48 bg-slate-200 rounded-t-2xl"></div>
               <div className="p-4 space-y-3">
                 <div className="h-4 bg-slate-200 w-3/4 rounded"></div>
                 <div className="h-3 bg-slate-100 w-1/2 rounded"></div>
               </div>
             </div>
           ))}
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 font-bold text-xl mb-1">Ruangan Tidak Ditemukan</p>
          <p className="text-slate-400 text-sm">Coba ubah kata kunci pencarian atau sesuaikan filter status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFacilities.map((f) => {
            const cond = (f.condition || f.status || 'good').toLowerCase();
            const isMaintenance = cond === 'maintenance' || cond === 'under_maintenance';
            const isGood = cond === 'good' || cond === 'available';

            return (
              <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 group">
                {/* Image Container */}
                <div className="h-48 relative overflow-hidden bg-slate-100 border-b border-slate-100">
                  <img 
                    src={f.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600&h=400'} 
                    alt={f.name}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isMaintenance ? 'grayscale opacity-60' : ''}`}
                  />
                  
                  {/* Dynamic Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {isMaintenance && (
                      <span className="bg-[#F1F5F9] text-[#475569] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-slate-200 backdrop-blur-md">
                        <Wrench size={14} weight="bold" /> Maintenance
                      </span>
                    )}
                    {!isMaintenance && isGood && (
                      <span className="bg-[#D1FAE5] text-[#065F46] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-emerald-200 backdrop-blur-md">
                        <CheckCircle size={14} weight="bold" /> Tersedia
                      </span>
                    )}
                    
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-grow flex flex-col">
                  <h3 className="font-black text-slate-800 text-lg mb-1 truncate">{f.name}</h3>
                  <p className="text-slate-500 text-xs font-semibold mb-4 truncate">{f.location}</p>
                  
                  {/* Capacity & Assets Pills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200 shadow-sm">
                      <Users size={16} className="text-primary" /> {f.capacity} Orang
                    </span>
                    
                    {f.assets && f.assets.slice(0, 3).map((asset, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200 shadow-sm">
                        <span className="text-primary">{getAssetIcon(asset.name)}</span> {asset.name}
                      </span>
                    ))}
                    {f.assets && f.assets.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">
                        +{f.assets.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto">
                    <button 
                      onClick={() => openModal(f)}
                      className="w-full py-2.5 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
                    >
                      Ubah Status & Kondisi
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FacilityStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        facility={selectedFacility}
        onSave={handleSaveStatus}
      />
    </div>
  );
}
