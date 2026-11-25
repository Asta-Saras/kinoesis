import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/** Gate for authenticated routes. Remembers where the user was heading. */
export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** "/" entry point: send visitors to auth, signed-in users home. */
export function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={user ? '/home' : '/auth'} replace />;
}
