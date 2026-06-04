const ROLE_ALIASES = {
  civitas: 'Civitas',
  user: 'Civitas',
  facility_manager: 'FacilityAdmin',
  facilityadmin: 'FacilityAdmin',
  facility_admin: 'FacilityAdmin',
  admin: 'SuperAdmin',
  superadmin: 'SuperAdmin',
  super_admin: 'SuperAdmin',
};

export const normalizeRole = (role) => {
  if (!role) return '';
  const key = String(role).trim().toLowerCase();
  return ROLE_ALIASES[key] || role;
};

export const isCivitasRole = (role) => normalizeRole(role) === 'Civitas';

export const isFacilityAdminRole = (role) => normalizeRole(role) === 'FacilityAdmin';

export const isSuperAdminRole = (role) => normalizeRole(role) === 'SuperAdmin';
