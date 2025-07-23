import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../translations/en.json';
import esTranslations from '../translations/es.json';
import frTranslations from '../translations/fr.json';

type Language = 'en' | 'es' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const getNestedTranslation = (obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => current?.[key], obj) || path;
  };

  const t = (key: string): string => {
    return getNestedTranslation(translations[language], key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};