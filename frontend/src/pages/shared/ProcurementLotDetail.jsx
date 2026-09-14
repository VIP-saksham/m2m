import React from 'react';
import { useTranslation } from 'react-i18next';

const ProcurementLotDetail = (props) => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{t('shared.lotDetail')}</h2>
    </div>
  );
};

export default ProcurementLotDetail;
