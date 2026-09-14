import React from 'react';
import { useTranslation } from 'react-i18next';

const ForFarmers = (props) => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{t('nav.forFarmers')}</h2>
    </div>
  );
};

export default ForFarmers;
