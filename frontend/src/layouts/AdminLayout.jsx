import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, Menu, X, LayoutDashboard, Users, Box, FileText, Layers, CheckSquare, BarChart, ShieldAlert, Send, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { adminApi } from '../services/api';
import NotificationDropdown from '../components/domain/NotificationDropdown';
import LanguageToggle from '../components/ui/LanguageToggle';

export default function AdminLayout({ children }) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Shared cache with the dashboard's 'adminStats' query — no extra request.
  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats,
    staleTime: 30000,
  });
  const pendingVerifications = stats?.pendingVerifications || 0;

  const navItems = [
    { name: t('admin.dashboard'), path: '/admin/dashboard', icon: LayoutDashboard },
    { name: t('admin.users'), path: '/admin/users', icon: Users },
    { name: t('admin.batches'), path: '/admin/batches', icon: Box },
    { name: t('admin.demands'), path: '/admin/demands', icon: FileText },
    { name: t('admin.procurementLots'), path: '/admin/lots', icon: Layers },
    { name: t('admin.verificationQueue'), path: '/admin/verification', icon: CheckSquare, badge: pendingVerifications },
    { name: t('admin.reports'), path: '/admin/reports', icon: BarChart },
    { name: t('admin.auditLogs'), path: '/admin/audit-logs', icon: ShieldAlert },
    { name: 'Send notification', path: '/admin/notifications', icon: Send },
    { name: 'Profile', path: '/admin/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 flex-col bg-slate-900 text-white md:flex">
        <div className="flex h-16 items-center justify-center border-b border-slate-700 px-4 text-center">
          <span className="text-xl font-bold tracking-wider text-white">{t('appTitle.m2mAdmin')}</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-leaf-light" />
                  )}
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-4">
          <button type="button" className="flex items-center group text-left" onClick={() => navigate('/admin/profile')}>
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-green-500" title="Online" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name || t('admin.administrator')}</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{user?.role || 'admin'}</p>
              <p className="text-xs text-slate-400 hover:text-blue-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>{t('admin.signout')}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile menu - similar structure but styled for admin */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-slate-900 pt-5 pb-4">
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
            <div className="flex flex-shrink-0 items-center px-4 mt-2">
              <span className="text-xl font-bold tracking-wider text-white">{t('appTitle.m2mAdmin')}</span>
            </div>
            <div className="mt-5 h-0 flex-1 overflow-y-auto">
              <nav className="space-y-1 px-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center rounded-md px-2 py-2 text-base font-medium ${
                        isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
            <div className="border-t border-slate-700 p-4">
              <button
                type="button"
                className="flex w-full items-center rounded-md px-2 py-2 text-base font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200"
                onClick={handleLogout}
              >
                <LogOut className="mr-4 h-5 w-5" aria-hidden="true" />
                {t('admin.signout')}
              </button>
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
            className="text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-900 md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">{t('admin.openSidebar')}</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex flex-1 justify-end items-center gap-3">
            <LanguageToggle />
            <div className="relative ml-4 flex items-center">
              <button
                type="button"
                className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span className="sr-only">{t('admin.viewNotifications')}</span>
                <Bell className="h-6 w-6" aria-hidden="true" />
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 z-50">
                   <NotificationDropdown onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>
            <button type="button" onClick={() => navigate('/admin/profile')} className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white" aria-label="Open profile">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </button>
          </div>
        </header>

        {/* Main section */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
