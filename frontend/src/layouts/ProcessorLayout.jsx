import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Menu, X, LayoutDashboard, FileText, List, Network, Box, BellRing, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationDropdown from '../components/domain/NotificationDropdown';
import LanguageToggle from '../components/ui/LanguageToggle';

export default function ProcessorLayout({ children }) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: t('buyerProcessor.overview'), path: '/processor/dashboard', icon: LayoutDashboard },
    { name: t('buyerProcessor.createDemand'), path: '/processor/demands/new', icon: FileText },
    { name: t('buyerProcessor.demandBoard'), path: '/processor/demands', icon: List },
    { name: 'Community', path: '/community', icon: Network },
    { name: t('buyerProcessor.procurementLots'), path: '/processor/lots', icon: Box },
    { name: t('buyerProcessor.notifications'), path: '/processor/notifications', icon: BellRing },
    { name: t('buyerProcessor.profile'), path: '/processor/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-cream">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 flex-col bg-forest text-white md:flex">
        <div className="flex h-16 items-center justify-center border-b border-white/10 px-4">
          <svg className="h-8 w-auto text-gold" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zm0 10l-10-5v10l10 5 10-5V7l-10 5z" />
          </svg>
          <span className="ml-2 text-xl font-bold tracking-wider">{t('appTitle.m2m')}</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                  isActive ? 'bg-leaf text-white' : 'text-white/80 hover:bg-leaf/50 hover:text-white'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center group cursor-pointer" onClick={() => navigate('/processor/profile')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-forest font-bold">
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name || t('auth.roleBuyerProcessor')}</p>
              <button type="button" className="text-xs text-left text-white/70 hover:text-gold" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>{t('layout.signOut')}</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-forest pt-5 pb-4">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">{t('admin.closeSidebar')}</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-shrink-0 items-center px-4">
              <svg className="h-8 w-auto text-gold" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zm0 10l-10-5v10l10 5 10-5V7l-10 5z" />
              </svg>
              <span className="ml-2 text-xl font-bold tracking-wider text-white">{t('appTitle.m2m')}</span>
            </div>
            <div className="mt-5 h-0 flex-1 overflow-y-auto">
              <nav className="space-y-1 px-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center rounded-md px-2 py-2 text-base font-medium ${
                        isActive ? 'bg-leaf text-white' : 'text-white/80 hover:bg-leaf/50 hover:text-white'
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="mr-4 h-6 w-6 flex-shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="border-t border-white/10 p-4">
               <div className="flex items-center group">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-forest font-bold">
                  {user?.name?.charAt(0) || 'P'}
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-white">{user?.name || t('auth.roleBuyerProcessor')}</p>
                  <button type="button" className="text-sm text-white/70 hover:text-gold" onClick={handleLogout}>{t('layout.signOut')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">{t('admin.openSidebar')}</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex flex-1 justify-end items-center gap-3">
            <LanguageToggle />
            <button type="button" onClick={() => navigate('/processor/profile')} className="flex items-center gap-2 rounded-xl p-1 hover:bg-cream">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">{user?.name?.[0]?.toUpperCase() || 'B'}</span>
              <span className="hidden text-sm font-medium text-charcoal sm:block">{user?.name}</span>
            </button>
            <div className="relative ml-4 flex items-center">
              <button
                type="button"
                className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span className="sr-only">{t('admin.viewNotifications')}</span>
                <Bell className="h-6 w-6" aria-hidden="true" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 z-50">
                   <NotificationDropdown onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main section */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-cream">
          {children}
        </main>
      </div>
    </div>
  );
}
