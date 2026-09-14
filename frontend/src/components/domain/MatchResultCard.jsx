import React from 'react';
import { useTranslation } from 'react-i18next';

const MatchResultCard = (props) => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{t('shared.matchResults')}</h2>
    </div>
  );
};

export default MatchResultCard;
