import React from 'react';
import { useNavigate } from 'react-router-dom';
import RoomCard from '../components/RoomCard';
import Input from '../../../shared/components/ui/Input/Input';
import bgRektorat from '../../../assets/images/background.jpg';
import { Compass } from '@phosphor-icons/react';

import { facilityService } from '../services/facilityService';
import { isFacilityAvailable } from '../../../shared/constants/facility';

export default function PublicExplore() {
  const [facilities, setFacilities] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await facilityService.getAllFacilities();
        if (response.success) {
          setFacilities(response.data.items || []);
        }
      } catch (error) {
        console.error('Error fetching facilities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/facilities/explore?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/facilities/explore');
    }
  };

  const filteredFacilities = facilities.filter((room) => {
    const q = searchTerm.toLowerCase();
    return (
      q === '' ||
      room.name.toLowerCase().includes(q) ||
      (room.location && room.location.toLowerCase().includes(q))
    );
  });

  return (
    <>
      {/* Hero Section */}
      <section 
        className="relative w-full min-h-[360px] md:min-h-[72vh] flex flex-col items-center bg-cover bg-center pt-5"
        style={{ backgroundImage: `url(${bgRektorat})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-primary-container/70 to-transparent"></div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center animate-slide-up">
          <h1 className="text-white font-black text-[2.5rem] md:text-8xl leading-[1.1] md:leading-[1] tracking-tighter drop-shadow-2xl">
            Book Your Space,<br />Set Your Pace,<br /><span className="text-accent italic">Make Your Place.</span>
          </h1>
        </div>

        {/* Floating Search Bar */}
        <form 
          onSubmit={handleSearchSubmit}
          className="bg-white rounded-[2rem] shadow-2xl p-2 max-w-3xl w-[calc(100%-3rem)] mx-auto -mb-12 relative z-20 border border-white/50 backdrop-blur-sm animate-slide-up"
          style={{ animationDelay: '0.05s' }}
        >
          <div className="bg-surface-lowest rounded-[1.5rem] p-0.5">
            <Input 
              placeholder="Cari nama gedung atau ruangan..." 
              className="border-none shadow-none text-base md:text-lg py-2.5 md:py-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </form>
      </section>

      {/* Facilities Grid Section */}
      <section className="bg-surface py-20 px-4 md:px-8 mt-8 md:mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-gray-100 pb-4 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-primary flex items-center gap-3">
                <Compass size={36} weight="duotone" className="text-accent" />
                Eksplorasi Fasilitas
              </h1>
              <p className="text-gray-500 mt-2 text-base">Temukan ruangan terbaik untuk aktivitas akademik dan organisasimu.</p>
            </div>
          </div>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-gray-200 h-80 rounded-card"></div>
                ))}
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
                  <div className="col-span-full text-center py-20 bg-white rounded-card border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium text-lg">Belum ada data fasilitas yang tersedia.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
