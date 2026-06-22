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
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import InstanceDetailPage from './pages/InstanceDetailPage';
import ContainerTypesPage from './pages/ContainerTypesPage';
import UnitsPage from './pages/UnitsPage';
import LendingsPage from './pages/LendingsPage';
import UsersPage from './pages/UsersPage';
import ItemsOverviewPage from './pages/ItemsOverviewPage';
import TagsPage from './pages/TagsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import TranslationsPage from './pages/TranslationsPage';
import ContainersPage from './pages/ContainersPage';
import QRScannerPage from './pages/QRScannerPage';
import ProductGroupsPage from './pages/ProductGroupsPage';

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
          <Route path="/containers" element={<ContainersPage />} />
          <Route path="/locations/:id" element={<LocationDetailPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/product-groups" element={<ProductGroupsPage />} />
          <Route path="/instances/:id" element={<InstanceDetailPage />} />
          <Route path="/scan" element={<QRScannerPage />} />
          <Route path="/items-overview" element={<ItemsOverviewPage />} />
          <Route path="/lendings" element={<LendingsPage />} />
          <Route path="/container-types" element={<ContainerTypesPage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/translations" element={<TranslationsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  );
}
