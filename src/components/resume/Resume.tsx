import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faDownload, faFileLines} from '@fortawesome/free-solid-svg-icons';
import SectionTitle from '../section-title/SectionTitle';
import {Suspense, lazy, useEffect, useRef, useState} from 'react';
import {useMotionTheme} from '../../hooks/useMotionTheme';
import {motion} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import type {ResumeLanguage} from '../../hooks/useResumeUrl';
import {RESUME_DOWNLOAD_NAME, useResumeUrl} from '../../hooks/useResumeUrl';

// The component is mounted only when its section approaches the viewport.
const PDFViewer = lazy(() => import('../pdf-viewer/PDFViewer.tsx'));

const Resume = () => {
    const {t, i18n} = useTranslation();
    const {reveal} = useMotionTheme();
    const [selectedLanguage, setSelectedLanguage] = useState<ResumeLanguage | null>(null);
    const language = selectedLanguage ?? (i18n.resolvedLanguage === 'it' ? 'it' : 'en');
    const languageLabel = t(`resume.languages.${language}`);
    const resume = useResumeUrl(language);
    const sectionRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(() => !("IntersectionObserver" in window));

    useEffect(() => {
        if (!sectionRef.current || !("IntersectionObserver" in window)) return () => undefined;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                observer.disconnect();
            }
        }, {rootMargin: '300px'});
        observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="section" id="resume" ref={sectionRef}>
            <SectionTitle>{t('resume.title')}</SectionTitle>

            <div className="resume-layout">
                <div className="resume-intro">
                    <span className="resume-symbol" aria-hidden="true"><FontAwesomeIcon icon={faFileLines}/></span>
                    <span className="resume-format">PDF · {languageLabel}</span>
                    <h3>{t('resume.introTitle')}</h3>
                    <p>{t('resume.introDescription')}</p>
                    <div className="resume-language-field">
                        <span id="resume-language-label">{t('resume.languageSelector')}</span>
                        <div className="resume-language-switcher" role="group" aria-labelledby="resume-language-label">
                            {(['it', 'en'] as const).map((value) => (
                                <button type="button" key={value} aria-pressed={language === value}
                                    onClick={() => setSelectedLanguage(value)}>{t(`resume.languages.${value}`)}</button>
                            ))}
                        </div>
                    </div>
                    <a className="resume-download" href={resume} download={RESUME_DOWNLOAD_NAME}>
                        <FontAwesomeIcon icon={faDownload}/>{t('resume.download')}
                    </a>
                    <p className="resume-hint">{t('resume.readingHint')}</p>
                </div>
                <motion.div
                    className="resume-preview"
                    {...reveal}
                >
                    <Suspense fallback={<div className="resume-placeholder" role="status"><div className="spinner"/>{t('resume.loading')}</div>}>
                        {visible ? <PDFViewer key={resume} src={resume} downloadName={RESUME_DOWNLOAD_NAME} documentLanguage={languageLabel}/> : <div className="resume-placeholder"><FontAwesomeIcon icon={faFileLines}/><p>{t('resume.previewHint')}</p></div>}
                    </Suspense>
                </motion.div>
            </div>
        </div>
    );
};

export default Resume;
