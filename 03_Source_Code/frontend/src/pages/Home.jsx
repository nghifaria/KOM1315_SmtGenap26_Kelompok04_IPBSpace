import { useState, useEffect } from "react";
import api from "../lib/axios";
import FacilityCard from "../components/FacilityCard";
import { Buildings, CircleNotch } from "@phosphor-icons/react";
import { Toaster, toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Home() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFacilities = async () => {
    try {
      const response = await api.get("/facilities/");
      setFacilities(response.data);
    } catch (error) {
      console.error("Gagal ambil data:", error);
      toast.error("Gagal terhubung ke server backend!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Buildings size={24} weight="fill" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              IPB Space
            </h1>
          </div>
          <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-blue-600">
            Login
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Daftar Fasilitas</h2>
          <p className="text-gray-500 mt-2">Temukan dan booking ruangan untuk kegiatanmu.</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <CircleNotch size={48} className="animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500">Memuat data ruangan...</p>
          </div>
        ) : (
          /* Grid Card Ruangan */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.length > 0 ? (
              facilities.map((item) => (
                <FacilityCard key={item.id} facility={item} />
              ))
            ) : (
              <div className="col-span-full text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">Belum ada data ruangan.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
