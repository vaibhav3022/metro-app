import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';
import { storage } from '../utils/storage';

const LanguageContext = createContext();

const LANGUAGE_KEY = 'app_language';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    // Load saved language on app start
    const loadLanguage = async () => {
      try {
        const saved = await storage.getString(LANGUAGE_KEY);
        if (saved && ['en', 'hi', 'mr'].includes(saved)) {
          setLanguageState(saved);
          i18n.changeLanguage(saved);
        }
      } catch (e) {
        console.warn('Could not load language preference');
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang) => {
    try {
      setLanguageState(lang);
      i18n.changeLanguage(lang);
      await storage.saveString(LANGUAGE_KEY, lang);
    } catch (e) {
      console.warn('Could not save language preference');
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
