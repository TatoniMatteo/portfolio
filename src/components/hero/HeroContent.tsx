import {useEffect, useRef, useState} from 'react';
import {useMotionTheme} from '../../hooks/useMotionTheme';
import type {CSSProperties, PointerEvent} from 'react';
import {motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import type {HeroProps} from './Hero';
import Java from '../../assets/images/java.svg?react';
import ReactLogo from '../../assets/images/react.svg?react';
import {RESUME_DOWNLOAD_NAME} from '../../hooks/useResumeUrl';

const codeSymbols = ['</>', 'void()', '{ }', '=>', '++', '&&', 'npm', '[]', '!=', 'git', 'fn()', '010'];

const randomSpark = (previousSymbol?: string) => {
    const symbols = codeSymbols.filter((symbol) => symbol !== previousSymbol);
    const angle = Math.random() * Math.PI * 2;
    const radius = 37 + Math.random() * 8;
    return {
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        style: {
            left: `${50 + Math.cos(angle) * radius}%`,
            top: `${50 + Math.sin(angle) * radius}%`,
            fontSize: `${10 + Math.random() * 7}px`,
            color: Math.random() > .5 ? 'var(--color-primary)' : 'var(--color-accent-text)',
            '--spark-x': `${Math.cos(angle) * (20 + Math.random() * 30)}px`,
            '--spark-y': `${Math.sin(angle) * (20 + Math.random() * 30)}px`,
            '--spark-angle': `${Math.random() * 60 - 30}deg`,
        } as CSSProperties,
    };
};

const CodeSpark = ({index}: {index: number}) => {
    const [spark, setSpark] = useState(() => randomSpark());
    const [duration] = useState(() => `${3.8 + Math.random() * 2}s`);
    return <span style={{...spark.style, animationDuration: duration, animationDelay: `${-index * .6}s`}}
        onAnimationIteration={() => setSpark((previous) => randomSpark(previous.symbol))}>{spark.symbol}</span>;
};

const HeroContent = ({profileImg, resumeFile, name, role, description}: HeroProps) => {
    const {t} = useTranslation();
    const {reduced} = useMotionTheme();
    const heroRef = useRef<HTMLDivElement>(null);
    const inView = useInView(heroRef);
    const {scrollYProgress} = useScroll({target: heroRef, offset: ['start start', 'end end']});
    const [secondScene, setSecondScene] = useState(false);
    useMotionValueEvent(scrollYProgress, 'change', (value) => setSecondScene(value >= .45));
    const firstOpacity = useTransform(scrollYProgress, [0, .22, .44], [1, 1, 0]);
    const firstY = useTransform(scrollYProgress, [0, .44], [0, -85]);
    const portraitY = useTransform(scrollYProgress, [0, .44], [0, -160]);
    const portraitScale = useTransform(scrollYProgress, [0, .44], [1, .78]);
    const sparksProgress = useSpring(scrollYProgress, {stiffness: 110, damping: 26, mass: .4});
    const sparksScale = useTransform(sparksProgress, [0, .44], [1, 1.65]);
    const sparksRotate = useTransform(sparksProgress, [0, .44], [0, -14]);
    const sparksY = useTransform(sparksProgress, [0, .44], [0, -40]);
    const secondOpacity = useTransform(scrollYProgress, [.4, .62, 1], [0, 1, 1]);
    const secondY = useTransform(scrollYProgress, [.4, .72], [100, 0]);
    const cardsRotate = useTransform(scrollYProgress, [.4, .85], [12, -4]);
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
                <div className="hero-scenes">
                    <div className="hero-scene hero-scene-first" inert={!reduced && secondScene}
                        aria-hidden={!reduced && secondScene}>
                        <motion.div className="hero-copy" style={reduced ? undefined : {opacity: firstOpacity, y: firstY}}>
                            <span className="hero-eyebrow">{role}</span>
                            <h1><span className="hero-greeting">{t('hero.greeting', {name})}</span></h1>
                            <p>{description}</p>
                        </motion.div>
                        <motion.div className="hero-portrait-scene"
                            style={reduced ? undefined : {opacity: firstOpacity, y: portraitY, scale: portraitScale}}>
                            <div className="hero-portrait" onPointerMove={tilt}
                                onPointerLeave={() => { x.set(0); y.set(0); }}>
                                <svg className="portrait-orbits" viewBox="0 0 360 360" aria-hidden="true" focusable="false">
                                    <circle className="portrait-orbit portrait-orbit-blue" cx="180" cy="180" r="166" pathLength="360" strokeDasharray="210 150" strokeLinecap="round"/>
                                    <circle className="portrait-orbit portrait-orbit-gold" cx="180" cy="180" r="178" pathLength="360" strokeDasharray="105 255" strokeLinecap="round"/>
                                </svg>
                                <motion.img src={profileImg} alt={name}
                                    style={{rotateX, rotateY, transformPerspective: 900}}/>
                                <motion.div className="hero-code-sparks" aria-hidden="true"
                                    style={reduced ? undefined : {scale: sparksScale, rotate: sparksRotate, y: sparksY}}>
                                    {Array.from({length: 8}, (_, index) => (
                                        <CodeSpark key={index} index={index}/>
                                    ))}
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                    <div className="hero-scene hero-scene-second" inert={!reduced && !secondScene}
                        aria-hidden={!reduced && !secondScene}>
                        <motion.div className="hero-copy" style={reduced ? undefined : {opacity: secondOpacity, y: secondY}}>
                            <span className="hero-eyebrow">{t('hero.secondEyebrow')}</span>
                            <h2>{t('hero.secondTitle')} <span>{t('hero.secondAccent')}</span></h2>
                            <p>{t('hero.secondDescription')}</p>
                        </motion.div>
                        <motion.div className="hero-tech" aria-hidden="true"
                            style={reduced ? undefined : {opacity: secondOpacity, y: secondY, rotate: cardsRotate}}>
                            <div className="hero-tech-card hero-tech-backend">
                                <span className="hero-tech-index">01 / BACKEND</span>
                                <Java/><strong>Java & Spring</strong><span>{t('hero.backendNote')}</span>
                            </div>
                            <div className="hero-tech-card hero-tech-frontend">
                                <span className="hero-tech-index">02 / FRONTEND</span>
                                <ReactLogo/><strong>React & TypeScript</strong><span>{t('hero.frontendNote')}</span>
                            </div>
                            <span className="hero-code-mark">{'</>'}</span>
                        </motion.div>
                    </div>
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
