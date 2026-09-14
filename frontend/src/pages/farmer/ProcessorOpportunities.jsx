import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Factory, Calendar, MapPin, Search, Package, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FarmerLayout from '../../layouts/FarmerLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import { demandApi, batchApi } from '../../services/api';

const ProcessorOpportunities = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cropFilter, setCropFilter] = useState('');
  const [selectedDemand, setSelectedDemand] = useState(null);

  const { data: demands = [], isLoading: isLoadingDemands, isError: demandsError } = useQuery({
    queryKey: ['demands', 'open'],
    queryFn: () => demandApi.getAll({ status: 'open' }),
    refetchInterval: 15000,
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchApi.getAll(),
    refetchInterval: 15000,
  });

  const availableCrops = useMemo(
    () => Array.from(new Set((Array.isArray(batches) ? batches : []).map(b => b.crop).filter(Boolean))),
    [batches]
  );

  const filteredDemands = (Array.isArray(demands) ? demands : []).filter(d => {
    if (cropFilter && d.crop !== cropFilter) return false;
    return true;
  });

  const cropOptions = [
    { label: 'All Crops', value: '' },
    ...Array.from(new Set([...availableCrops, ...filteredDemands.map(d => d.crop).filter(Boolean)]))
      .sort()
      .map(crop => ({ label: crop, value: crop })),
  ];

  const formatDate = (value) => {
    if (!value) return 'Not specified';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Not specified' : date.toLocaleDateString();
  };

  if (isLoadingDemands) {
    return (
      <FarmerLayout>
        <LoadingSkeleton />
      </FarmerLayout>
    );
  }

  return (
    <FarmerLayout>
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
              <Factory className="text-leaf" size={24} />
              Processor Opportunities
            </h1>
            <p className="text-charcoal/60">Find processors looking for produce right now.</p>
          </div>
          
          <div className="w-full md:w-64">
            <Select 
              options={cropOptions}
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
            />
          </div>
        </div>

        {demandsError && (
          <Card className="border border-red-200 bg-red-50">
            <Card.Body className="text-red-700">
              Unable to load processor opportunities. Please try again in a moment.
            </Card.Body>
          </Card>
        )}

        {!demandsError && filteredDemands.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredDemands.map(demand => {
              // Check if farmer has matching crops
              const isMatch = availableCrops.includes(demand.crop);

              return (
                <Card key={demand.id} className={`hover:shadow-md transition-shadow ${isMatch ? 'border-2 border-leaf' : ''}`}>
                  <Card.Body>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {isMatch && (
                          <span className="inline-block bg-leaf/10 text-leaf text-xs font-bold px-2 py-1 rounded mb-2">
                            MATCHES YOUR PRODUCE
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-charcoal">{demand.title || `Wanted: ${demand.crop}`}</h3>
                        <p className="text-forest font-medium">Buyer & Processor demand</p>
                      </div>
                      <Badge status={demand.status || 'open'}>Open</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-charcoal/50">Required Quantity</p>
                        <p className="font-semibold">{demand.required_quantity} {demand.unit}</p>
                      </div>
                      <div>
                        <p className="text-charcoal/50">Min. Quality</p>
                        <Badge status="default">{demand.minimum_quality}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-charcoal/40" />
                        <span>Deadline: {formatDate(demand.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-charcoal/40" />
                        <span>{demand.preferred_region || 'Any Region'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                      <Button 
                        variant={isMatch ? 'primary' : 'outline'} 
                        className="w-full"
                        onClick={() => setSelectedDemand(demand)}
                      >
                        View Details
                      </Button>
                      {isMatch && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate('/farmer/batches/new')}
                        >
                          <Package size={16} /> List produce
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        ) : !demandsError ? (
          <EmptyState 
            icon={<Search size={48} className="text-charcoal/20" />}
            title="No opportunities found"
            description="There are no processor demands matching your criteria right now. Check back later."
            onAction={() => setCropFilter('')}
            actionText="Clear Filters"
          />
        ) : null}

        {selectedDemand && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4" role="dialog" aria-modal="true">
            <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto">
              <Card.Body>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-leaf">{selectedDemand.demand_code || 'Open demand'}</p>
                    <h2 className="mt-1 text-2xl font-bold text-charcoal">{selectedDemand.crop} requirement</h2>
                  </div>
                  <button type="button" className="rounded-full p-2 text-charcoal/60 hover:bg-cream" onClick={() => setSelectedDemand(null)} aria-label="Close details">
                    <X size={20} />
                  </button>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-cream p-3"><span className="block text-charcoal/50">Quantity needed</span><strong>{selectedDemand.required_quantity} {selectedDemand.unit}</strong></div>
                  <div className="rounded-xl bg-cream p-3"><span className="block text-charcoal/50">Minimum quality</span><strong>{selectedDemand.minimum_quality || 'Any'}</strong></div>
                  <div className="rounded-xl bg-cream p-3"><span className="block text-charcoal/50">Deadline</span><strong>{formatDate(selectedDemand.deadline)}</strong></div>
                  <div className="rounded-xl bg-cream p-3"><span className="block text-charcoal/50">Region</span><strong>{selectedDemand.preferred_region || 'Any region'}</strong></div>
                </div>
                {selectedDemand.offered_price_per_unit != null && (
                  <p className="mt-5 text-sm"><strong>Offered price:</strong> {selectedDemand.offer_currency || 'INR'} {selectedDemand.offered_price_per_unit}/{selectedDemand.unit}</p>
                )}
                {selectedDemand.notes && <p className="mt-3 text-sm text-charcoal/70">{selectedDemand.notes}</p>}
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button className="flex-1" onClick={() => navigate('/farmer/batches/new')}>List matching produce</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedDemand(null)}>Close</Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}
      </motion.div>
    </FarmerLayout>
  );
};

export default ProcessorOpportunities;
