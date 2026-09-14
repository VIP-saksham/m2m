import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, Package, X } from 'lucide-react';
import ProcessorLayout from '../../layouts/ProcessorLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { lotApi } from '../../services/api';

export default function ProcurementLots() {
  const queryClient = useQueryClient();
  const { data: lots = [], isLoading, isError } = useQuery({
    queryKey: ['processorLots'],
    queryFn: lotApi.list,
    refetchInterval: 10000,
  });
  const action = useMutation({
    mutationFn: ({ id, type }) => type === 'confirm' ? lotApi.confirm(id) : lotApi.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['processorLots'] }),
  });
  return (
    <ProcessorLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Procurement lots</h1><p className="mt-1 text-gray-600">Review matches and farmer responses before confirming a purchase.</p></div>
        {isLoading && <LoadingSkeleton count={3} />}
        {isError && <Card className="p-5 text-red-700">Unable to load procurement lots.</Card>}
        {!isLoading && !isError && lots.length === 0 && <Card className="p-10 text-center"><Package className="mx-auto mb-3 text-gray-300" /><p>No procurement lots yet. Run matching from a demand.</p></Card>}
        <div className="grid gap-4 lg:grid-cols-2">{lots.map((lot) => (
          <Card key={lot.id} className="p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-leaf">{lot.lot_code}</p><h2 className="mt-1 text-xl font-bold">{lot.crop || 'Produce'} lot</h2></div><Badge status={lot.status}>{lot.status}</Badge></div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-cream p-3"><span className="block text-gray-500">Matched quantity</span><strong>{lot.total_quantity} {lot.unit || 'kg'}</strong></div><div className="rounded-xl bg-cream p-3"><span className="block text-gray-500">Farmers</span><strong>{lot.farmer_count}</strong></div></div>
            <div className="mt-5 flex gap-2"><Button variant="outline" className="flex-1" onClick={() => window.location.assign(`/processor/lots/${lot.id}`)}><Eye size={16} /> View</Button>{['proposed', 'pending_review', 'farmer_accepted'].includes(lot.status) && <><Button className="flex-1" onClick={() => action.mutate({ id: lot.id, type: 'confirm' })}><Check size={16} /> Confirm</Button><Button variant="outline" onClick={() => action.mutate({ id: lot.id, type: 'reject' })}><X size={16} /></Button></>}</div>
          </Card>
        ))}</div>
      </div>
    </ProcessorLayout>
  );
}
