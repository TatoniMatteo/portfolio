import { useEffect, useState } from 'react';

/**
 * Ritorna true se la viewport è <= breakpoint (default 768px).
 * Il resize è debounced per evitare re-render eccessivi durante il drag
 * della finestra o su dispositivi che sparano molti eventi 'resize'.
 */
export const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
    );

    useEffect(() => {
        let timeoutId: number | undefined;

        const handleResize = () => {
            if (timeoutId) window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                setIsMobile(window.innerWidth <= breakpoint);
            }, 150);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) window.clearTimeout(timeoutId);
        };
    }, [breakpoint]);

    return isMobile;
};

export default useIsMobile;
