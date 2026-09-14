import React from 'react';
import { useTranslation } from 'react-i18next';

const SurplusRadar = (props) => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{t('surplus.title')}</h2>
    </div>
  );
};

export default SurplusRadar;
