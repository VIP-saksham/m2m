import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { adminApi, demandApi } from '../../services/api';

export default function Demands() {
  const { data: demands = [], isLoading, isError } = useQuery({ queryKey: ['adminDemands'], queryFn: () => demandApi.getAll() });
  const queryClient = useQueryClient();
  const remove = useMutation({ mutationFn: (id) => adminApi.removeDemand(id, 'This demand was removed after an administrator safety review.'), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminDemands'] }) });
  return <AdminLayout><div className="space-y-6"><div><h1 className="text-2xl font-bold">Processor demands</h1><p className="text-gray-500">Review demands and remove unsafe or misleading requests. The owner is notified.</p></div><Card className="overflow-hidden">{isLoading ? <LoadingSkeleton count={4} /> : isError ? <p className="p-6 text-red-600">Could not load demands.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">Demand</th><th className="p-4">Crop</th><th className="p-4">Quantity</th><th className="p-4">Min quality</th><th className="p-4">Deadline</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y">{demands.map((demand) => <tr key={demand.id}><td className="p-4 font-semibold">{demand.demand_code}</td><td className="p-4">{demand.crop}</td><td className="p-4">{demand.required_quantity} {demand.unit}</td><td className="p-4">{demand.minimum_quality}</td><td className="p-4">{demand.deadline ? new Date(demand.deadline).toLocaleDateString() : '-'}</td><td className="p-4"><Badge status={demand.status}>{demand.status}</Badge></td><td className="p-4">{demand.status !== 'removed' && <button onClick={() => window.confirm('Remove this demand and notify the buyer?') && remove.mutate(demand.id)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Remove</button>}</td></tr>)}</tbody></table>{demands.length === 0 && <p className="p-8 text-center text-gray-500">No demands found.</p>}</div>}</Card></div></AdminLayout>;
}
