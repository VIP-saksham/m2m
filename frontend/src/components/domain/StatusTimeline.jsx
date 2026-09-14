import React from 'react';
import { useTranslation } from 'react-i18next';

const StatusTimeline = (props) => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{t('shared.timeline')}</h2>
    </div>
  );
};

export default StatusTimeline;
