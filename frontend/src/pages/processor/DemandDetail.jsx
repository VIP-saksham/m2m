import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import ProcessorLayout from '../../layouts/ProcessorLayout';
import Card from '../../components/ui/Card';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { demandApi } from '../../services/api';

const DemandDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['demand', id],
    queryFn: () => demandApi.get(id),
    refetchInterval: 10000,
  });
  const demand = data?.demand || data;
  if (isLoading) return <ProcessorLayout><LoadingSkeleton className="h-64" /></ProcessorLayout>;
  return (
    <ProcessorLayout>
      <h1 className="mb-6 text-2xl font-bold">{t('demand.detailTitle')}</h1>
      {isError ? <Card className="p-5 text-red-700">Unable to load this demand.</Card> : (
        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <p><strong>Crop:</strong> {demand?.crop}</p>
            <p><strong>Quantity:</strong> {demand?.required_quantity} {demand?.unit}</p>
            <p><strong>Quality:</strong> {demand?.minimum_quality}</p>
            <p><strong>Status:</strong> {demand?.status}</p>
            <p><strong>Deadline:</strong> {demand?.deadline}</p>
          </div>
          <Link className="mt-6 inline-block rounded-lg bg-forest px-4 py-2 text-white" to={`/processor/demands/${id}/match`}>Run matching</Link>
        </Card>
      )}
    </ProcessorLayout>
  );
};

export default DemandDetail;
