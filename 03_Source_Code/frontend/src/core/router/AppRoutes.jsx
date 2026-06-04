// App Routes system
import React from 'react';
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Layouts
import MainLayout from '../../shared/components/layout/MainLayout';
import AdminLayout from '../../shared/components/layout/AdminLayout';

// Pages
import PublicExplore from '../../features/facilities/pages/PublicExplore';
import FacilityCatalog from '../../features/facilities/pages/FacilityCatalog';
import FacilityDetail from '../../features/facilities/pages/FacilityDetail';
import PublicCalendar from '../../features/calendar/pages/PublicCalendar';
import Login from '../../features/auth/pages/Login';
import Register from '../../features/auth/pages/Register';
import CivitasDashboard from '../../features/dashboard/pages/CivitasDashboard';
import CivitasProfile from '../../features/dashboard/pages/CivitasProfile';
import FacilityAdminOverview from '../../features/dashboard/pages/FacilityAdminOverview';
import AdminValidationList from '../../features/bookings/pages/AdminValidationList';
import FacilityManagement from '../../features/facilities/pages/FacilityManagement';
import FacilityFormPage from '../../features/facilities/pages/FacilityFormPage';
import AdminBookingHistory from '../../features/bookings/pages/AdminBookingHistory';
import AdminCalendarSchedule from '../../features/calendar/pages/AdminCalendarSchedule';
import AdminSystemLogs from '../../features/audit/pages/AdminSystemLogs';
import BookingForm from '../../features/bookings/pages/BookingForm';
import BookingHistory from '../../features/bookings/pages/BookingHistory';
import BookingDetail from '../../features/bookings/pages/BookingDetail';
import DigitalTicket from '../../features/tickets/pages/DigitalTicket';
import AdminTicketValidator from '../../features/tickets/pages/AdminTicketValidator';
import AdminManagement from '../../features/users/pages/AdminManagement';
import AdminMasterData from '../../features/facilities/pages/AdminMasterData';
import SuperAdminDashboard from '../../features/dashboard/pages/SuperAdminDashboard';
import SystemAuditLog from '../../features/audit/pages/SystemAuditLog';
import AdminItemMaster from '../../features/items/pages/AdminItemMaster';
import AdminAssetMaster from '../../features/assets/pages/AdminAssetMaster';

import NotFound from '../../shared/components/common/NotFound';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import { normalizeRole } from '../../shared/utils/authRole';

/**
 * Helper component that dynamically wraps public pages with the correct
 * layout depending on the user's authentication and role status.
 */
const DynamicLayoutWrapper = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-md"></div>
      </div>
    );
  }

  // Guest gets MainLayout (which acts as PublicLayout for guests)
  if (!user) {
    return (
      <MainLayout>
        <Outlet />
      </MainLayout>
    );
  }

  const role = normalizeRole(user.role);

  // Civitas gets MainLayout (which acts as CivitasLayout for civitas)
  if (role === 'Civitas') {
    return (
      <MainLayout>
        <Outlet />
      </MainLayout>
    );
  }

  // Redirect admin from root path directly to their dashboard
  if (user && location.pathname === '/') {
    if (role === 'FacilityAdmin') return <Navigate to="/admin/facility/validations" replace />;
    if (role === 'SuperAdmin') return <Navigate to="/admin/super/overview" replace />;
  }

  // Admins get AdminLayout by default here
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

// --- PLACEHOLDER COMPONENTS ---
const AdminValidationDetail = () => <div className="p-10 text-center">Detail Validasi</div>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* 2. DYNAMIC SHARED ROUTES */}
      <Route element={<DynamicLayoutWrapper />}>
        <Route path="/" element={<PublicExplore />} />
        <Route path="/facilities/explore" element={<FacilityCatalog />} />
        <Route path="/facilities/explore/:facilityId" element={<FacilityDetail />} />
        <Route path="/calendar" element={<PublicCalendar />} />

        {/* 3. CIVITAS ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['Civitas']} />}>
          <Route path="/civitas/dashboard" element={<CivitasDashboard />} />
          <Route path="/civitas/beranda" element={<Navigate to="/civitas/dashboard" replace />} />
          <Route path="/civitas/history" element={<BookingHistory />} />
          <Route path="/civitas/riwayat" element={<Navigate to="/civitas/history" replace />} />
          <Route path="/civitas/booking/:facilityId" element={<BookingForm />} />
          <Route path="/civitas/booking-detail/:bookingId" element={<BookingDetail />} />
          <Route path="/civitas/ticket/:bookingId" element={<DigitalTicket />} />
          <Route path="/civitas/profile" element={<CivitasProfile />} />
        </Route>
      </Route>

      {/* 4. FACILITY ADMIN ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={['FacilityAdmin']} />}>
        <Route element={<AdminLayout><Outlet /></AdminLayout>}>
          <Route path="/admin/facility/overview" element={<FacilityAdminOverview />} />
          <Route path="/admin/facility/room-management" element={<FacilityManagement />} />
          <Route path="/admin/facility/history" element={<AdminBookingHistory />} />
          <Route path="/admin/facility/calendar" element={<AdminCalendarSchedule />} />
          <Route path="/admin/facility/logs" element={<AdminSystemLogs />} />
          <Route path="/admin/facility/validations" element={<AdminValidationList />} />
          <Route path="/admin/facility/validations/:bookingId" element={<AdminValidationDetail />} />
        </Route>
      </Route>

      {/* 5. SUPER ADMIN ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={['SuperAdmin']} />}>
        <Route element={<AdminLayout><Outlet /></AdminLayout>}>
          <Route path="/admin/super/overview" element={<SuperAdminDashboard />} />
          <Route path="/admin/super/master-data" element={<AdminMasterData />} />
          <Route path="/admin/super/master-data/new" element={<FacilityFormPage />} />
          <Route path="/admin/super/master-data/:facilityId/edit" element={<FacilityFormPage />} />
          <Route path="/admin/super/users" element={<AdminManagement />} />
          <Route path="/admin/super/items" element={<AdminItemMaster />} />
          <Route path="/admin/super/assets" element={<AdminAssetMaster />} />
          <Route path="/admin/super/calendar" element={<AdminCalendarSchedule />} />
          <Route path="/admin/super/audit" element={<SystemAuditLog />} />
        </Route>
      </Route>


      {/* 6. TICKET VALIDATION SHARED ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={['FacilityAdmin', 'SuperAdmin']} />}>
        <Route path="/admin/validate-ticket/:bookingId" element={<AdminTicketValidator />} />
      </Route>

      {/* 7. CATCH ALL */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}