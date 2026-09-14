import { useTranslation } from 'react-i18next';

/**
 * Returns the active locale string. The helper name is kept for compatibility
 * with existing screens that use it for English/Hindi labels.
 */
export const useBilingual = () => {
  const { t, i18n } = useTranslation();

  return (key) => {
    const activeLanguage = i18n.language === 'hi' ? 'hi' : 'en';
    return t(key, { lng: activeLanguage });
  };
};
