import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Info, Factory, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FarmerLayout from '../../layouts/FarmerLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import { batchApi } from '../../services/api';
import FarmerAssistant from '../../components/domain/FarmerAssistant';

const DecisionCenter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: batches = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchApi.getAll(),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <FarmerLayout>
        <LoadingSkeleton />
      </FarmerLayout>
    );
  }

  const batchesWithDecisions = batches.filter(b => b.decision);
  const batchesWithoutDecisions = batches.filter(b => !b.decision);

  return (
    <FarmerLayout>
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gold/20 text-gold rounded-full">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-charcoal">{t('farmer.decisionCenter')}</h1>
            <p className="text-charcoal/60">Crop guidance and market options, based on your batch details.</p>
          </div>
          <Button variant="outline" className="ml-auto flex items-center gap-2" onClick={() => refetch()} disabled={isFetching}><RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} /> Refresh</Button>
        </div>

        <div className="border-l-4 border-l-forest bg-[#f1f7f2] p-4 rounded-r-lg flex items-start gap-3">
          <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <p className="text-blue-800 text-sm">
            <strong>{t('farmer.disclaimerTitle')}</strong> {t('farmer.disclaimerText')}
          </p>
        </div>

        {/* Batches Needing Action */}
        {isError && <Card className="border border-red-200 bg-red-50"><Card.Body className="text-red-700">Your crop guidance could not be loaded. Please refresh and try again.</Card.Body></Card>}

        {batchesWithoutDecisions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-charcoal mb-4">{t('farmer.pendingDecisionsHeader')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batchesWithoutDecisions.map(batch => (
                <Card key={batch.id} className="border-l-4 border-l-gold">
                  <Card.Body className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{batch.batch_code}</p>
                      <p className="text-sm text-charcoal/60">{batch.crop} • {batch.quantity} {batch.unit} • {batch.assessment ? 'Assessment ready' : 'Assessment pending'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/farmer/batches/${batch.id}`)}>
                      {batch.assessment ? t('farmer.generateDecision') : 'Open batch & assess'}
                    </Button>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Decisions List */}
        <div>
          <h2 className="text-lg font-semibold text-charcoal mb-4">{t('farmer.yourInsights')}</h2>
          
          {batchesWithDecisions.length > 0 ? (
            <div className="space-y-6">
              {batchesWithDecisions.map(batch => {
                const recAction = batch.decision.recommended_action;
                const scores = {
                  SELL: batch.decision.sell_score || 0,
                  STORE: batch.decision.store_score || 0,
                  PROCESS: batch.decision.process_score || 0
                };
                
                return (
                  <Card key={batch.id} className="overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{batch.batch_code} <span className="text-charcoal/50 text-base font-normal">| {batch.crop}</span></h3>
                        <p className="text-sm text-charcoal/60">{t('farmer.assessedLabel')} {batch.assessment?.quality_grade || t('common.na')}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/farmer/batches/${batch.id}`)}>
                        {t('farmer.viewBatch')}
                      </Button>
                    </div>
                    
                    <Card.Body className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['SELL', 'STORE', 'PROCESS'].map((action, idx) => {
                          const actionLabels = [t('decision.sell'), t('decision.store'), t('decision.process')];
                          const isRecommended = recAction === action;
                          const score = scores[action] || 0;
                          
                          return (
                            <div key={action} className={`p-4 rounded-xl border-2 relative ${isRecommended ? 'border-leaf bg-leaf/5' : 'border-gray-100 bg-white'}`}>
                              {isRecommended && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-leaf text-white text-[10px] font-bold px-2 py-1 rounded-full tracking-wider">
                                  {t('farmer.recommended')}
                                </div>
                              )}
                              
                              <div className="text-center mb-4 mt-2">
                                <h4 className={`text-lg font-bold ${isRecommended ? 'text-leaf' : 'text-charcoal'}`}>{actionLabels[idx]}</h4>
                                <div className="text-3xl font-black text-charcoal my-2">{score}%</div>
                                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                  <div className={`h-full ${isRecommended ? 'bg-leaf' : 'bg-gray-400'}`} style={{ width: `${score}%` }} />
                                </div>
                              </div>
                              
                              {isRecommended && action === 'PROCESS' && (
                                <Button 
                                  variant="primary" 
                                  className="w-full mt-4 flex items-center justify-center gap-2"
                                  onClick={() => navigate('/farmer/processor-opportunities')}
                                >
                                  <Factory size={16} /> {t('farmer.opportunities')}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2 text-charcoal flex items-center gap-2">
                          <Info size={16} className="text-gold" />
                          {t('farmer.keyFactors')}
                        </h4>
                        <ul className="text-sm text-charcoal/80 space-y-1 ml-6 list-disc">
                          {batch.decision.reasons?.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          )) || <li>{t('farmer.basedOnData')}</li>}
                        </ul>
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState 
              icon={<BrainCircuit size={48} className="text-charcoal/20" />}
              title={t('farmer.noDecisionsTitle')}
              description={t('farmer.noDecisionsDesc')}
              onAction={() => navigate('/farmer/batches')}
              actionText={t('farmer.goToBatches')}
            />
          )}
        </div>
        <div className="border-t border-cream-dark pt-5 text-xs text-charcoal/50">
          Government-style information service • Guidance is based on the details you provide. Verify price and quality locally before a sale.
        </div>
      </motion.div>
      <FarmerAssistant />
    </FarmerLayout>
  );
};

export default DecisionCenter;
