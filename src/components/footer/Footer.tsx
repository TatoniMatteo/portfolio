import {useLayoutEffect, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowUp, faCode} from '@fortawesome/free-solid-svg-icons';
import {CURRENT_YEAR} from '../../utils/date';

const Footer = () => {
    const {t} = useTranslation();
    const footerRef = useRef<HTMLElement>(null);
    useLayoutEffect(() => {
        const footer = footerRef.current;
        if (!footer) return () => undefined;
        const update = () => document.documentElement.style.setProperty('--footer-height', `${footer.getBoundingClientRect().height}px`);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(footer);
        return () => observer.disconnect();
    }, []);
    const years = CURRENT_YEAR === 2025 ? '2025' : `2025 – ${CURRENT_YEAR}`;

    return (
        <footer className="footer-container" ref={footerRef}>
            <div className="footer-content">
                <div className="footer-main">
                    <a className="footer-brand" href="#home" aria-label="Matteo Tatoni — Home">
                        <img src={`${import.meta.env.BASE_URL}brand/mt-logo.png`} alt="" width="64" height="42" loading="lazy"/>
                        <span><strong>Matteo Tatoni</strong><span>Software Developer</span></span>
                    </a>
                    <div className="footer-links">
                        <a href="https://github.com/TatoniMatteo/portfolio" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faCode}/>{t('footer.source')}</a>
                        <a href="#home"><span>{t('footer.backToTop')}</span><FontAwesomeIcon icon={faArrowUp}/></a>
                    </div>
                </div>
                <div className="footer-meta">
                    <p>© {years} Matteo Tatoni. {t('footer.rights')}</p>
                </div>
            </div>
        </footer>
    );
};
export default Footer;
