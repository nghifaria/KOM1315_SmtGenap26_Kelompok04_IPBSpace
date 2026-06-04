// Verification route wrapper
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole } from '../../shared/utils/authRole';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-md"></div>
        <p className="text-primary-container font-medium animate-pulse">Memverifikasi sesi...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRole = normalizeRole(user.role);

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'SuperAdmin') {
      return <Navigate to="/admin/super/overview" replace />;
    }
    if (userRole === 'FacilityAdmin') {
      return <Navigate to="/admin/facility/validations" replace />;
    }
    return <Navigate to="/civitas/dashboard" replace />;
  }

  return <Outlet />;
}
