import { 
  ProjectorScreen, 
  Chalkboard, 
  Wind, 
  SpeakerHigh, 
  Television, 
  WifiHigh, 
  Microphone, 
  Chair, 
  Desktop, 
  Plug, 
  Steps,
  VideoCamera,
  Camera,
  Laptop,
  Printer,
  Lightbulb,
  BookOpen,
  Archive,
  Sidebar,
  List
} from '@phosphor-icons/react';

export const ASSET_ICON_MAP = {
  // Indonesian names
  "Proyektor LCD": ProjectorScreen,
  "Proyektor 4K": ProjectorScreen,
  "Layar Proyektor": ProjectorScreen,
  "Papan Tulis Kaca": Chalkboard,
  "Papan Tulis Glass": Chalkboard,
  "Papan Tulis Putih": Chalkboard,
  "Papan Tulis Portable": Chalkboard,
  "Central Air Conditioner": Wind,
  "Air Conditioner (AC)": Wind,
  "AC Sentral": Wind,
  "AC Split": Wind,
  "Sound System Ruangan": SpeakerHigh,
  "Sound System Utama": SpeakerHigh,
  "Audio Mixer": SpeakerHigh,
  "Smart TV 65 Inci": Television,
  "Smart TV 55 Inci": Television,
  "Smart TV 75 Inci": Television,
  "Access Point High-Speed": WifiHigh,
  "WiFi High-Speed": WifiHigh,
  "Microphone Wireless": Microphone,
  "Mic Wireless": Microphone,
  "Mic Kabel": Microphone,
  "Meja Dosen": Desktop,
  "Meja Rapat": Desktop,
  "Kursi Kuliah Lipat": Chair,
  "Kursi Ergonomis": Chair,
  "Kursi Lipat": Chair,
  "Stopkontak Colokan": Plug,
  "Stopkontak Lantai": Plug,
  "Panggung Mini": Steps,
  "Panggung Utama": Steps,
  
  // English names
  "Projector": ProjectorScreen,
  "Projector Screen": ProjectorScreen,
  "Whiteboard": Chalkboard,
  "Whiteboard Glass": Chalkboard,
  "Air Conditioner": Wind,
  "AC": Wind,
  "Sound System": SpeakerHigh,
  "Speakers": SpeakerHigh,
  "LED TV 65 Inch": Television,
  "Smart TV": Television,
  "TV": Television,
  "High-Speed WiFi Access Point": WifiHigh,
  "WiFi": WifiHigh,
  "Access Point": WifiHigh,
  "Microphone": Microphone,
  "Wireless Microphone": Microphone,
  "Ergonomic Chairs": Chair,
  "Ergonomic Chair": Chair,
  "Folding Chair": Chair,
  "Chairs": Chair,
  "Table": Desktop,
  "Desk": Desktop,
  "Power Outlet": Plug,
  "Socket": Plug,
  "Mini Stage": Steps,
  "Stage": Steps,
  
  // Advanced hardware additions
  "Kamera Konferensi": VideoCamera,
  "Conference Camera": VideoCamera,
  "Webcam": VideoCamera,
  "Kamera DSLR": Camera,
  "DSLR Camera": Camera,
  "Komputer PC": Desktop,
  "Desktop PC": Desktop,
  "Laptop Admin": Laptop,
  "Laptop": Laptop,
  "Printer": Printer,
  "Scanner": Printer,
  "Lampu Panggung": Lightbulb,
  "Stage Lighting": Lightbulb,
  "Lampu Sorot": Lightbulb,
  "Podium": BookOpen,
  "Lemari": Archive,
  "Partition": Sidebar,
};

export const getAssetIcon = (assetName) => {
  return ASSET_ICON_MAP[assetName] || List;
};

export const getConditionLabel = (condition) => {
  if (!condition) return 'Sangat Baik';
  const condLower = condition.toLowerCase();
  if (condLower === 'good') return 'Sangat Baik';
  if (condLower === 'maintenance') return 'Dalam Perbaikan';
  if (condLower === 'broken') return 'Rusak';
  return condition;
};

export const getConditionColor = (condition) => {
  if (!condition) return 'text-emerald-800 bg-emerald-50/65 border-emerald-100/80';
  const condLower = condition.toLowerCase();
  if (condLower === 'good') return 'text-emerald-800 bg-emerald-50/65 border-emerald-100/80';
  if (condLower === 'maintenance') return 'text-warning bg-warning/10 border-warning/30';
  if (condLower === 'broken') return 'text-danger bg-danger/10 border-danger/30';
  return 'text-on-surface-variant bg-surface-dim/40 border-surface-container';
};

export const getConditionClass = (condition) => {
  if (!condition) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  const condLower = condition.toLowerCase();
  if (condLower === 'good') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (condLower === 'maintenance') return 'text-amber-700 bg-amber-50 border-amber-200';
  if (condLower === 'broken') return 'text-red-700 bg-red-50 border-red-200';
  return 'text-gray-700 bg-gray-50 border-gray-200';
};
