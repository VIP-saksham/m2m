import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageToggle({ className = '' }) {
  const { i18n } = useTranslation();
  const language = i18n.language === 'hi' ? 'hi' : 'en';
  const changeLanguage = (nextLanguage) => {
    i18n.changeLanguage(nextLanguage);
    localStorage.setItem('m2m_language', nextLanguage);
  };

  return (
    <div className={`inline-flex items-center rounded-lg border border-cream-darker bg-white p-0.5 text-xs ${className}`}>
      <button type="button" onClick={() => changeLanguage('en')} className={`rounded-md px-2 py-1 ${language === 'en' ? 'bg-forest text-white' : 'text-charcoal/60'}`}>EN</button>
      <button type="button" onClick={() => changeLanguage('hi')} className={`rounded-md px-2 py-1 ${language === 'hi' ? 'bg-forest text-white' : 'text-charcoal/60'}`}>हिंदी</button>
    </div>
  );
}
