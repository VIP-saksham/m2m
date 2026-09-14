import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Check, X, Info, FileText, ArrowLeft, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProcessorLayout from '../../layouts/ProcessorLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { dashboardApi } from '../../services/api'; 

export default function LotDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { success: toastSuccess, info: toastInfo } = useToast();
  const queryClient = useQueryClient();
  
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: lot, isLoading } = useQuery({
    queryKey: ['lot', id],
    queryFn: async () => {
      // Mock data
      return {
        id: id,
        lot_code: 'VP001',
        status: 'proposed',
        total_quantity: 10000,
        required_quantity: 10000,
        farmer_count: 5, // Matching requirement description
        quality_summary: 'Grade B / B+',
        match_score: 89,
        demand_id: 'DEM-001',
        demand_crop: 'Tomato',
        batches: [
          { id: 'BAT-012', farmer_name: 'Farmer A', quantity: 5000, quality: 'B+', maturity: 'Optimal', spoilage_risk: 'Low', response: 'accepted', availability: 'Ready' },
          { id: 'BAT-045', farmer_name: 'Farmer B', quantity: 3000, quality: 'A', maturity: 'Optimal', spoilage_risk: 'Low', response: 'pending', availability: 'In 2 days' },
          { id: 'BAT-089', farmer_name: 'Farmer C', quantity: 2000, quality: 'B', maturity: 'Slightly Under', spoilage_risk: 'Medium', response: 'accepted', availability: 'Ready' },
        ],
        timeline: [
          { status: 'created', date: '2026-09-13T10:00:00Z', note: 'Lot assembled by matching engine' },
          { status: 'proposed', date: '2026-09-13T10:05:00Z', note: 'Sent for processor review' }
        ]
      };
    }
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      await new Promise(r => setTimeout(r, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toastSuccess(t('procurementLot.confirmed'));
      setConfirmModalOpen(false);
      queryClient.invalidateQueries(['lot', id]);
      navigate('/processor/lots');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      await new Promise(r => setTimeout(r, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toastInfo(t('procurementLot.rejected'));
      setRejectModalOpen(false);
      queryClient.invalidateQueries(['lot', id]);
      navigate('/processor/lots');
    }
  });

  if (isLoading) return <ProcessorLayout><div className="p-8">{t('common.loading')}</div></ProcessorLayout>;

  return (
    <ProcessorLayout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{t('procurementLot.detailTitle', { code: lot.lot_code })}</h1>
              <Badge variant={lot.status === 'proposed' ? 'warning' : 'success'} className="uppercase">
                {t(`procurementLot.status.${lot.status}`, lot.status)}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{t('procurementLot.forDemand', { code: lot.demand_code, crop: lot.demand_crop })}</p>
          </div>
        </div>
        
        {(lot.status === 'proposed' || lot.status === 'pending_review') && (
          <div className="flex gap-3">
            <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50" onClick={() => setRejectModalOpen(true)}>
              <X className="w-4 h-4 mr-2" /> {t('procurementLot.reject')}
            </Button>
            <Button className="bg-forest hover:bg-leaf text-white" onClick={() => setConfirmModalOpen(true)}>
              <Check className="w-4 h-4 mr-2" /> {t('procurementLot.confirm')}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-start mb-6 shadow-sm">
        <Info className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>{t('common.important')}:</strong> {t('procurementLot.disclaimer')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('procurementLot.totalQuantity')}</p>
          <p className="text-xl font-bold text-gray-900">{lot.total_quantity} kg</p>
          <p className="text-xs text-gray-400 mt-1">{t('procurementLot.target', { value: lot.required_quantity })}</p>
        </Card>
        <Card className="p-4 bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('procurementLot.farmerCount')}</p>
          <p className="text-xl font-bold text-gray-900">{t('procurementLot.suppliers', { count: lot.farmer_count })}</p>
        </Card>
        <Card className="p-4 bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('procurementLot.qualitySummary')}</p>
          <p className="text-xl font-bold text-gray-900">{lot.quality_summary}</p>
        </Card>
        <Card className="p-4 bg-forest text-white">
          <p className="text-xs text-white/70 uppercase tracking-wider mb-1">{t('procurementLot.matchScore')}</p>
          <p className="text-xl font-bold text-gold">{lot.match_score}%</p>
        </Card>
      </div>

      <Card className="mb-6 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Layers className="w-5 h-5 mr-2 text-forest" />
          {t('procurementLot.aggregationComposition')}
        </h3>
        <div className="w-full bg-gray-100 h-12 rounded-lg flex overflow-hidden shadow-inner border border-gray-200">
          {lot.batches.map((batch, index) => (
            <div 
              key={batch.id}
              className="h-full flex items-center justify-center text-xs font-bold text-white transition-all border-r border-white/20 last:border-r-0"
              style={{ 
                width: `${(batch.quantity / lot.total_quantity) * 100}%`,
                backgroundColor: index === 0 ? '#1a5c38' : index === 1 ? '#2d8c4e' : '#c9a84c'
              }}
              title={`${batch.quantity} kg`}
            >
              {batch.quantity}kg
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">{t('procurementLot.batchContributions')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm font-medium text-gray-500 uppercase">
                <th className="p-4">{t('procurementLot.farmerLabel')}</th>
                <th className="p-4">{t('procurementLot.batchIdLabel')}</th>
                <th className="p-4 text-right">{t('procurementLot.quantityContributed')}</th>
                <th className="p-4">{t('procurementLot.qualityGrade')}</th>
                <th className="p-4">{t('procurementLot.maturity')}</th>
                <th className="p-4">{t('procurementLot.spoilageRisk')}</th>
                <th className="p-4">{t('procurementLot.availability')}</th>
                <th className="p-4">{t('procurementLot.farmerResponse')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lot.batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50 text-sm">
                  <td className="p-4 font-medium text-gray-900">{batch.farmer_name}</td>
                  <td className="p-4 text-gray-500 font-mono">{batch.id}</td>
                  <td className="p-4 text-right font-medium">{batch.quantity} kg</td>
                  <td className="p-4"><Badge variant="outline">{batch.quality}</Badge></td>
                  <td className="p-4 text-gray-600">{t(`procurementLot.maturityLevels.${batch.maturity.replace(/\s+/g, '')}`, batch.maturity)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${batch.spoilage_risk === 'Low' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {t(`procurementLot.riskLevels.${batch.spoilage_risk}`, batch.spoilage_risk)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{batch.availability}</td>
                  <td className="p-4">
                    {batch.response === 'accepted' ? (
                      <Badge variant="success">{t('procurementLot.responseAccepted')}</Badge>
                    ) : batch.response === 'pending' ? (
                      <Badge variant="warning">{t('procurementLot.responsePending')}</Badge>
                    ) : (
                      <Badge variant="error">{t('procurementLot.responseDeclined')}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('procurementLot.statusTimeline')}</h3>
        <div className="space-y-4">
            {lot.timeline.map((item, i) => (
                <div key={i} className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-forest flex-shrink-0"></div>
                    <div>
                        <p className="font-medium text-gray-900 capitalize">{t(`procurementLot.timelineStatus.${item.status}`, item.status)}</p>
                        <p className="text-sm text-gray-500">{new Date(item.date).toLocaleString()}</p>
                        <p className="text-sm text-gray-700 mt-1">{item.note}</p>
                    </div>
                </div>
            ))}
        </div>
      </Card>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">{t('procurementLot.confirmModalTitle')}</h2>
            <p className="text-gray-600 mb-4 text-sm">
              {t('procurementLot.confirmModalDesc')}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('procurementLot.notesOptional')}</label>
              <textarea 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-forest focus:border-forest" 
                rows="3"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>{t('common.cancel')}</Button>
              <Button className="bg-forest hover:bg-leaf text-white" onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
                {confirmMutation.isPending ? t('procurementLot.confirming') : t('common.confirm')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4 text-red-600">{t('procurementLot.rejectModalTitle')}</h2>
            <p className="text-gray-600 mb-4 text-sm">
              {t('procurementLot.rejectModalDesc')}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('procurementLot.rejectionReason')}</label>
              <textarea 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500" 
                rows="3"
                required
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('procurementLot.rejectionPlaceholder')}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>{t('common.cancel')}</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending || !notes}>
                {rejectMutation.isPending ? t('procurementLot.rejecting') : t('procurementLot.reject')}
              </Button>
            </div>
          </Card>
        </div>
      )}

    </ProcessorLayout>
  );
}
