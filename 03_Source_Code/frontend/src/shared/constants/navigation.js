import { House, Compass, CalendarBlank, ClockCounterClockwise, User as UserIcon } from '@phosphor-icons/react';

export const PUBLIC_DESKTOP_LINKS = [
  { name: 'Beranda', path: '/' },
  { name: 'Eksplorasi', path: '/facilities/explore' },
  { name: 'Kalender Publik', path: '/calendar' },
];

export const PUBLIC_MOBILE_LINKS = [
  { name: 'Beranda', path: '/', icon: House },
  { name: 'Eksplorasi', path: '/facilities/explore', icon: Compass },
  { name: 'Kalender', path: '/calendar', icon: CalendarBlank },
];

export const CIVITAS_DESKTOP_LINKS = [
  { name: 'Beranda', path: '/civitas/dashboard' },
  { name: 'Eksplorasi', path: '/facilities/explore' },
  { name: 'Kalender Publik', path: '/calendar' },
  { name: 'Riwayat', path: '/civitas/history' },
];

export const CIVITAS_MOBILE_LINKS = [
  { name: 'Beranda', path: '/civitas/dashboard', icon: House },
  { name: 'Eksplorasi', path: '/facilities/explore', icon: Compass },
  { name: 'Kalender', path: '/calendar', icon: CalendarBlank },
  { name: 'Riwayat', path: '/civitas/history', icon: ClockCounterClockwise },
  { name: 'Profil', path: '/civitas/profile', icon: UserIcon },
];
