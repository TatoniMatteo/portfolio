import {useLayoutEffect} from 'react';
import type {PropsWithChildren} from 'react';
import {MotionConfig} from 'framer-motion';
import {useMotionTheme} from '../../hooks/useMotionTheme';

export const MotionPreferences = ({children}: PropsWithChildren) => {
    const {reduced} = useMotionTheme();
    useLayoutEffect(() => {
        document.documentElement.dataset.reducedMotion = String(reduced);
    }, [reduced]);
    return <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>;
};
