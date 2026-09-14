import React from 'react';
import { useTranslation } from 'react-i18next';

const ValueRecovery = (props) => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{t('valueRecovery.title')}</h2>
    </div>
  );
};

export default ValueRecovery;
