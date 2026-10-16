import {useSyncExternalStore} from 'react';

const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribe = (onChange: () => void) => {
    const preference = window.matchMedia(motionQuery);
    preference.addEventListener('change', onChange);
    return () => preference.removeEventListener('change', onChange);
};
const getSnapshot = () => window.matchMedia(motionQuery).matches;

// Motion and native fullscreen animations read the same timing tokens as SASS.
export const useMotionTheme = () => {
    const reduced = useSyncExternalStore(subscribe, getSnapshot, () => true);
    const styles = getComputedStyle(document.documentElement);
    const duration = (token: string, fallback: number) => reduced ? 0 : parseFloat(styles.getPropertyValue(token)) || fallback;
    const easing = styles.getPropertyValue('--motion-ease').trim() || 'cubic-bezier(.22, 1, .36, 1)';
    const curve = easing.match(/[\d.]+/g)?.map(Number);
    const ease: [number, number, number, number] = [curve?.[0] ?? .22, curve?.[1] ?? 1, curve?.[2] ?? .36, curve?.[3] ?? 1];
    const timings = {
        fast: duration('--motion-fast', .16),
        normal: duration('--motion-normal', .24),
        reveal: duration('--motion-reveal', .42),
        swap: duration('--motion-swap', .18),
        fullscreen: duration('--motion-fullscreen', .34),
    };
    const transition = {duration: timings.reveal, ease};
    return {
        reduced, timings, easing, ease,
        reveal: {
            initial: reduced ? false as const : {opacity: 0, y: 12},
            whileInView: {opacity: 1, y: 0},
            viewport: {once: true, amount: .15},
            transition,
        },
        swap: {
            initial: reduced ? false as const : {opacity: 0, y: 6},
            animate: {opacity: 1, y: 0},
            exit: reduced ? {opacity: 1} : {opacity: 0, y: -4},
            transition: {duration: timings.swap, ease},
        },
    };
};
