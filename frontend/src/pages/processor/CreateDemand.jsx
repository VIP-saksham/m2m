import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Save, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProcessorLayout from '../../layouts/ProcessorLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../hooks/useToast';
import { demandApi } from '../../services/api';
import { useMutation } from '@tanstack/react-query';

const demandSchema = z.object({
  crop: z.string().min(1, 'demand.cropRequired'),
  variety: z.string().optional(),
  required_quantity: z.number({ invalid_type_error: 'demand.quantityRequired' }).min(100, 'demand.minimumQuantity'),
  unit: z.enum(['kg', 'quintal', 'tonne']).default('kg'),
  minimum_quality: z.enum(['A', 'B', 'C']),
  deadline: z.string().refine((val) => new Date(val) > new Date(), { message: 'demand.futureDateRequired' }),
  preferred_region: z.string().optional(),
  acceptable_harvest_window: z.number().default(7),
  processing_category: z.string().min(1, 'demand.categoryRequired'),
  offered_price_per_unit: z.number().optional(),
  notes: z.string().optional(),
});

export default function CreateDemand() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(demandSchema),
    defaultValues: {
      unit: 'kg',
      minimum_quality: 'B',
      acceptable_harvest_window: 7,
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
        if(demandApi.createDemand) {
            return demandApi.createDemand(data);
        }
        return { data: { id: 'DEM-' + Math.floor(Math.random()*10000) } };
    },
    onSuccess: (res) => {
      toastSuccess(t('demand.createdSuccess'));
      const newId = res?.id || res?.data?.id;
      navigate(`/processor/demands/${newId || ''}`);
    },
    onError: () => {
      toastError(t('demand.createFailed'));
    }
  });

  const onSubmit = (data) => {
    createMutation.mutate({ ...data, status: 'open' });
  };
  
  const onSaveDraft = handleSubmit((data) => {
    createMutation.mutate({ ...data, status: 'draft' });
  });

  const loadDemoScenario = () => {
    setValue('crop', 'Tomato');
    setValue('required_quantity', 10000);
    setValue('unit', 'kg');
    setValue('minimum_quality', 'B');
    setValue('processing_category', 'Tomato Paste');
    setValue('preferred_region', 'Haryana');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    setValue('deadline', futureDate.toISOString().split('T')[0]);
  };

  return (
    <ProcessorLayout>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('demand.createTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('demand.createSubtitle')}</p>
        </div>
        <button 
          type="button"
          onClick={loadDemoScenario}
          className="text-sm text-leaf hover:text-forest underline"
        >
          {t('demand.demoScenario')}
        </button>
      </div>

      <Card className="max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">{t('demand.basicInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('demand.cropLabel')}</label>
                <select 
                  {...register('crop')} 
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-leaf focus:ring-leaf sm:text-sm p-2 border"
                >
                  <option value="">{t('demand.selectCrop')}</option>
                  <option value="Tomato">{t('crops.tomato')}</option>
                  <option value="Wheat">{t('crops.wheat')}</option>
                  <option value="Rice">{t('crops.rice')}</option>
                  <option value="Onion">{t('crops.onion')}</option>
                  <option value="Potato">{t('crops.potato')}</option>
                  <option value="Mango">{t('crops.mango')}</option>
                  <option value="Other">{t('common.other')}</option>
                </select>
                {errors.crop && <p className="text-red-500 text-xs mt-1">{t(errors.crop.message)}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('demand.categoryLabel')}</label>
                <select 
                  {...register('processing_category')} 
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-leaf focus:ring-leaf sm:text-sm p-2 border"
                >
                  <option value="">{t('demand.selectCategory')}</option>
                  <option value="Tomato Paste">{t('processing.tomatoPaste')}</option>
                  <option value="Juice">{t('processing.juice')}</option>
                  <option value="Puree">{t('processing.puree')}</option>
                  <option value="Ketchup">{t('processing.ketchup')}</option>
                  <option value="Dry Processing">{t('processing.dryProcessing')}</option>
                  <option value="Other">{t('common.other')}</option>
                </select>
                {errors.processing_category && <p className="text-red-500 text-xs mt-1">{t(errors.processing_category.message)}</p>}
              </div>
              
              <Input 
                label={t('demand.varietyLabel')} 
                {...register('variety')} 
                error={errors.variety?.message} 
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">{t('demand.quantityQuality')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input 
                label={t('demand.requiredQuantityLabel')} 
                type="number" 
                {...register('required_quantity', { valueAsNumber: true })} 
                error={errors.required_quantity?.message ? t(errors.required_quantity.message) : undefined} 
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('demand.unitLabel')}</label>
                <select 
                  {...register('unit')} 
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-leaf focus:ring-leaf sm:text-sm p-2 border"
                >
                  <option value="kg">kg</option>
                  <option value="quintal">{t('units.quintal')}</option>
                  <option value="tonne">{t('units.tonne')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('demand.minQualityLabel')}</label>
                <select 
                  {...register('minimum_quality')} 
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-leaf focus:ring-leaf sm:text-sm p-2 border"
                >
                  <option value="A">{t('quality.gradeA')}</option>
                  <option value="B">{t('quality.gradeB')}</option>
                  <option value="C">{t('quality.gradeC')}</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">{t('demand.logisticsPricing')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label={t('demand.deadlineLabel')} 
                type="date" 
                {...register('deadline')} 
                error={errors.deadline?.message ? t(errors.deadline.message) : undefined} 
              />
              
              <Input 
                label={t('demand.preferredRegionLabel')} 
                {...register('preferred_region')} 
                error={errors.preferred_region?.message} 
              />
              
              <Input 
                label={t('demand.harvestWindowLabel')} 
                type="number" 
                {...register('acceptable_harvest_window', { valueAsNumber: true })} 
                error={errors.acceptable_harvest_window?.message} 
              />
              
              <Input 
                label={t('demand.offeredPriceLabel')} 
                type="number" 
                {...register('offered_price_per_unit', { valueAsNumber: true })} 
                error={errors.offered_price_per_unit?.message} 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('demand.additionalNotesLabel')}</label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-leaf focus:ring-leaf sm:text-sm p-3"
              placeholder={t('demand.notesPlaceholder')}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSaveDraft}
              disabled={createMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" /> {t('common.saveDraft')}
            </Button>
            <Button 
              type="submit" 
              className="bg-forest hover:bg-leaf text-white"
              disabled={createMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" /> {t('demand.postDemand')}
            </Button>
          </div>

        </form>
      </Card>
    </ProcessorLayout>
  );
}
