import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  Search,
  ArrowRightLeft,
  Box,
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isEditor = user?.role === 'EDITOR';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/rooms', icon: Home, label: 'Räume', show: true },
    { to: '/search', icon: Search, label: 'Suche', show: true },
    { to: '/lendings', icon: ArrowRightLeft, label: 'Ausleihen', show: true },
    { to: '/container-types', icon: Box, label: 'Container-Typen', show: isEditor },
    { to: '/users', icon: Users, label: 'Nutzer', show: isEditor },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-gray-700">
          <h1 className="text-white font-semibold text-lg">🏠 Home Inventory</h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.filter((n) => n.show).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-700">
          <div className="px-3 py-1.5">
            <div className="text-gray-200 text-sm truncate">{user?.name ?? user?.email}</div>
            <div className="text-gray-500 text-xs mt-0.5">
              {user?.role === 'EDITOR' ? '✏️ Editor' : '👁 Betrachter'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
