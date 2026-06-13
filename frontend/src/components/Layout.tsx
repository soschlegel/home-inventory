import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  Table2,
  ArrowRightLeft,
  Box,
  Ruler,
  Tag,
  Languages,
  Users,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEditor = user?.role === 'EDITOR';
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLang = () => {
    const next = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  const closeMobile = () => setMobileOpen(false);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), show: true },
    { to: '/rooms', icon: Home, label: t('nav.rooms'), show: true },
    { to: '/items-overview', icon: Table2, label: t('nav.items_overview'), show: true },
    { to: '/lendings', icon: ArrowRightLeft, label: t('nav.lendings'), show: true },
    { to: '/container-types', icon: Box, label: t('nav.container_types'), show: isEditor },
    { to: '/units', icon: Ruler, label: t('nav.units'), show: isEditor },
    { to: '/tags', icon: Tag, label: t('nav.tags'), show: isEditor },
    { to: '/translations', icon: Languages, label: t('nav.translations'), show: isEditor },
    { to: '/users', icon: Users, label: t('nav.users'), show: isEditor },
    { to: '/admin', icon: Settings, label: t('nav.admin'), show: isEditor },
    { to: '/profile', icon: User, label: t('nav.profile'), show: true },
  ];

  const sidebarContent = (
    <>
      <div className="px-6 py-5 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <h1 className="text-white font-semibold text-lg">🏠 Home Inventory</h1>
        <button
          type="button"
          className="md:hidden text-gray-400 hover:text-white p-1 -mr-1"
          onClick={closeMobile}
          aria-label="Menü schließen"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.filter((n) => n.show).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
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

      <div className="px-3 py-4 border-t border-gray-700 flex-shrink-0">
        <div className="px-3 py-1.5 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-gray-200 text-sm truncate">{user?.name ?? user?.email}</div>
            <div className="text-gray-500 text-xs mt-0.5">
              {user?.role === 'EDITOR' ? t('nav.role_editor') : t('nav.role_viewer')}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleLang}
            className="ml-2 text-xs text-gray-400 hover:text-gray-200 border border-gray-600 hover:border-gray-400 rounded px-1.5 py-0.5 transition-colors flex-shrink-0"
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
        <div className="mt-3 px-3 text-xs text-gray-600 text-center">
          v{__APP_VERSION__}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh bg-gray-50">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar — drawer on mobile, static on desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 flex flex-col
          transition-transform duration-200 ease-in-out
          md:static md:translate-x-0 md:flex-shrink-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main area (top bar + content) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden bg-gray-900 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-gray-300 hover:text-white p-0.5"
            aria-label="Navigation öffnen"
          >
            <Menu size={22} />
          </button>
          <span className="text-white font-semibold text-sm">🏠 Home Inventory</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-4 md:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
