import {useEffect, useRef, useState} from 'react';
import {useMotionTheme} from '../../hooks/useMotionTheme';
import type {PointerEvent} from 'react';
import {motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import type {HeroProps} from './Hero';
import Java from '../../assets/images/java.svg?react';
import ReactLogo from '../../assets/images/react.svg?react';
import Navbar from '../navbar/Navbar';
import {RESUME_DOWNLOAD_NAME} from '../../hooks/useResumeUrl';

const HeroContent = ({profileImg, resumeFile, name, role, description}: HeroProps) => {
    const {t} = useTranslation();
    const {reduced} = useMotionTheme();
    const heroRef = useRef<HTMLDivElement>(null);
    const inView = useInView(heroRef);
    const {scrollYProgress} = useScroll({target: heroRef, offset: ['start start', 'end end']});
    const [secondScene, setSecondScene] = useState(false);
    useMotionValueEvent(scrollYProgress, 'change', (value) => setSecondScene(value >= .45));
    const sceneProgress = useSpring(scrollYProgress, {stiffness: 180, damping: 32, mass: .3});
    const firstOpacity = useTransform(sceneProgress, [0, .22, .48], [1, 1, 0]);
    const firstScale = useTransform(sceneProgress, [.22, .48], [1, .94]);
    const firstRotate = useTransform(sceneProgress, [.22, .48], [0, 8]);
    const firstBlur = useTransform(sceneProgress, [.22, .48], ['blur(0px)', 'blur(6px)']);
    const secondOpacity = useTransform(sceneProgress, [.36, .66], [0, 1]);
    const secondScale = useTransform(sceneProgress, [.36, .66], [1.06, 1]);
    const secondRotate = useTransform(sceneProgress, [.36, .66], [-8, 0]);
    const secondBlur = useTransform(sceneProgress, [.36, .66], ['blur(6px)', 'blur(0px)']);
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
        <section className="hero" id="home" ref={heroRef} data-reduced-motion={reduced}
            data-motion-active={inView && !reduced} aria-label={t('hero.introLabel')}>
            <div className="hero-stage">
                <header className="site-header" role="banner"><Navbar/></header>
                <div className="hero-scenes">
                    <motion.div className="hero-scene hero-scene-first" inert={!reduced && secondScene}
                        style={reduced ? undefined : {opacity: firstOpacity, scale: firstScale, rotateY: firstRotate, filter: firstBlur}}
                        aria-hidden={!reduced && secondScene}>
                        <div className="hero-copy">
                            <span className="hero-eyebrow">{role}</span>
                            <h1><span className="hero-greeting">{t('hero.greeting', {name})}</span></h1>
                            <p>{description}</p>
                        </div>
                        <div className="hero-portrait-scene">
                            <div className="hero-portrait" onPointerMove={tilt}
                                onPointerLeave={() => { x.set(0); y.set(0); }}>
                                <svg className="portrait-orbits" viewBox="0 0 360 360" aria-hidden="true" focusable="false">
                                    <circle className="portrait-orbit portrait-orbit-blue" cx="180" cy="180" r="166" pathLength="360" strokeDasharray="210 150" strokeLinecap="round"/>
                                    <circle className="portrait-orbit portrait-orbit-gold" cx="180" cy="180" r="178" pathLength="360" strokeDasharray="105 255" strokeLinecap="round"/>
                                </svg>
                                <motion.img src={profileImg} alt={name}
                                    style={{rotateX, rotateY, transformPerspective: 900}}/>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div className="hero-scene hero-scene-second" inert={!reduced && !secondScene}
                        style={reduced ? undefined : {opacity: secondOpacity, scale: secondScale, rotateY: secondRotate, filter: secondBlur}}
                        aria-hidden={!reduced && !secondScene}>
                        <div className="hero-copy">
                            <span className="hero-eyebrow">{t('hero.secondEyebrow')}</span>
                            <h2>{t('hero.secondTitle')} <span>{t('hero.secondAccent')}</span></h2>
                            <p>{t('hero.secondDescription')}</p>
                        </div>
                        <div className="hero-tech" aria-hidden="true">
                            <div className="hero-tech-card hero-tech-backend">
                                <span className="hero-tech-index">01 / BACKEND</span>
                                <Java/><strong>Java & Spring</strong><span>{t('hero.backendNote')}</span>
                            </div>
                            <div className="hero-tech-card hero-tech-frontend">
                                <span className="hero-tech-index">02 / FRONTEND</span>
                                <ReactLogo/><strong>React & TypeScript</strong><span>{t('hero.frontendNote')}</span>
                            </div>
                            <span className="hero-code-mark">{'</>'}</span>
                        </div>
                    </motion.div>
                </div>
                <div className="hero-bottom">
                    <div className="hero-action">
                        <a className="hero-contact" href="#contact-me">{t('hero.contact')}</a>
                        <a className="hero-resume" href={resumeFile} download={RESUME_DOWNLOAD_NAME}>{t('hero.resume')}</a>
                    </div>
                    <a className="hero-scroll-hint" href="#about-me">{t('hero.scrollHint')} <span aria-hidden="true">↓</span></a>
                </div>
            </div>
        </section>
    );
};
export default HeroContent;
