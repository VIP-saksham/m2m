import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FarmerLayout from '../../layouts/FarmerLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FileUploader from '../../components/ui/FileUploader';
import { useToast } from '../../hooks/useToast';
import { batchApi } from '../../services/api';

const CreateBatch = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => z.object({
    crop: z.string().min(1, t('batch.cropRequired')),
    variety: z.string().optional(),
    quantity: z.coerce.number().min(0.1, t('batch.quantityRequired')),
    unit: z.string().min(1, t('batch.unitRequired')),
    harvest_date: z.string().min(1, t('batch.harvestDateRequired')),
    location: z.string().optional(),
    storage_condition: z.string().optional(),
    availability_start: z.string().optional(),
    availability_end: z.string().optional(),
    initial_quality_estimate: z.string().optional(),
    maturity_level: z.string().optional(),
    visible_defects: z.string().optional(),
    spoilage_signs: z.string().optional(),
    notes: z.string().optional(),
    asking_price_min: z.coerce.number().min(0).optional(),
    asking_price_max: z.coerce.number().min(0).optional(),
    listing_description: z.string().optional(),
  }).refine(data => {
    if (data.availability_start && data.availability_end) {
      return new Date(data.availability_start) <= new Date(data.availability_end);
    }
    return true;
  }, {
    message: t('batch.endDateAfterStart'),
    path: ["availability_end"]
  }), [t]);

  const { register, handleSubmit, formState: { errors, isValid }, trigger, watch } = useHookForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      unit: 'kg',
      storage_condition: t('batch.roomTemp'),
      initial_quality_estimate: 'B',
      maturity_level: t('batch.medium'),
      visible_defects: t('common.none')
    }
  });

  const formData = watch();

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['crop', 'quantity', 'unit', 'harvest_date', 'availability_start', 'availability_end'];
    }
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const batchResp = await batchApi.create(data);
      const batchId = batchResp.id;

      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        try {
          await batchApi.uploadImage(batchId, formData);
        } catch (e) {
          console.error("Image upload failed, continuing...", e);
        }
      }

      await batchApi.assess(batchId);

      toastSuccess(t('batch.createdSuccess'));
      navigate(`/farmer/batches/${batchId}`);
    } catch (error) {
      toastError(error.payload?.message || error.message || t('batch.createFailed'));
      setIsSubmitting(false);
    }
  };

  const cropOptions = [t('batch.tomato'), t('batch.wheat'), t('batch.rice'), t('batch.onion'), t('batch.potato'), t('batch.mango'), t('batch.other')].map(c => ({ label: c, value: c }));
  const unitOptions = ['kg', 'quintal', 'tonne'].map(u => ({ label: u, value: u }));
  const storageOptions = [t('batch.roomTemp'), t('batch.coldStorage'), t('batch.shade'), t('batch.openAir')].map(s => ({ label: s, value: s }));
  const qualityOptions = ['A', 'B', 'C', 'D'].map(q => ({ label: q, value: q }));
  const maturityOptions = [t('batch.low'), t('batch.medium'), t('batch.high'), t('batch.overripe')].map(m => ({ label: m, value: m }));
  const defectOptions = [t('common.none'), t('batch.minor'), t('batch.moderate'), t('batch.severe')].map(d => ({ label: d, value: d }));

  return (
    <FarmerLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-charcoal">{t('farmer.createBatch')}</h1>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-leaf transition-all duration-300 z-0" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= i ? 'bg-leaf text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > i ? <CheckCircle2 size={20} /> : i}
            </div>
          ))}
        </div>

        <Card>
          <Card.Body>
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                
                {/* Step 1 */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <h2 className="text-xl font-semibold mb-4">{t('batch.stepBasic')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select label={`${t('batch.crop')} *`} options={cropOptions} error={errors.crop?.message} {...register('crop')} />
                      <Input label={t('batch.variety')} placeholder="e.g. Roma" {...register('variety')} />
                      <Input label={`${t('batch.quantity')} *`} type="number" step="0.1" error={errors.quantity?.message} {...register('quantity')} />
                      <Select label={`${t('batch.unit')} *`} options={unitOptions} error={errors.unit?.message} {...register('unit')} />
                      <Input label={`${t('batch.harvestDate')} *`} type="date" error={errors.harvest_date?.message} {...register('harvest_date')} />
                      <Input label={t('common.location')} placeholder="Farm Plot A" {...register('location')} />
                      <Select label={t('batch.storageCondition')} options={storageOptions} {...register('storage_condition')} />
                      <Input label="Minimum price (₹/unit)" type="number" step="0.01" {...register('asking_price_min')} />
                      <Input label="Maximum price (₹/unit)" type="number" step="0.01" {...register('asking_price_max')} />
                    </div>
                    <p className="rounded-xl bg-leaf/10 p-3 text-sm text-forest">Price guide: check your local mandi rate and keep a realistic minimum–maximum range so buyers can respond faster.</p>
                    <textarea className="w-full rounded-xl border p-3" rows="3" placeholder="Product description (optional — we'll draft one if blank)" {...register('listing_description')} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Input label={t('batch.availabilityStart')} type="date" {...register('availability_start')} />
                      <Input label={t('batch.availabilityEnd')} type="date" error={errors.availability_end?.message} {...register('availability_end')} />
                    </div>
                  </motion.div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <h2 className="text-xl font-semibold mb-4">{t('batch.stepQuality')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select label={t('batch.initialQuality')} options={qualityOptions} {...register('initial_quality_estimate')} />
                      <Select label={t('batch.maturityLevel')} options={maturityOptions} {...register('maturity_level')} />
                      <Select label={t('batch.visibleDefects')} options={defectOptions} {...register('visible_defects')} />
                    </div>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('batch.spoilageSigns')}</label>
                        <textarea className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-leaf focus:border-transparent" rows="3" {...register('spoilage_signs')} placeholder={t('batch.spoilagePlaceholder')}></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('batch.additionalNotes')}</label>
                        <textarea className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-leaf focus:border-transparent" rows="3" {...register('notes')}></textarea>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <h2 className="text-xl font-semibold mb-4">{t('batch.stepImage')}</h2>
                    <p className="text-sm text-gray-500 mb-4">{t('batch.imageHelpText')}</p>
                    
                    <FileUploader 
                      onFileSelect={(f) => setFile(f)} 
                      onRemove={() => setFile(null)}
                      preview={file ? URL.createObjectURL(file) : null}
                    />
                  </motion.div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <h2 className="text-xl font-semibold mb-4">{t('batch.stepReview')}</h2>
                    <div className="bg-gray-50 p-4 rounded-md space-y-4">
                      <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                        <div>
                          <p className="text-xs text-gray-500">{t('batch.crop')}</p>
                          <p className="font-medium">{formData.crop} ({formData.variety || t('common.na')})</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('batch.quantity')}</p>
                          <p className="font-medium">{formData.quantity} {formData.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('batch.harvestDate')}</p>
                          <p className="font-medium">{formData.harvest_date}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('batch.storage')}</p>
                          <p className="font-medium">{formData.storage_condition}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">{t('batch.estQuality')}</p>
                          <p className="font-medium">{formData.initial_quality_estimate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('batch.imageAttached')}</p>
                          <p className="font-medium">{file ? t('common.yes') : t('common.no')}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-8 flex justify-between">
                {step > 1 ? (
                  <Button type="button" variant="ghost" onClick={prevStep} disabled={isSubmitting}>
                    <ChevronLeft size={16} className="mr-1 inline" /> {t('common.back')}
                  </Button>
                ) : <div></div>}

                {step < 4 ? (
                  <div className="flex gap-2">
                    {step === 3 && (
                      <Button type="button" variant="ghost" onClick={() => setStep(4)}>{t('common.skip')}</Button>
                    )}
                    <Button type="button" variant="primary" onClick={nextStep}>
                      {t('common.next')} <ChevronRight size={16} className="ml-1 inline" />
                    </Button>
                  </div>
                ) : (
                  <Button type="submit" variant="gold" loading={isSubmitting}>
                    {t('batch.submitForAssessment')}
                  </Button>
                )}
              </div>
            </form>
          </Card.Body>
        </Card>
      </div>
    </FarmerLayout>
  );
};

export default CreateBatch;
