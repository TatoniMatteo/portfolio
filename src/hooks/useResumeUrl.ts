import { useTranslation } from 'react-i18next';

// I PDF non stanno nel repo: vengono scaricati dall'ultima release del repo
// CV da scripts/fetch-cv.mjs in sviluppo e dal container updater in produzione.
// Italiano se la lingua attiva è "it", altrimenti inglese.
export const RESUME_DOWNLOAD_NAME = 'CV-Matteo-Tatoni.pdf';

export type ResumeLanguage = 'it' | 'en';

export const useResumeUrl = (language?: ResumeLanguage) => {
    const { i18n } = useTranslation();
    const lang = language ?? (i18n.resolvedLanguage === 'it' ? 'it' : 'en');
    return `${import.meta.env.BASE_URL}cv/cv-${lang}.pdf`;
};
