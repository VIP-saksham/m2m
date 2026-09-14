import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Play, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProcessorLayout from '../../layouts/ProcessorLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { demandApi } from '../../services/api';

export default function Demands() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');

  const { data: demands = [], isLoading, isError } = useQuery({
    queryKey: ['processorDemands'],
    queryFn: demandApi.getDemands,
    refetchInterval: 15000,
  });

  const filteredDemands = filter === 'All' ? demands : demands.filter(d => d.status.toLowerCase() === filter.toLowerCase());

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'open': return <Badge variant="info">{t('demand.statusOpen')}</Badge>;
      case 'matching': return <Badge variant="warning">{t('demand.statusMatching')}</Badge>;
      case 'matched': return <Badge variant="success">{t('demand.statusMatched')}</Badge>;
      case 'confirmed': return <Badge className="bg-forest text-white">{t('demand.statusConfirmed')}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const calculateDaysRemaining = (deadlineDate) => {
    const diff = new Date(deadlineDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <ProcessorLayout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('demand.boardTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('demand.boardSubtitle')}</p>
        </div>
        <Button 
          onClick={() => navigate('/processor/demands/new')}
          className="bg-forest hover:bg-leaf text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> {t('demand.createNew')}
        </Button>
      </div>

      {isError && <Card className="mb-6 p-4 text-red-700">Unable to load demands. Please try again.</Card>}
      <Card className="mb-6 p-2">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'All', label: t('common.filterAll') },
            { key: 'Open', label: t('demand.statusOpen') },
            { key: 'Matching', label: t('demand.statusMatching') },
            { key: 'Matched', label: t('demand.statusMatched') },
            { key: 'Confirmed', label: t('demand.statusConfirmed') }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key 
                  ? 'bg-cream text-forest shadow-sm border border-gray-200' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
        </div>
      ) : filteredDemands.length === 0 ? (
        <EmptyState 
          title={t('demand.noDemands')}
          description={t('demand.noDemandsDesc', { filter: filter !== 'All' ? filter.toLowerCase() : '' })}
          action={{
            label: t('demand.createNew'),
            onClick: () => navigate('/processor/demands/new')
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredDemands.map(demand => (
            <Card key={demand.id} className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center transition-shadow hover:shadow-md">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-gray-500">{demand.demand_code}</span>
                  <h3 className="text-xl font-bold text-gray-900">{demand.crop}</h3>
                  {getStatusBadge(demand.status)}
                </div>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                  <div>
                    <span className="text-gray-400">{t('demand.requiredLabel')}:</span> <span className="font-semibold">{demand.required_quantity} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('demand.qualityLabel')}:</span> <Badge variant="outline">{t(`quality.grade${demand.minimum_quality}`)}</Badge>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('demand.deadlineShort')}:</span> {t('demand.daysRemaining', { days: calculateDaysRemaining(demand.deadline) })}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{t('common.progress')}</span>
                    <span className="font-medium text-forest">{demand.matched_quantity} / {demand.required_quantity} kg ({(demand.matched_quantity / demand.required_quantity * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${demand.matched_quantity >= demand.required_quantity ? 'bg-green-500' : 'bg-leaf'}`}
                      style={{ width: `${Math.min((demand.matched_quantity / demand.required_quantity) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                <Button 
                  onClick={() => navigate(`/processor/demands/${demand.id}/match`)}
                  className="flex-1 md:flex-none bg-gold text-forest hover:bg-yellow-500"
                >
                  <Play className="w-4 h-4 mr-2" /> {t('demand.runMatching')}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/processor/demands/${demand.id}`)}
                  className="flex-1 md:flex-none"
                >
                  <Eye className="w-4 h-4 mr-2" /> {t('common.viewDetails')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </ProcessorLayout>
  );
}
