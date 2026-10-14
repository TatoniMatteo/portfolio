import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import it from './locales/it.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            it: { translation: it },
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'it'],
        interpolation: {
            escapeValue: false, // React già fa l'escaping
        },
        detection: {
            // Ordine di rilevamento: prima una scelta salvata dall'utente,
            // poi la lingua del browser, infine il fallback sopra.
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'portfolio-lang',
        },
    });

// Mantiene l'attributo lang dell'HTML allineato alla lingua attiva
// (accessibilità + SEO), incluso al primo caricamento.
document.documentElement.lang = i18n.resolvedLanguage ?? 'en';
i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
});

export default i18n;
