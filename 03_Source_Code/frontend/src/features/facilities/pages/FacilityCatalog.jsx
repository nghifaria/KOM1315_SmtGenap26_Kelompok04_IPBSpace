import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import RoomCard from '../components/RoomCard';
import Input from '../../../shared/components/ui/Input/Input';
import { useFacilities } from '../hooks/useFacilities';
import { isFacilityAvailable } from '../../../shared/constants/facility';
import { Compass } from '@phosphor-icons/react';

export default function FacilityCatalog() {
  const { facilities, loading, error } = useFacilities();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [minCapacity, setMinCapacity] = useState(searchParams.get('capacity') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setMinCapacity(searchParams.get('capacity') || '');
    setStatusFilter(searchParams.get('status') || 'all');
  }, [searchParams]);

  const updateSearchParam = (key, value) => {
    setSearchParams(prev => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      return prev;
    }, { replace: true });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    updateSearchParam('search', value);
  };

  const handleCapacityChange = (e) => {
    const value = e.target.value;
    setMinCapacity(value);
    updateSearchParam('capacity', value);
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    updateSearchParam('status', value);
  };

  const filteredFacilities = facilities.filter(f => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      q === '' || 
      f.name.toLowerCase().includes(q) || 
      (f.location && f.location.toLowerCase().includes(q));
    const matchesCapacity = minCapacity ? f.capacity >= parseInt(minCapacity, 10) : true;
    const isAvailable = isFacilityAvailable(f);
    const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'available' ? isAvailable : !isAvailable);
    return matchesSearch && matchesCapacity && matchesStatus;
  });

  return (
    <>
      <div className="bg-surface py-8 px-4 md:px-8 min-h-screen flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-gray-100 pb-4 gap-4 animate-slide-up">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-primary flex items-center gap-3">
                <Compass size={36} weight="duotone" className="text-accent" />
                Eksplorasi Fasilitas
              </h1>
              <p className="text-gray-500 mt-2 text-base">Temukan ruangan terbaik untuk kebutuhan kegiatan Anda.</p>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-[1.5rem] shadow-ambient mb-8 flex flex-col md:flex-row gap-4 items-center border border-gray-100 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <form onSubmit={e => e.preventDefault()} className="flex-[2] w-full">
              <Input 
                placeholder="Cari nama gedung atau ruangan..." 
                className="py-2.5 bg-surface-lowest border-gray-200 focus:border-accent shadow-inner text-on-surface"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </form>
            <div className="flex-1 w-full">
              <input 
                type="number"
                placeholder="Min Kapasitas"
                className="w-full rounded-btn border border-gray-200 px-4 py-2.5 focus:outline-none focus:border-accent text-on-surface bg-surface-lowest shadow-inner"
                value={minCapacity}
                onChange={handleCapacityChange}
              />
            </div>
            <div className="flex-1 w-full">
              <select 
                className="w-full rounded-btn border border-gray-200 px-4 py-2.5 focus:outline-none focus:border-accent text-on-surface bg-surface-lowest shadow-inner"
                value={statusFilter}
                onChange={handleStatusChange}
              >
                <option value="all">Semua Status</option>
                <option value="available">Tersedia</option>
                <option value="maintenance">Perbaikan</option>
              </select>
            </div>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-gray-200 h-80 rounded-[1.5rem]"></div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20 text-danger bg-error-container rounded-card border border-danger/20">
                <p className="font-bold">{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredFacilities.length > 0 ? (
                  filteredFacilities.map((room) => (
                    <RoomCard 
                      key={room.id}
                      id={room.id}
                      name={room.name}
                      location={room.location}
                      capacity={room.capacity}
                      status={isFacilityAvailable(room) ? "Tersedia" : "Dalam Perbaikan"}
                      imageUrl={room.image_url}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-24 bg-white rounded-[2rem] shadow-sm border border-gray-100">
                    <p className="text-gray-400 font-bold text-xl mb-2">Fasilitas Tidak Ditemukan</p>
                    <p className="text-gray-400 text-sm">Coba ubah kata kunci pencarian atau turunkan kapasitas minimum.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
