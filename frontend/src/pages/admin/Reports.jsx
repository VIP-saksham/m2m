import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CheckCircle2, Package, Users } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/ui/Card';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { adminApi } from '../../services/api';

export default function Reports() {
  const { data: stats = {}, isLoading, isError } = useQuery({ queryKey: ['adminStatsReport'], queryFn: adminApi.getStats });
  const cards = [['Users', stats.totalUsers, Users], ['Batches', stats.totalBatches, Package], ['Active demands', stats.activeDemands, BarChart3], ['Confirmed lots', stats.confirmedLots, CheckCircle2]];
  return <AdminLayout><div className="space-y-6"><div><h1 className="text-2xl font-bold">Reports & analytics</h1><p className="text-gray-500">A quick view of the network&apos;s current health.</p></div>{isLoading ? <LoadingSkeleton count={2} /> : isError ? <p className="rounded-xl bg-red-50 p-5 text-red-700">Could not load report data.</p> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, Icon]) => <Card key={label}><Card.Body><Icon className="text-blue-600" size={22} /><p className="mt-4 text-sm text-gray-500">{label}</p><p className="mt-1 text-3xl font-bold">{value || 0}</p></Card.Body></Card>)}</div>}<Card><Card.Body><h2 className="font-semibold">Verification snapshot</h2><div className="mt-4 flex flex-wrap gap-6 text-sm"><span>Verified users: <strong>{stats.verifiedUsers || 0}</strong></span><span>Pending verification: <strong>{stats.pendingVerifications || 0}</strong></span><span>Farmers: <strong>{stats.farmers || 0}</strong></span><span>Processors: <strong>{stats.processors || 0}</strong></span></div></Card.Body></Card></div></AdminLayout>;
}
