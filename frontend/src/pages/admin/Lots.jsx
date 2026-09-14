import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { lotApi } from '../../services/api';

export default function Lots() {
  const { data: lots = [], isLoading, isError } = useQuery({ queryKey: ['adminLots'], queryFn: () => lotApi.getAll() });
  return <AdminLayout><div className="space-y-6"><div><h1 className="text-2xl font-bold">Procurement lots</h1><p className="text-gray-500">Track matches from demand to confirmed procurement.</p></div><Card className="overflow-hidden">{isLoading ? <LoadingSkeleton count={4} /> : isError ? <p className="p-6 text-red-600">Could not load lots.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">Lot</th><th className="p-4">Quantity</th><th className="p-4">Farmers</th><th className="p-4">Match score</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y">{lots.map((lot) => <tr key={lot.id}><td className="p-4 font-semibold">{lot.lot_code}</td><td className="p-4">{lot.total_quantity} kg</td><td className="p-4">{lot.farmer_count}</td><td className="p-4">{lot.match_score ?? '-'} </td><td className="p-4"><Badge status={lot.status}>{lot.status}</Badge></td></tr>)}</tbody></table>{lots.length === 0 && <p className="p-8 text-center text-gray-500">No procurement lots found.</p>}</div>}</Card></div></AdminLayout>;
}
