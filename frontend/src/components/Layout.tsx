import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  Table2,
  Search,
  ArrowRightLeft,
  Box,
  Ruler,
  Tag,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEditor = user?.role === 'EDITOR';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLang = () => {
    const next = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), show: true },
    { to: '/rooms', icon: Home, label: t('nav.rooms'), show: true },
    { to: '/items-overview', icon: Table2, label: t('nav.items_overview'), show: true },
    { to: '/search', icon: Search, label: t('nav.search'), show: true },
    { to: '/lendings', icon: ArrowRightLeft, label: t('nav.lendings'), show: true },
    { to: '/container-types', icon: Box, label: t('nav.container_types'), show: isEditor },
    { to: '/units', icon: Ruler, label: t('nav.units'), show: isEditor },
    { to: '/tags', icon: Tag, label: t('nav.tags'), show: isEditor },
    { to: '/users', icon: Users, label: t('nav.users'), show: isEditor },
    { to: '/admin', icon: Settings, label: t('nav.admin'), show: isEditor },
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
          <div className="px-3 py-1.5 flex items-center justify-between">
            <div>
              <div className="text-gray-200 text-sm truncate">{user?.name ?? user?.email}</div>
              <div className="text-gray-500 text-xs mt-0.5">
                {user?.role === 'EDITOR' ? t('nav.role_editor') : t('nav.role_viewer')}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleLang}
              className="text-xs text-gray-400 hover:text-gray-200 border border-gray-600 hover:border-gray-400 rounded px-1.5 py-0.5 transition-colors"
              title={i18n.language === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
            >
              {t('nav.lang_toggle')}
            </button>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            {t('nav.logout')}
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
