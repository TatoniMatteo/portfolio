import {useState} from 'react';
import type {ReactNode} from 'react';
import {motion, useMotionValueEvent, useSpring, useTransform} from 'framer-motion';
import type {MotionValue} from 'framer-motion';

interface HeroLiquidTransitionProps {
    progress: MotionValue<number>;
    reduced: boolean;
    first: ReactNode;
    second: ReactNode;
    third: ReactNode;
}

const HeroLiquidTransition = ({progress, reduced, first, second, third}: HeroLiquidTransitionProps) => {
    const spring = useSpring(progress, {stiffness: 180, damping: 32, mass: .3});
    const [activeScene, setActiveScene] = useState(0);
    useMotionValueEvent(spring, 'change', (value) => setActiveScene(value < .27 ? 0 : value < .73 ? 1 : 2));
    const outgoingOpacity = useTransform(spring, [.1, .26], [1, 0]);
    const middleOpacity = useTransform(spring, [.28, .44, .56, .72], [0, 1, 1, 0]);
    const incomingOpacity = useTransform(spring, [.74, .9], [0, 1]);

    return (
        <div className="hero-scenes liquid-transition">
            <motion.div className="hero-scene hero-scene-first" inert={!reduced && activeScene !== 0}
                aria-hidden={!reduced && activeScene !== 0}
                style={{opacity: reduced ? 1 : outgoingOpacity}}>
                {first}
            </motion.div>
            <motion.div className="hero-scene hero-scene-second" inert={!reduced && activeScene !== 1}
                aria-hidden={!reduced && activeScene !== 1}
                style={{opacity: reduced ? 1 : middleOpacity}}>
                {second}
            </motion.div>
            <motion.div className="hero-scene hero-scene-third" inert={!reduced && activeScene !== 2}
                aria-hidden={!reduced && activeScene !== 2}
                style={{opacity: reduced ? 1 : incomingOpacity}}>
                {third}
            </motion.div>

        </div>
    );
};

export default HeroLiquidTransition;
