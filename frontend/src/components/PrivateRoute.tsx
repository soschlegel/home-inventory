import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

export default function PrivateRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
