import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Filter, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FarmerLayout from '../../layouts/FarmerLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { batchApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const Batches = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const publishMutation = useMutation({
    mutationFn: (id) => batchApi.publish(id),
    onSuccess: () => {
      toastSuccess('Your produce is now visible to buyers in Buy & Sell.');
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
    },
    onError: (err) => toastError(err.payload?.message || err.message || 'Could not publish this batch.'),
  });

  const { data: batches, isLoading, error } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchApi.getAll()
  });

  const filteredBatches = batches?.filter(batch => {
    const matchesSearch = batch.batch_code?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          batch.crop?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? batch.status === statusFilter : true;
    const matchesCrop = cropFilter ? batch.crop === cropFilter : true;
    
    return matchesSearch && matchesStatus && matchesCrop;
  }) || [];

  const cropOptions = [
    { label: t('farmer.allCrops'), value: '' },
    { label: t('batch.tomato'), value: 'Tomato' },
    { label: t('batch.wheat'), value: 'Wheat' },
    { label: t('batch.rice'), value: 'Rice' },
    { label: t('batch.potato'), value: 'Potato' },
    { label: t('batch.onion'), value: 'Onion' }
  ];

  const statusOptions = [
    { label: t('farmer.allStatuses'), value: '' },
    { label: t('common.pending'), value: 'pending' },
    { label: t('batch.assessedStatus'), value: 'assessed' },
    { label: t('batch.decisionMadeStatus'), value: 'decision_made' },
    { label: t('batch.listedStatus'), value: 'listed' }
  ];

  return (
    <FarmerLayout>
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-charcoal">{t('farmer.myBatches')}</h1>
          <Button 
            variant="primary" 
            onClick={() => navigate('/farmer/batches/new')}
            className="flex items-center gap-2"
          >
            <PlusCircle size={18} />
            {t('common.create')}
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white">
          <Card.Body className="p-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" size={18} />
              <input
                type="text"
                placeholder={t('farmer.searchBatchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-leaf/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select 
                options={cropOptions} 
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select 
                options={statusOptions} 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </Card.Body>
        </Card>

        {/* List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <LoadingSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-md">
            {t('common.failedToLoad')}
          </div>
        ) : filteredBatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBatches.map(batch => (
              <Card key={batch.id} className="hover:shadow-lg transition-all border-l-4 border-l-leaf">
                <Card.Body>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-charcoal">{batch.batch_code}</h3>
                      <p className="text-sm font-medium text-forest">{batch.crop}</p>
                    </div>
                    <Badge status={batch.status || 'default'}>{batch.status || t('common.pending')}</Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4 text-sm text-charcoal/80">
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">{t('farmer.quantityLabel')}</span>
                      <span className="font-medium">{batch.quantity} {batch.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">{t('farmer.harvestDateLabel')}</span>
                      <span className="font-medium">{new Date(batch.harvest_date).toLocaleDateString()}</span>
                    </div>
                    {batch.quality_grade && (
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">{t('farmer.qualityGradeLabel')}</span>
                        <span className="font-medium text-gold">{batch.quality_grade}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 border-leaf text-leaf hover:bg-leaf hover:text-white" onClick={() => navigate(`/farmer/batches/${batch.id}`)}>
                      {t('common.viewDetails')}
                    </Button>
                    {['draft', 'assessment_complete', 'decision_ready'].includes(batch.status) && (
                      <Button variant="primary" className="flex-1" onClick={() => publishMutation.mutate(batch.id)} loading={publishMutation.isPending}>
                        <ShoppingCart size={16} /> Sell now
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={<Filter size={48} className="text-charcoal/20" />}
            title={t('farmer.noBatchesFound')}
            description={batches?.length === 0 ? t('farmer.noBatchesCreated') : t('farmer.noBatchesMatchFilter')}
            onAction={() => navigate('/farmer/batches/new')}
            actionText={t('farmer.createFirstBatch')}
          />
        )}
      </motion.div>
    </FarmerLayout>
  );
};

export default Batches;
