import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  Package, 
  BrainCircuit, 
  Factory, 
  CheckCircle2, 
  AlertCircle,
  PlusCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FarmerLayout from '../../layouts/FarmerLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { dashboardApi } from '../../services/api';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['farmerDashboard'],
    queryFn: dashboardApi.getFarmerStats
  });

  if (isLoading) {
    return (
      <FarmerLayout>
        <LoadingSkeleton />
      </FarmerLayout>
    );
  }

  if (error) {
    return (
      <FarmerLayout>
        <div className="p-4 bg-red-50 text-red-600 rounded-md flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{t('common.failedToLoad')}</span>
        </div>
      </FarmerLayout>
    );
  }

  const stats = data || {
    totalBatches: 0,
    availableQuantity: 0,
    pendingDecisions: 0,
    matchedOpportunities: 0,
    activeLots: 0,
    completed: 0,
    recentBatches: []
  };

  const statCards = [
    { title: t('farmer.totalBatches'), value: stats.totalBatches, icon: <Package className="text-forest" size={24} /> },
    { title: t('farmer.availableQuantity'), value: stats.availableQuantity, icon: <Sprout className="text-leaf" size={24} /> },
    { title: t('farmer.pendingDecisions'), value: stats.pendingDecisions, icon: <BrainCircuit className="text-gold" size={24} /> },
    { title: t('farmer.matchedOpportunities'), value: stats.matchedOpportunities, icon: <CheckCircle2 className="text-green-600" size={24} /> },
    { title: t('farmer.activeLots'), value: stats.activeLots, icon: <Package className="text-forest" size={24} /> },
    { title: t('common.completed'), value: stats.completed, icon: <CheckCircle2 className="text-forest" size={24} /> },
  ];

  return (
    <FarmerLayout>
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-forest to-leaf rounded-xl p-6 text-cream shadow-md">
          <h1 className="text-2xl font-bold mb-2">{t('farmer.welcomeGreeting')} {user?.name || t('auth.farmer')}!</h1>
          <p className="text-cream/90">{t('farmer.harvestDecisionsMatter')}</p>
          
          <div className="mt-6 flex flex-wrap gap-4">
            <Button 
              variant="gold" 
              onClick={() => navigate('/farmer/batches/new')}
              className="flex items-center gap-2"
            >
              <PlusCircle size={18} />
              {t('farmer.createBatch')}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/farmer/decision-center')}
              className="flex items-center gap-2 bg-cream text-forest hover:bg-cream/90"
            >
              <BrainCircuit size={18} />
              {t('farmer.viewDecisionCenter')}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/farmer/opportunities')}
              className="flex items-center gap-2 text-cream hover:bg-white/10"
            >
              <Factory size={18} />
              {t('farmer.processorOpportunities')}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <Card.Body className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal/60 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
                </div>
                <div className="p-3 bg-cream rounded-full">
                  {stat.icon}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>

        {/* Recent Batches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-charcoal">{t('farmer.recentBatches')}</h2>
            <Link to="/farmer/batches" className="text-leaf hover:text-forest flex items-center gap-1 text-sm font-medium">
              {t('common.viewAll')} <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentBatches && stats.recentBatches.length > 0 ? (
              stats.recentBatches.slice(0, 3).map((batch) => (
                <Card key={batch.id} className="hover:shadow-md transition-shadow">
                  <Card.Body>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-charcoal">{batch.batch_code}</p>
                        <p className="text-sm text-charcoal/70">{batch.crop}</p>
                      </div>
                      <Badge status={batch.status}>{batch.status}</Badge>
                    </div>
                    <div className="text-sm text-charcoal/70 mb-4">
                      <p>{t('common.qty')}: {batch.quantity} {batch.unit}</p>
                      <p>{t('common.harvested')}: {new Date(batch.harvest_date).toLocaleDateString()}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full text-forest border border-forest/20 hover:bg-forest/5"
                      onClick={() => navigate(`/farmer/batches/${batch.id}`)}
                    >
                      {t('common.viewDetails')}
                    </Button>
                  </Card.Body>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <Card.Body className="text-center py-8">
                    <p className="text-charcoal/60 mb-4">{t('farmer.noRecentBatches')}</p>
                    <Button variant="primary" onClick={() => navigate('/farmer/batches/new')}>
                      {t('farmer.createFirstBatch')}
                    </Button>
                  </Card.Body>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Tip Card */}
        <Card className="bg-cream border-gold/30">
          <Card.Body className="flex items-start gap-3">
            <Lightbulb className="text-gold mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-charcoal mb-1">{t('farmer.tipOfDay')}</h3>
              <p className="text-sm text-charcoal/80">
                {t('farmer.tipText')}
              </p>
            </div>
          </Card.Body>
        </Card>
      </motion.div>
    </FarmerLayout>
  );
};

export default Dashboard;
