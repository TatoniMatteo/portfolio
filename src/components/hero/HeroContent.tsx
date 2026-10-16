import {useEffect, useRef} from 'react';
import {useMotionTheme} from '../../hooks/useMotionTheme';
import type {PointerEvent} from 'react';
import {motion, useInView, useMotionValue, useSpring} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import type {HeroProps} from './Hero';
import {RESUME_DOWNLOAD_NAME} from '../../hooks/useResumeUrl';

const HeroContent = ({profileImg, resumeFile, name, role, description}: HeroProps) => {
    const {t} = useTranslation();
    const {reduced, reveal, timings, ease} = useMotionTheme();
    const heroRef = useRef<HTMLDivElement>(null);
    const inView = useInView(heroRef);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(x, {stiffness: 140, damping: 26});
    const rotateY = useSpring(y, {stiffness: 140, damping: 26});
    const tilt = (event: PointerEvent<HTMLDivElement>) => {
        if (reduced || event.pointerType !== 'mouse') return;
        const bounds = event.currentTarget.getBoundingClientRect();
        x.set(-((event.clientY - bounds.top) / bounds.height - 0.5) * 6);
        y.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 6);
    };
    useEffect(() => {
        if (reduced || !inView) { x.set(0); y.set(0); }
    }, [reduced, inView, x, y]);

    return (
        <div className="section hero" id="home" ref={heroRef} data-motion-active={inView && !reduced}>
            <div className="hero-atmosphere" aria-hidden="true"><span/><span/><span/></div>
            <motion.div className="hero-portrait" onPointerMove={tilt} onPointerLeave={() => { x.set(0); y.set(0); }}
                {...reveal}>
                <svg className="portrait-orbits" viewBox="0 0 360 360" aria-hidden="true" focusable="false">
                    <circle className="portrait-orbit portrait-orbit-blue" cx="180" cy="180" r="166" pathLength="360" strokeDasharray="210 150" strokeLinecap="round"/>
                    <circle className="portrait-orbit portrait-orbit-gold" cx="180" cy="180" r="178" pathLength="360" strokeDasharray="105 255" strokeLinecap="round"/>
                </svg>
                <motion.img src={profileImg} alt={`${t('hero.greeting', {name})}, ${role}`}
                    style={{rotateX, rotateY, transformPerspective: 900}}/>
            </motion.div>
            <motion.h1 {...reveal}
                transition={{duration: timings.reveal, delay: reduced ? 0 : .04, ease}}>
                <span className="hero-greeting">{t('hero.greeting', {name})}</span><br/>{role}
            </motion.h1>
            <motion.p {...reveal}
                transition={{duration: timings.reveal, delay: reduced ? 0 : .08, ease}}>
                {description}
            </motion.p>
            <motion.div className="hero-action" {...reveal}
                transition={{duration: timings.reveal, delay: reduced ? 0 : .12, ease}}>
                <a className="hero-contact" href="#contact-me">{t('hero.contact')}</a>
                <a className="hero-resume" href={resumeFile} download={RESUME_DOWNLOAD_NAME}>{t('hero.resume')}</a>
            </motion.div>
        </div>
    );
};
export default HeroContent;
