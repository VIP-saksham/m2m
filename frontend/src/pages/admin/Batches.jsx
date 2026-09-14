import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { adminApi, batchApi } from '../../services/api';

export default function Batches() {
  const { data: batches = [], isLoading, isError } = useQuery({ queryKey: ['adminBatches'], queryFn: () => batchApi.getAll() });
  const queryClient = useQueryClient();
  const remove = useMutation({ mutationFn: (id) => adminApi.removeBatch(id, 'This listing was removed after an administrator safety review.'), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminBatches'] }) });
  return <AdminLayout><div className="space-y-6"><div><h1 className="text-2xl font-bold">Produce batches</h1><p className="text-gray-500">Review listings and remove unsafe or misleading content. The owner is notified.</p></div><Card className="overflow-hidden">{isLoading ? <LoadingSkeleton count={4} /> : isError ? <p className="p-6 text-red-600">Could not load batches.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">Batch</th><th className="p-4">Crop</th><th className="p-4">Quantity</th><th className="p-4">Quality</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y">{batches.map((batch) => <tr key={batch.id}><td className="p-4 font-semibold">{batch.batch_code}</td><td className="p-4">{batch.crop}</td><td className="p-4">{batch.quantity} {batch.unit}</td><td className="p-4">{batch.initial_quality_estimate || '-'}</td><td className="p-4"><Badge status={batch.status}>{batch.status}</Badge></td><td className="p-4">{batch.status !== 'removed' && <button onClick={() => window.confirm('Remove this listing and notify the farmer?') && remove.mutate(batch.id)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Remove</button>}</td></tr>)}</tbody></table>{batches.length === 0 && <p className="p-8 text-center text-gray-500">No batches found.</p>}</div>}</Card></div></AdminLayout>;
}
