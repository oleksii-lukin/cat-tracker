import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { be } from './be';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { ru } from './ru';
import { uk } from './uk';

export const SUPPORTED_LANGUAGES = ['ru', 'uk', 'be', 'en', 'es', 'de', 'it', 'fr'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_AUTO = 'auto';
export type LanguagePref = Language | typeof LANGUAGE_AUTO;

export function getDeviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode ?? '';
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code) ? (code as Language) : 'ru';
}

/** Preset feed names per kind and language — used to seed and to rename presets on language change. */
export const PRESET_FEED_NAMES: Record<'wet' | 'dry', Record<Language, string>> = {
  wet: {
    ru: ru.feed.wetName,
    uk: uk.feed.wetName,
    be: be.feed.wetName,
    en: en.feed.wetName,
    es: es.feed.wetName,
    de: de.feed.wetName,
    it: it.feed.wetName,
    fr: fr.feed.wetName,
  },
  dry: {
    ru: ru.feed.dryName,
    uk: uk.feed.dryName,
    be: be.feed.dryName,
    en: en.feed.dryName,
    es: es.feed.dryName,
    de: de.feed.dryName,
    it: it.feed.dryName,
    fr: fr.feed.dryName,
  },
};

void i18next.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    uk: { translation: uk },
    be: { translation: be },
    en: { translation: en },
    es: { translation: es },
    de: { translation: de },
    it: { translation: it },
    fr: { translation: fr },
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'ru',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: { escapeValue: false },
  returnNull: false,
});

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: typeof ru;
    returnNull: false;
  }
}

export default i18next;
