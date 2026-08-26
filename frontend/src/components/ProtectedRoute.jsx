import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, currentSociety, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && currentSociety && currentSociety.role !== role) {
    return <Navigate to={currentSociety.role === 'admin' ? '/admin/dashboard' : '/member/dashboard'} replace />;
  }

  return children;
}
