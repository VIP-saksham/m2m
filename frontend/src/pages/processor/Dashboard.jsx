import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, Clock, Package, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dashboardApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import ProcessorLayout from '../../layouts/ProcessorLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

export default function ProcessorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['processorDashboardStats'],
    queryFn: dashboardApi.getProcessorStats,
    refetchInterval: 15000,
  });

  return (
    <ProcessorLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('processor.welcome', { name: user?.name || t('processor.role') })}
        </h1>
        <p className="text-gray-600 mt-1">{t('processor.subtitle')}</p>
      </div>

      <div className="mb-8">
        <Button 
          onClick={() => navigate('/processor/demands/new')}
          className="bg-forest hover:bg-leaf text-white text-lg py-4 px-6 w-full md:w-auto shadow-md"
        >
          <Plus className="w-6 h-6 mr-2" />
          {t('processor.createRequirement')}
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 mb-8" />
      ) : isError ? (
        <Card className="mb-8 p-5 text-red-700">Unable to load live dashboard data. Please refresh and try again.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="p-5 flex items-center">
            <div className="rounded-full p-3 bg-blue-100 text-blue-600 mr-4">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('processor.activeDemands')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.activeDemands || 0}</p>
            </div>
          </Card>
          
          <Card className="p-5 flex items-center">
            <div className="rounded-full p-3 bg-indigo-100 text-indigo-600 mr-4">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('processor.totalQuantity')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalQuantityRequested || 0}</p>
            </div>
          </Card>

          <Card className="p-5 flex items-center">
            <div className="rounded-full p-3 bg-yellow-100 text-yellow-600 mr-4">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('processor.pendingConfirmations')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.pendingConfirmations || 0}</p>
            </div>
          </Card>
          
          <Card className="p-5 flex items-center">
            <div className="rounded-full p-3 bg-green-100 text-green-600 mr-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('processor.completedLots')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.completedLots || 0}</p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('processor.recentDemands')}</h2>
          <Card className="p-4">
            <p className="text-gray-500 text-sm">{t('processor.loadingDemands')}</p>
          </Card>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('processor.recentLots')}</h2>
          <Card className="p-4">
            <p className="text-gray-500 text-sm">{t('processor.loadingLots')}</p>
          </Card>
        </div>
      </div>
    </ProcessorLayout>
  );
}
