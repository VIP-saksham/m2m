import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, Plus, Brain, Search as SearchIcon,
  Handshake, ShoppingBag, TrendingUp, Warehouse, Bell,
  User, HelpCircle, LogOut, Menu, X, ChevronDown, Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Drawer from '../components/ui/Drawer';
import NotificationDropdown from '../components/domain/NotificationDropdown';
import LanguageToggle from '../components/ui/LanguageToggle';

const Logo = () => {
  const { t } = useTranslation();
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
        <svg viewBox="0 0 32 32" className="h-6 w-6">
          <path fill="#1a5c38" d="M16 3C9 3 3 9 3 16s6 13 13 13 13-6 13-13S23 3 16 3zm0 2c2.2 0 4.2.7 5.9 1.8-1 1.3-2.5 2.2-4.2 2.2-2.9 0-5.3-2.1-5.7-4.8.6-.1 1.3-.2 2-.2zM5 16c0-4.3 2.4-8 6-10 .5 3.5 3.5 6.2 7.2 6.2 2.2 0 4.2-1 5.5-2.5C25.5 11.4 27 13.6 27 16c0 6.1-5 11-11 11S5 22.1 5 16z"/>
          <path fill="#2d8c4e" d="M20 19c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z" opacity=".6"/>
        </svg>
      </div>
      <div>
        <span className="font-black text-white text-lg tracking-tight">{t('appTitle.m2m')}</span>
        <span className="text-white/60 text-xs block leading-none -mt-0.5">{t('appTitle.tagline')}</span>
      </div>
    </Link>
  );
};

const SidebarContent = ({ onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const navItems = [
    { to: '/farmer/dashboard', icon: LayoutDashboard, label: t('farmer.overview') },
    { to: '/farmer/batches', icon: Package, label: t('farmer.myBatches') },
    { to: '/farmer/batches/new', icon: Plus, label: t('farmer.createBatch'), highlight: true },
    { to: '/farmer/decision-center', icon: Brain, label: t('farmer.decisionCenter') },
    { to: '/farmer/opportunities', icon: SearchIcon, label: t('farmer.opportunities') },
    { to: '/farmer/lots', icon: Handshake, label: t('farmer.procurementLots') },
    { to: '/farmer/market', icon: TrendingUp, label: t('farmer.marketIntelligence') },
    { to: '/farmer/storage', icon: Warehouse, label: t('farmer.storageDiscovery') },
    { to: '/farmer/notifications', icon: Bell, label: t('common.notifications') },
    { to: '/farmer/profile', icon: User, label: t('common.profile') },
  ];

  const handleLogout = () => {
    logout();
    success(t('farmer.loggedOut'), t('farmer.seeYouNextTime'));
    navigate('/');
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 bg-forest">
        <Logo />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 bg-forest/95">
        {navItems.map(({ to, icon: Icon, label, highlight }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white text-forest shadow-sm'
                  : highlight
                  ? 'bg-leaf-light/20 text-white hover:bg-white/10'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
            {highlight && (
              <span className="ml-auto bg-gold text-white text-xs px-1.5 py-0.5 rounded-md font-semibold">{t('common.new')}</span>
            )}
          </NavLink>
        ))}

        <div className="mt-2 pt-2 border-t border-white/10">
          <NavLink
            to="/community"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all text-white/60 hover:bg-white/10 hover:text-white ${isActive ? 'bg-white/10 text-white' : ''}`
            }
          >
            <Globe className="h-4 w-4" /> Community
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all"
          >
            <LogOut className="h-4 w-4" /> {t('layout.signOut')}
          </button>
        </div>
      </nav>

      {/* User info */}
      <div className="px-4 py-4 bg-forest border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-leaf-light/30 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-white/50 text-xs truncate">{user?.phone || user?.email}</p>
          </div>
          <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            user?.verification_status === 'verified' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
          }`}>
            {user?.verification_status === 'verified' ? '✓' : '?'}
          </div>
        </div>
      </div>
    </div>
  );
};

const FarmerLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <Drawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} title="">
        <div className="h-full">
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </div>
      </Drawer>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-cream-dark px-4 lg:px-6 h-16 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-cream text-charcoal-lighter"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />
          <LanguageToggle />

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl hover:bg-cream text-charcoal-lighter hover:text-charcoal transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <NotificationDropdown onClose={() => setNotifOpen(false)} />
              </div>
            )}
          </div>

          {/* User avatar */}
          <button type="button" onClick={() => navigate('/farmer/profile')} className="flex items-center gap-2 rounded-xl p-1 hover:bg-cream">
            <div className="h-8 w-8 rounded-full bg-forest flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium text-charcoal">{user?.name}</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default FarmerLayout;
