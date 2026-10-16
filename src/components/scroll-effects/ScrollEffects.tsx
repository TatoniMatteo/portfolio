import {useEffect, useRef, useState} from 'react';
import {motion, useScroll, useSpring} from 'framer-motion';
import {useMotionTheme} from '../../hooks/useMotionTheme';
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

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) setActive(entry.target.id);
            }
        }, {rootMargin: '-45% 0px -45% 0px', threshold: 0});
        for (const {id} of sections) {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        }
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const resetTarget = () => { keyboardTarget.current = null; };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
                (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
            const origin = event.target;
            if (origin instanceof Element && origin.closest(
                'input, textarea, select, button, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="slider"], [role="listbox"], [role="combobox"], .pdf-container',
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
