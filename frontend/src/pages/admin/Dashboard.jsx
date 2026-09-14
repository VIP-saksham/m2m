import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, ArrowRight, BadgeCheck, Boxes, CheckCircle2, ClipboardList,
  Layers, Package, ShieldAlert, Sprout, TrendingUp, UserCheck, Users, Warehouse,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/ui/Card';

const COLORS = ['#2d8c4e', '#c9a84c', '#1a5c38', '#4caf6e', '#a08030'];
const CHART_TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e5ddd0',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  fontSize: 13,
};

const StatTile = ({ icon: Icon, label, value, sub, accent, badge, onClick, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.07 }}
    whileHover={{ y: -4 }}
  >
    <Card
      className={`relative overflow-hidden p-5 cursor-pointer transition-shadow hover:shadow-card-hover ${onClick ? '' : 'cursor-default'}`}
      onClick={onClick}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`rounded-2xl p-3 ${accent.replace('bg-gradient-to-r', 'bg').split(' ')[0]} bg-opacity-10`}>
          <Icon size={24} className="text-forest" />
        </div>
      </div>
      {badge > 0 && (
        <span className="absolute right-4 top-4 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </Card>
  </motion.div>
);

const SectionCard = ({ title, action, children, className = '' }) => (
  <Card className={`flex flex-col ${className}`}>
    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {action}
    </div>
    <div className="flex-1 p-4">{children}</div>
  </Card>
);

const ACTION_META = {
  verify_user: { label: 'Verified', className: 'bg-green-100 text-green-700' },
  suspend_user: { label: 'Suspend toggle', className: 'bg-red-100 text-red-700' },
  create_batch: { label: 'Batch created', className: 'bg-blue-100 text-blue-700' },
  create_demand: { label: 'Demand posted', className: 'bg-purple-100 text-purple-700' },
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: stats = {}, isLoading, isError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats,
    refetchInterval: 30000, // keep the pulse live
  });

  const qualityData = ['A', 'B', 'C'].map((q) => ({
    name: `Grade ${q}`,
    value: stats?.batchesByQuality?.[q] || 0,
  }));

  const statusData = Object.entries(stats?.batchesByStatus || {}).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
  }));

  const trendData = stats?.activityTrend || [];
  const cropData = stats?.batchesByCrop || [];
  const events = stats?.recentEvents || [];
  const hasEvents = events.length > 0;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            {t('admin.dashboard')}
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Live
            </span>
          </h1>
          <p className="mt-1 text-gray-600">{t('admin.systemStats')} · refreshes every 30s</p>
        </div>
        <button
          onClick={() => navigate('/admin/verification')}
          className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-white shadow-green transition hover:-translate-y-0.5 hover:bg-forest-dark"
        >
          <BadgeCheck size={18} />
          {t('admin.verificationQueue')}
          {stats?.pendingVerifications > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {stats.pendingVerifications}
            </span>
          )}
        </button>
      </div>

      {isError && (
        <Card className="mb-6 p-6 text-center text-gray-500">{t('common.failedToLoad')}</Card>
      )}

      {/* Stat tiles */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          index={0}
          icon={Users}
          label={t('admin.totalUsers')}
          value={stats?.totalUsers ?? '—'}
          sub={`${stats?.farmers || 0} ${t('network.farmers')} · ${stats?.processors || 0} ${t('network.processors')}`}
          accent="bg-gradient-to-r from-blue-500 to-blue-400"
          onClick={() => navigate('/admin/users')}
        />
        <StatTile
          index={1}
          icon={Package}
          label={t('admin.batches')}
          value={stats?.totalBatches ?? '—'}
          sub={cropData.length ? `Top crop: ${cropData[0].crop}` : undefined}
          accent="bg-gradient-to-r from-leaf to-leaf-light"
          onClick={() => navigate('/admin/batches')}
        />
        <StatTile
          index={2}
          icon={ClipboardList}
          label={`${t('common.active')} ${t('admin.demands')}`}
          value={stats?.activeDemands ?? '—'}
          accent="bg-gradient-to-r from-purple-500 to-purple-400"
          onClick={() => navigate('/admin/demands')}
        />
        <StatTile
          index={3}
          icon={Layers}
          label={t('admin.procurementLots')}
          value={stats?.totalLots ?? '—'}
          sub={`${stats?.confirmedLots || 0} confirmed`}
          accent="bg-gradient-to-r from-gold to-gold-light"
          onClick={() => navigate('/admin/lots')}
        />
      </div>

      {/* Charts row */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title={
            <span className="flex items-center gap-2">
              <Activity size={18} className="text-forest" /> Platform activity — last 7 days
            </span>
          }
        >
          {isLoading ? (
            <div className="flex h-56 items-center justify-center text-gray-400">{t('common.loading')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={trendData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d8c4e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2d8c4e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee7db" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#636366' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#636366' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="count" stroke="#1a5c38" strokeWidth={2.5} fill="url(#activityFill)" name="Events" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title={<span className="flex items-center gap-2"><Boxes size={18} className="text-forest" /> Batches by quality</span>}>
          {isLoading ? (
            <div className="flex h-56 items-center justify-center text-gray-400">{t('common.loading')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={qualityData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {qualityData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-gray-600">
            {qualityData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={<span className="flex items-center gap-2"><TrendingUp size={18} className="text-forest" /> Top crops</span>}>
          {isLoading ? (
            <div className="flex h-52 items-center justify-center text-gray-400">{t('common.loading')}</div>
          ) : cropData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-gray-400">{t('common.noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={cropData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee7db" vertical={false} />
                <XAxis dataKey="crop" tick={{ fontSize: 12, fill: '#636366' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#636366' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Batches" radius={[8, 8, 0, 0]} fill="#2d8c4e" maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard
          title={<span className="flex items-center gap-2"><Activity size={18} className="text-forest" /> {t('admin.recentActivity')}</span>}
          action={
            <button onClick={() => navigate('/admin/audit-logs')} className="flex items-center text-sm font-medium text-forest hover:text-forest-dark">
              {t('common.viewAll')} <ArrowRight size={15} className="ml-1" />
            </button>
          }
        >
          {isLoading ? (
            <div className="flex h-52 items-center justify-center text-gray-400">{t('common.loading')}</div>
          ) : !hasEvents ? (
            <div className="flex h-52 flex-col items-center justify-center gap-2 text-gray-400">
              <ShieldAlert size={28} />
              <span className="text-sm">No audit events yet</span>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {events.map((e) => {
                const meta = ACTION_META[e.action] || { label: e.action, className: 'bg-gray-100 text-gray-700' };
                const time = e.createdAt ? new Date(e.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-gray-800">
                        <span className="font-semibold">{e.actorName}</span>
                        {' · '}
                        <span className="text-gray-500">{e.entityType} #{e.entityId ?? '—'}</span>
                      </p>
                      <p className="text-xs text-gray-400">{time}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: UserCheck, label: t('admin.verificationQueue'), path: '/admin/verification', badge: stats?.pendingVerifications },
          { icon: Users, label: t('admin.users'), path: '/admin/users' },
          { icon: Sprout, label: t('admin.batches'), path: '/admin/batches' },
          { icon: Warehouse, label: t('admin.reports'), path: '/admin/reports' },
        ].map(({ icon: Icon, label, path, badge }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="relative flex flex-col items-center gap-3 rounded-2xl border border-cream-darker bg-white p-5 transition hover:-translate-y-0.5 hover:border-leaf hover:shadow-card-hover"
          >
            {badge > 0 && (
              <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                {badge}
              </span>
            )}
            <span className="rounded-2xl bg-forest/5 p-3 text-forest"><Icon size={22} /></span>
            <span className="text-sm font-semibold text-gray-800">{label}</span>
          </button>
        ))}
      </div>
    </AdminLayout>
  );
}
