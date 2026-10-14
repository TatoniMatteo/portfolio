import { useTranslation } from 'react-i18next';

// I PDF non stanno nel repo: vengono scaricati dall'ultima release del repo
// CV da scripts/fetch-cv.mjs (a ogni dev/build) e serviti da public/cv/.
// Italiano se la lingua attiva è "it", altrimenti inglese.
export const RESUME_DOWNLOAD_NAME = 'CV-Matteo-Tatoni.pdf';

export const useResumeUrl = () => {
    const { i18n } = useTranslation();
    const lang = i18n.resolvedLanguage === 'it' ? 'it' : 'en';
    return `${import.meta.env.BASE_URL}cv/cv-${lang}.pdf`;
};
