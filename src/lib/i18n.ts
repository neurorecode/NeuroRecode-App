import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from '@/locales/en.json';
import ta from '@/locales/ta.json';

export function initI18n() {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en';
  i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, ta: { translation: ta } },
    lng: locale === 'ta' ? 'ta' : 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v3',
  });
}

export function setLanguage(lng: 'en' | 'ta') {
  i18n.changeLanguage(lng);
}

export default i18n;
