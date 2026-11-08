import {useId, useState} from 'react';
import type {ReactNode} from 'react';
import {motion, useMotionValueEvent, useSpring, useTransform} from 'framer-motion';
import type {MotionValue} from 'framer-motion';
import {useIsMobile} from '../../hooks/useIsMobile';

// Complementary clips reveal the next scene without moving or distorting its content.
const front = (phase: number, mobile: boolean, reverse = false) => {
    const x = -.2 + 1.4 * phase;
    const y = mobile ? .12 + .76 * phase : .3 + .4 * phase - Math.sin(phase * Math.PI) * .12;
    const pull = Math.sin(phase * Math.PI);
    const nose = x + .16 * pull;
    const segments = [
        [[x, -.1], [x, y - .35], [x - .08 * pull, y - .16], [nose, y - .06]],
        [[nose, y - .06], [nose + .06 * pull, y - .02], [nose + .06 * pull, y + .04], [nose, y + .08]],
        [[nose, y + .08], [x - .08 * pull, y + .2], [x, 1.1], [x, 1.1]],
    ];
    const mirrorX = (value: number) => reverse ? 1 - value : value;
    const mirrorY = (value: number) => reverse && mobile ? 1 - value : value;
    const mapped = segments.map((points) => points.map(([px, py]) => [mirrorX(px), mirrorY(py)]));
    const curve = `M${mapped[0][0].join(' ')} ${mapped.map((points) =>
        `C${points.slice(1).map((point) => point.join(' ')).join(' ')}`).join(' ')}`;
    return {segments: mapped,
        outgoing: `${curve} L${mirrorX(1.4)} ${mirrorY(1.1)} L${mirrorX(1.4)} ${mirrorY(-.1)} Z`,
        incoming: `${curve} L${mirrorX(-.4)} ${mirrorY(1.1)} L${mirrorX(-.4)} ${mirrorY(-.1)} Z`};
};

// Sample the very same Béziers used by the clips, including their older positions.
const frontPoint = (phase: number, position: number, mobile: boolean, reverse: boolean) => {
    const part = Math.min(position * 3, 2.999999);
    const points = front(phase, mobile, reverse).segments[Math.floor(part)];
    const t = part % 1;
    const weights = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3];
    return [0, 1].map((axis) => points.reduce((sum, point, index) => sum + point[axis] * weights[index], 0));
};

// More samples near the head; the older, wider tail becomes progressively sparse.
const TrailParticle = ({index, phase, mobile, reverse}: {index: number; phase: MotionValue<number>; mobile: boolean; reverse: MotionValue<boolean>}) => {
    const age = (index / 359) ** 1.7;
    const position = .5 + Math.sin(index * 2.39996) * .49 * age ** .55;
    const left = useTransform(() => `${frontPoint(Math.max(0, phase.get() - age * .4), position, mobile, reverse.get())[0] * 100}%`);
    const top = useTransform(() => `${frontPoint(Math.max(0, phase.get() - age * .4), position, mobile, reverse.get())[1] * 100}%`);
    return <motion.i className="code-transition-particle" style={{left, top, opacity: .8 * (1 - age) ** 1.2,
        scale: (1 - age * .75) * (.5 + (index % 5) * .16),
        x: Math.sin(index * 2.4) * (2 + age * 12), y: Math.cos(index * 1.7) * (2 + age * 8)}}/>;
};

interface HeroLiquidTransitionProps {
    progress: MotionValue<number>;
    reduced: boolean;
    first: ReactNode;
    second: ReactNode;
    third: ReactNode;
}

const HeroLiquidTransition = ({progress, reduced, first, second, third}: HeroLiquidTransitionProps) => {
    const id = useId().replace(/:/g, '');
    const mobile = useIsMobile();
    const spring = useSpring(progress, {stiffness: 180, damping: 32, mass: .3});
    const firstPhase = useTransform(spring, [.1, .44], [0, 1]);
    const secondPhase = useTransform(spring, [.56, .9], [0, 1]);
    const phase = useTransform(() => spring.get() < .5 ? firstPhase.get() : secondPhase.get());
    const reverse = useTransform(spring, (value) => value >= .5);
    const [activeScene, setActiveScene] = useState(0);
    useMotionValueEvent(spring, 'change', (value) => setActiveScene(value < .27 ? 0 : value < .73 ? 1 : 2));
    const outgoingClip = useTransform(firstPhase, (value) => front(value, mobile).outgoing);
    const middleClip = useTransform(() => secondPhase.get() > 0
        ? front(secondPhase.get(), mobile, true).outgoing
        : front(firstPhase.get(), mobile).incoming);
    const incomingClip = useTransform(secondPhase, (value) => front(value, mobile, true).incoming);
    const outgoingOpacity = useTransform(firstPhase, [0, .999, 1], [1, 1, 0]);
    const middleOpacity = useTransform(() => firstPhase.get() === 0 || secondPhase.get() === 1 ? 0 : 1);
    const incomingOpacity = useTransform(secondPhase, [0, .001, 1], [0, 1, 1]);

    const cursorOpacity = useTransform(phase, [0, .08, .9, 1], [0, 1, 1, 0]);
    const cursorLeft = useTransform(() => `${frontPoint(phase.get(), .5, mobile, reverse.get())[0] * 100}%`);
    const cursorTop = useTransform(() => `${frontPoint(phase.get(), .5, mobile, reverse.get())[1] * 100}%`);

    return (
        <div className="hero-scenes liquid-transition">
            {!reduced && <svg className="liquid-transition-defs" width="0" height="0" aria-hidden="true" focusable="false">
                <defs>
                    <clipPath id={`${id}-outgoing`} clipPathUnits="objectBoundingBox"><motion.path d={outgoingClip}/></clipPath>
                    <clipPath id={`${id}-middle`} clipPathUnits="objectBoundingBox"><motion.path d={middleClip}/></clipPath>
                    <clipPath id={`${id}-incoming`} clipPathUnits="objectBoundingBox"><motion.path d={incomingClip}/></clipPath>
                </defs>
            </svg>}
            <motion.div className="hero-scene hero-scene-first" inert={!reduced && activeScene !== 0}
                aria-hidden={!reduced && activeScene !== 0}
                style={reduced ? {clipPath: 'none', filter: 'none', opacity: 1}
                    : {clipPath: `url(#${id}-outgoing)`, opacity: outgoingOpacity}}>
                {first}
            </motion.div>
            <motion.div className="hero-scene hero-scene-second" inert={!reduced && activeScene !== 1}
                aria-hidden={!reduced && activeScene !== 1}
                style={reduced ? {clipPath: 'none', opacity: 1} : {clipPath: `url(#${id}-middle)`, opacity: middleOpacity}}>
                {second}
            </motion.div>
            <motion.div className="hero-scene hero-scene-third" inert={!reduced && activeScene !== 2}
                aria-hidden={!reduced && activeScene !== 2}
                style={reduced ? {clipPath: 'none', opacity: 1} : {clipPath: `url(#${id}-incoming)`, opacity: incomingOpacity}}>
                {third}
            </motion.div>
            {!reduced && <motion.div className="code-transition-trail" aria-hidden="true" style={{opacity: cursorOpacity}}>
                {Array.from({length: 360}, (_, index) => <TrailParticle key={index} index={index} phase={phase} mobile={mobile} reverse={reverse}/>)}
                <motion.span className="code-transition-ball"
                    style={{left: cursorLeft, top: cursorTop}}/>
            </motion.div>}

        </div>
    );
};

export default HeroLiquidTransition;
