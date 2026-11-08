import {useEffect, useRef, useState} from 'react';
import {motion, useScroll, useSpring, useTransform} from 'framer-motion';
import {useMotionTheme} from '../../hooks/useMotionTheme';
import {useIsMobile} from '../../hooks/useIsMobile';
import {useTranslation} from 'react-i18next';

const sections = [
    {id: 'home', label: 'home'},
    {id: 'about-me', label: 'aboutMe'},
    {id: 'career', label: 'career'},
    {id: 'resume', label: 'resume'},
    {id: 'open-source', label: 'openSource'},
    {id: 'my-projects', label: 'myProjects'},
    {id: 'contact-me', label: 'contactMe'},
];

const ScrollEffects = () => {
    const {t} = useTranslation();
    const [active, setActive] = useState('home');
    const {reduced} = useMotionTheme();
    const keyboardTarget = useRef<HTMLElement | null>(null);
    const {scrollYProgress} = useScroll();
    const progress = useSpring(scrollYProgress, {stiffness: 240, damping: 34});
    const isMobile = useIsMobile();
    const depth = reduced ? 0 : isMobile ? 0.35 : 1;
    const blueY = useTransform(scrollYProgress, [0, 1], [0, 180 * depth]);
    const goldY = useTransform(scrollYProgress, [0, 1], [0, -140 * depth]);
    const glowX = useTransform(scrollYProgress, [0, 1], [0, 220 * depth]);

    useEffect(() => {
        const getStops = () => sections.map(({id}) => document.getElementById(id)).filter((element) => element !== null);
        let frame = 0;
        const update = () => {
            frame = 0;
            const stops = getStops();
            if (!stops.length) return;
            const end = document.documentElement.scrollHeight - innerHeight;
            if (window.scrollY <= 1) {
                setActive(stops[0].id);
                return;
            }
            if (window.scrollY >= end - 1) {
                setActive(stops[stops.length - 1].id);
                return;
            }
            const center = innerHeight / 2;
            let nearest = stops[0];
            let distance = Infinity;
            for (const element of stops) {
                const bounds = element.getBoundingClientRect();
                const gap = Math.max(bounds.top - center, center - bounds.bottom, 0);
                if (gap < distance) { distance = gap; nearest = element; }
            }
            setActive(nearest.id);
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
        const observer = new ResizeObserver(schedule);
        for (const element of getStops()) observer.observe(element);
        const footer = document.querySelector('footer');
        if (footer) observer.observe(footer);
        window.addEventListener('scroll', schedule, {passive: true});
        window.addEventListener('resize', schedule);
        update();
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            cancelAnimationFrame(frame);
        };
    }, []);

    useEffect(() => {
        const resetTarget = () => { keyboardTarget.current = null; };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
                (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
            const origin = event.target;
            if (origin instanceof Element && origin.closest(
                'input, textarea, select, button, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="slider"], [role="listbox"], [role="combobox"], .pdf-container, .mobile-panel, .mobile-panels-track, .timeline-detail-card, .contact-layout',
            )) return;

            const stops = sections.map(({id}) => document.getElementById(id)).filter((element) => element !== null);
            if (!stops.length) return;
            event.preventDefault();
            // One section per press, even if a key is held down.
            if (event.repeat) return;
            let current = keyboardTarget.current ? stops.indexOf(keyboardTarget.current) : -1;
            if (current < 0) {
                const center = window.innerHeight / 2;
                let distance = Infinity;
                stops.forEach((element, index) => {
                    const rect = element.getBoundingClientRect();
                    const gap = Math.max(rect.top - center, center - rect.bottom, 0);
                    if (gap < distance) { distance = gap; current = index; }
                });
            }
            const next = Math.max(0, Math.min(stops.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)));
            if (next === current) return;
            const target = stops[next];
            keyboardTarget.current = target;
            const behavior = reduced ? 'instant' : 'smooth';
            if (next === 0) window.scrollTo({top: 0, behavior});
            else if (next === stops.length - 1 && target.offsetHeight + (document.querySelector('footer')?.offsetHeight ?? 0) <= innerHeight + 1) {
                window.scrollTo({top: document.documentElement.scrollHeight, behavior});
            } else target.scrollIntoView({behavior, block: target.offsetHeight > innerHeight ? 'start' : 'center'});
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('scrollend', resetTarget);
        window.addEventListener('wheel', resetTarget, {passive: true});
        window.addEventListener('touchstart', resetTarget, {passive: true});
        window.addEventListener('pointerdown', resetTarget);
        window.addEventListener('resize', resetTarget);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('scrollend', resetTarget);
            window.removeEventListener('wheel', resetTarget);
            window.removeEventListener('touchstart', resetTarget);
            window.removeEventListener('pointerdown', resetTarget);
            window.removeEventListener('resize', resetTarget);
        };
    }, [reduced]);

    return <>
        <div className="portfolio-atmosphere" aria-hidden="true">
            <motion.span style={{y: blueY}}/>
            <motion.span style={{y: goldY}}/>
            <motion.span style={{x: glowX}}/>
        </div>
        {!reduced && <motion.div className="reading-progress" aria-hidden="true" style={{scaleX: progress}}/>}
        <nav className="section-guide" aria-label={t('nav.sectionGuide')}>
            {sections.map(({id, label}) => (
                <a key={id} href={`#${id}`} aria-label={t(`nav.${label}`)}
                    aria-current={active === id ? 'location' : undefined}>
                    <span className="section-guide-label" aria-hidden="true">{t(`nav.${label}`)}</span>
                    <span className="section-guide-dot" aria-hidden="true"/>
                </a>
            ))}
        </nav>
    </>;
};
export default ScrollEffects;
