import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import it from "./locales/it.json";

i18n.on("languageChanged", (lng) => {
    document.documentElement.lang = lng;
});

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
        document.documentElement.lang = i18n.resolvedLanguage ?? "en";
    })
    .catch((cause: unknown) => {
        console.error("Errore durante l'inizializzazione di i18next:", cause);
    });

export default i18n;
