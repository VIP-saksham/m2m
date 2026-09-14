import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, AlertCircle, BrainCircuit, Activity, BarChart2, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FarmerLayout from '../../layouts/FarmerLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { useToast } from '../../hooks/useToast';
import { batchApi } from '../../services/api';

const BatchDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const imageInput = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const publishMutation = useMutation({
    mutationFn: () => batchApi.publish(id),
    onSuccess: () => {
      toastSuccess('Your produce is now visible to buyers in Buy & Sell.');
      queryClient.invalidateQueries({ queryKey: ['batch', id] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
    },
    onError: (err) => toastError(err.payload?.message || err.message || 'Could not publish this batch.'),
  });

  const { data: batch, isLoading, error } = useQuery({
    queryKey: ['batch', id],
    queryFn: () => batchApi.getById(id)
  });

  const assessMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      if (selectedImage) formData.append('image', selectedImage);
      return batchApi.assess(id, selectedImage ? formData : undefined);
    },
    onSuccess: () => {
      toastSuccess(t('common.success'));
      setSelectedImage(null);
      queryClient.invalidateQueries({ queryKey: ['batch', id] });
    },
    onError: (error) => toastError(error.payload?.message || error.message || t('common.error'))
  });

  const decisionMutation = useMutation({
    mutationFn: () => batchApi.decision(id),
    onSuccess: () => {
      toastSuccess(t('common.success'));
      queryClient.invalidateQueries({ queryKey: ['batch', id] });
    },
    onError: () => toastError(t('common.error'))
  });

  if (isLoading) {
    return (
      <FarmerLayout>
        <LoadingSkeleton />
      </FarmerLayout>
    );
  }

  if (error || !batch) {
    return (
      <FarmerLayout>
        <div className="p-4 bg-red-50 text-red-600 rounded-md flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{t('common.failedToLoad')}</span>
        </div>
        {batch.assessment.ai_raw_response?.prediction && (
          <div className="mt-4 rounded-md border border-leaf/20 bg-leaf/5 p-3 text-sm">
            <p className="font-semibold text-forest">Photo-based estimate</p>
            <p className="mt-1">Sell within approximately <strong>{batch.assessment.ai_raw_response.prediction.sell_window_days} days</strong>.</p>
            <p>Estimated range: <strong>{batch.assessment.ai_raw_response.prediction.currency} {batch.assessment.ai_raw_response.prediction.estimated_price_min}–{batch.assessment.ai_raw_response.prediction.estimated_price_max}/{batch.assessment.ai_raw_response.prediction.unit}</strong></p>
            <p className="mt-1 text-xs text-charcoal/60">OpenCV + PyTorch image signals; verify against local mandi rates and a quality expert.</p>
          </div>
        )}
      </FarmerLayout>
    );
  }

  const hasAssessment = !!batch.assessment;
  const hasDecision = !!batch.decision;
  const recommendedAction = batch.decision?.recommended_action;

  return (
    <FarmerLayout>
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/farmer/batches')} className="p-2">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-charcoal">{batch.batch_code}</h1>
                <Badge status={batch.status || 'default'}>{batch.status}</Badge>
              </div>
              <p className="text-charcoal/60">{batch.crop} • {batch.quantity} {batch.unit}</p>
            </div>
            
            <div className="flex gap-2">
              <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => setSelectedImage(event.target.files?.[0] || null)} />
              <Button variant="outline" onClick={() => imageInput.current?.click()}>
                <Camera size={18} className="mr-2 inline" /> {selectedImage ? selectedImage.name : 'Add crop photo'}
              </Button>
              {(!hasAssessment || selectedImage) && (
                <Button 
                  variant="primary" 
                  onClick={() => assessMutation.mutate()}
                  loading={assessMutation.isPending}
                >
                  <Activity size={18} className="mr-2 inline" /> {t('shared.runAssessment')}
                </Button>
              )}
              {hasAssessment && !hasDecision && (
                <Button 
                  variant="gold" 
                  onClick={() => decisionMutation.mutate()}
                  loading={decisionMutation.isPending}
                >
                  <BrainCircuit size={18} className="mr-2 inline" /> {t('shared.generateDecision')}
                </Button>
              )}
              {hasDecision && recommendedAction === 'PROCESS' && (
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/farmer/processor-opportunities')}
                >
                  {t('farmer.processorOpportunities')}
                </Button>
              )}
              {['draft', 'assessment_complete', 'decision_ready'].includes(batch.status) && (
                <Button variant="primary" onClick={() => publishMutation.mutate()} loading={publishMutation.isPending}>
                  Sell this produce
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batch Info */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-charcoal">
                <Activity size={18} className="text-forest" />
                {t('shared.batchDetail')}
              </h2>
            </Card.Header>
            <Card.Body className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-charcoal/50 mb-1">{t('batch.crop')}</p>
                  <p className="font-medium">{batch.crop}</p>
                </div>
                <div>
                  <p className="text-charcoal/50 mb-1">{t('batch.variety')}</p>
                  <p className="font-medium">{batch.variety || t('common.na')}</p>
                </div>
                <div>
                  <p className="text-charcoal/50 mb-1">{t('batch.quantity')}</p>
                  <p className="font-medium">{batch.quantity} {batch.unit}</p>
                </div>
                <div>
                  <p className="text-charcoal/50 mb-1">{t('batch.harvestDate')}</p>
                  <p className="font-medium">{new Date(batch.harvest_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-charcoal/50 mb-1">{t('common.location')}</p>
                  <p className="font-medium">{batch.location || t('common.na')}</p>
                </div>
                <div>
                  <p className="text-charcoal/50 mb-1">{t('batch.storageCondition')}</p>
                  <p className="font-medium">{batch.storage_condition || t('common.na')}</p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Assessment Info */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-charcoal">
                <CheckCircle2 size={18} className="text-leaf" />
                {t('shared.assessmentResults')}
              </h2>
            </Card.Header>
            <Card.Body>
              {hasAssessment ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-cream rounded-md border border-gold/20">
                    <span className="font-medium">{t('batch.quality')}</span>
                    <span className="text-2xl font-bold text-gold">{batch.assessment.quality_grade || batch.quality_grade}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">{t('batch.maturityLevel')}</span>
                      <span className="font-medium">{batch.assessment.maturity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">Spoilage Risk</span>
                      <span className="font-medium">{batch.assessment.spoilage_risk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">Confidence Score</span>
                      <span className="font-medium">{batch.assessment.confidence ? `${Math.round(batch.assessment.confidence * 100)}%` : 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-md flex gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <p>{t('common.demo')} {t('common.aiDisclaimer')}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-charcoal/50 mb-4">{t('common.noData')}</p>
                  <Button variant="outline" onClick={() => assessMutation.mutate()} loading={assessMutation.isPending}>
                    {selectedImage ? 'Predict from photo' : t('shared.runAssessment')}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Decision Info */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-charcoal">
                <BrainCircuit size={18} className="text-gold" />
                {t('shared.decisionResults')}
              </h2>
            </Card.Header>
            <Card.Body>
              {hasDecision ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[t('decision.sell'), t('decision.store'), t('decision.process')].map((action, idx) => {
                      const actionKeys = ['SELL', 'STORE', 'PROCESS'];
                      const scoreFields = ['sell_score', 'store_score', 'process_score'];
                      const actionKey = actionKeys[idx];
                      const score = batch.decision[scoreFields[idx]] || 0;
                      const isRecommended = recommendedAction === actionKey;
                      
                      return (
                        <div key={actionKey} className={`p-2 rounded-md border-2 ${isRecommended ? 'border-leaf bg-leaf/10' : 'border-transparent bg-gray-50'}`}>
                          <p className={`text-xs font-bold ${isRecommended ? 'text-leaf' : 'text-charcoal/60'}`}>{action}</p>
                          <p className="text-lg font-bold">{score}%</p>
                          <div className="w-full bg-gray-200 h-1.5 mt-2 rounded-full overflow-hidden">
                            <div className="bg-leaf h-full" style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2">{t('farmer.keyFactors')}</h3>
                    <ul className="space-y-1 text-sm text-charcoal/70 list-disc pl-4">
                      {batch.decision.reasons?.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      )) || <li>{t('farmer.basedOnData')}</li>}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-charcoal/50 mb-4">{t('common.noData')}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => decisionMutation.mutate()} 
                    loading={decisionMutation.isPending}
                    disabled={!hasAssessment}
                  >
                    {t('shared.generateDecision')}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </motion.div>
    </FarmerLayout>
  );
};

export default BatchDetail;
