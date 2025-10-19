import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {i18n} from "../../i18n.ts";

export type Language = 'en' | 'ro';

export const getCurrentLanguage = () => {
  return localStorage.getItem('language') || 'en';
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export interface TranslationItem {
  en: string;
  ro: string;
}


const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved && ['en', 'ro'].includes(saved) ? saved : 'ro';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, params?: Record<string, any>): string => {
    if (typeof key !== 'string') {
      console.warn('Translation key must be a string. Got:', key);
      return '';
    }
    const translationEntry = i18n[key];

    if (!translationEntry) return key;

    let translated = translationEntry[language] ?? key;

    if (params) {
      translated = translated.replace(/\{(\w+)\}/g, (_, p) =>
          params[p] !== undefined ? String(params[p]) : `{${p}}`
      );
    }

    return translated;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        {children}
      </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
