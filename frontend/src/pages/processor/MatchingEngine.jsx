import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, CheckCircle, XCircle, AlertTriangle, Play, ChevronDown, ChevronUp, Layers, Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProcessorLayout from '../../layouts/ProcessorLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { demandApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';

export default function MatchingEngine() {
  const { t } = useTranslation();
  const { demandId } = useParams();
  const navigate = useNavigate();
  const { success: toastSuccess } = useToast();
  const [matchingState, setMatchingState] = useState('idle'); // idle, running, complete
  const [matchStage, setMatchStage] = useState(0);
  const [expandedExcluded, setExpandedExcluded] = useState(false);

  const [results, setResults] = useState(null);
  const { data: demandData } = useQuery({
    queryKey: ['demand', demandId],
    queryFn: () => demandApi.get(demandId),
  });
  const demandInfo = demandData?.demand || demandData || {};

  const runMatchingMutation = useMutation({
    mutationFn: async () => {
      setMatchingState('running');
      setMatchStage(1);
      const response = await demandApi.match(demandId);
      setMatchStage(3);
      return response;
    },
    onSuccess: (data) => {
      setResults(data);
      setMatchingState('complete');
    }
  });

  const createLotMutation = useMutation({
    mutationFn: async () => {
      return demandApi.getMatches(demandId);
    },
    onSuccess: (data) => {
      toastSuccess(t('procurementLot.createdSuccess'));
      navigate(`/processor/demands/${demandId}`);
    }
  });

  const handleRunMatch = () => {
    runMatchingMutation.mutate();
  };

  const getStatusBanner = (status) => {
    switch (status) {
      case 'full_match':
        return (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center">
            <CheckCircle className="w-6 h-6 mr-3 text-green-500" />
            <div>
              <h3 className="font-bold">{t('matching.fullMatchTitle')}</h3>
              <p className="text-sm">{t('matching.fullMatchDesc')}</p>
            </div>
          </div>
        );
      case 'partial_match':
        return (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3 text-yellow-500" />
            <div>
              <h3 className="font-bold">{t('matching.partialMatchTitle')}</h3>
              <p className="text-sm">{t('matching.partialMatchDesc')}</p>
            </div>
          </div>
        );
      case 'no_match':
        return (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center">
            <XCircle className="w-6 h-6 mr-3 text-red-500" />
            <div>
              <h3 className="font-bold">{t('matching.noMatchTitle')}</h3>
              <p className="text-sm">{t('matching.noMatchDesc')}</p>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <ProcessorLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('matching.title')}</h1>
        <p className="text-gray-600 mt-1">{t('matching.subtitle')}</p>
      </div>

      <Card className="mb-8 p-6 bg-forest text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 flex-1">
            <h2 className="text-lg font-medium text-gold">{t('matching.demandSummary')}</h2>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div><span className="text-white/70 block text-xs uppercase tracking-wider">{t('matching.cropLabel')}</span><span className="font-semibold text-lg">{demandInfo.crop}</span></div>
              <div><span className="text-white/70 block text-xs uppercase tracking-wider">{t('matching.quantityLabel')}</span><span className="font-semibold text-lg">{demandInfo.quantity} kg</span></div>
              <div><span className="text-white/70 block text-xs uppercase tracking-wider">{t('matching.qualityLabel')}</span><span className="font-semibold text-lg">{demandInfo.quality}</span></div>
              <div><span className="text-white/70 block text-xs uppercase tracking-wider">{t('matching.regionLabel')}</span><span className="font-semibold text-lg">{demandInfo.region}</span></div>
              <div><span className="text-white/70 block text-xs uppercase tracking-wider">{t('matching.deadlineLabel')}</span><span className="font-semibold text-lg">{demandInfo.deadline}</span></div>
            </div>
          </div>
        </div>
      </Card>

      {matchingState === 'idle' && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="bg-leaf/10 p-6 rounded-full mb-6">
            <Settings className="w-16 h-16 text-forest" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('matching.readyTitle')}</h2>
          <p className="text-gray-600 max-w-md mb-8">
            {t('matching.readyDesc')}
          </p>
          <Button 
            onClick={handleRunMatch}
            className="bg-forest hover:bg-leaf text-white text-lg py-4 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            <Play className="w-5 h-5 mr-2" /> {t('matching.runAlgorithm')}
          </Button>
        </div>
      )}

      {matchingState === 'running' && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-8"
          >
            <Settings className="w-16 h-16 text-leaf" />
          </motion.div>
          
          <div className="space-y-4 w-full max-w-md text-left">
            <div className={`p-4 rounded-lg flex items-center transition-opacity duration-500 ${matchStage >= 1 ? 'bg-cream opacity-100 border border-leaf/30' : 'opacity-0'}`}>
               <CheckCircle className={`w-5 h-5 mr-3 ${matchStage > 1 ? 'text-forest' : 'text-leaf animate-pulse'}`} />
               <span className="font-medium text-gray-800">{t('matching.stage1')}</span>
            </div>
            <div className={`p-4 rounded-lg flex items-center transition-opacity duration-500 ${matchStage >= 2 ? 'bg-cream opacity-100 border border-leaf/30' : 'opacity-0'}`}>
               <CheckCircle className={`w-5 h-5 mr-3 ${matchStage > 2 ? 'text-forest' : 'text-leaf animate-pulse'}`} />
               <span className="font-medium text-gray-800">{t('matching.stage2')}</span>
            </div>
            <div className={`p-4 rounded-lg flex items-center transition-opacity duration-500 ${matchStage >= 3 ? 'bg-cream opacity-100 border border-leaf/30' : 'opacity-0'}`}>
               <CheckCircle className="w-5 h-5 mr-3 text-leaf animate-pulse" />
               <span className="font-medium text-gray-800">{t('matching.stage3')}</span>
            </div>
          </div>
        </div>
      )}

      {matchingState === 'complete' && results && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {getStatusBanner(results.match_status)}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center justify-between">
              <span className="text-gray-500">{t('matching.required')}</span>
              <span className="text-xl font-bold">{results.required_quantity} kg</span>
            </Card>
            <Card className="p-4 flex items-center justify-between border-2 border-forest">
              <span className="text-forest font-medium">{t('matching.matched')}</span>
              <span className="text-xl font-bold text-forest">{results.matched_quantity} kg</span>
            </Card>
            <Card className="p-4 flex items-center justify-between">
              <span className="text-gray-500">{t('matching.shortfall')}</span>
              <span className="text-xl font-bold">{results.shortfall} kg</span>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('matching.aggregationViz')}</h3>
            <div className="w-full bg-gray-100 h-12 rounded-lg flex overflow-hidden shadow-inner">
              {results.selected_batches.map((batch, index) => (
                <div 
                  key={batch.id}
                  className={`h-full flex items-center justify-center text-xs font-bold text-white transition-all hover:opacity-90`}
                  style={{ 
                    width: `${(batch.quantity / results.required_quantity) * 100}%`,
                    backgroundColor: index === 0 ? '#1a5c38' : index === 1 ? '#2d8c4e' : '#c9a84c'
                  }}
                  title={`${batch.farmer} - ${batch.quantity}kg`}
                >
                  {batch.quantity}kg
                </div>
              ))}
            </div>
            <div className="text-center text-sm text-gray-500 mt-2 font-mono">
              {results.selected_batches.map(b => b.quantity).join(' + ')} = {results.matched_quantity} kg
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">{t('matching.selectedBatches')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-sm font-medium text-gray-500 uppercase">
                    <th className="p-4">{t('matching.farmerLabel')}</th>
                    <th className="p-4">{t('matching.batchIdLabel')}</th>
                    <th className="p-4">{t('matching.cropLabel')}</th>
                    <th className="p-4 text-right">{t('matching.quantityLabel')}</th>
                    <th className="p-4">{t('matching.qualityLabel')}</th>
                    <th className="p-4 text-center">{t('matching.compatibilityScore')}</th>
                    <th className="p-4">{t('matching.reasonIncluded')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.selected_batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{batch.farmer}</td>
                      <td className="p-4 text-gray-500 font-mono text-sm">{batch.id}</td>
                      <td className="p-4 font-medium">{batch.crop}</td>
                      <td className="p-4 text-right font-medium">{batch.quantity} kg</td>
                      <td className="p-4"><Badge variant="outline">{batch.quality}</Badge></td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${batch.score > 90 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {batch.score}%
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{batch.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <button 
              className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
              onClick={() => setExpandedExcluded(!expandedExcluded)}
            >
              <h3 className="text-md font-medium text-gray-700 flex items-center">
                <XCircle className="w-4 h-4 mr-2 text-gray-400" />
                {t('matching.excludedBatches', { count: results.excluded_batches.length })}
              </h3>
              {expandedExcluded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            
            <AnimatePresence>
              {expandedExcluded && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-gray-100"
                >
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {results.excluded_batches.map((batch) => (
                        <tr key={batch.id}>
                          <td className="p-4 text-gray-500 font-mono">{batch.id}</td>
                          <td className="p-4 text-red-500 font-mono capitalize">{t(`matching.reasons.${batch.reason}`, batch.reason.replace(/_/g, ' '))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <div className="flex justify-end pt-4">
            <Button 
              className="bg-forest hover:bg-leaf text-white text-lg py-3 px-6 shadow-md"
              onClick={() => createLotMutation.mutate()}
              disabled={createLotMutation.isPending}
            >
              <Layers className="w-5 h-5 mr-2" /> 
              {t('procurementLot.generate')}
            </Button>
          </div>
        </motion.div>
      )}

    </ProcessorLayout>
  );
}
