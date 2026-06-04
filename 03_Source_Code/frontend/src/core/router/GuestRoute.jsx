import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function GuestRoute() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated && user) {
    if (user.role === 'civitas') return <Navigate to="/civitas/dashboard" replace />;
    if (user.role === 'facility_manager') return <Navigate to="/admin/facility/validations" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/super/master-data" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}