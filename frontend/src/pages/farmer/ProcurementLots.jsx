import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Handshake, MapPin, Package, Check, X, AlertCircle } from 'lucide-react';
import FarmerLayout from '../../layouts/FarmerLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { lotApi } from '../../services/api';

const ProcurementLots = () => {
  const queryClient = useQueryClient();
  const { data: lots = [], isLoading, isError } = useQuery({
    queryKey: ['farmerProcurementLots'],
    queryFn: () => lotApi.list(),
  });

  const respond = async (id, response) => {
    await lotApi.farmerRespond(id, response);
    queryClient.invalidateQueries({ queryKey: ['farmerProcurementLots'] });
  };

  return (
    <FarmerLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-leaf/10 text-leaf"><Handshake size={28} /></div>
          <div>
            <h1 className="text-2xl font-bold text-charcoal">Procurement Lots</h1>
            <p className="text-charcoal/60">Review processor offers matched to your produce.</p>
          </div>
        </div>

        {isLoading && <LoadingSkeleton count={3} />}
        {isError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex gap-2">
            <AlertCircle size={20} /> Unable to load procurement lots. Please try again.
          </div>
        )}
        {!isLoading && !isError && lots.length === 0 && (
          <Card><Card.Body className="text-center py-12">
            <Package className="mx-auto text-charcoal/20" size={44} />
            <h2 className="mt-4 text-lg font-semibold">No procurement offers yet</h2>
            <p className="mt-1 text-charcoal/60">Create and assess a batch to get matched with processors.</p>
          </Card.Body></Card>
        )}
        {!isLoading && !isError && lots.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {lots.map((lot) => (
              <Card key={lot.id} hover className="overflow-hidden">
                <Card.Body>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-leaf font-bold">{lot.lot_code}</p>
                      <h2 className="text-xl font-bold mt-1">{lot.crop || 'Produce'} procurement</h2>
                    </div>
                    <Badge status={lot.status}>{lot.status || 'proposed'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                    <div className="p-3 rounded-xl bg-cream"><span className="block text-charcoal/50">Quantity</span><strong>{lot.total_quantity || lot.quantity || 0} kg</strong></div>
                    <div className="p-3 rounded-xl bg-cream"><span className="block text-charcoal/50">Created</span><strong>{lot.created_at ? new Date(lot.created_at).toLocaleDateString() : 'Recently'}</strong></div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-sm text-charcoal/60">
                    <MapPin size={16} className="text-leaf" /> Processor offer available in your network
                  </div>
                  {(lot.status === 'proposed' || lot.status === 'pending_review') && lot.farmer_response === 'pending' && (
                    <div className="flex gap-3 mt-5">
                      <Button variant="primary" className="flex-1 flex items-center justify-center gap-2" onClick={() => respond(lot.id, 'accepted')}>
                        <Check size={16} /> Accept offer
                      </Button>
                      <Button variant="outline" className="flex-1 flex items-center justify-center gap-2" onClick={() => respond(lot.id, 'declined')}>
                        <X size={16} /> Decline
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </FarmerLayout>
  );
};

export default ProcurementLots;
