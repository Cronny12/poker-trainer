import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-white bg-gradient-to-b from-velvet-green-900 via-velvet-green-800 to-velvet-red-900">
        <div className="rounded-2xl border border-white/20 px-8 py-4 bg-white/5 backdrop-blur text-lg">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
