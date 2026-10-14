import {Suspense, lazy} from 'react';
import {motion} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import {RESUME_DOWNLOAD_NAME, useResumeUrl} from '../../hooks/useResumeUrl';
import './Resume.css';

// Stesso motivo del vecchio Contact.tsx: pdfjs-dist è pesante, lo carichiamo
// solo quando l'utente arriva davvero su questa sezione.
const PDFViewer = lazy(() => import('../pdf-viewer/PDFViewer.tsx'));

const Resume = () => {
    const {t} = useTranslation();
    const resume = useResumeUrl();

    return (
        <div className="section" id="resume">
            <div className="section-title">
                <h1>{t('resume.title')}</h1>
            </div>

            <motion.div
                className="resume-preview"
                initial={{opacity: 0, scale: 0.95}}
                whileInView={{opacity: 1, scale: 1}}
                viewport={{once: false, amount: 0.3}}
                transition={{duration: 0.8}}
            >
                <Suspense fallback={<div className="pdf-loader"><div className="spinner"/></div>}>
                    <PDFViewer src={resume} downloadName={RESUME_DOWNLOAD_NAME}/>
                </Suspense>
            </motion.div>
        </div>
    );
};

export default Resume;
