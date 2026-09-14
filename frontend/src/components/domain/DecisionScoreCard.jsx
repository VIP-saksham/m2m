import React from 'react';
import { useTranslation } from 'react-i18next';

const DecisionScoreCard = (props) => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{t('shared.decisionResults')}</h2>
    </div>
  );
};

export default DecisionScoreCard;
