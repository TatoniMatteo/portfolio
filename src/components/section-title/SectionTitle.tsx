import type {PropsWithChildren} from 'react';
import {motion} from 'framer-motion';
import {useMotionTheme} from '../../hooks/useMotionTheme';

const SectionTitle = ({children}: PropsWithChildren) => {
    const {reveal} = useMotionTheme();
    return (
        <motion.div className="section-title" {...reveal}>
            <h2>{children}</h2>
            <span className="section-title-line" aria-hidden="true"/>
        </motion.div>
    );
};
export default SectionTitle;
