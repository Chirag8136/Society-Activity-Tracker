import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const home = user?.role === 'admin' ? '/admin/dashboard' : '/login';
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-gray-600">Page not found</p>
      <Link to={home} className="btn-primary">Go Home</Link>
    </div>
  );
}
