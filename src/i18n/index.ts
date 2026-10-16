import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import it from "./locales/it.json";

const updateMetadata = () => {
    const lang = i18n.resolvedLanguage ?? 'en';
    document.documentElement.lang = lang;
    const description = i18n.t('meta.description');
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
        document.querySelector(selector)?.setAttribute('content', description);
    }
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', lang === 'it' ? 'it_IT' : 'en_US');
};
i18n.on("languageChanged", updateMetadata);

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            it: { translation: it },
        },
        fallbackLng: "en",
        supportedLngs: ["en", "it"],
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
            lookupLocalStorage: "portfolio-lang",
        },
    })
    .then(() => {
        updateMetadata();
    })
    .catch((cause: unknown) => {
        console.error("Errore durante l'inizializzazione di i18next:", cause);
    });

export default i18n;
