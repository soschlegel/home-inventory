import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Spinner from './components/Spinner';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import LocationDetailPage from './pages/LocationDetailPage';
import ItemDetailPage from './pages/ItemDetailPage';
import SearchPage from './pages/SearchPage';
import ContainerTypesPage from './pages/ContainerTypesPage';
import LendingsPage from './pages/LendingsPage';

export default function App() {
  const { isLoading } = useAuth();
  if (isLoading) return <Spinner fullscreen />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/locations/:id" element={<LocationDetailPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/lendings" element={<LendingsPage />} />
          <Route path="/container-types" element={<ContainerTypesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
